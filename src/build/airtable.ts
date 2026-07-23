/**
 * Airtable data source for the alumni directory.
 *
 * Fetches every record from the alumni table at build time via the Airtable
 * REST API (https://airtable.com/developers/web/api/list-records), following
 * pagination offsets until exhausted.
 *
 * Records are requested by field ID (`returnFieldsByFieldId`) so column
 * renames in Airtable never break the build.
 */

const BASE_ID = "appjaEg1F9htFHxbK";
const TABLE_ID = "tblZZuXqH7Eqh2458";
const API_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

/** Airtable field IDs → semantic names. */
const FIELDS = {
	fullName: "fldwtQiKKaSEsTnP5",
	firstName: "fldKJwJEvh5isX0JE",
	lastName: "fldFHirQtgs2Qjuym",
	email: "fldhq8kFB8LbnzkI3",
	employment: "fldiAtCCijhbencei",
	linkedin: "fldrIALc1RLhApxT9",
	major: "fld7TXMgSWYNEu5IX",
	/** Free-text "Location" column: ZIPs, "City, ST", "City, Country"… */
	location: "fldBx1pCv2Bf2ItXJ",
	graduation: "fldZ4k3ojI6Vh4C3X",
	/** Checkbox: record may appear in the (encrypted) directory at all. */
	visibleContactConsent: "fld4IuR2Xn3kuHl6q",
	/** Checkbox: LinkedIn handle may be shown. */
	linkedinConsent: "fldn7A7muCIIUSKP4",
} as const;

export interface AirtableAlumniRecord {
	id: string;
	fullName: string;
	firstName: string;
	lastName: string;
	email: string;
	employment: string;
	linkedin: string;
	major: string;
	location: string;
	graduation: string;
	visibleContactConsent: boolean;
	linkedinConsent: boolean;
}

interface AirtableListResponse {
	records: {
		id: string;
		fields: Record<string, unknown>;
	}[];
	offset?: string;
}

function text(fields: Record<string, unknown>, fieldId: string): string {
	const value = fields[fieldId];
	return typeof value === "string" ? value.trim() : "";
}

/** Fetch all alumni records, following pagination. */
export async function fetchAlumniRecords(
	token: string,
): Promise<AirtableAlumniRecord[]> {
	const records: AirtableAlumniRecord[] = [];
	let offset: string | undefined;

	do {
		const url = new URL(API_URL);
		url.searchParams.set("returnFieldsByFieldId", "true");
		url.searchParams.set("pageSize", "100");
		for (const fieldId of Object.values(FIELDS)) {
			url.searchParams.append("fields[]", fieldId);
		}
		if (offset) url.searchParams.set("offset", offset);

		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!res.ok) {
			throw new Error(
				`Airtable request failed: ${res.status} ${res.statusText} — ${await res.text()}`,
			);
		}

		const page = (await res.json()) as AirtableListResponse;
		for (const { id, fields } of page.records) {
			records.push({
				id,
				fullName: text(fields, FIELDS.fullName),
				firstName: text(fields, FIELDS.firstName),
				lastName: text(fields, FIELDS.lastName),
				email: text(fields, FIELDS.email),
				employment: text(fields, FIELDS.employment),
				linkedin: text(fields, FIELDS.linkedin),
				major: text(fields, FIELDS.major),
				location: text(fields, FIELDS.location),
				graduation: text(fields, FIELDS.graduation),
				visibleContactConsent: fields[FIELDS.visibleContactConsent] === true,
				linkedinConsent: fields[FIELDS.linkedinConsent] === true,
			});
		}
		offset = page.offset;
	} while (offset);

	return records;
}
