import {
	ArrowDownIcon,
	ArrowUpDownIcon,
	ArrowUpIcon,
	MailIcon,
	SearchXIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import linkedinLogo from "../assets/linkedin-logo.png";
import { gradYear } from "../hooks/useAlumniFilters";
import { formatLocation } from "../lib/location";
import type { Alumni } from "../types/alumni";

interface AlumniTableProps {
	alumni: Alumni[];
	/** Called when a row is activated; opens the shared detail dialog. */
	onSelect: (alumni: Alumni) => void;
}

const columns: { field: keyof Alumni; label: string; className?: string }[] = [
	{ field: "name", label: "Name" },
	{
		field: "graduation_date",
		label: "Class",
		className: "hidden md:table-cell",
	},
	{ field: "company", label: "Company" },
	{ field: "major", label: "Major", className: "hidden lg:table-cell" },
	{ field: "city", label: "Location", className: "hidden sm:table-cell" },
];

/** Sortable directory table. Expects an already-filtered alumni list. */
export default function AlumniTable({ alumni, onSelect }: AlumniTableProps) {
	const [sortField, setSortField] = useState<keyof Alumni>("name");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

	const sorted = useMemo(() => {
		const result = [...alumni];
		result.sort((a, b) => {
			const cmp = String(a[sortField] ?? "").localeCompare(
				String(b[sortField] ?? ""),
			);
			return sortDirection === "asc" ? cmp : -cmp;
		});
		return result;
	}, [alumni, sortField, sortDirection]);

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
			return <ArrowUpDownIcon data-icon="inline-end" aria-hidden="true" />;
		return sortDirection === "asc" ? (
			<ArrowUpIcon data-icon="inline-end" aria-hidden="true" />
		) : (
			<ArrowDownIcon data-icon="inline-end" aria-hidden="true" />
		);
	};

	return (
		<TooltipProvider>
			<div className="overflow-hidden rounded-xl border">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/50 hover:bg-muted/50">
							{columns.map(({ field, label, className }) => (
								<TableHead
									key={field}
									scope="col"
									aria-sort={
										sortField === field
											? sortDirection === "asc"
												? "ascending"
												: "descending"
											: undefined
									}
									className={className}
								>
									{/* Negative margin cancels the button's own padding so the
									    label aligns with cell text below. */}
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleSort(field)}
										className="-ml-2.5"
									>
										{label}
										<SortIcon field={field} />
									</Button>
								</TableHead>
							))}
							<TableHead scope="col" className="pr-4 text-center">
								Connect
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sorted.map((a, i) => (
							<TableRow
								key={
									a.email || `${a.name}-${a.graduation_date}-${a.region}-${i}`
								}
								className="cursor-pointer"
								onClick={() => onSelect(a)}
							>
								<TableCell className="font-medium">
									{/* Focusable activator so rows work from the keyboard too. */}
									<button
										type="button"
										className="cursor-pointer rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-4"
										onClick={() => onSelect(a)}
									>
										{a.name}
									</button>
								</TableCell>
								<TableCell className="hidden text-muted-foreground md:table-cell">
									{gradYear(a.graduation_date)}
								</TableCell>
								<TableCell>{a.company}</TableCell>
								<TableCell className="hidden text-muted-foreground lg:table-cell">
									{a.major}
								</TableCell>
								<TableCell className="hidden text-muted-foreground sm:table-cell">
									{formatLocation(a)}
								</TableCell>
								<TableCell className="pr-4">
									{/* Stop propagation so contact links don't also open the dialog. */}
									{/* biome-ignore lint/a11y/useKeyWithClickEvents: click fence only — keyboard activation fires synthetic clicks that this also catches */}
									{/* biome-ignore lint/a11y/noStaticElementInteractions: click fence only, not an interactive control */}
									<div
										className="flex items-center justify-center gap-1"
										onClick={(e) => e.stopPropagation()}
									>
										{a.linkedin && (
											<Tooltip>
												<TooltipTrigger
													render={
														<Button
															variant="ghost"
															size="icon-sm"
															render={
																// biome-ignore lint/a11y/useAnchorContent: content passed via Button children
																<a
																	href={`https://linkedin.com/in/${a.linkedin}`}
																	target="_blank"
																	rel="noopener noreferrer"
																	aria-label={`${a.name} on LinkedIn`}
																/>
															}
														/>
													}
												>
													<img
														src={linkedinLogo.src}
														alt=""
														width={16}
														height={16}
														className="size-4 rounded-[3px]"
													/>
												</TooltipTrigger>
												<TooltipContent>View LinkedIn</TooltipContent>
											</Tooltip>
										)}
										{a.email && (
											<Tooltip>
												<TooltipTrigger
													render={
														<Button
															variant="ghost"
															size="icon-sm"
															render={
																// biome-ignore lint/a11y/useAnchorContent: content passed via Button children
																<a
																	href={`mailto:${a.email}`}
																	aria-label={`Email ${a.name}`}
																/>
															}
														/>
													}
												>
													<MailIcon aria-hidden="true" />
												</TooltipTrigger>
												<TooltipContent>Send email</TooltipContent>
											</Tooltip>
										)}
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				{sorted.length === 0 && (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<SearchXIcon aria-hidden="true" />
							</EmptyMedia>
							<EmptyTitle>No matches</EmptyTitle>
							<EmptyDescription>
								No alumni match your search. Try different keywords or clear the
								filters.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</div>
		</TooltipProvider>
	);
}
