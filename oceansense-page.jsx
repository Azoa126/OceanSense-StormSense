'use client';
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Plot from "react-plotly.js";
import { motion } from "framer-motion";
import { FaFish } from "react-icons/fa";
import Neritic_v2 from "@/components/Neritic_v2";

export default function OceanSensePage() {
  const [speciesData, setSpeciesData] = useState([]);
  const [cyclones, setCyclones] = useState([]);
  const [oceanParams, setOceanParams] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState("Rastrelliger kanagurta");
  const [coords, setCoords] = useState({ lat: 9.9, lon: 76.3 }); // Default: Kochi
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🐟 Fetch species data from OBIS
  useEffect(() => {
    const fetchSpeciesData = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_OBIS_API}?scientificname=${encodeURIComponent(selectedSpecies)}&limit=100`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSpeciesData(data.results || []);
      } catch (err) {
        console.error("OBIS fetch error:", err);
        setError("⚠️ Failed to load species data. Try again later.");
      }
    };
    fetchSpeciesData();
  }, [selectedSpecies]);

  // 🌪️ Fetch live cyclone data
  useEffect(() => {
    const fetchCyclones = async () => {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_IMD_API || "https://mausam.imd.gov.in/backend/imd_api/cyclone_info/active");
        const data = await res.json();
        setCyclones(data?.data || []);
      } catch (err) {
        console.error("Cyclone fetch error:", err);
      }
    };
    fetchCyclones();
  }, []);

  // 📍 User’s location (optional)
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => console.warn("Using default location")
      );
    }
  }, []);

  // 🌡️ Fetch live ocean parameters
  useEffect(() => {
    const fetchOceanParams = async () => {
      try {
        const res = await fetch(`/api/ocean?lat=${coords.lat}&lon=${coords.lon}`);
        const data = await res.json();
        setOceanParams(data);
      } catch (err) {
        console.error("Ocean params error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOceanParams();
  }, [coords]);

  // Prepare Plotly Traces
  const cycloneTraces = cyclones.flatMap((c) =>
    c.track.map((p, j) => ({
      x: [p.lon],
      y: [p.lat],
      mode: "markers",
      type: "scatter",
      name: `${c.name} (${j + 1})`,
      marker: { size: 10, color: "orange", symbol: "circle" },
      text: `${c.name} — ${p.datetime}<br>Wind: ${p.wind_speed} knots<br>Pressure: ${p.pressure} hPa`,
      hoverinfo: "text",
    }))
  );

  const speciesTrace = {
    x: speciesData.map((d) => d.decimalLongitude),
    y: speciesData.map((d) => d.decimalLatitude),
    mode: "markers",
    type: "scatter",
    name: selectedSpecies,
    marker: { size: 6, color: "#00BFFF" },
    text: speciesData.map((d) => `${d.scientificName}<br>${d.eventDate}`),
    hoverinfo: "text",
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-cyan-800 text-white p-6">
      <Head>
        <title>OceanSense 🌊 — Live Fisheries & Cyclone Visualizer</title>
        <meta
          name="description"
          content="Real-time visualization of Indian fisheries, cyclones, and ocean health parameters using live oceanographic and meteorological data."
        />
      </Head>

      <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
        <FaFish className="text-cyan-400" /> OceanSense — Fisheries & Ocean Health
      </h1>
      <p className="text-gray-300 mb-6">
        Interactive marine dashboard visualizing fish species distributions, cyclones, and real-time ocean parameters.
      </p>

      {/* 🐟 Species Selector */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">Select a species:</label>
        <select
          value={selectedSpecies}
          onChange={(e) => setSelectedSpecies(e.target.value)}
          className="text-black p-2 rounded-md"
        >
          <option value="Rastrelliger kanagurta">Indian Mackerel</option>
          <option value="Thunnus albacares">Yellowfin Tuna</option>
          <option value="Sardinella longiceps">Indian Oil Sardine</option>
        </select>
      </div>

      {/* 🗺️ Plotly Visualization */}
      {error ? (
        <p className="text-red-400 italic">{error}</p>
      ) : (
        <Plot
          data={[speciesTrace, ...cycloneTraces]}
          layout={{
            title: `${selectedSpecies} Distribution + Active Cyclones`,
            xaxis: { title: "Longitude" },
            yaxis: { title: "Latitude" },
            showlegend: true,
            legend: { bgcolor: "rgba(0,0,0,0.5)", font: { color: "white" } },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
          }}
          style={{ width: "100%", height: "70vh" }}
          config={{ responsive: true }}
        />
      )}

      {/* 🌡️ Ocean Parameters */}
      <motion.div
        className="mt-6 bg-gray-900/70 backdrop-blur-md border border-cyan-600 rounded-xl p-4 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-cyan-400 font-semibold mb-2">🌡️ Live Ocean Parameters</h3>
        {loading ? (
          <p className="text-gray-400 italic">Fetching live data...</p>
        ) : oceanParams ? (
          <>
            <p>
              <strong>Location:</strong> {oceanParams.lat?.toFixed(2)}, {oceanParams.lon?.toFixed(2)}
            </p>
            <p>Sea Surface Temperature: <span className="font-medium">{oceanParams.sst} °C</span></p>
            <p>Salinity: <span className="font-medium">{oceanParams.salinity} PSU</span></p>
            <p>Chlorophyll-a: <span className="font-medium">{oceanParams.chl} mg/m³</span></p>
          </>
        ) : (
          <p className="text-red-400 italic">⚠️ Failed to fetch live ocean data.</p>
        )}
      </motion.div>

      {/* 🤖 Neritic Chatbot */}
      <div className="mt-6">
        <Neritic_v2 />
      </div>
    </div>
  );
}
