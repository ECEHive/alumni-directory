import {
	Building2Icon,
	GraduationCapIcon,
	type LucideIcon,
	MapPinIcon,
	UsersIcon,
} from "lucide-react";
import { useMemo } from "react";
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { locationGroup } from "../lib/location";
import type { Alumni } from "../types/alumni";

interface StatsBarProps {
	alumni: Alumni[];
}

export default function StatsBar({ alumni }: StatsBarProps) {
	const stats = useMemo(() => {
		// US states and countries, counted together ("Georgia", "Switzerland").
		const uniqueRegions = new Set(alumni.map(locationGroup).filter(Boolean));
		const uniqueCompanies = new Set(
			alumni.map((a) => a.company).filter(Boolean),
		);
		const years = alumni
			.map((a) => a.graduation_date?.split("-")[0])
			.filter(Boolean);
		const latestYear = years.length > 0 ? Math.max(...years.map(Number)) : 0;
		const earliestYear = years.length > 0 ? Math.min(...years.map(Number)) : 0;

		return {
			totalAlumni: alumni.length,
			regions: uniqueRegions.size,
			companies: uniqueCompanies.size,
			yearRange:
				earliestYear && latestYear ? `${earliestYear}–${latestYear}` : "—",
		};
	}, [alumni]);

	const cards: { label: string; value: number | string; Icon: LucideIcon }[] = [
		{ label: "Total Alumni", value: stats.totalAlumni, Icon: UsersIcon },
		{ label: "Locations", value: stats.regions, Icon: MapPinIcon },
		{ label: "Companies", value: stats.companies, Icon: Building2Icon },
		{ label: "Class Years", value: stats.yearRange, Icon: GraduationCapIcon },
	];

	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			{cards.map(({ label, value, Icon }) => (
				<Card key={label} size="sm">
					<CardHeader>
						<CardDescription>{label}</CardDescription>
						<CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
						<CardAction>
							<Icon
								className="size-4 text-muted-foreground"
								aria-hidden="true"
							/>
						</CardAction>
					</CardHeader>
				</Card>
			))}
		</div>
	);
}
