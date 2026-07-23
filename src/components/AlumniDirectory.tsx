import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAlumniFilters } from "../hooks/useAlumniFilters";
import type { Alumni } from "../types/alumni";
import AlumniDetailDialog from "./AlumniDetailDialog";
import { AlumniFilterSummary, AlumniFilters } from "./AlumniFilters";
import AlumniTable from "./AlumniTable";

interface AlumniDirectoryProps {
	alumni: Alumni[];
}

export default function AlumniDirectory({ alumni }: AlumniDirectoryProps) {
	const filters = useAlumniFilters(alumni);
	const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<h2 id="directory-heading">Alumni Directory</h2>
				</CardTitle>
				<CardDescription>
					Search, filter, and connect with Hive alumni across the country.
				</CardDescription>
				<CardAction>
					<Badge variant="secondary">{alumni.length} members</Badge>
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<AlumniFilters filters={filters} className="sm:flex-row" />
				<AlumniFilterSummary filters={filters} total={alumni.length} />
				<AlumniTable alumni={filters.filtered} onSelect={setSelectedAlumni} />
			</CardContent>
			<AlumniDetailDialog
				alumni={selectedAlumni}
				onOpenChange={(open) => {
					if (!open) setSelectedAlumni(null);
				}}
			/>
		</Card>
	);
}
