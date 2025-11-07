'use client';
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import Neritic_v2 from "@/components/Neritic_v2"; // ✅ Chatbot integration

export default function OceanSensePage() {
  const [speciesData, setSpeciesData] = useState([]);
  const [cyclones, setCyclones] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState("Rastrelliger kanagurta");

  // 🌊 Fetch live OBIS data
  useEffect(() => {
    const fetchSpeciesData = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_OBIS_API}?scientificname=${encodeURIComponent(selectedSpecies)}&limit=100`;
        const res = await fetch(url);
        const data = await res.json();
        setSpeciesData(data.results || []);
      } catch (err) {
        console.error("Error fetching OBIS data:", err);
      }
    };
    fetchSpeciesData();
  }, [selectedSpecies]);

  // 🌪️ Fetch live cyclone data from IMD API
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
    const interval = setInterval(fetchCyclones, 3600000); // refresh every hour
    return () => clearInterval(interval);
  }, []);

  // 🌪️ Prepare cyclone traces for the map
  const cycloneTraces = cyclones.flatMap((c, i) =>
    c.track.map((p, j) => ({
      x: [p.lon],
      y: [p.lat],
      mode: "markers",
      type: "scatter",
      name: `${c.name} (${j + 1})`,
      marker: {
        size: 10,
        color: "orange",
        symbol: "circle",
      },
      text: `${c.name} — ${p.datetime}<br>Wind: ${p.wind_speed} knots<br>Pressure: ${p.pressure} hPa`,
      hoverinfo: "text",
    }))
  );

  // 🐟 Prepare species distribution points
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
      <h1 className="text-3xl font-semibold mb-2">🌊 OceanSense — Live Fisheries & Cyclone Data</h1>
      <p className="text-gray-300 mb-6">
        Real-time species distributions with live cyclone overlays across the Indian Ocean.
      </p>

      {/* Species selection */}
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

      {/* Combined map visualization */}
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
          geo: { projection: { type: "natural earth" } },
        }}
        style={{ width: "100%", height: "75vh" }}
      />

      {/* 🧠 Floating Neritic Chatbot */}
      <Neritic_v2 />
    </div>
  );
}
