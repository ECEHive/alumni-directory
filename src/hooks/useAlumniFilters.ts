import { useMemo, useState } from "react";
import { locationGroup } from "../lib/location";
import type { Alumni } from "../types/alumni";

/** Returns the graduation year portion of an ISO-ish date string. */
export function gradYear(date: string | undefined): string {
	if (!date) return "";
	return date.split("-")[0] || date;
}

/**
 * Shared search + region/year filtering used by the directory table and the
 * map sidebar. Keeps filter option lists and matching logic in one place.
 *
 * "Region" is the location grouping key: a full US state name for domestic
 * alumni, the country name for everyone else (see lib/location.ts).
 */
export function useAlumniFilters(alumni: Alumni[]) {
	const [search, setSearch] = useState("");
	const [filterRegion, setFilterRegion] = useState("");
	const [filterYear, setFilterYear] = useState("");

	const regions = useMemo(() => {
		const r = new Set(alumni.map(locationGroup).filter(Boolean));
		return Array.from(r).sort();
	}, [alumni]);

	const years = useMemo(() => {
		const y = new Set(
			alumni.map((a) => gradYear(a.graduation_date)).filter(Boolean),
		);
		return Array.from(y).sort().reverse();
	}, [alumni]);

	const filtered = useMemo(() => {
		let result = alumni;
		if (search) {
			const q = search.toLowerCase();
			result = result.filter(
				(a) =>
					a.name?.toLowerCase().includes(q) ||
					a.company?.toLowerCase().includes(q) ||
					a.major?.toLowerCase().includes(q) ||
					[a.city, a.region, a.country, locationGroup(a)]
						.join(" ")
						.toLowerCase()
						.includes(q),
			);
		}
		if (filterRegion)
			result = result.filter((a) => locationGroup(a) === filterRegion);
		if (filterYear)
			result = result.filter((a) => a.graduation_date?.startsWith(filterYear));
		return result;
	}, [alumni, search, filterRegion, filterYear]);

	const hasFilters = !!(search || filterRegion || filterYear);

	const clearFilters = () => {
		setSearch("");
		setFilterRegion("");
		setFilterYear("");
	};

	return {
		search,
		setSearch,
		filterRegion,
		setFilterRegion,
		filterYear,
		setFilterYear,
		regions,
		years,
		filtered,
		hasFilters,
		clearFilters,
	};
}
