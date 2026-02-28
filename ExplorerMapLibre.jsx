"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

export default function ExplorerMap({ bathymetry, boundaries, vessels }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: "explorer-map",
      style: "https://api.maptiler.com/maps/streets/style.json?key=YOUR_KEY",
      center: [80, 10],
      zoom: 4,
    });

    mapRef.current = map;

    // ---------- BATHYMETRY ----------
    map.on("load", () => {
      if (bathymetry?.url) {
        map.addSource("bathy", {
          type: "raster",
          tiles: [bathymetry.url],
          tileSize: 256
        });

        map.addLayer({
          id: "bathyLayer",
          type: "raster",
          source: "bathy",
          paint: { "raster-opacity": 0.7 }
        });
      }
    });

    // ---------- MARINE BOUNDARIES ----------
    map.on("load", () => {
      if (boundaries?.length > 0) {
        map.addSource("boundaries", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: boundaries
          }
        });

        map.addLayer({
          id: "boundaryLines",
          type: "line",
          source: "boundaries",
          paint: {
            "line-color": "#facc15",
            "line-width": 2
          }
        });
      }
    });

    // ---------- VESSEL TRACKING ----------
    map.on("load", () => {
      if (vessels?.length > 0) {
        map.addSource("vessels", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: vessels.map((v) => ({
              type: "Feature",
              geometry: { type: "Point", coordinates: [v.lon, v.lat] },
              properties: v
            }))
          }
        });

        map.addLayer({
          id: "vesselPoints",
          type: "circle",
          source: "vessels",
          paint: {
            "circle-radius": 5,
            "circle-color": "#f87171",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff"
          }
        });
      }
    });
  }, [bathymetry, boundaries, vessels]);

  return <div id="explorer-map" className="w-full h-[70vh] rounded-xl"></div>;
}
