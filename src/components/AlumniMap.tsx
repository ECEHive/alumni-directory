import L from "leaflet";
import { useEffect, useRef } from "react";
import type { Alumni } from "../types/alumni";

// Custom gold marker for GT branding
const goldIcon = L.divIcon({
	className: "custom-marker",
	html: `<div style="
    width: 14px;
    height: 14px;
    background: #B3A369;
    border: 3px solid #003057;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(179, 163, 105, 0.6);
  "></div>`,
	iconSize: [20, 20],
	iconAnchor: [10, 10],
	popupAnchor: [0, -12],
});

interface AlumniMapProps {
	alumni: Alumni[];
	onAlumniSelect?: (alumni: Alumni) => void;
	focusedAlumni?: Alumni | null;
}

export default function AlumniMap({
	alumni,
	onAlumniSelect,
	focusedAlumni,
}: AlumniMapProps) {
	const mapRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<L.Map | null>(null);

	useEffect(() => {
		if (!mapRef.current || mapInstanceRef.current) return;

		const map = L.map(mapRef.current, {
			center: [39.8283, -98.5795],
			zoom: 4,
			minZoom: 3,
			maxZoom: 18,
			zoomControl: false,
			scrollWheelZoom: true,
		});

		// Tile layer matches system color scheme
		const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		const tileUrl = isDark
			? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
			: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
		L.tileLayer(tileUrl, {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
			subdomains: "abcd",
			maxZoom: 19,
		}).addTo(map);

		// Zoom control on the right
		L.control.zoom({ position: "topright" }).addTo(map);

		mapInstanceRef.current = map;

		// Ensure correct sizing after CSS layout settles
		requestAnimationFrame(() => map.invalidateSize());

		return () => {
			map.remove();
			mapInstanceRef.current = null;
		};
	}, []);

	// Add/update markers when filtered alumni change
	useEffect(() => {
		const map = mapInstanceRef.current;
		if (!map) return;

		// Clear existing markers
		map.eachLayer((layer) => {
			if (layer instanceof L.Marker) map.removeLayer(layer);
		});

		// Group alumni by location to offset duplicates
		const locationGroups: Record<string, Alumni[]> = {};
		alumni.forEach((a) => {
			if (a.latitude && a.longitude) {
				const key = `${a.latitude},${a.longitude}`;
				if (!locationGroups[key]) locationGroups[key] = [];
				locationGroups[key].push(a);
			}
		});

		Object.entries(locationGroups).forEach(([, group]) => {
			group.forEach((a, i) => {
				const offset = i * 0.005;
				const lat = a.latitude + offset;
				const lng = a.longitude + (i % 2 === 0 ? offset : -offset);

				const marker = L.marker([lat, lng], { icon: goldIcon }).addTo(map);
				marker.on("click", () => {
					if (onAlumniSelect) onAlumniSelect(a);
				});
			});
		});
	}, [alumni, onAlumniSelect]);

	// Fly to focused alumni when selected from sidebar
	useEffect(() => {
		if (!focusedAlumni || !mapInstanceRef.current) return;
		if (focusedAlumni.latitude && focusedAlumni.longitude) {
			mapInstanceRef.current.flyTo(
				[focusedAlumni.latitude, focusedAlumni.longitude],
				13,
				{ duration: 1.2 },
			);
		}
	}, [focusedAlumni]);

	return (
		<div className="absolute inset-0">
			<div ref={mapRef} className="w-full h-full" />
		</div>
	);
}
