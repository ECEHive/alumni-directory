import { useEffect, useState } from "react";
import { decodeAlumni } from "../lib/alumni-codec";
import { decryptAlumniData } from "../lib/alumni-crypto";
import type { Alumni } from "../types/alumni";

export type AlumniLoadError = "no-key" | "fetch-failed" | "decrypt-failed";

function resolveKey(): string | null {
	if (typeof window === "undefined") return null;
	const hash = window.location.hash.slice(1);
	return hash || null;
}

export function useAlumniData() {
	const [alumni, setAlumni] = useState<Alumni[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<AlumniLoadError | null>(null);

	useEffect(() => {
		const key = resolveKey();
		if (!key) {
			setLoading(false);
			setError("no-key");
			return;
		}

		fetch("/data/alumni.enc")
			.then((res) => {
				if (!res.ok)
					throw Object.assign(new Error("fetch"), { kind: "fetch-failed" });
				return res.text();
			})
			.then((encrypted) => decryptAlumniData(encrypted, key))
			.then((blob) => {
				setAlumni(decodeAlumni(blob));
				setLoading(false);
			})
			.catch((err: Error & { kind?: string }) => {
				setLoading(false);
				setError(
					err.kind === "fetch-failed" ? "fetch-failed" : "decrypt-failed",
				);
			});
	}, []);

	return { alumni, loading, error };
}
