'use client';
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaThermometerHalf, FaTint, FaLeaf, FaMapMarkerAlt } from "react-icons/fa";
import Neritic_v3 from "../../components/Neritic_v3";

export default function ExplorerPage() {
  const [data, setData] = useState({ sst: "Loading...", chl: "Loading...", salinity: "Loading..." });
  const [coords, setCoords] = useState({ lat: 9.9, lon: 76.3 }); // default: Kochi
  const [loading, setLoading] = useState(true);

  // 🔄 Fetch live ocean parameter data
  const fetchData = async (lat, lon) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ocean-parameters?lat=${lat}&lon=${lon}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      console.error("Error fetching ocean parameters:", err);
      setData({ sst: "N/A", chl: "N/A", salinity: "N/A" });
    } finally {
      setLoading(false);
    }
  };

  // ⛵ Fetch once on mount
  useEffect(() => {
    fetchData(coords.lat, coords.lon);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 relative overflow-hidden">
      {/* 🌍 Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">🌊 Ocean Explorer Dashboard</h1>
        <p className="text-gray-400">Live environmental parameters influencing coastal fisheries</p>
      </motion.div>

      {/* 📍 Location Selector (future interactive map can plug here) */}
      <div className="flex items-center justify-center mb-8">
        <FaMapMarkerAlt className="text-cyan-400 mr-2" />
        <p className="text-gray-300">
          Current location: <span className="text-white font-semibold">Lat {coords.lat}°, Lon {coords.lon}°</span>
        </p>
      </div>

      {/* 📊 Parameter Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* SST */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gray-900 border border-cyan-800 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <FaThermometerHalf className="text-cyan-400 text-3xl" />
            <p className="text-sm text-gray-500">Sea Surface Temperature</p>
          </div>
          <h2 className="text-2xl font-bold mt-3">{data.sst} °C</h2>
          <p className="text-sm mt-2 text-gray-400">
            {data.sst !== "N/A"
              ? data.sst > 28
                ? "Warm waters — stratified surface, moderate productivity."
                : "Cooler waters — nutrient-rich and productive."
              : "Data unavailable."}
          </p>
        </motion.div>

        {/* Chlorophyll-a */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gray-900 border border-green-700 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <FaLeaf className="text-green-400 text-3xl" />
            <p className="text-sm text-gray-500">Chlorophyll-a</p>
          </div>
          <h2 className="text-2xl font-bold mt-3">{data.chl} mg/m³</h2>
          <p className="text-sm mt-2 text-gray-400">
            {data.chl !== "N/A"
              ? data.chl > 0.3
                ? "High phytoplankton biomass — strong base for fisheries."
                : "Low chlorophyll — reduced productivity."
              : "Data unavailable."}
          </p>
        </motion.div>

        {/* Salinity */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gray-900 border border-blue-700 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <FaTint className="text-blue-400 text-3xl" />
            <p className="text-sm text-gray-500">Sea Surface Salinity</p>
          </div>
          <h2 className="text-2xl font-bold mt-3">{data.salinity} PSU</h2>
          <p className="text-sm mt-2 text-gray-400">
            {data.salinity !== "N/A"
              ? data.salinity < 33
                ? "Lower salinity — potential freshwater influence or cyclone activity."
                : "Stable marine salinity."
              : "Data unavailable."}
          </p>
        </motion.div>
      </motion.div>

      {/* 💬 Neritic AI Assistant */}
      <Neritic_v3 />

      {/* 🌀 Loading indicator */}
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
