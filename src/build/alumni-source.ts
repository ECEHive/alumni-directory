/**
 * Build-time alumni data pipeline: Airtable → transformed Alumni records.
 *
 * Applies consent gating, normalizes messy free-text fields, and geocodes
 * locations:
 *
 *   - Records without "Internally Visible Contact" consent are excluded.
 *   - LinkedIn handles are included only with "LinkedIn Consent", and are
 *     normalized from the many pasted formats (full URLs, tracking params…).
 *   - Graduation free text ("Spring 2026", "2018 (BS), 2020 (MS)") is reduced
 *     to the earliest 4-digit class year.
 *   - Locations are geocoded into city / region / country / coordinates
 *     (see geocode.ts).
 */

import type { Alumni } from "../types/alumni";
import { type AirtableAlumniRecord, fetchAlumniRecords } from "./airtable";
import { type GeocodeLogger, Geocoder } from "./geocode";

export interface LoadAlumniOptions {
	airtableToken: string;
	geocodeCachePath: string;
	logger: GeocodeLogger;
}

/** Fetch, filter, and transform all alumni data. */
export async function loadAlumni(
	options: LoadAlumniOptions,
): Promise<Alumni[]> {
	const { airtableToken, geocodeCachePath, logger } = options;

	const records = await fetchAlumniRecords(airtableToken);
	const visible = records.filter((r) => r.visibleContactConsent);
	logger.info(
		`fetched ${records.length} Airtable records — ${visible.length} consented to directory visibility`,
	);

	const geocoder = new Geocoder(geocodeCachePath, logger);
	const alumni: Alumni[] = [];
	for (const record of visible) {
		alumni.push(await toAlumni(record, geocoder));
	}
	geocoder.save();

	return alumni.sort((a, b) => a.name.localeCompare(b.name));
}

async function toAlumni(
	record: AirtableAlumniRecord,
	geocoder: Geocoder,
): Promise<Alumni> {
	const location = await geocoder.resolve(record.location);

	return {
		name: displayName(record),
		graduation_date: parseGraduationYear(record.graduation),
		company: record.employment,
		major: record.major,
		city: location?.city ?? "",
		region: location?.region ?? "",
		country: location?.country ?? "",
		latitude: location?.latitude ?? 0,
		longitude: location?.longitude ?? 0,
		email: record.email,
		linkedin: record.linkedinConsent
			? normalizeLinkedInHandle(record.linkedin)
			: "",
	};
}

function displayName(record: AirtableAlumniRecord): string {
	const full = record.fullName.replace(/\s+/g, " ").trim();
	if (full) return full;
	return [record.firstName, record.lastName]
		.map((part) => part.trim())
		.filter(Boolean)
		.join(" ");
}

/**
 * Reduce free-text graduation info to a single class year.
 * Multiple degrees ("2018 (BS), 2020 (MS)") → the earliest year.
 * Two-digit shorthand ("Spring 26") → 20xx.
 */
function parseGraduationYear(raw: string): string {
	const years = raw.match(/\b(?:19|20)\d{2}\b/g);
	if (years) return String(Math.min(...years.map(Number)));
	const shorthand = raw.match(/\b(\d{2})\b/);
	if (shorthand) return String(2000 + Number(shorthand[1]));
	return "";
}

/**
 * Normalize a pasted LinkedIn value to a bare profile handle.
 * Accepts bare handles and profile URLs in any pasted form ("linkedin.com/
 * in/handle", full URLs with tracking params, even typos like "inkedin.com").
 * URLs without an /in/ segment (e.g. "linkedin.com/me?…") carry no usable
 * handle and are dropped.
 */
function normalizeLinkedInHandle(raw: string): string {
	const trimmed = raw.trim();
	if (!trimmed) return "";
	const urlMatch = trimmed.match(/\/in\/([^/?#\s]+)/i);
	if (urlMatch) {
		return decodeURIComponent(urlMatch[1]).replace(/\/+$/, "");
	}
	// No /in/ segment: keep only values that look like a bare handle.
	if (/[/.:]/.test(trimmed)) return "";
	return trimmed.replace(/^@/, "");
}
