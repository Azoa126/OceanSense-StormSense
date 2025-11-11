'use client';
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaThermometerHalf, FaTint, FaLeaf, FaMapMarkerAlt, FaWater, FaWind } from "react-icons/fa";
import Plot from "react-plotly.js";
import Neritic_v3 from "../../components/Neritic_v3";

export default function ExplorerPage() {
  const [params, setParams] = useState({ sst: "Loading...", chl: "Loading...", salinity: "Loading..." });
  const [cyclones, setCyclones] = useState([]);
  const [coords, setCoords] = useState({ lat: 9.9, lon: 76.3 }); // Default: Kochi
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔄 Fetch live ocean data
  const fetchOceanParams = async (lat, lon) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ocean-parameters?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setParams(data);
    } catch (err) {
      console.error("Ocean data error:", err);
      setError("⚠️ Failed to fetch live ocean data.");
      setParams({ sst: "N/A", chl: "N/A", salinity: "N/A" });
    } finally {
      setLoading(false);
    }
  };

  // 🌪️ Fetch cyclone data (from IMD API)
  const fetchCyclones = async () => {
    try {
      const res = await fetch("https://mausam.imd.gov.in/backend/imd_api/cyclone_info/active");
      const json = await res.json();
      setCyclones(json?.data || []);
    } catch (err) {
      console.error("Cyclone fetch error:", err);
    }
  };

  // 📍 On mount
  useEffect(() => {
    fetchOceanParams(coords.lat, coords.lon);
    fetchCyclones();
  }, []);

  // 🗺️ Prepare cyclone traces
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-cyan-900 text-white p-6 relative overflow-hidden">
      {/* 🌍 Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">🌊 OceanSense x StormSense Explorer</h1>
        <p className="text-gray-400">
          Real-time dashboard combining oceanographic and meteorological intelligence for Indian waters.
        </p>
      </motion.div>

      {/* 📍 Coordinates */}
      <div className="flex items-center justify-center mb-8">
        <FaMapMarkerAlt className="text-cyan-400 mr-2" />
        <p className="text-gray-300">
          Current location:{" "}
          <span className="text-white font-semibold">
            Lat {coords.lat}°, Lon {coords.lon}°
          </span>
        </p>
      </div>

      {/* ⚙️ Ocean Parameters */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* SST */}
        <ParameterCard
          icon={<FaThermometerHalf className="text-cyan-400 text-3xl" />}
          title="Sea Surface Temperature"
          value={`${params.sst} °C`}
          desc={
            params.sst !== "N/A"
              ? params.sst > 28
                ? "Warm surface — stratified layers, moderate productivity."
                : "Cooler waters — nutrient upwelling likely."
              : "Data unavailable."
          }
          border="border-cyan-700"
        />

        {/* Chlorophyll-a */}
        <ParameterCard
          icon={<FaLeaf className="text-green-400 text-3xl" />}
          title="Chlorophyll-a"
          value={`${params.chl} mg/m³`}
          desc={
            params.chl !== "N/A"
              ? params.chl > 0.3
                ? "High biomass — strong base for fisheries."
                : "Low chlorophyll — reduced productivity."
              : "Data unavailable."
          }
          border="border-green-700"
        />

        {/* Salinity */}
        <ParameterCard
          icon={<FaTint className="text-blue-400 text-3xl" />}
          title="Salinity"
          value={`${params.salinity} PSU`}
          desc={
            params.salinity !== "N/A"
              ? params.salinity < 33
                ? "Lower salinity — possible riverine or cyclone influence."
                : "Stable marine salinity."
              : "Data unavailable."
          }
          border="border-blue-700"
        />
      </motion.div>

      {/* 🌀 Cyclone & Ocean Map */}
      <motion.div
        className="mt-12 border border-cyan-800 rounded-2xl bg-gray-900/70 backdrop-blur-md p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
          <FaWater /> Active Cyclones & Ocean Zones
        </h2>
        <Plot
          data={[...cycloneTraces]}
          layout={{
            title: "Cyclone Tracks (IMD Live Feed)",
            xaxis: { title: "Longitude" },
            yaxis: { title: "Latitude" },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            showlegend: true,
            legend: { bgcolor: "rgba(0,0,0,0.4)", font: { color: "white" } },
          }}
          style={{ width: "100%", height: "70vh" }}
          config={{ responsive: true }}
        />
      </motion.div>

      {/* ⚠️ Error Message */}
      {error && (
        <motion.div
          className="text-center mt-6 text-red-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}

      {/* 💬 Neritic Assistant */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Neritic_v3 />
      </motion.div>

      {/* 🌀 Loading Overlay */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/50 text-cyan-400 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Fetching live ocean data...
        </motion.div>
      )}
    </div>
  );
}

// 🔧 Reusable parameter card component
function ParameterCard({ icon, title, value, desc, border }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`bg-gray-900 border ${border} rounded-2xl p-6 shadow-lg`}
    >
      <div className="flex items-center justify-between">
        {icon}
        <p className="text-sm text-gray-500">{title}</p>
      </div>
      <h2 className="text-2xl font-bold mt-3">{value}</h2>
      <p className="text-sm mt-2 text-gray-400">{desc}</p>
    </motion.div>
  );
}
