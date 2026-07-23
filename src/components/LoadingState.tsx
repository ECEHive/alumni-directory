import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

/** Centered spinner for full-screen surfaces like the map. */
export default function LoadingState() {
	return (
		<div
			className="flex min-h-[400px] flex-col items-center justify-center gap-3"
			role="status"
		>
			<Spinner className="size-6 text-primary" />
			<p className="text-sm text-muted-foreground">Loading alumni data…</p>
		</div>
	);
}

/**
 * Placeholder that mirrors the directory page layout (stats, map CTA,
 * directory card) so content loads in place without a layout shift.
 */
export function DirectorySkeleton() {
	return (
		<div className="flex flex-col gap-8" role="status" aria-busy="true">
			<span className="sr-only">Loading alumni data…</span>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{Array.from({ length: 4 }, (_, i) => i).map((i) => (
					<Card key={i} size="sm">
						<CardHeader>
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-7 w-14" />
						</CardHeader>
					</Card>
				))}
			</div>

			{/* Map CTA */}
			<Skeleton className="h-16 w-full rounded-xl" />

			{/* Directory */}
			<Card>
				<CardHeader className="flex flex-col gap-2">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-4 w-72 max-w-full" />
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<div className="flex flex-col gap-2 sm:flex-row">
						<Skeleton className="h-9 sm:flex-1" />
						<div className="flex min-w-0 gap-2">
							<Skeleton className="h-9 min-w-36 flex-1" />
							<Skeleton className="h-9 min-w-36 flex-1" />
						</div>
					</div>
					<div className="flex flex-col gap-2 rounded-xl border p-4">
						{Array.from({ length: 8 }, (_, i) => i).map((i) => (
							<Skeleton key={i} className="h-8 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
