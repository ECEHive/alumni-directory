/**
 * alumni-codec.ts
 *
 * Compact binary-safe encoding for alumni data.
 *
 * Format:
 *   base64( fields joined by \x1F, records joined by \x1E )
 *
 * Field order (fixed, matches Alumni interface):
 *   0  name
 *   1  graduation_date  (4-digit year)
 *   2  company
 *   3  major
 *   4  city
 *   5  region     (US state code, province, …)
 *   6  country    (English country name)
 *   7  latitude   (4 decimal places)
 *   8  longitude  (4 decimal places)
 *   9  email
 *  10  linkedin
 *
 * ASCII control chars \x1E/\x1F cannot appear in the data, so no escaping
 * is needed.
 *
 * The encoder runs at build time (fed from Airtable); the decoder runs in the
 * browser. Both ship from the same build, so the format needs no versioning.
 * This module is intentionally dependency-free and runs in both Node and
 * the browser.
 */

import type { Alumni } from "../types/alumni";

const RS = "\x1E"; // record separator
const US = "\x1F"; // unit separator (field separator)

// ─── Encode ──────────────────────────────────────────────────────────────────

export function encodeAlumni(records: Alumni[]): string {
	const rows = records.map((a) =>
		[
			a.name ?? "",
			a.graduation_date ?? "",
			a.company ?? "",
			a.major ?? "",
			a.city ?? "",
			a.region ?? "",
			a.country ?? "",
			a.latitude != null ? a.latitude.toFixed(4) : "",
			a.longitude != null ? a.longitude.toFixed(4) : "",
			a.email ?? "",
			a.linkedin ?? "",
		].join(US),
	);
	const packed = rows.join(RS);
	const bytes = new TextEncoder().encode(packed);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

// ─── Decode ──────────────────────────────────────────────────────────────────

export function decodeAlumni(encoded: string): Alumni[] {
	const binary = atob(encoded);
	const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
	const packed = new TextDecoder().decode(bytes);
	if (!packed) return [];
	return packed.split(RS).map((row) => {
		const f = row.split(US);
		return {
			name: f[0] ?? "",
			graduation_date: f[1] ?? "",
			company: f[2] ?? "",
			major: f[3] ?? "",
			city: f[4] ?? "",
			region: f[5] ?? "",
			country: f[6] ?? "",
			latitude: f[7] ? Number.parseFloat(f[7]) : 0,
			longitude: f[8] ? Number.parseFloat(f[8]) : 0,
			email: f[9] ?? "",
			linkedin: f[10] ?? "",
		};
	});
}
