'use client';
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import dynamic from "next/dynamic";

// ✅ Corrected import
const Neritic_v2 = dynamic(() => import("./Neritic_v2"), { ssr: false });

export default function OceanSensePage() {
  const [speciesData, setSpeciesData] = useState([]);
  const [cyclones, setCyclones] = useState([]);
  const [oceanParams, setOceanParams] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState("Rastrelliger kanagurta");
  const [coords, setCoords] = useState({ lat: 9.9, lon: 76.3 }); // default: Kochi
  const [loading, setLoading] = useState(true);

  // 🐟 Fetch OBIS species data
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

  // 🌪️ Fetch live cyclone data (IMD)
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
    const interval = setInterval(fetchCyclones, 3600000); // update every hour
    return () => clearInterval(interval);
  }, []);

  // 📍 Detect user’s location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        err => console.warn("Geolocation not allowed:", err)
      );
    }
  }, []);

  // 🌡️ Fetch live ocean parameters (SST, salinity, chl-a)
  useEffect(() => {
    const fetchOceanParams = async () => {
      try {
        const res = await fetch(`/api/ocean?lat=${coords.lat}&lon=${coords.lon}`);
        const data = await res.json();
        setOceanParams(data);
      } catch (err) {
        console.error("Error fetching ocean parameters:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOceanParams();
    const interval = setInterval(fetchOceanParams, 1800000); // refresh every 30 min
    return () => clearInterval(interval);
  }, [coords]);

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
      <h1 className="text-3xl font-semibold mb-2">🌊 OceanSense — Live Fisheries & Cyclone Data</h1>
      <p className="text-gray-300 mb-6">
        Real-time species distributions with live cyclone overlays and ocean health parameters.
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

      {/* 🗺️ Interactive Map */}
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
      />

      {/* 🌡️ Live Ocean Parameters */}
      <div className="mt-6">
        {loading ? (
          <p className="text-gray-400 italic">Fetching ocean parameters...</p>
        ) : oceanParams ? (
          <div className="bg-gray-900/70 backdrop-blur-md border border-cyan-600 rounded-xl p-4 mt-2 w-full max-w-md">
            <h3 className="text-cyan-400 font-semibold mb-2">🌡️ Live Ocean Parameters</h3>
            <p>
              <strong>Location:</strong> {oceanParams.lat?.toFixed(2)}, {oceanParams.lon?.toFixed(2)}
            </p>
            <p>Sea Surface Temperature: <span className="font-medium">{oceanParams.sst} °C</span></p>
            <p>Salinity: <span className="font-medium">{oceanParams.salinity} PSU</span></p>
            <p>Chlorophyll-a: <span className="font-medium">{oceanParams.chl} mg/m³</span></p>
          </div>
        ) : (
          <p className="text-red-400 italic">⚠️ Failed to fetch live ocean data.</p>
        )}
      </div>

      {/* 🤖 Neritic Chatbot */}
      <Neritic_v2 />
    </div>
  );
}
