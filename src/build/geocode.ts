/**
 * Build-time geocoding for free-text alumni locations.
 *
 * The Airtable "Location" column is free text: US ZIP codes, "City, ST",
 * "City, Country", region names ("SF Bay Area"), or nothing. This module
 * normalizes all of it into structured parts — city, region (first-level
 * subdivision), country — plus coordinates:
 *
 *   - Bare ZIP codes → offline lookup via the `zipcodes` dataset (no network)
 *   - Everything else → OpenStreetMap Nominatim (rate-limited to 1 req/s),
 *     US-restricted when the text ends in a US state ("City, ST"), worldwide
 *     otherwise so international places resolve to the well-known match
 *
 * Results are cached in a JSON file (gitignored locally, persisted between CI
 * runs via actions/cache) so repeat builds only geocode locations that
 * changed in Airtable.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import zipcodes from "zipcodes";
import { UNITED_STATES, US_STATE_NAMES } from "../lib/location";

export interface ResolvedLocation {
	city: string;
	/** First-level subdivision: US state code ("GA"), province ("Ontario"), … */
	region: string;
	/** English country name ("United States", "Switzerland"). */
	country: string;
	latitude: number;
	longitude: number;
}

/** Cache entry: a resolved location, or null when lookup found nothing. */
type CacheEntry = ResolvedLocation | null;

export interface GeocodeLogger {
	info(message: string): void;
	warn(message: string): void;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT =
	"ECEHive-alumni-directory/1.0 (+https://github.com/ECEHive/alumni-directory)";
const REQUEST_INTERVAL_MS = 1100; // Nominatim usage policy: max 1 req/s

const EXACT_ZIP_RE = /^(\d{5})(?:-\d{4})?$/;
const EMBEDDED_ZIP_RE = /\b(\d{5})(?:-\d{4})?\b/;

/** Full US state names, lowercased, for suffix matching. */
const US_STATE_NAME_SET = new Set(
	Object.values(US_STATE_NAMES).map((name) => name.toLowerCase()),
);

/**
 * Does the text after the last comma name a US state ("GA", "Georgia",
 * possibly followed by a ZIP) or an explicit US marker? Only then is the
 * Nominatim search biased to the US — a US-restricted search for anything
 * else fuzzy-matches obscure places ("Zürich" → Zurich, KS). Bare names
 * search worldwide, where importance ranking picks the well-known place.
 */
function hasUsStateSuffix(input: string): boolean {
	const commaAt = input.lastIndexOf(",");
	if (commaAt === -1) return false;

	// "MA 02144" → "MA"; "United States" stays intact.
	const suffix = input
		.slice(commaAt + 1)
		.replace(EMBEDDED_ZIP_RE, "")
		.trim();
	if (!suffix) return false;

	if (suffix in US_STATE_NAMES) return true;
	const lower = suffix.toLowerCase();
	return (
		US_STATE_NAME_SET.has(lower) ||
		lower === "us" ||
		lower === "usa" ||
		lower === "u.s." ||
		lower === "u.s.a." ||
		lower === "united states" ||
		lower === "united states of america"
	);
}

export class Geocoder {
	private cache: Record<string, CacheEntry>;
	private dirty = false;
	private lastRequestAt = 0;

	constructor(
		private cachePath: string,
		private logger: GeocodeLogger,
	) {
		this.cache = existsSync(cachePath)
			? JSON.parse(readFileSync(cachePath, "utf-8"))
			: {};
		// Drop entries from older cache formats so they get re-resolved.
		for (const [key, entry] of Object.entries(this.cache)) {
			if (entry !== null && typeof entry.country !== "string") {
				delete this.cache[key];
				this.dirty = true;
			}
		}
	}

	/** Resolve a raw location string; null when it can't be located. */
	async resolve(raw: string): Promise<ResolvedLocation | null> {
		const input = raw.replace(/\s+/g, " ").trim();
		if (!input) return null;

		if (input in this.cache) return this.cache[input];

		const resolved = await this.lookup(input);
		if (resolved !== undefined) {
			this.cache[input] = resolved;
			this.dirty = true;
			return resolved;
		}
		// Transient failure (network error) — don't cache, try again next build.
		return null;
	}

	/** Persist the cache if any new locations were resolved. */
	save(): void {
		if (!this.dirty) return;
		mkdirSync(dirname(this.cachePath), { recursive: true });
		writeFileSync(
			this.cachePath,
			`${JSON.stringify(this.cache, null, "\t")}\n`,
			"utf-8",
		);
		this.logger.info(`geocode cache updated → ${this.cachePath}`);
	}

	/**
	 * Perform an actual lookup.
	 * Returns undefined for transient errors (as opposed to a definitive miss).
	 */
	private async lookup(
		input: string,
	): Promise<ResolvedLocation | null | undefined> {
		// The whole input is a US ZIP — resolve offline, no network needed.
		const exactZip = input.match(EXACT_ZIP_RE)?.[1];
		if (exactZip) {
			const hit = zipLookup(exactZip);
			if (hit) return hit;
			// Not a known US ZIP — might be a foreign postcode; fall through.
		}

		// "City, ST" searches US-only for precision; everything else — bare
		// names ("Zürich"), "City, Country" — searches worldwide, where
		// importance ranking picks the well-known place.
		const domestic = hasUsStateSuffix(input);
		let result = await this.nominatimSearch(input, domestic ? "us" : undefined);

		// Compound answers ("Pittsburgh, PA, soon moving to Albuquerque, NM")
		// fail as a whole — fall back to the first "City, ST" they contain.
		if (result === null) {
			const cityState = input.match(/([A-Za-z .'-]+),\s*([A-Z]{2})\b/);
			if (cityState && cityState[0] !== input) {
				result = await this.nominatimSearch(
					`${cityState[1].trim()}, ${cityState[2]}`,
					"us",
				);
			}
		}

		// A ZIP buried in unparseable text ("Somewhere near 30332…") is still
		// a precise signal — resolve it offline.
		if (result === null) {
			const zip = input.match(EMBEDDED_ZIP_RE)?.[1];
			if (zip) {
				const hit = zipLookup(zip);
				if (hit) return hit;
			}
		}

		// Still nothing — retry worldwide if the first pass was US-only.
		if (result === null && domestic) {
			result = await this.nominatimSearch(input);
		}

		if (result === null) this.logger.warn(`no geocoding result for "${input}"`);
		return result;
	}

	private async nominatimSearch(
		input: string,
		countrycodes?: string,
	): Promise<ResolvedLocation | null | undefined> {
		// Rate-limit per Nominatim usage policy.
		const wait = this.lastRequestAt + REQUEST_INTERVAL_MS - Date.now();
		if (wait > 0) await new Promise((r) => setTimeout(r, wait));
		this.lastRequestAt = Date.now();

		const url = new URL(NOMINATIM_URL);
		url.searchParams.set("q", input);
		url.searchParams.set("format", "jsonv2");
		url.searchParams.set("limit", "1");
		url.searchParams.set("addressdetails", "1");
		url.searchParams.set("accept-language", "en"); // English place names
		if (countrycodes) url.searchParams.set("countrycodes", countrycodes);

		let results: NominatimResult[];
		try {
			const res = await fetch(url, {
				headers: { "User-Agent": USER_AGENT },
			});
			if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
			results = (await res.json()) as NominatimResult[];
		} catch (err) {
			this.logger.warn(`geocoding "${input}" failed: ${err}`);
			return undefined;
		}

		const top = results[0];
		if (!top) return null;

		const address = top.address ?? {};
		const city =
			address.city ??
			address.town ??
			address.village ??
			address.municipality ??
			address.county ??
			top.name ??
			input;
		// US → two-letter state code from ISO3166-2 ("US-GA" → "GA");
		// elsewhere → the subdivision name Nominatim reports ("Ontario").
		const region =
			address.country_code === "us"
				? (address["ISO3166-2-lvl4"]?.replace(/^US-/, "") ?? "")
				: (address.state ?? "");

		return {
			city,
			region,
			country: address.country ?? "",
			latitude: Number.parseFloat(top.lat),
			longitude: Number.parseFloat(top.lon),
		};
	}
}

/** Offline US ZIP lookup via the bundled `zipcodes` dataset. */
function zipLookup(zip: string): ResolvedLocation | null {
	const hit = zipcodes.lookup(zip);
	if (!hit) return null;
	return {
		city: hit.city,
		region: hit.state,
		country: UNITED_STATES,
		latitude: hit.latitude,
		longitude: hit.longitude,
	};
}

interface NominatimResult {
	lat: string;
	lon: string;
	name?: string;
	address?: {
		city?: string;
		town?: string;
		village?: string;
		municipality?: string;
		county?: string;
		state?: string;
		country?: string;
		country_code?: string;
		"ISO3166-2-lvl4"?: string;
	};
}
