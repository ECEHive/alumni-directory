import { Building2, ChevronLeft, Mail, MapPin, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function formatGradDate(date: string | undefined): string {
	if (!date) return "";
	const [year, month] = date.split("-");
	if (!year) return date;
	if (!month) return year;
	return new Date(Number(year), Number(month) - 1).toLocaleString("en-US", {
		month: "long",
		year: "numeric",
	});
}

import linkedinLogo from "../assets/linkedin-logo.png";
import { useAlumniData } from "../hooks/useAlumniData";
import type { Alumni } from "../types/alumni";
import AccessRestricted from "./AccessRestricted";
import AlumniMap from "./AlumniMap";

export default function MapApp() {
	const { alumni, loading, error } = useAlumniData();
	const [search, setSearch] = useState("");
	const [filterState, setFilterState] = useState("");
	const [filterYear, setFilterYear] = useState("");
	const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
	const [focusedAlumni, setFocusedAlumni] = useState<Alumni | null>(null);
	const [mobileView, setMobileView] = useState<"map" | "list">("map");

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
		if (filterState) result = result.filter((a) => a.state === filterState);
		if (filterYear)
			result = result.filter((a) => a.graduation_date?.startsWith(filterYear));
		return result;
	}, [alumni, search, filterState, filterYear]);

	const hasFilters = !!(search || filterState || filterYear);

	const handleListItemClick = (a: Alumni) => {
		setFocusedAlumni(a);
		setSelectedAlumni(a);
		setMobileView("map");
	};

	if (error) {
		return (
			<div className="flex flex-col h-screen items-center justify-center bg-white dark:bg-hive-darker">
				<AccessRestricted error={error} />
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen bg-white dark:bg-hive-darker">
				<div className="flex flex-col items-center gap-4">
					<div className="w-10 h-10 border-[3px] border-gt-gold/30 border-t-gt-gold rounded-full animate-spin" />
					<p className="text-sm text-gray-400 dark:text-white/40">
						Loading alumni data...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-hive-darker">
			{/* Mobile top bar */}
			<header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-hive-dark border-b border-gray-200 dark:border-white/10 shrink-0 z-20">
				<a
					href="/"
					className="flex items-center gap-1 text-sm text-gray-500 dark:text-white/50 hover:text-gt-gold transition-colors shrink-0"
				>
					<ChevronLeft className="w-4 h-4" />
					Back
				</a>
				<div className="flex-1 text-center">
					<span className="text-sm font-semibold text-gray-900 dark:text-white">
						Hive Alumni Map
					</span>
				</div>
				<div className="flex bg-gray-100 dark:bg-hive-card rounded-lg p-0.5 shrink-0">
					<button
						type="button"
						onClick={() => setMobileView("map")}
						className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
							mobileView === "map"
								? "bg-white dark:bg-gt-navy/80 text-gt-gold shadow-sm"
								: "text-gray-500 dark:text-white/40"
						}`}
					>
						Map
					</button>
					<button
						type="button"
						onClick={() => setMobileView("list")}
						className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
							mobileView === "list"
								? "bg-white dark:bg-gt-navy/80 text-gt-gold shadow-sm"
								: "text-gray-500 dark:text-white/40"
						}`}
					>
						List
					</button>
				</div>
			</header>

			{/* Main layout */}
			<div className="flex flex-1 min-h-0 overflow-hidden">
				{/* Sidebar */}
				<aside
					className={`${mobileView === "list" ? "flex" : "hidden"} md:flex w-full md:w-80 lg:w-96 flex-col bg-white dark:bg-hive-dark border-r border-gray-200 dark:border-white/10 overflow-hidden shrink-0`}
				>
					{/* Desktop header */}
					<div className="hidden md:flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5 shrink-0">
						<a
							href="/"
							className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/50 hover:text-gt-gold transition-colors"
						>
							<ChevronLeft className="w-4 h-4" />
							Back
						</a>
						<div className="flex items-center">
							<img
								src="/logo-light.svg"
								alt="The Hive Alumni"
								className="h-7 w-auto dark:hidden"
							/>
							<img
								src="/logo-dark.svg"
								alt="The Hive Alumni"
								className="h-7 w-auto hidden dark:block"
							/>
						</div>
					</div>

					{/* Search */}
					<div className="px-3 pt-3 pb-2 shrink-0">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30 pointer-events-none" />
							<input
								type="text"
								placeholder="Search name, company, city..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-hive-card border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-gt-gold/50 focus:ring-1 focus:ring-gt-gold/20 transition-all"
							/>
							{search && (
								<button
									type="button"
									onClick={() => setSearch("")}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/60 transition-colors"
									aria-label="Clear search"
								>
									<X className="w-3.5 h-3.5" />
								</button>
							)}
						</div>
					</div>

					{/* Filters */}
					<div className="px-3 pb-2 flex gap-2 shrink-0">
						<select
							value={filterState}
							onChange={(e) => setFilterState(e.target.value)}
							className="flex-1 min-w-0 px-2.5 py-2 bg-gray-50 dark:bg-hive-card border border-gray-200 dark:border-white/10 rounded-lg text-xs text-gray-700 dark:text-white/80 focus:outline-none focus:border-gt-gold/50 transition-all cursor-pointer"
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
							className="flex-1 min-w-0 px-2.5 py-2 bg-gray-50 dark:bg-hive-card border border-gray-200 dark:border-white/10 rounded-lg text-xs text-gray-700 dark:text-white/80 focus:outline-none focus:border-gt-gold/50 transition-all cursor-pointer"
						>
							<option value="">All Years</option>
							{years.map((y) => (
								<option key={y} value={y}>
									{y}
								</option>
							))}
						</select>
					</div>

					{/* Count + clear */}
					<div className="px-3 pb-2 flex items-center justify-between shrink-0">
						<span className="text-xs text-gray-400 dark:text-white/30">
							{filtered.length} of {alumni.length} alumni
						</span>
						{hasFilters && (
							<button
								type="button"
								onClick={() => {
									setSearch("");
									setFilterState("");
									setFilterYear("");
								}}
								className="text-xs text-gt-gold hover:text-gt-gold-light transition-colors"
							>
								Clear all
							</button>
						)}
					</div>

					{/* Alumni list */}
					<div className="flex-1 overflow-y-auto">
						{filtered.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 px-6 text-center">
								<p className="text-sm text-gray-400 dark:text-white/30">
									No alumni match your search
								</p>
							</div>
						) : (
							<ul>
								{filtered.map((a, i) => (
									<li
										key={a.email || `${a.name}-${a.graduation_date}-${i}`}
										className="border-b border-gray-100 dark:border-white/5 last:border-0"
									>
										<button
											type="button"
											onClick={() => handleListItemClick(a)}
											className="w-full text-left px-3 py-3 hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10 transition-colors group"
										>
											<div className="flex items-start gap-2.5">
												<div className="w-8 h-8 rounded-full bg-gt-gold/15 border border-gt-gold/20 flex items-center justify-center shrink-0 mt-0.5">
													<span className="text-xs font-bold text-gt-gold">
														{a.name?.charAt(0) ?? "?"}
													</span>
												</div>
												<div className="min-w-0 flex-1">
													<p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-gt-gold transition-colors truncate">
														{a.name}
													</p>
													{(a.job_title || a.company) && (
														<p className="text-xs text-gray-500 dark:text-white/50 truncate mt-0.5">
															{[a.job_title, a.company]
																.filter(Boolean)
																.join(" · ")}
														</p>
													)}
													{(a.city || a.state) && (
														<p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">
															{[a.city, a.state].filter(Boolean).join(", ")}
														</p>
													)}
												</div>
												{a.graduation_date && (
													<span className="text-[10px] text-gray-400 dark:text-white/25 shrink-0 mt-0.5">
														{formatGradDate(a.graduation_date)}
													</span>
												)}
											</div>
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</aside>

				{/* Map area */}
				<main
					className={`${mobileView === "map" ? "flex" : "hidden"} md:flex flex-1 relative overflow-hidden`}
				>
					<AlumniMap
						alumni={filtered}
						onAlumniSelect={(a) => setSelectedAlumni(a)}
						focusedAlumni={focusedAlumni}
					/>
				</main>
			</div>

			{/* Alumni Detail Dialog */}
			{selectedAlumni && (
				<AlumniDialog
					alumni={selectedAlumni}
					onClose={() => setSelectedAlumni(null)}
				/>
			)}
		</div>
	);
}

function AlumniDialog({
	alumni,
	onClose,
}: {
	alumni: Alumni;
	onClose: () => void;
}) {
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [onClose]);

	return (
		<div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
			{/* Backdrop */}
			<button
				type="button"
				aria-label="Close dialog"
				className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default w-full"
				onClick={onClose}
			/>

			{/* Dialog */}
			<div className="relative bg-white dark:bg-hive-dark w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border-t border-gray-200 dark:border-white/10 sm:border overflow-hidden">
				{/* Drag handle (mobile only) */}
				<div className="sm:hidden flex justify-center pt-3 pb-1">
					<div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/20" />
				</div>

				{/* Header */}
				<div className="bg-gt-navy px-5 py-4">
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="w-11 h-11 rounded-full bg-gt-gold/20 border-2 border-gt-gold/30 flex items-center justify-center shrink-0">
								<span className="text-base font-bold text-gt-gold">
									{alumni.name?.charAt(0) ?? "?"}
								</span>
							</div>
							<div>
								<h2 className="text-base font-bold text-white leading-tight">
									{alumni.name}
								</h2>
								{alumni.graduation_date && (
									<p className="text-xs text-white/50 mt-0.5">
										Class of {formatGradDate(alumni.graduation_date)}
									</p>
								)}
							</div>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="text-white/40 hover:text-white transition-colors shrink-0 mt-0.5"
							aria-label="Close"
						>
							<X className="w-5 h-5" />
						</button>
					</div>
				</div>

				{/* Body */}
				<div className="px-5 py-4 space-y-3">
					{(alumni.job_title || alumni.company) && (
						<div className="flex items-start gap-3">
							<Building2 className="w-4 h-4 text-gt-gold mt-0.5 shrink-0" />
							<div>
								{alumni.job_title && (
									<p className="text-sm font-semibold text-gray-900 dark:text-white">
										{alumni.job_title}
									</p>
								)}
								{alumni.company && (
									<p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
										{alumni.company}
									</p>
								)}
							</div>
						</div>
					)}

					{(alumni.city || alumni.state) && (
						<div className="flex items-center gap-3">
							<MapPin className="w-4 h-4 text-gt-gold shrink-0" />
							<p className="text-sm text-gray-700 dark:text-white/80">
								{[alumni.city, alumni.state].filter(Boolean).join(", ")}
							</p>
						</div>
					)}

					{alumni.email && (
						<div className="flex items-center gap-3">
							<Mail className="w-4 h-4 text-gt-gold shrink-0" />
							<a
								href={`mailto:${alumni.email}`}
								className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
							>
								{alumni.email}
							</a>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-5 pb-5 pt-1 flex gap-2">
					{alumni.linkedin && (
						<a
							href={`https://linkedin.com/in/${alumni.linkedin}`}
							target="_blank"
							rel="noopener noreferrer"
							className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0A66C2] hover:bg-[#085db5] text-white text-sm font-semibold rounded-xl transition-colors"
						>
							<img
								src={linkedinLogo.src}
								alt="LinkedIn"
								width={16}
								height={16}
								className="w-4 h-4 rounded-[3px]"
							/>
							LinkedIn
						</a>
					)}
					<button
						type="button"
						onClick={onClose}
						className={`${alumni.linkedin ? "flex-none px-5" : "flex-1"} py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-white/15 transition-colors`}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
