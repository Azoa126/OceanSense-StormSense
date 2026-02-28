"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const MapComponent = dynamic(
  () => import("@/components/MapComponent"),
  { ssr: false }
);

export default function ExplorerPage() {
  const [pfzZones, setPfzZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [layers, setLayers] = useState({
    pfz: true,
    bathymetry: true,
    chlorophyll: true,
    sst: false,
    slope: false,
    upwelling: false,
  });

  /* ---------------------------------------------
     REAL TILE SOURCES (TEMP WORKING)
  --------------------------------------------- */
  const environmentalTiles = {
    bathymetry:
      "https://tiles.opentopomap.org/{z}/{x}/{y}.png",

    chlorophyll:
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_Chlorophyll_A/default/2019-06-01/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png",

    sst:
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_Sea_Surface_Temp_Day/default/2019-06-01/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png",

    slope: "",       // keep empty for now
    upwelling: "",   // backend later
  };

  /* ---------------------------------------------
     TRANSFORM BACKEND → FRONTEND PFZ FORMAT
  --------------------------------------------- */
  function convertToZones(data) {
    return data.map((p, i) => ({
      id: `PFZ_${i}`,
      confidence:
        p.score > 0.75 ? "High" :
        p.score > 0.6 ? "Medium" : "Low",

      points: {
        center: [p.lat, p.lon],
        north:  [p.lat + 0.5, p.lon],
        south:  [p.lat - 0.5, p.lon],
        east:   [p.lat, p.lon + 0.5],
        west:   [p.lat, p.lon - 0.5],
      },
    }));
  }

  /* ---------------------------------------------
     FETCH PFZ FROM BACKEND
  --------------------------------------------- */
  useEffect(() => {
    async function fetchPFZ() {
      try {
        const res = await fetch("http://127.0.0.1:8000/pfz");
        const data = await res.json();

        const transformed = convertToZones(data.pfz_zones || []);
        setPfzZones(transformed);

      } catch (err) {
        console.error("PFZ Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPFZ();
  }, []);

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col">

      {/* Controls */}
      <div className="p-3 bg-zinc-900 flex gap-4 flex-wrap">
        {Object.keys(layers).map((key) => (
          <label key={key} className="text-sm">
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={() =>
                setLayers((prev) => ({
                  ...prev,
                  [key]: !prev[key],
                }))
              }
            />{" "}
            {key.toUpperCase()}
          </label>
        ))}

        {loading && (
          <span className="text-xs text-yellow-400 ml-4">
            Computing PFZ...
          </span>
        )}
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapComponent
          center={[0, 80]}
          zoom={4}
          pfzZones={pfzZones}
          layers={layers}
          environmentalTiles={environmentalTiles}   // 🔥 FIX
        />
      </div>
    </div>
  );
}
