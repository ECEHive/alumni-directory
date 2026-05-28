import { ChevronRight, MapPin } from "lucide-react";
import { useAlumniData } from "../hooks/useAlumniData";
import AccessRestricted from "./AccessRestricted";
import AlumniDirectory from "./AlumniDirectory";
import StatsBar from "./StatsBar";

export default function AlumniApp() {
	const { alumni, loading, error } = useAlumniData();

	if (error) {
		return <AccessRestricted error={error} />;
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="flex flex-col items-center gap-4">
					<div className="w-10 h-10 border-3 border-gt-gold/30 border-t-gt-gold rounded-full animate-spin" />
					<p className="text-gray-500 dark:text-white/50 text-sm">
						Loading alumni data...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-10">
			{/* Stats */}
			<StatsBar alumni={alumni} />

			{/* Map CTA */}
			<section>
				<div className="flex items-center gap-3 mb-4">
					<h2 className="text-xl font-bold text-gray-900 dark:text-white">
						Alumni Map
					</h2>
				</div>
				<a
					href="/map"
					className="group flex items-center gap-4 p-5 bg-gt-navy rounded-2xl hover:ring-2 hover:ring-gt-gold/40 transition-all"
				>
					<div className="p-3 rounded-xl bg-gt-gold/20 shrink-0">
						<MapPin className="w-5 h-5 text-gt-gold" strokeWidth={1.75} />
					</div>
					<div className="flex-1 min-w-0">
						<p className="font-semibold text-white group-hover:text-gt-gold transition-colors">
							Open Interactive Map
						</p>
						<p className="text-sm text-white/50 mt-0.5">
							Full-screen map with searchable sidebar — explore where{" "}
							{alumni.length} alumni have landed
						</p>
					</div>
					<ChevronRight
						className="w-5 h-5 text-white/30 group-hover:text-gt-gold transition-colors shrink-0"
						strokeWidth={2}
					/>
				</a>
			</section>

			{/* Directory */}
			<section id="directory">
				<div className="flex items-center gap-3 mb-4">
					<h2 className="text-xl font-bold text-gray-900 dark:text-white">
						Alumni Directory
					</h2>
					<span className="text-xs bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60 px-2.5 py-1 rounded-full font-medium">
						{alumni.length} members
					</span>
				</div>
				<p className="text-gray-500 dark:text-white/50 text-sm mb-5">
					Search, filter, and connect with Hive alumni across the country.
				</p>
				<AlumniDirectory alumni={alumni} />
			</section>
		</div>
	);
}
