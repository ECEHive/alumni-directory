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
 *   1  graduation_date
 *   2  company
 *   3  job_title
 *   4  city
 *   5  state
 *   6  latitude   (4 decimal places)
 *   7  longitude  (4 decimal places)
 *   8  phone
 *   9  email
 *   10 linkedin
 *
 * ASCII control chars \x1E/\x1F cannot appear in the data, so no escaping
 * is needed. The base64 encoding makes the result safe for .env files.
 *
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
			a.job_title ?? "",
			a.city ?? "",
			a.state ?? "",
			a.latitude != null ? a.latitude.toFixed(4) : "",
			a.longitude != null ? a.longitude.toFixed(4) : "",
			a.phone ?? "",
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
			job_title: f[3] ?? "",
			city: f[4] ?? "",
			state: f[5] ?? "",
			latitude: f[6] ? Number.parseFloat(f[6]) : 0,
			longitude: f[7] ? Number.parseFloat(f[7]) : 0,
			phone: f[8] ?? "",
			email: f[9] ?? "",
			linkedin: f[10] ?? "",
		};
	});
}
