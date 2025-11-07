'use client';
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaThermometerHalf, FaTint, FaLeaf, FaMapMarkerAlt, FaSearchLocation } from "react-icons/fa";
import Neritic_v4 from "../../components/Neritic_v4";

export default function ExplorerPage() {
  const [data, setData] = useState({ sst: "Loading...", chl: "Loading...", salinity: "Loading..." });
  const [coords, setCoords] = useState({ lat: 9.9, lon: 76.3 }); // default: Kochi
  const [location, setLocation] = useState("Kochi");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔄 Fetch live ocean parameter data
  const fetchData = async (lat, lon) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/ocean-parameters?lat=${lat}&lon=${lon}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      console.error("Error fetching ocean parameters:", err);
      setError("Unable to fetch live data. Please try again later.");
      setData({ sst: "N/A", chl: "N/A", salinity: "N/A" });
    } finally {
      setLoading(false);
    }
  };

  // ⛵ Fetch once on mount
  useEffect(() => {
    fetchData(coords.lat, coords.lon);
  }, []);

  // 📍 Search for a location (geocoding API)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!location.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
      );
      const data = await res.json();
      if (data.results && data.results[0]) {
        const lat = data.results[0].latitude;
        const lon = data.results[0].longitude;
        setCoords({ lat, lon });
        fetchData(lat, lon);
      } else {
        setError("Could not find that location.");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching coordinates.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 relative overflow-hidden">
      {/* 🌍 Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">🌊 Ocean Explorer Dashboard</h1>
        <p className="text-gray-400">Live environmental parameters shaping ocean productivity</p>
      </motion.div>

      {/* 🔎 Search bar */}
      <form onSubmit={handleSearch} className="flex justify-center items-center gap-2 mb-8">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Search a location (e.g., Mangalore, Kochi)"
          className="px-4 py-2 rounded-xl bg-gray-800 border border-cyan-700 text-white w-72 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          type="submit"
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-xl transition"
        >
          <FaSearchLocation /> Search
        </button>
      </form>

      {/* 📍 Current location */}
      <div className="flex items-center justify-center mb-8">
        <FaMapMarkerAlt className="text-cyan-400 mr-2" />
        <p className="text-gray-300">
          Current location:{" "}
          <span className="text-white font-semibold">
            {location} (Lat {coords.lat.toFixed(2)}°, Lon {coords.lon.toFixed(2)}°)
          </span>
        </p>
      </div>

      {/* ⚙️ Data Cards */}
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
                ? "Warm waters — stratified, moderate productivity."
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
                ? "High phytoplankton — excellent fish productivity."
                : "Low chlorophyll — less biological activity."
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
                ? "Low salinity — possible freshwater or cyclone influence."
                : "Stable marine salinity levels."
              : "Data unavailable."}
          </p>
        </motion.div>
      </motion.div>

      {/* 💬 Neritic AI Assistant */}
      <Neritic_v4 />

      {/* 🌀 Loading Overlay */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/60 text-cyan-400 text-lg backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Fetching live ocean data...
        </motion.div>
      )}

      {/* ⚠️ Error */}
      {error && (
        <motion.p
          className="text-center text-red-400 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
