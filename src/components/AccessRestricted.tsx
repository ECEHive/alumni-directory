import { LockIcon } from "lucide-react";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
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
		body: "Could not load this website. Please try again or contact an administrator.",
	},
	"decrypt-failed": {
		heading: "Invalid Access Link",
		body: "The link you provided is invalid. You need a valid access link to view this website.",
	},
};

export default function AccessRestricted({ error }: AccessRestrictedProps) {
	const { heading, body } = messages[error];

	return (
		<Empty className="min-h-[60vh]">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<LockIcon aria-hidden="true" />
				</EmptyMedia>
				<EmptyTitle>{heading}</EmptyTitle>
				<EmptyDescription>{body}</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}
