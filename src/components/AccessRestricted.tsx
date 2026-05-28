import { Lock } from "lucide-react";
import type { AlumniLoadError } from "../hooks/useAlumniData";

interface AccessRestrictedProps {
	error: AlumniLoadError;
}

const messages: Record<AlumniLoadError, { heading: string; body: string }> = {
	"no-key": {
		heading: "Access Restricted",
		body: "This website is private. You need a valid access link to view this website.",
	},
	"fetch-failed": {
		heading: "Data Unavailable",
		body: "Could load this website. Please try again or contact an administrator.",
	},
	"decrypt-failed": {
		heading: "Invalid Access Link",
		body: "The link you provided is invalid. You need a valid access link to view this website.",
	},
};

export default function AccessRestricted({ error }: AccessRestrictedProps) {
	const { heading, body } = messages[error];

	return (
		<div className="flex items-center justify-center min-h-[60vh] px-4">
			<div className="flex flex-col items-center gap-6 text-center max-w-sm">
				<div className="p-4 rounded-2xl bg-gt-navy/10 dark:bg-white/5 border border-gt-navy/10 dark:border-white/10">
					<Lock
						className="w-8 h-8 text-gt-navy dark:text-white/40"
						strokeWidth={1.5}
					/>
				</div>
				<div className="space-y-2">
					<h2 className="text-xl font-bold text-gray-900 dark:text-white">
						{heading}
					</h2>
					<p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed">
						{body}
					</p>
				</div>
			</div>
		</div>
	);
}
