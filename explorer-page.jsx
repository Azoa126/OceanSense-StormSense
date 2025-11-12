'use client';
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Plot from "react-plotly.js";
import dynamic from "next/dynamic";
import { FaThermometerHalf, FaTint, FaLeaf } from "react-icons/fa";
import { GiOceanEmblem } from "react-icons/gi";
import Neritic_v2 from "../../components/Neritic_v2";

// 🗺️ Dynamically import Leaflet (client-side only)
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const WindLayer = dynamic(() => import("react-leaflet-windbarb"), { ssr: false });

export default function ExplorerPage() {
  const regions = {
    Kutch: { lat: 23.0, lon: 68.8 },
    Konkan: { lat: 17.0, lon: 73.3 },
    Malabar: { lat: 9.9, lon: 76.3 },
    Coromandel: { lat: 13.0, lon: 80.3 },
    Odisha: { lat: 19.5, lon: 85.0 },
    Sundarbans: { lat: 21.9, lon: 89.2 },
    Andaman: { lat: 11.6, lon: 92.7 },
    Lakshadweep: { lat: 10.5, lon: 72.6 },
  };

  const [coords, setCoords] = useState(regions["Malabar"]);
  const [data, setData] = useState({ sst: "Loading...", chl: "Loading...", salinity: "Loading..." });
  const [mode, setMode] = useState("simulated");
  const [trendData, setTrendData] = useState([]);
  const [currents, setCurrents] = useState([]);
  const [showCurrents, setShowCurrents] = useState(false);
  const [showUpwelling, setShowUpwelling] = useState(false);
  const [upwellingData, setUpwellingData] = useState({ dates: [], values: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🌍 Fetch live ocean data
  const fetchLiveData = async (lat, lon) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/?lat=${lat}&lon=${lon}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);

      // Simulated time series for trends
      const t = [...Array(10).keys()];
      setTrendData(
        t.map((i) => ({
          time: i,
          sst: parseFloat(json.sst) + (Math.random() - 0.5),
          chl: parseFloat(json.chl) + (Math.random() - 0.3) / 10,
          salinity: parseFloat(json.salinity) + (Math.random() - 0.5),
        }))
      );
    } catch (err) {
      console.error("🌊 Live fetch error:", err);
      setError("Unable to fetch live ocean data.");
    } finally {
      setLoading(false);
    }
  };

  // 🧪 Generate simulated data
  const generateSimulatedData = () => {
    const base = {
      sst: (27 + Math.random() * 2).toFixed(2),
      chl: (0.3 + Math.random() * 0.2).toFixed(3),
      salinity: (34 + Math.random()).toFixed(2),
    };
    setData(base);
    const t = [...Array(10).keys()];
    setTrendData(
      t.map((i) => ({
        time: i,
        sst: parseFloat(base.sst) + (Math.random() - 0.5),
        chl: parseFloat(base.chl) + (Math.random() - 0.5) / 10,
        salinity: parseFloat(base.salinity) + (Math.random() - 0.5),
      }))
    );
  };

  // 🌀 Fetch live ocean current data (NOAA OSCAR)
  const fetchCurrents = async () => {
    try {
      const res = await fetch(
        "https://coastwatch.pfeg.noaa.gov/erddap/griddap/oscar_third_deg.json?u[0][0:10:180][0:10:360],v[0][0:10:180][0:10:360]"
      );
      const data = await res.json();
      const uIndex = data.table.columnNames.indexOf("u");
      const vIndex = data.table.columnNames.indexOf("v");
      const latIndex = data.table.columnNames.indexOf("latitude");
      const lonIndex = data.table.columnNames.indexOf("longitude");
      const points = data.table.rows.map((r) => ({
        lat: r[latIndex],
        lon: r[lonIndex],
        dir: Math.atan2(r[uIndex], r[vIndex]) * (180 / Math.PI),
        speed: Math.sqrt(r[uIndex] ** 2 + r[vIndex] ** 2),
      }));
      setCurrents(points);
    } catch (err) {
      console.error("⚠️ Error fetching currents:", err);
    }
  };

  // 🌿 Simulated upwelling index
  const generateUpwellingData = () => {
    const t = [...Array(10).keys()];
    setUpwellingData({
      dates: t.map((i) => `T${i}`),
      values: t.map(() => 10 + Math.random() * 30),
    });
  };

  // Initial load
  useEffect(() => {
    if (mode === "simulated") generateSimulatedData();
    else fetchLiveData(coords.lat, coords.lon);
    if (showCurrents) fetchCurrents();
    if (showUpwelling) generateUpwellingData();
  }, [coords, mode, showCurrents, showUpwelling]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 relative overflow-hidden">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">🌊 Ocean Explorer Dashboard</h1>
        <p className="text-gray-400">Live and simulated ocean data around Indian coasts</p>
      </motion.div>

      {/* Region + Mode + Layer Toggles */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <select
          value={Object.keys(regions).find((r) => regions[r].lat === coords.lat)}
          onChange={(e) => setCoords(regions[e.target.value])}
          className="bg-gray-800 border border-cyan-700 p-2 rounded-lg text-white"
        >
          {Object.keys(regions).map((region) => (
            <option key={region}>{region}</option>
          ))}
        </select>

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="bg-gray-800 border border-green-700 p-2 rounded-lg text-white"
        >
          <option value="simulated">🧪 Simulated Data</option>
          <option value="live">🌍 Live NOAA Data</option>
        </select>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showCurrents} onChange={() => setShowCurrents(!showCurrents)} />
          Show Currents
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showUpwelling} onChange={() => setShowUpwelling(!showUpwelling)} />
          Show Upwelling
        </label>
      </div>

      {/* Map + Optional Currents */}
      {showCurrents && (
        <div className="h-[500px] mb-10 rounded-2xl overflow-hidden border border-cyan-700 shadow-lg">
          <MapContainer center={[coords.lat, coords.lon]} zoom={5} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            <WindLayer
              data={currents}
              options={{
                color: "cyan",
                velocityScale: 0.02,
                lineWidth: 2,
                opacity: 0.8,
              }}
            />
          </MapContainer>
        </div>
      )}

      {/* Parameter Cards */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* SST */}
        <div className="bg-gray-900 border border-cyan-800 rounded-2xl p-6 shadow-lg">
          <FaThermometerHalf className="text-cyan-400 text-3xl mb-2" />
          <h2 className="text-2xl font-bold">{data.sst} °C</h2>
          <p className="text-sm text-gray-500 mt-1">Sea Surface Temperature</p>
        </div>
        {/* Chlorophyll */}
        <div className="bg-gray-900 border border-green-700 rounded-2xl p-6 shadow-lg">
          <FaLeaf className="text-green-400 text-3xl mb-2" />
          <h2 className="text-2xl font-bold">{data.chl} mg/m³</h2>
          <p className="text-sm text-gray-500 mt-1">Chlorophyll-a</p>
        </div>
        {/* Salinity */}
        <div className="bg-gray-900 border border-blue-700 rounded-2xl p-6 shadow-lg">
          <FaTint className="text-blue-400 text-3xl mb-2" />
          <h2 className="text-2xl font-bold">{data.salinity} PSU</h2>
          <p className="text-sm text-gray-500 mt-1">Salinity</p>
        </div>
      </motion.div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
        <Plot data={[{ x: trendData.map((d) => d.time), y: trendData.map((d) => d.sst), type: "scatter", mode: "lines+markers" }]} layout={{ title: "SST Trend", paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "white" } }} />
        <Plot data={[{ x: trendData.map((d) => d.time), y: trendData.map((d) => d.chl), type: "scatter", mode: "lines+markers" }]} layout={{ title: "Chlorophyll Trend", paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "white" } }} />
        <Plot data={[{ x: trendData.map((d) => d.time), y: trendData.map((d) => d.salinity), type: "scatter", mode: "lines+markers" }]} layout={{ title: "Salinity Trend", paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "white" } }} />
      </div>

      {/* Upwelling Index */}
      {showUpwelling && (
        <div className="bg-gray-900 border border-purple-700 rounded-2xl p-6 shadow-lg max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-between mb-3">
            <GiOceanEmblem className="text-purple-400 text-3xl" />
            <p className="text-sm text-gray-500">Upwelling Index</p>
          </div>
          <h2 className="text-2xl font-bold">{upwellingData.values.at(-1)?.toFixed(2)} m³/s/100m</h2>
          <Plot
            data={[{ x: upwellingData.dates, y: upwellingData.values, type: "scatter", mode: "lines+markers", line: { color: "#a855f7" } }]}
            layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "white" }, title: "Upwelling Intensity" }}
          />
        </div>
      )}

      {/* Neritic Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        <Neritic_v2 />
      </div>

      {/* Loading overlay */}
      {loading && (
        <motion.div className="absolute inset-0 flex items-center justify-center bg-black/50 text-cyan-400 text-lg">
          Fetching live ocean data...
        </motion.div>
      )}
    </div>
  );
}
