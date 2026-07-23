import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { useAlumniFilters } from "../hooks/useAlumniFilters";

type FiltersState = ReturnType<typeof useAlumniFilters>;

interface FilterSelectProps {
	placeholder: string;
	ariaLabel: string;
	value: string;
	onChange: (value: string) => void;
	options: string[];
}

/**
 * Single-choice filter. The null-valued item doubles as the placeholder and
 * the "show everything" reset option.
 */
function FilterSelect({
	placeholder,
	ariaLabel,
	value,
	onChange,
	options,
}: FilterSelectProps) {
	const items: { label: string; value: string | null }[] = [
		{ label: placeholder, value: null },
		...options.map((option) => ({ label: option, value: option })),
	];

	return (
		<Select
			items={items}
			value={value || null}
			onValueChange={(next) => onChange(next ?? "")}
		>
			<SelectTrigger aria-label={ariaLabel} className="min-w-36 flex-1">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{items.map((item) => (
						<SelectItem key={item.value ?? "__all"} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

interface AlumniFiltersProps {
	filters: FiltersState;
	/** Layout overrides, e.g. `sm:flex-row` for a single-row toolbar. */
	className?: string;
}

/** Search box plus location and class-year filters. Stacks by default. */
export function AlumniFilters({ filters, className }: AlumniFiltersProps) {
	const {
		search,
		setSearch,
		filterRegion,
		setFilterRegion,
		filterYear,
		setFilterYear,
		regions,
		years,
	} = filters;

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<InputGroup className="sm:flex-1">
				<InputGroupAddon>
					<SearchIcon aria-hidden="true" />
				</InputGroupAddon>
				<InputGroupInput
					type="text"
					aria-label="Search alumni"
					placeholder="Search by name, company, major, or location…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				{search && (
					<InputGroupAddon align="inline-end">
						<InputGroupButton
							size="icon-xs"
							aria-label="Clear search"
							onClick={() => setSearch("")}
						>
							<XIcon />
						</InputGroupButton>
					</InputGroupAddon>
				)}
			</InputGroup>
			<div className="flex min-w-0 gap-2">
				<FilterSelect
					placeholder="All locations"
					ariaLabel="Filter by location"
					value={filterRegion}
					onChange={setFilterRegion}
					options={regions}
				/>
				<FilterSelect
					placeholder="All years"
					ariaLabel="Filter by class year"
					value={filterYear}
					onChange={setFilterYear}
					options={years}
				/>
			</div>
		</div>
	);
}

interface AlumniFilterSummaryProps {
	filters: FiltersState;
	total: number;
}

/** Result count with a clear-filters action when any filter is active. */
export function AlumniFilterSummary({
	filters,
	total,
}: AlumniFilterSummaryProps) {
	const { filtered, hasFilters, clearFilters } = filters;

	return (
		<div className="flex min-h-7 items-center justify-between gap-2">
			<p className="text-sm text-muted-foreground" aria-live="polite">
				Showing {filtered.length} of {total} alumni
			</p>
			{hasFilters && (
				<Button variant="ghost" size="sm" onClick={clearFilters}>
					<XIcon data-icon="inline-start" aria-hidden="true" />
					Clear filters
				</Button>
			)}
		</div>
	);
}
