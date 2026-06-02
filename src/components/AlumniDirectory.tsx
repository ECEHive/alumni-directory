import { ArrowDown, ArrowUp, ArrowUpDown, Mail, Search } from "lucide-react";
import { useMemo, useState } from "react";

function formatGradDate(date: string | undefined): string {
	if (!date) return "";
	return date.split("-")[0] || date;
}

import linkedinLogo from "../assets/linkedin-logo.png";
import type { Alumni } from "../types/alumni";

interface AlumniDirectoryProps {
	alumni: Alumni[];
}

export default function AlumniDirectory({ alumni }: AlumniDirectoryProps) {
	const [search, setSearch] = useState("");
	const [sortField, setSortField] = useState<keyof Alumni>("name");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
	const [filterState, setFilterState] = useState<string>("");
	const [filterYear, setFilterYear] = useState<string>("");

	const states = useMemo(() => {
		const s = new Set(alumni.map((a) => a.state).filter(Boolean));
		return Array.from(s).sort();
	}, [alumni]);

	const years = useMemo(() => {
		const y = new Set(
			alumni.map((a) => a.graduation_date?.split("-")[0]).filter(Boolean),
		);
		return Array.from(y).sort().reverse();
	}, [alumni]);

	const filtered = useMemo(() => {
		let result = [...alumni];

		if (search) {
			const q = search.toLowerCase();
			result = result.filter(
				(a) =>
					a.name?.toLowerCase().includes(q) ||
					a.company?.toLowerCase().includes(q) ||
					a.job_title?.toLowerCase().includes(q) ||
					a.city?.toLowerCase().includes(q),
			);
		}

		if (filterState) {
			result = result.filter((a) => a.state === filterState);
		}

		if (filterYear) {
			result = result.filter((a) => a.graduation_date?.startsWith(filterYear));
		}

		result.sort((a, b) => {
			const aVal = a[sortField] ?? "";
			const bVal = b[sortField] ?? "";
			const cmp = String(aVal).localeCompare(String(bVal));
			return sortDirection === "asc" ? cmp : -cmp;
		});

		return result;
	}, [alumni, search, filterState, filterYear, sortField, sortDirection]);

	const handleSort = (field: keyof Alumni) => {
		if (sortField === field) {
			setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	};

	const SortIcon = ({ field }: { field: keyof Alumni }) => {
		if (sortField !== field)
			return (
				<ArrowUpDown className="w-3.5 h-3.5 text-gray-400 dark:text-white/20 ml-1 inline-block" />
			);
		return sortDirection === "asc" ? (
			<ArrowUp className="w-3.5 h-3.5 text-gt-gold ml-1 inline-block" />
		) : (
			<ArrowDown className="w-3.5 h-3.5 text-gt-gold ml-1 inline-block" />
		);
	};

	return (
		<div>
			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-3 mb-6">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
					<input
						type="text"
						placeholder="Search alumni by name, company, or title..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-hive-card border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-gt-gold/50 focus:ring-1 focus:ring-gt-gold/30 transition-all"
					/>
				</div>
				<select
					value={filterState}
					onChange={(e) => setFilterState(e.target.value)}
					className="px-4 py-2.5 bg-white dark:bg-hive-card border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gt-gold/50 transition-all cursor-pointer"
				>
					<option value="">All States</option>
					{states.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
				<select
					value={filterYear}
					onChange={(e) => setFilterYear(e.target.value)}
					className="px-4 py-2.5 bg-white dark:bg-hive-card border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gt-gold/50 transition-all cursor-pointer"
				>
					<option value="">All Years</option>
					{years.map((y) => (
						<option key={y} value={y}>
							{y}
						</option>
					))}
				</select>
			</div>

			{/* Results count */}
			<p className="text-xs text-gray-500 dark:text-white/50 mb-3">
				Showing {filtered.length} of {alumni.length} alumni
			</p>

			{/* Table */}
			<div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-gray-100 dark:bg-gt-navy/60 text-left text-gray-700 dark:text-white">
							<th
								className="px-4 py-3 font-semibold cursor-pointer hover:text-gt-gold transition-colors"
								onClick={() => handleSort("name")}
							>
								Name <SortIcon field="name" />
							</th>
							<th
								className="px-4 py-3 font-semibold cursor-pointer hover:text-gt-gold transition-colors hidden md:table-cell"
								onClick={() => handleSort("graduation_date")}
							>
								Class <SortIcon field="graduation_date" />
							</th>
							<th
								className="px-4 py-3 font-semibold cursor-pointer hover:text-gt-gold transition-colors"
								onClick={() => handleSort("company")}
							>
								Company <SortIcon field="company" />
							</th>
							<th
								className="px-4 py-3 font-semibold cursor-pointer hover:text-gt-gold transition-colors hidden lg:table-cell"
								onClick={() => handleSort("job_title")}
							>
								Role <SortIcon field="job_title" />
							</th>
							<th
								className="px-4 py-3 font-semibold cursor-pointer hover:text-gt-gold transition-colors hidden sm:table-cell"
								onClick={() => handleSort("city")}
							>
								Location <SortIcon field="city" />
							</th>
							<th className="px-4 py-3 font-semibold text-center">Connect</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((a, i) => (
							<tr
								key={
									a.email || `${a.name}-${a.graduation_date}-${a.state}-${i}`
								}
								className="border-t border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
							>
								<td className="px-4 py-3">
									<span className="font-medium text-gray-900 dark:text-white">
										{a.name}
									</span>
								</td>
								<td className="px-4 py-3 text-gray-500 dark:text-white/60 hidden md:table-cell">
									{formatGradDate(a.graduation_date)}
								</td>
								<td className="px-4 py-3 text-gray-700 dark:text-white/80">
									{a.company}
								</td>
								<td className="px-4 py-3 text-gray-500 dark:text-white/60 hidden lg:table-cell">
									{a.job_title}
								</td>
								<td className="px-4 py-3 text-gray-500 dark:text-white/60 hidden sm:table-cell">
									{a.city}, {a.state}
								</td>
								<td className="px-4 py-3">
									<div className="flex items-center justify-center gap-2">
										{a.linkedin && (
											<a
												href={`https://linkedin.com/in/${a.linkedin}`}
												target="_blank"
												rel="noopener noreferrer"
												className="hover:opacity-80 transition-opacity"
												title="LinkedIn"
											>
												<img
													src={linkedinLogo.src}
													alt="LinkedIn"
													width={16}
													height={16}
													className="w-4 h-4 rounded-[3px]"
												/>
											</a>
										)}
										{a.email && (
											<a
												href={`mailto:${a.email}`}
												className="text-gray-400 dark:text-white/40 hover:text-gt-gold transition-colors"
												title="Email"
											>
												<Mail className="w-4 h-4" />
											</a>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{filtered.length === 0 && (
					<div className="text-center py-12 text-gray-400 dark:text-white/40">
						No alumni match your search criteria.
					</div>
				)}
			</div>
		</div>
	);
}
