import { ChevronRightIcon, MapPinIcon } from "lucide-react";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { useAlumniData } from "../hooks/useAlumniData";
import AccessRestricted from "./AccessRestricted";
import AlumniDirectory from "./AlumniDirectory";
import { DirectorySkeleton } from "./LoadingState";
import StatsBar from "./StatsBar";

export default function AlumniApp() {
	const { alumni, loading, error } = useAlumniData();

	if (error) {
		return <AccessRestricted error={error} />;
	}

	if (loading) {
		return <DirectorySkeleton />;
	}

	return (
		<div className="flex flex-col gap-8">
			{/* Stats */}
			<StatsBar alumni={alumni} />

			{/* Map CTA */}
			<Item
				variant="outline"
				className="group/cta bg-card transition-colors hover:bg-accent/50"
				render={
					// biome-ignore lint/a11y/useAnchorContent: content passed via Item children
					<a href={`/map${window.location.hash}`} />
				}
			>
				<ItemMedia variant="icon">
					<MapPinIcon aria-hidden="true" />
				</ItemMedia>
				<ItemContent>
					<ItemTitle>Open the interactive map</ItemTitle>
					<ItemDescription>
						Explore where {alumni.length} alumni have landed across the country.
					</ItemDescription>
				</ItemContent>
				<ItemActions>
					<ChevronRightIcon
						className="size-4 text-muted-foreground transition-transform group-hover/cta:translate-x-0.5"
						aria-hidden="true"
					/>
				</ItemActions>
			</Item>

			{/* Directory */}
			<section aria-labelledby="directory-heading">
				<AlumniDirectory alumni={alumni} />
			</section>
		</div>
	);
}
