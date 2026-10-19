"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";

export type MapRegion = {
  regionName: string;
  location: string;
  type: "1-AZ" | "3-AZ" | "LOCAL-ZONE";
  dcCount: number | null;
  lat: number;
  lng: number;
};

const ARCS: [ [number, number], [number, number] ][] = [
  [[-73.87, 45.32], [3.2, 50.69]],
  [[-73.87, 45.32], [0.18, 51.48]],
  [[-122.99, 45.52], [-73.87, 45.32]],
  [[-77.67, 38.75], [2.13, 50.99]],
  [[3.2, 50.69], [72.88, 19.08]],
  [[72.88, 19.08], [103.82, 1.35]],
  [[103.82, 1.35], [151.21, -33.87]],
  [[7.75, 48.57], [72.88, 19.08]],
  [[-6.83, 34.02], [2.13, 50.99]],
  [[-122.99, 45.52], [151.21, -33.87]],
];

function arcPoints(from: [number, number], to: [number, number], lift = 12, n = 40): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const lng = from[0] + (to[0] - from[0]) * t;
    const lat = from[1] + (to[1] - from[1]) * t + Math.sin(Math.PI * t) * lift;
    pts.push([lat, lng]);
  }
  return pts;
}

function pinIcon(r: MapRegion, mine: boolean, active: boolean, delay: number) {
  const isLz = r.type === "LOCAL-ZONE";
  const big = !isLz && (r.dcCount || 0) > 3;
  const cls = `dc-pin pin-pop ${isLz ? "lz" : ""} ${mine ? "mine" : ""} ${active ? "active" : ""} ${big ? "big" : ""}`;
  const inner = big && r.dcCount ? `<span class="dc-count">${r.dcCount}</span>` : "";
  const tag = mine ? `<span class="mine-tag">★ YOUR REGION</span>` : "";
  return L.divIcon({
    className: "dc-pin-wrap",
    html: `<div class="${cls}" style="animation-delay:${delay}ms">${tag}<span class="ring"></span><span class="ring r2"></span><span class="ring r3"></span><span class="dot"></span>${inner}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function FlyTo({ target }: { target: { lat: number; lng: number; z?: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      const t = setTimeout(() => map.flyTo([target.lat, target.lng], target.z ?? 4, { duration: 2.2 }), 400);
      return () => clearTimeout(t);
    }
  }, [target, map]);
  return null;
}

export default function DCMap({
  regions,
  myRegionName,
  selectedName,
  onSelect,
  flyTo,
}: {
  regions: MapRegion[];
  myRegionName: string | null;
  selectedName: string | null;
  onSelect: (r: MapRegion) => void;
  flyTo?: { lat: number; lng: number; z?: number } | null;
}) {
  const [satellite, setSatellite] = useState(true);
  const myRegion = regions.find((r) => r.regionName === myRegionName);

  return (
    <div className="dcmap-root">
      <MapContainer
        center={[28, 15]}
        zoom={2.4}
        minZoom={2.2}
        maxZoom={17}
        zoomControl={true}
        attributionControl={false}
        worldCopyJump
        style={{ width: "100%", height: "480px", background: "#05050f" }}
      >
        {satellite ? (
          <>
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={17} className="sat-tiles" />
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={17} opacity={0.9} className="label-tiles" />
          </>
        ) : (
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={16} className="dark-tiles" />
        )}

        {/* animated backbone arcs */}
        {ARCS.map(([f, t], i) => {
          const pts = arcPoints(f, t);
          return (
            <span key={i}>
              <Polyline positions={pts} pathOptions={{ color: "#00b7ff", weight: 1.2, opacity: 0.35 }} />
              <Polyline positions={pts} pathOptions={{ color: "#4ff2ff", weight: 2, opacity: 0.9, dashArray: "1 30", lineCap: "round", className: `packet packet-${i}` }} />
            </span>
          );
        })}

        {regions.map((r, i) => (
          <Marker
            key={r.regionName}
            position={[r.lat, r.lng]}
            icon={pinIcon(r, r.regionName === myRegionName, r.regionName === selectedName, 300 + i * 45)}
            eventHandlers={{ click: () => onSelect(r) }}
          />
        ))}

        <FlyTo target={flyTo ?? (myRegion ? { lat: myRegion.lat, lng: myRegion.lng, z: 4 } : null)} />
      </MapContainer>

      {/* layer toggle */}
      <div className="absolute bottom-4 right-4 z-[500] flex overflow-hidden rounded-lg border border-white/15 shadow-lg">
        <button
          onClick={() => setSatellite(true)}
          className={`px-3 py-1.5 text-[11px] font-bold transition ${satellite ? "bg-cyan-400 text-[#070714]" : "bg-[#0c0c24]/90 text-slate-300 hover:text-white"}`}
        >🛰 Satellite</button>
        <button
          onClick={() => setSatellite(false)}
          className={`px-3 py-1.5 text-[11px] font-bold transition ${!satellite ? "bg-cyan-400 text-[#070714]" : "bg-[#0c0c24]/90 text-slate-300 hover:text-white"}`}
        >🌃 Night map</button>
      </div>
    </div>
  );
}
