/**
 * DataImportApp
 *
 * Developer utility for converting CSV or XLSX files into the compact
 * ALUMNI_DATA env variable format consumed by the alumni-encrypt integration.
 *
 * Workflow:
 *   1. Drop or pick a CSV / XLSX file
 *   2. Map its columns to the Alumni fields (auto-detected)
 *   3. Preview the parsed rows
 *   4. Generate the ALUMNI_DATA= string and copy it to the clipboard
 */

import {
	AlertTriangle,
	CheckCircle2,
	ChevronDown,
	ClipboardCopy,
	FileSpreadsheet,
	RefreshCw,
	Upload,
	X,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

function formatGradDate(date: string | undefined): string {
	if (!date) return "";
	return date.split("-")[0] || date;
}

import { encodeAlumni } from "../../lib/alumni-codec";
import type { Alumni } from "../../types/alumni";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "upload" | "map" | "preview" | "output";

interface RawRow {
	[key: string]: string | number | boolean | Date | null | undefined;
}

// All Alumni fields in display order
const ALUMNI_FIELDS: { key: keyof Alumni; label: string; required: boolean }[] =
	[
		{ key: "name", label: "Name", required: true },
		{
			key: "graduation_date",
			label: "Graduation Year (YYYY)",
			required: true,
		},
		{ key: "company", label: "Company", required: true },
		{ key: "job_title", label: "Job Title", required: true },
		{ key: "city", label: "City", required: true },
		{ key: "state", label: "State (abbr.)", required: true },
		{ key: "latitude", label: "Latitude", required: true },
		{ key: "longitude", label: "Longitude", required: true },
		{ key: "email", label: "Email", required: false },
		{ key: "linkedin", label: "LinkedIn handle", required: false },
	];

// Common column name aliases for auto-detection
const AUTO_MAP: Record<keyof Alumni, string[]> = {
	name: ["name", "full name", "fullname", "student name"],
	graduation_date: [
		"graduation_date",
		"graduation date",
		"grad date",
		"grad_date",
		"graduation",
	],
	company: ["company", "employer", "organization", "org", "workplace"],
	job_title: ["job_title", "job title", "title", "position", "role"],
	city: ["city", "location city"],
	state: ["state", "location state", "st"],
	latitude: ["latitude", "lat"],
	longitude: ["longitude", "lon", "lng", "long"],
	email: ["email", "email address", "e-mail"],
	linkedin: ["linkedin", "linkedin handle", "linkedin url"],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function autoDetectMapping(
	headers: string[],
): Partial<Record<keyof Alumni, string>> {
	const mapping: Partial<Record<keyof Alumni, string>> = {};
	const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
	for (const field of ALUMNI_FIELDS) {
		const aliases = AUTO_MAP[field.key];
		for (const alias of aliases) {
			const idx = lowerHeaders.indexOf(alias);
			if (idx !== -1) {
				mapping[field.key] = headers[idx];
				break;
			}
		}
	}
	return mapping;
}

function parseFile(file: File): Promise<{ headers: string[]; rows: RawRow[] }> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = e.target?.result;
				const wb = XLSX.read(data, { type: "array", cellDates: true });
				const ws = wb.Sheets[wb.SheetNames[0]];
				const json = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: "" });
				const headers = Object.keys(json[0] ?? {});
				resolve({ headers, rows: json });
			} catch (err) {
				reject(err);
			}
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsArrayBuffer(file);
	});
}

function applyMapping(
	rows: RawRow[],
	mapping: Partial<Record<keyof Alumni, string>>,
): { alumni: Alumni[]; warnings: string[] } {
	const warnings: string[] = [];

	const alumni: Alumni[] = rows.map((row, i) => {
		const get = (key: keyof Alumni): string => {
			const col = mapping[key];
			if (!col) return "";
			const val = row[col];
			if (val == null) return "";
			if (val instanceof Date) {
				if (key === "graduation_date") return String(val.getFullYear());
				const y = val.getFullYear();
				const m = String(val.getMonth() + 1).padStart(2, "0");
				return `${y}-${m}`;
			}
			const str = String(val).trim();
			if (key === "graduation_date") {
				return str.match(/^(\d{4})/)?.[1] ?? str;
			}
			return str;
		};

		const lat = Number.parseFloat(get("latitude"));
		const lng = Number.parseFloat(get("longitude"));

		if (Number.isNaN(lat) || Number.isNaN(lng)) {
			warnings.push(
				`Row ${i + 1}: invalid lat/lng — "${get("latitude")}", "${get("longitude")}"`,
			);
		}

		return {
			name: get("name"),
			graduation_date: get("graduation_date"),
			company: get("company"),
			job_title: get("job_title"),
			city: get("city"),
			state: get("state"),
			latitude: Number.isNaN(lat) ? 0 : lat,
			longitude: Number.isNaN(lng) ? 0 : lng,
			email: get("email"),
			linkedin: get("linkedin"),
		};
	});

	return { alumni, warnings };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
	const steps: { id: Step; label: string }[] = [
		{ id: "upload", label: "Upload" },
		{ id: "map", label: "Map Columns" },
		{ id: "preview", label: "Preview" },
		{ id: "output", label: "Export" },
	];
	const idx = steps.findIndex((s) => s.id === current);
	return (
		<div className="flex items-center gap-0 mb-10">
			{steps.map((step, i) => (
				<div key={step.id} className="flex items-center">
					<div className="flex items-center gap-2">
						<div
							className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
								i < idx
									? "bg-gt-gold text-white"
									: i === idx
										? "bg-gt-navy text-white dark:bg-gt-gold dark:text-gt-navy"
										: "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/30"
							}`}
						>
							{i < idx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
						</div>
						<span
							className={`text-sm font-medium ${
								i === idx
									? "text-gray-900 dark:text-white"
									: "text-gray-400 dark:text-white/30"
							}`}
						>
							{step.label}
						</span>
					</div>
					{i < steps.length - 1 && (
						<div className="w-10 h-px bg-gray-200 dark:bg-white/10 mx-3" />
					)}
				</div>
			))}
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DataImportApp() {
	// Step state
	const [step, setStep] = useState<Step>("upload");

	// Upload
	const [file, setFile] = useState<File | null>(null);
	const [headers, setHeaders] = useState<string[]>([]);
	const [rawRows, setRawRows] = useState<RawRow[]>([]);
	const [parseError, setParseError] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Mapping
	const [mapping, setMapping] = useState<Partial<Record<keyof Alumni, string>>>(
		{},
	);

	// Output
	const [alumni, setAlumni] = useState<Alumni[]>([]);
	const [warnings, setWarnings] = useState<string[]>([]);
	const [encoded, setEncoded] = useState<string>("");
	const [copied, setCopied] = useState(false);

	// ── Upload handlers ────────────────────────────────────────────────────────

	const handleFile = useCallback(async (f: File) => {
		setParseError(null);
		setFile(f);
		try {
			const { headers: h, rows } = await parseFile(f);
			setHeaders(h);
			setRawRows(rows);
			setMapping(autoDetectMapping(h));
			setStep("map");
		} catch (e) {
			setParseError(
				`Failed to parse file: ${e instanceof Error ? e.message : String(e)}`,
			);
		}
	}, []);

	const onDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const f = e.dataTransfer.files[0];
			if (f) handleFile(f);
		},
		[handleFile],
	);

	const onInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const f = e.target.files?.[0];
			if (f) handleFile(f);
		},
		[handleFile],
	);

	// ── Mapping → Preview ─────────────────────────────────────────────────────

	const missingRequired = useMemo(
		() =>
			ALUMNI_FIELDS.filter((f) => f.required && !mapping[f.key]).map(
				(f) => f.label,
			),
		[mapping],
	);

	const handlePreview = useCallback(() => {
		const { alumni: a, warnings: w } = applyMapping(rawRows, mapping);
		setAlumni(a);
		setWarnings(w);
		setStep("preview");
	}, [rawRows, mapping]);

	// ── Preview → Output ──────────────────────────────────────────────────────

	const handleGenerate = useCallback(() => {
		const blob = encodeAlumni(alumni);
		setEncoded(blob);
		setStep("output");
	}, [alumni]);

	// ── Copy ──────────────────────────────────────────────────────────────────

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(`ALUMNI_DATA=${encoded}`);
		setCopied(true);
		setTimeout(() => setCopied(false), 2500);
	}, [encoded]);

	// ── Reset ─────────────────────────────────────────────────────────────────

	const handleReset = useCallback(() => {
		setStep("upload");
		setFile(null);
		setHeaders([]);
		setRawRows([]);
		setMapping({});
		setAlumni([]);
		setWarnings([]);
		setEncoded("");
		setCopied(false);
		setParseError(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}, []);

	// ─── Render ───────────────────────────────────────────────────────────────

	return (
		<div className="space-y-8">
			{/* Page title */}
			<div>
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
					Alumni Data Import
				</h1>
				<p className="mt-1 text-sm text-gray-500 dark:text-white/50">
					Convert a CSV or XLSX file into the compact{" "}
					<code className="font-mono text-gt-gold bg-gt-gold/10 px-1.5 py-0.5 rounded">
						ALUMNI_DATA
					</code>{" "}
					env variable.
				</p>
			</div>

			<StepIndicator current={step} />

			{/* ── Step 1: Upload ── */}
			{step === "upload" && (
				<div className="space-y-4">
					<button
						type="button"
						className={`w-full relative border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${
							isDragging
								? "border-gt-gold bg-gt-gold/5"
								: "border-gray-200 dark:border-white/10 hover:border-gt-gold/50 hover:bg-gray-50 dark:hover:bg-white/5"
						}`}
						onDrop={onDrop}
						onDragOver={(e) => {
							e.preventDefault();
							setIsDragging(true);
						}}
						onDragLeave={() => setIsDragging(false)}
						onClick={() => fileInputRef.current?.click()}
					>
						<div className="p-4 rounded-2xl bg-gray-100 dark:bg-white/10">
							<Upload
								className="w-8 h-8 text-gray-400 dark:text-white/40"
								strokeWidth={1.5}
							/>
						</div>
						<div className="text-center">
							<p className="font-semibold text-gray-900 dark:text-white">
								Drop your file here
							</p>
							<p className="text-sm text-gray-500 dark:text-white/50 mt-1">
								or click to browse — CSV and XLSX supported
							</p>
						</div>
						<input
							ref={fileInputRef}
							type="file"
							accept=".csv,.xlsx,.xls"
							className="sr-only"
							onChange={onInputChange}
						/>
					</button>

					{parseError && (
						<div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-sm text-red-700 dark:text-red-400">
							<AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
							{parseError}
						</div>
					)}
				</div>
			)}

			{/* ── Step 2: Map Columns ── */}
			{step === "map" && (
				<div className="space-y-6">
					<div className="flex items-center gap-3">
						<FileSpreadsheet className="w-5 h-5 text-gt-gold shrink-0" />
						<p className="text-sm text-gray-600 dark:text-white/60">
							<span className="font-semibold text-gray-900 dark:text-white">
								{file?.name}
							</span>
							{" — "}
							{rawRows.length.toLocaleString()} rows · {headers.length} columns
							detected
						</p>
						<button
							type="button"
							onClick={handleReset}
							className="ml-auto text-xs text-gray-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
						>
							<X className="w-3.5 h-3.5" /> Change file
						</button>
					</div>

					<div className="bg-white dark:bg-hive-dark border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
						<div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-white/5 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider px-4 py-2.5">
							<span>Alumni Field</span>
							<span>Source Column</span>
						</div>
						<div className="divide-y divide-gray-100 dark:divide-white/5">
							{ALUMNI_FIELDS.map((field) => (
								<div
									key={field.key}
									className="grid grid-cols-2 gap-4 items-center px-4 py-3"
								>
									<div className="flex items-center gap-2">
										<span className="text-sm text-gray-900 dark:text-white">
											{field.label}
										</span>
										{field.required ? (
											<span className="text-[10px] text-red-400 font-semibold uppercase">
												required
											</span>
										) : (
											<span className="text-[10px] text-gray-300 dark:text-white/20 font-medium uppercase">
												optional
											</span>
										)}
									</div>
									<div className="relative">
										<select
											className="w-full appearance-none text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 pr-8 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gt-gold/50"
											value={mapping[field.key] ?? ""}
											onChange={(e) =>
												setMapping((m) => ({
													...m,
													[field.key]: e.target.value || undefined,
												}))
											}
										>
											<option value="">— not mapped —</option>
											{headers.map((h) => (
												<option key={h} value={h}>
													{h}
												</option>
											))}
										</select>
										<ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
									</div>
								</div>
							))}
						</div>
					</div>

					{missingRequired.length > 0 && (
						<div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-sm text-amber-700 dark:text-amber-400">
							<AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
							<span>
								Required fields not yet mapped:{" "}
								<strong>{missingRequired.join(", ")}</strong>
							</span>
						</div>
					)}

					<div className="flex justify-between">
						<button
							type="button"
							onClick={handleReset}
							className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
						>
							← Back
						</button>
						<button
							type="button"
							disabled={missingRequired.length > 0}
							onClick={handlePreview}
							className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gt-navy text-white hover:bg-gt-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
						>
							Preview Data →
						</button>
					</div>
				</div>
			)}

			{/* ── Step 3: Preview ── */}
			{step === "preview" && (
				<div className="space-y-6">
					<div className="flex items-center gap-3 text-sm">
						<CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
						<span className="text-gray-600 dark:text-white/60">
							<span className="font-semibold text-gray-900 dark:text-white">
								{alumni.length.toLocaleString()} records
							</span>{" "}
							parsed successfully
						</span>
					</div>

					{warnings.length > 0 && (
						<div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 space-y-1">
							<p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
								<AlertTriangle className="w-3.5 h-3.5" />
								{warnings.length} warning{warnings.length !== 1 ? "s" : ""}
							</p>
							<ul className="mt-1 space-y-0.5">
								{warnings.slice(0, 10).map((w) => (
									<li
										key={w}
										className="text-xs text-amber-700 dark:text-amber-400"
									>
										{w}
									</li>
								))}
								{warnings.length > 10 && (
									<li className="text-xs text-amber-500">
										… and {warnings.length - 10} more
									</li>
								)}
							</ul>
						</div>
					)}

					{/* Preview table */}
					<div className="overflow-auto rounded-2xl border border-gray-200 dark:border-white/10 max-h-[420px]">
						<table className="min-w-full text-xs divide-y divide-gray-100 dark:divide-white/5">
							<thead className="bg-gray-50 dark:bg-white/5 sticky top-0">
								<tr>
									{ALUMNI_FIELDS.map((f) => (
										<th
											key={f.key}
											className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider whitespace-nowrap"
										>
											{f.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-hive-dark">
								{alumni.slice(0, 50).map((a) => (
									<tr
										key={`${a.name}-${a.graduation_date}-${a.company}`}
										className="hover:bg-gray-50 dark:hover:bg-white/5"
									>
										<td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap font-medium">
											{a.name}
										</td>
										<td className="px-3 py-2 text-gray-500 dark:text-white/60 whitespace-nowrap">
											{formatGradDate(a.graduation_date)}
										</td>
										<td className="px-3 py-2 text-gray-500 dark:text-white/60 whitespace-nowrap">
											{a.company}
										</td>
										<td className="px-3 py-2 text-gray-500 dark:text-white/60 whitespace-nowrap">
											{a.job_title}
										</td>
										<td className="px-3 py-2 text-gray-500 dark:text-white/60 whitespace-nowrap">
											{a.city}
										</td>
										<td className="px-3 py-2 text-gray-500 dark:text-white/60">
											{a.state}
										</td>
										<td className="px-3 py-2 text-gray-500 dark:text-white/60 font-mono">
											{a.latitude}
										</td>
										<td className="px-3 py-2 text-gray-500 dark:text-white/60 font-mono">
											{a.longitude}
										</td>
										<td className="px-3 py-2 text-gray-500 dark:text-white/60">
											{a.email}
										</td>
										<td className="px-3 py-2 text-gray-500 dark:text-white/60">
											{a.linkedin}
										</td>
									</tr>
								))}
							</tbody>
						</table>
						{alumni.length > 50 && (
							<p className="text-xs text-center text-gray-400 dark:text-white/30 py-3 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-hive-dark">
								Showing 50 of {alumni.length.toLocaleString()} rows
							</p>
						)}
					</div>

					<div className="flex justify-between">
						<button
							type="button"
							onClick={() => setStep("map")}
							className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
						>
							← Edit Mapping
						</button>
						<button
							type="button"
							onClick={handleGenerate}
							className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gt-navy text-white hover:bg-gt-navy/90 transition-colors"
						>
							Generate Env Variable →
						</button>
					</div>
				</div>
			)}

			{/* ── Step 4: Output ── */}
			{step === "output" && (
				<div className="space-y-6">
					<div className="flex items-center gap-3 text-sm">
						<CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
						<span className="text-gray-600 dark:text-white/60">
							Encoded{" "}
							<span className="font-semibold text-gray-900 dark:text-white">
								{alumni.length.toLocaleString()} records
							</span>{" "}
							→{" "}
							<span className="font-semibold text-gray-900 dark:text-white">
								{encoded.length.toLocaleString()} chars
							</span>{" "}
							({(encoded.length / 1024).toFixed(1)} KB)
						</span>
					</div>

					{/* The env variable output */}
					<div className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
						<div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
							<span className="text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wide">
								.env
							</span>
							<button
								type="button"
								onClick={handleCopy}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
									copied
										? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
										: "bg-gt-navy text-white hover:bg-gt-navy/90 dark:bg-gt-gold dark:text-gt-navy dark:hover:bg-gt-gold/90"
								}`}
							>
								{copied ? (
									<>
										<CheckCircle2 className="w-3.5 h-3.5" />
										Copied!
									</>
								) : (
									<>
										<ClipboardCopy className="w-3.5 h-3.5" />
										Copy
									</>
								)}
							</button>
						</div>
						<pre className="p-4 text-xs font-mono text-gray-800 dark:text-white/80 bg-white dark:bg-hive-dark overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
							<span className="text-purple-600 dark:text-purple-400">
								ALUMNI_DATA
							</span>
							<span className="text-gray-500 dark:text-white/40">=</span>
							<span className="text-green-700 dark:text-green-400">
								{encoded}
							</span>
						</pre>
					</div>

					{/* Usage instructions */}
					<div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3 text-sm">
						<p className="font-semibold text-gray-900 dark:text-white">
							Next steps
						</p>
						<ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-white/60">
							<li>
								Copy the line above and paste it into your{" "}
								<code className="font-mono text-gt-gold bg-gt-gold/10 px-1 rounded">
									.env
								</code>{" "}
								file, replacing any existing{" "}
								<code className="font-mono text-gt-gold bg-gt-gold/10 px-1 rounded">
									ALUMNI_DATA
								</code>{" "}
								value.
							</li>
							<li>
								Run{" "}
								<code className="font-mono text-gt-gold bg-gt-gold/10 px-1 rounded">
									bun run build
								</code>{" "}
								(or restart dev) — the integration will pick up the new data
								automatically.
							</li>
							<li>The raw file is never included in the build output.</li>
						</ol>
					</div>

					<div className="flex justify-between">
						<button
							type="button"
							onClick={() => setStep("preview")}
							className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
						>
							← Back
						</button>
						<button
							type="button"
							onClick={handleReset}
							className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
						>
							<RefreshCw className="w-4 h-4" />
							Import another file
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
