import {
	Building2,
	GraduationCap,
	type LucideIcon,
	MapPin,
	Users,
} from "lucide-react";
import { useMemo } from "react";
import type { Alumni } from "../types/alumni";

interface StatsBarProps {
	alumni: Alumni[];
}

export default function StatsBar({ alumni }: StatsBarProps) {
	const stats = useMemo(() => {
		const uniqueStates = new Set(alumni.map((a) => a.state).filter(Boolean));
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
			states: uniqueStates.size,
			companies: uniqueCompanies.size,
			yearRange:
				earliestYear && latestYear ? `${earliestYear}–${latestYear}` : "—",
		};
	}, [alumni]);

	const cards: { label: string; value: number | string; Icon: LucideIcon }[] = [
		{ label: "Total Alumni", value: stats.totalAlumni, Icon: Users },
		{ label: "States", value: stats.states, Icon: MapPin },
		{ label: "Companies", value: stats.companies, Icon: Building2 },
		{ label: "Class Years", value: stats.yearRange, Icon: GraduationCap },
	];

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{cards.map((card) => (
				<div
					key={card.label}
					className="bg-white dark:bg-hive-card border border-gray-200 dark:border-white/10 rounded-2xl p-5 hover:border-gt-gold/40 transition-all group"
				>
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-xl bg-gt-gold/10">
							<card.Icon className="w-5 h-5 text-gt-gold" strokeWidth={1.75} />
						</div>
						<div>
							<p className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-gt-gold transition-colors">
								{card.value}
							</p>
							<p className="text-xs text-gray-500 dark:text-white/50 uppercase tracking-wider mt-0.5">
								{card.label}
							</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
