import { Building2Icon, MailIcon, MapPinIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import linkedinLogo from "../assets/linkedin-logo.png";
import { gradYear } from "../hooks/useAlumniFilters";
import { formatLocation } from "../lib/location";
import type { Alumni } from "../types/alumni";

interface AlumniDetailDialogProps {
	alumni: Alumni | null;
	onOpenChange: (open: boolean) => void;
}

export default function AlumniDetailDialog({
	alumni,
	onOpenChange,
}: AlumniDetailDialogProps) {
	const location = alumni ? formatLocation(alumni) : "";

	return (
		<Dialog open={alumni !== null} onOpenChange={onOpenChange}>
			<DialogContent>
				{alumni && (
					<>
						<DialogHeader>
							<div className="flex items-center gap-3">
								<Avatar size="lg">
									<AvatarFallback>
										{alumni.name?.charAt(0) || "?"}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col gap-1">
									<DialogTitle>{alumni.name}</DialogTitle>
									{alumni.graduation_date ? (
										<DialogDescription>
											Class of {gradYear(alumni.graduation_date)}
										</DialogDescription>
									) : (
										<DialogDescription className="sr-only">
											Alumni details
										</DialogDescription>
									)}
								</div>
							</div>
						</DialogHeader>
						<ItemGroup className="gap-1">
							{(alumni.company || alumni.major) && (
								<Item size="sm">
									<ItemMedia variant="icon">
										<Building2Icon aria-hidden="true" />
									</ItemMedia>
									<ItemContent>
										<ItemTitle>{alumni.company || alumni.major}</ItemTitle>
										{alumni.company && alumni.major && (
											<ItemDescription>{alumni.major}</ItemDescription>
										)}
									</ItemContent>
								</Item>
							)}
							{location && (
								<Item size="sm">
									<ItemMedia variant="icon">
										<MapPinIcon aria-hidden="true" />
									</ItemMedia>
									<ItemContent>
										<ItemTitle>{location}</ItemTitle>
									</ItemContent>
								</Item>
							)}
							{alumni.email && (
								<Item size="sm">
									<ItemMedia variant="icon">
										<MailIcon aria-hidden="true" />
									</ItemMedia>
									<ItemContent>
										<ItemTitle className="max-w-full">
											<a
												href={`mailto:${alumni.email}`}
												className="truncate underline underline-offset-4 hover:text-primary"
											>
												{alumni.email}
											</a>
										</ItemTitle>
									</ItemContent>
								</Item>
							)}
						</ItemGroup>
						{alumni.linkedin && (
							<DialogFooter showCloseButton>
								<Button
									variant="outline"
									render={
										// biome-ignore lint/a11y/useAnchorContent: content passed via Button children
										<a
											href={`https://linkedin.com/in/${alumni.linkedin}`}
											target="_blank"
											rel="noopener noreferrer"
										/>
									}
								>
									<img
										src={linkedinLogo.src}
										alt=""
										width={16}
										height={16}
										className="size-4 rounded-[3px]"
										data-icon="inline-start"
									/>
									View LinkedIn
								</Button>
							</DialogFooter>
						)}
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
