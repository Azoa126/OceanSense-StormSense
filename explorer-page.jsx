'use client';
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { FaGlobeAsia, FaFish, FaWater, FaTemperatureHigh } from "react-icons/fa";
import Neritic_v2 from "@/components/Neritic_v2";

// Dynamic Leaflet import for Next.js
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(m => m.Polyline), { ssr: false });

export default function ExplorerPage() {
  const [cyclones, setCyclones] = useState([]);
  const [speciesData, setSpeciesData] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState("Rastrelliger kanagurta");
  const [layer, setLayer] = useState("sst"); // SST, chlorophyll, salinity

  // 🌀 Fetch live cyclone data
  useEffect(() => {
    const fetchCyclones = async () => {
      try {
        const res = await fetch("https://mausam.imd.gov.in/backend/imd_api/cyclone_info/active");
        const data = await res.json();
        setCyclones(data?.data || []);
      } catch (err) {
        console.error("Error fetching cyclone data:", err);
      }
    };
    fetchCyclones();
  }, []);

  // 🐟 Fetch live OBIS data
  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_OBIS_API}?scientificname=${encodeURIComponent(selectedSpecies)}&limit=50`;
        const res = await fetch(url);
        const data = await res.json();
        setSpeciesData(data.results || []);
      } catch (err) {
        console.error("Error fetching species data:", err);
      }
    };
    fetchSpecies();
  }, [selectedSpecies]);

  // 🌊 Define overlay URLs for SST, Chlorophyll, Salinity
  const overlays = {
    sst: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L3_SST_Temporal_8Day_4km/default/2025-11-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
    chlorophyll: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L3_Chlorophyll_A_Temporal_8Day_4km/default/2025-11-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
    salinity: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L3_SSS_SMI_8Day_RunningMean_70km_Eq_A/default/2025-11-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-teal-800 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          <FaGlobeAsia className="text-cyan-400" /> Ocean–Earth Explorer
        </h1>

        {/* Species selector */}
        <select
          value={selectedSpecies}
          onChange={(e) => setSelectedSpecies(e.target.value)}
          className="text-black p-2 rounded"
        >
          <option value="Rastrelliger kanagurta">Indian Mackerel</option>
          <option value="Thunnus albacares">Yellowfin Tuna</option>
          <option value="Sardinella longiceps">Indian Oil Sardine</option>
        </select>
      </div>

      {/* Parameter toggle */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setLayer("sst")}
          className={`p-2 rounded ${layer === "sst" ? "bg-cyan-600" : "bg-gray-700"}`}
        >
          <FaTemperatureHigh className="inline mr-2" /> SST
        </button>
        <button
          onClick={() => setLayer("chlorophyll")}
          className={`p-2 rounded ${layer === "chlorophyll" ? "bg-green-600" : "bg-gray-700"}`}
        >
          🌿 Chlorophyll-a
        </button>
        <button
          onClick={() => setLayer("salinity")}
          className={`p-2 rounded ${layer === "salinity" ? "bg-blue-600" : "bg-gray-700"}`}
        >
          🧂 Salinity
        </button>
      </div>

      {/* Map */}
      <MapContainer center={[10, 80]} zoom={4} style={{ height: "75vh", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <TileLayer url={overlays[layer]} opacity={0.6} />

        {/* Cyclone paths */}
        {cyclones.map((c, i) => (
          <Polyline key={i} positions={c.track.map(p => [p.lat, p.lon])} color="orange" weight={3} />
        ))}

        {/* Species markers */}
        {speciesData.map((s, i) => (
          <Marker key={i} position={[s.decimalLatitude, s.decimalLongitude]}>
            <Popup>
              <b>{s.scientificName}</b><br />
              Depth: {s.depth} m<br />
              Location: {s.locality || "N/A"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Info Panel */}
      <motion.div
        className="mt-6 bg-gray-800/70 p-4 rounded-xl shadow-md border border-cyan-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-semibold mb-3">🌊 Live Ocean Parameters</h2>
        <p>🌀 Cyclones Active: {cyclones.length > 0 ? cyclones.map(c => c.name).join(", ") : "None"}</p>
        <p>🐟 Species Displayed: {selectedSpecies}</p>
        <p>🌡️ Parameter Active: {layer.toUpperCase()}</p>
      </motion.div>

      {/* Chatbot */}
      <Neritic_v2 />
    </div>
  );
}
