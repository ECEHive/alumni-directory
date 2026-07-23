/**
 * Location formatting and grouping shared by the build pipeline and the
 * browser. Dependency-free, like alumni-codec.
 *
 * Alumni locations are stored as three parts — city, region (first-level
 * subdivision), country — so display and filtering work the same way for
 * "Atlanta, GA" and "Zürich, Switzerland".
 */

export const UNITED_STATES = "United States";

/** US state / territory postal codes → full names. */
export const US_STATE_NAMES: Record<string, string> = {
	AL: "Alabama",
	AK: "Alaska",
	AZ: "Arizona",
	AR: "Arkansas",
	CA: "California",
	CO: "Colorado",
	CT: "Connecticut",
	DE: "Delaware",
	DC: "District of Columbia",
	FL: "Florida",
	GA: "Georgia",
	HI: "Hawaii",
	ID: "Idaho",
	IL: "Illinois",
	IN: "Indiana",
	IA: "Iowa",
	KS: "Kansas",
	KY: "Kentucky",
	LA: "Louisiana",
	ME: "Maine",
	MD: "Maryland",
	MA: "Massachusetts",
	MI: "Michigan",
	MN: "Minnesota",
	MS: "Mississippi",
	MO: "Missouri",
	MT: "Montana",
	NE: "Nebraska",
	NV: "Nevada",
	NH: "New Hampshire",
	NJ: "New Jersey",
	NM: "New Mexico",
	NY: "New York",
	NC: "North Carolina",
	ND: "North Dakota",
	OH: "Ohio",
	OK: "Oklahoma",
	OR: "Oregon",
	PA: "Pennsylvania",
	RI: "Rhode Island",
	SC: "South Carolina",
	SD: "South Dakota",
	TN: "Tennessee",
	TX: "Texas",
	UT: "Utah",
	VT: "Vermont",
	VA: "Virginia",
	WA: "Washington",
	WV: "West Virginia",
	WI: "Wisconsin",
	WY: "Wyoming",
	AS: "American Samoa",
	GU: "Guam",
	MP: "Northern Mariana Islands",
	PR: "Puerto Rico",
	VI: "U.S. Virgin Islands",
};

export interface LocationParts {
	city?: string;
	region?: string;
	country?: string;
}

/**
 * Human-readable location line.
 *   US            → "Atlanta, GA"
 *   elsewhere     → "Zürich, Switzerland"
 *   city-states   → "Singapore" (no "Singapore, Singapore")
 */
export function formatLocation(loc: LocationParts): string {
	const city = loc.city ?? "";
	const region = loc.region ?? "";
	const country = loc.country ?? "";

	if (!country || country === UNITED_STATES) {
		return [city, region].filter(Boolean).join(", ");
	}
	if (city === country) return city;
	return [city, country].filter(Boolean).join(", ");
}

/**
 * Grouping key for filters and stats: the full US state name for US
 * locations, the country name elsewhere. "GA" and "Switzerland" would make
 * an odd dropdown together; "Georgia" and "Switzerland" don't.
 */
export function locationGroup(loc: LocationParts): string {
	const region = loc.region ?? "";
	const country = loc.country ?? "";

	if (country && country !== UNITED_STATES) return country;
	return US_STATE_NAMES[region] ?? region;
}
