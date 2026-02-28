"use client";

import {
  MapContainer,
  TileLayer,
  Polygon,
  Popup,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* -------------------------------------------------
   Fix Leaflet Icons (Next.js)
-------------------------------------------------- */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* -------------------------------------------------
   Indian Ocean Bounds
-------------------------------------------------- */
const INDIAN_OCEAN_BOUNDS = [
  [-50, 20],
  [30, 147],
];

/* -------------------------------------------------
   Convert 5-point PFZ → Polygon
-------------------------------------------------- */
function buildPolygon(points) {
  if (!points) return [];

  return [
    points.north,
    points.east,
    points.south,
    points.west,
    points.north,
  ];
}

/* -------------------------------------------------
   Confidence Colors
-------------------------------------------------- */
function getConfidenceColor(conf) {
  switch (conf) {
    case "High":
      return "#00e676";
    case "Medium":
      return "#ffeb3b";
    case "Low":
    default:
      return "#ff5252";
  }
}

/* -------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------- */
export default function MapComponent({
  center,
  zoom,
  pfzZones,
  layers,
  environmentalTiles,
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      maxBounds={INDIAN_OCEAN_BOUNDS}
      maxBoundsViscosity={1.0}
      minZoom={3}
    >
      {/* Base Map */}
      <TileLayer
        attribution="© OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* -------------------------------------------------
         ENVIRONMENTAL LAYERS (STABLE TILE VERSION)
      -------------------------------------------------- */}

      {/* Bathymetry */}
      {layers.bathymetry && environmentalTiles?.bathymetry && (
        <TileLayer
          url={environmentalTiles.bathymetry}
          opacity={0.7}
        />
      )}

      {/* Chlorophyll */}
      {layers.chlorophyll && environmentalTiles?.chlorophyll && (
        <TileLayer
          url={environmentalTiles.chlorophyll}
          opacity={0.65}
        />
      )}

      {/* SST */}
      {layers.sst && environmentalTiles?.sst && (
        <TileLayer
          url={environmentalTiles.sst}
          opacity={0.6}
        />
      )}

      {/* -------------------------------------------------
         PFZ POLYGONS
      -------------------------------------------------- */}
      {layers.pfz &&
        pfzZones.map((zone) => (
          <Polygon
            key={zone.id}
            positions={buildPolygon(zone.points)}
            pathOptions={{
              color: getConfidenceColor(zone.confidence),
              weight: 2,
              fillOpacity: 0.35,
            }}
          >
            <Popup>
              <strong>{zone.id}</strong>
              <div>Confidence: {zone.confidence}</div>
            </Popup>
          </Polygon>
        ))}

      {/* PFZ CENTERS */}
      {layers.pfz &&
        pfzZones.map((zone) => (
          <CircleMarker
            key={`center-${zone.id}`}
            center={zone.points.center}
            radius={4}
            pathOptions={{
              color: "#ffffff",
              fillOpacity: 1,
            }}
          />
        ))}
    </MapContainer>
  );
}
