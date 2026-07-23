import { ChevronLeftIcon, SearchXIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useAlumniData } from "../hooks/useAlumniData";
import { useAlumniFilters } from "../hooks/useAlumniFilters";
import type { Alumni } from "../types/alumni";
import AccessRestricted from "./AccessRestricted";
import AlumniDetailDialog from "./AlumniDetailDialog";
import { AlumniFilterSummary, AlumniFilters } from "./AlumniFilters";
import AlumniList from "./AlumniList";
import AlumniMap from "./AlumniMap";
import LoadingState from "./LoadingState";

function BackLink() {
	return (
		<Button
			variant="ghost"
			size="sm"
			render={
				// biome-ignore lint/a11y/useAnchorContent: content passed via Button children
				<a href={`/${window.location.hash}`} />
			}
		>
			<ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
			Back
		</Button>
	);
}

export default function MapApp() {
	const { alumni, loading, error } = useAlumniData();
	const filters = useAlumniFilters(alumni);
	const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
	const [focusedAlumni, setFocusedAlumni] = useState<Alumni | null>(null);
	const [mobileView, setMobileView] = useState<"map" | "list">("map");

	const handleAlumniSelect = useCallback(
		(a: Alumni) => setSelectedAlumni(a),
		[],
	);

	const handleListItemClick = (a: Alumni) => {
		setFocusedAlumni(a);
		setSelectedAlumni(a);
		setMobileView("map");
	};

	if (error) {
		return (
			<div className="flex h-screen items-center justify-center">
				<AccessRestricted error={error} />
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<LoadingState />
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-background">
			{/* Mobile top bar */}
			<header className="flex shrink-0 items-center gap-2 border-b bg-card px-2 py-2 md:hidden">
				<BackLink />
				<h1 className="flex-1 text-center text-sm font-medium">
					Hive Alumni Map
				</h1>
				<ToggleGroup
					variant="outline"
					size="sm"
					spacing={0}
					value={[mobileView]}
					onValueChange={(value) => {
						const next = value[0];
						if (next === "map" || next === "list") setMobileView(next);
					}}
					aria-label="Switch between map and list view"
				>
					<ToggleGroupItem value="map">Map</ToggleGroupItem>
					<ToggleGroupItem value="list">List</ToggleGroupItem>
				</ToggleGroup>
			</header>

			{/* Main layout */}
			<div className="flex min-h-0 flex-1 overflow-hidden">
				{/* Sidebar */}
				<aside
					aria-label="Alumni list and filters"
					className={cn(
						"w-full shrink-0 flex-col overflow-hidden border-r bg-card md:flex md:w-80 lg:w-96",
						mobileView === "list" ? "flex" : "hidden",
					)}
				>
					{/* Desktop header */}
					<div className="hidden shrink-0 items-center justify-between border-b px-2 py-2 md:flex">
						<BackLink />
						<img
							src="/logo-light.svg"
							alt="The Hive Alumni"
							className="mr-2 h-6 w-auto dark:hidden"
						/>
						<img
							src="/logo-dark.svg"
							alt="The Hive Alumni"
							className="mr-2 hidden h-6 w-auto dark:block"
						/>
					</div>

					{/* Filters */}
					<div className="flex shrink-0 flex-col gap-2 border-b p-3 pb-2">
						<AlumniFilters filters={filters} />
						<AlumniFilterSummary filters={filters} total={alumni.length} />
					</div>

					{/* Alumni list */}
					<ScrollArea className="min-h-0 flex-1">
						{filters.filtered.length === 0 ? (
							<Empty className="py-12">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<SearchXIcon aria-hidden="true" />
									</EmptyMedia>
									<EmptyTitle>No matches</EmptyTitle>
									<EmptyDescription>
										No alumni match your search or filters.
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						) : (
							<AlumniList
								alumni={filters.filtered}
								onSelect={handleListItemClick}
							/>
						)}
					</ScrollArea>
				</aside>

				{/* Map area */}
				<main
					id="main"
					aria-label="Alumni map"
					className={cn(
						"relative flex-1 overflow-hidden md:flex",
						mobileView === "map" ? "flex" : "hidden",
					)}
				>
					<AlumniMap
						alumni={filters.filtered}
						onAlumniSelect={handleAlumniSelect}
						focusedAlumni={focusedAlumni}
					/>
				</main>
			</div>

			{/* Alumni detail dialog */}
			<AlumniDetailDialog
				alumni={selectedAlumni}
				onOpenChange={(open) => {
					if (!open) setSelectedAlumni(null);
				}}
			/>
		</div>
	);
}
