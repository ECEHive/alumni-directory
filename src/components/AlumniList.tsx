import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { gradYear } from "../hooks/useAlumniFilters";
import { formatLocation } from "../lib/location";
import type { Alumni } from "../types/alumni";

interface AlumniListProps {
	alumni: Alumni[];
	onSelect: (alumni: Alumni) => void;
}

/** Compact clickable roster used in the map sidebar. */
export default function AlumniList({ alumni, onSelect }: AlumniListProps) {
	return (
		<ItemGroup className="gap-1 p-2">
			{alumni.map((a, i) => {
				const detail = [a.company, a.major].filter(Boolean).join(" · ");
				const location = formatLocation(a);
				const year = gradYear(a.graduation_date);

				return (
					<Item
						key={a.email || `${a.name}-${a.graduation_date}-${i}`}
						size="sm"
						className="hover:bg-muted"
						render={<button type="button" onClick={() => onSelect(a)} />}
					>
						<ItemMedia>
							<Avatar>
								<AvatarFallback>{a.name?.charAt(0) || "?"}</AvatarFallback>
							</Avatar>
						</ItemMedia>
						<ItemContent className="gap-0.5">
							<ItemTitle>{a.name}</ItemTitle>
							{detail && <ItemDescription>{detail}</ItemDescription>}
							{location && (
								<ItemDescription className="text-xs">
									{location}
								</ItemDescription>
							)}
						</ItemContent>
						{year && <Badge variant="secondary">{year}</Badge>}
					</Item>
				);
			})}
		</ItemGroup>
	);
}
