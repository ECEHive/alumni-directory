import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { formatLocation } from "../lib/location";
import type { Alumni } from "../types/alumni";

// Single alumnus: small gold dot with a navy ring
const dotIcon = L.divIcon({
	className: "alumni-marker",
	html: `<div class="alumni-marker-dot"></div>`,
	iconSize: [16, 16],
	iconAnchor: [8, 8],
	popupAnchor: [0, -10],
});

// Multiple alumni at the same coordinates: navy badge with a count
function clusterIcon(count: number): L.DivIcon {
	return L.divIcon({
		className: "alumni-marker",
		html: `<div class="alumni-marker-cluster">${count}</div>`,
		iconSize: [26, 26],
		iconAnchor: [13, 13],
		popupAnchor: [0, -15],
	});
}

// Popup listing every alumnus at a shared location; clicking a name opens
// the detail dialog via onSelect.
function buildGroupPopup(
	group: Alumni[],
	onSelect: (a: Alumni) => void,
	map: L.Map,
): HTMLElement {
	const container = document.createElement("div");
	container.className = "alumni-popup";

	const place = formatLocation(group[0]);
	const heading = document.createElement("p");
	heading.className = "alumni-popup-heading";
	heading.textContent = place
		? `${group.length} alumni in ${place}`
		: `${group.length} alumni here`;
	container.appendChild(heading);

	const list = document.createElement("ul");
	list.className = "alumni-popup-list";
	for (const a of group) {
		const item = document.createElement("li");
		const button = document.createElement("button");
		button.type = "button";
		button.className = "alumni-popup-item";
		const name = document.createElement("span");
		name.className = "alumni-popup-name";
		name.textContent = a.name ?? "Unknown";
		button.appendChild(name);
		if (a.company) {
			const company = document.createElement("span");
			company.className = "alumni-popup-company";
			company.textContent = a.company;
			button.appendChild(company);
		}
		button.addEventListener("click", () => {
			map.closePopup();
			onSelect(a);
		});
		item.appendChild(button);
		list.appendChild(item);
	}
	container.appendChild(list);
	return container;
}

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
	const markersRef = useRef<L.LayerGroup | null>(null);

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

		// Tile layer follows the system color scheme, live
		const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const tileUrl = (dark: boolean) =>
			dark
				? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
				: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
		const tiles = L.tileLayer(tileUrl(darkQuery.matches), {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
			subdomains: "abcd",
			maxZoom: 19,
		}).addTo(map);
		const onSchemeChange = (e: MediaQueryListEvent) =>
			tiles.setUrl(tileUrl(e.matches));
		darkQuery.addEventListener("change", onSchemeChange);

		// Zoom control on the right
		L.control.zoom({ position: "topright" }).addTo(map);

		markersRef.current = L.layerGroup().addTo(map);
		mapInstanceRef.current = map;

		// Ensure correct sizing after CSS layout settles
		requestAnimationFrame(() => map.invalidateSize());

		return () => {
			darkQuery.removeEventListener("change", onSchemeChange);
			map.remove();
			mapInstanceRef.current = null;
			markersRef.current = null;
		};
	}, []);

	// Add/update markers when filtered alumni change
	useEffect(() => {
		const map = mapInstanceRef.current;
		const markers = markersRef.current;
		if (!map || !markers) return;

		markers.clearLayers();

		// One marker per unique location; co-located alumni share a badge
		const locationGroups = new Map<string, Alumni[]>();
		for (const a of alumni) {
			if (a.latitude && a.longitude) {
				const key = `${a.latitude},${a.longitude}`;
				const group = locationGroups.get(key);
				if (group) group.push(a);
				else locationGroups.set(key, [a]);
			}
		}

		for (const group of locationGroups.values()) {
			const { latitude, longitude } = group[0];
			const position: L.LatLngExpression = [latitude, longitude];

			if (group.length === 1) {
				const a = group[0];
				const marker = L.marker(position, {
					icon: dotIcon,
					title: a.name ?? "Alumni",
					riseOnHover: true,
				}).addTo(markers);
				marker.on("click", () => onAlumniSelect?.(a));
			} else {
				const marker = L.marker(position, {
					icon: clusterIcon(group.length),
					title: `${group.length} alumni`,
					riseOnHover: true,
				}).addTo(markers);
				marker.bindPopup(
					() => buildGroupPopup(group, (a) => onAlumniSelect?.(a), map),
					{ maxWidth: 260, className: "alumni-popup-wrapper" },
				);
			}
		}
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
		// `isolate` traps Leaflet's large internal z-indexes in their own
		// stacking context so overlays (e.g. the detail dialog) render above.
		<div className="absolute inset-0 isolate">
			<div ref={mapRef} className="size-full" />
		</div>
	);
}
