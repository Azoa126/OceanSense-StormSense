'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { FaWater, FaThermometerHalf, FaSeedling } from "react-icons/fa";
import Neritic_v2 from "@/components/Neritic_v2";

// ✅ Dynamic imports for Leaflet (client-side only)
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

export default function ExplorerPage() {
  const [sstData, setSstData] = useState([]);
  const [salinityData, setSalinityData] = useState([]);
  const [chlData, setChlData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🌊 Fetch live SST, Salinity, and Chlorophyll-a data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sstRes, salRes, chlRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_SST_API}`),
          fetch(`${process.env.NEXT_PUBLIC_SALINITY_API}`),
          fetch(`${process.env.NEXT_PUBLIC_CHL_API}`)
        ]);

        const [sstJson, salJson, chlJson] = await Promise.all([
          sstRes.json(),
          salRes.json(),
          chlRes.json()
        ]);

        setSstData(sstJson?.data || []);
        setSalinityData(salJson?.data || []);
        setChlData(chlJson?.data || []);
      } catch (err) {
        console.error("Error fetching live data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3600000); // refresh hourly
    return () => clearInterval(interval);
  }, []);

  // 🗺️ Render map markers for parameters
  const renderMarkers = (data, color, label, key) =>
    data.slice(0, 100).map((point, i) => (
      <CircleMarker
        key={i}
        center={[point.lat, point.lon]}
        radius={4}
        color={color}
        fillOpacity={0.7}
      >
        <Popup>
          <b>{label}</b><br />
          {key}: {point[key]}<br />
          Lat: {point.lat.toFixed(2)}, Lon: {point.lon.toFixed(2)}
        </Popup>
      </CircleMarker>
    ));

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-cyan-900 text-white p-6 overflow-hidden">
      <motion.h1
        className="text-3xl font-semibold mb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        🌍 Ocean Explorer — Live Environmental Dashboard
      </motion.h1>

      <motion.p
        className="text-gray-300 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Real-time Sea Surface Temperature, Salinity, and Chlorophyll-a concentrations across the Indian Ocean.
      </motion.p>

      {loading ? (
        <p className="text-gray-400 italic">Fetching live environmental data...</p>
      ) : (
        <MapContainer
          center={[10, 80]}
          zoom={4}
          style={{ height: "75vh", width: "100%", borderRadius: "12px" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {renderMarkers(sstData, "red", "Sea Surface Temp", "sst")}
          {renderMarkers(salinityData, "blue", "Salinity", "salinity")}
          {renderMarkers(chlData, "green", "Chlorophyll-a", "chl_a")}
        </MapContainer>
      )}

      {/* 🌡️ Info Panels */}
      <motion.div
        className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="bg-gray-800/70 p-4 rounded-xl border border-red-500">
          <FaThermometerHalf className="text-red-400 text-2xl mb-2" />
          <h3 className="font-semibold text-lg">Sea Surface Temperature</h3>
          <p className="text-gray-400 text-sm">
            Indicates ocean warming and fish habitat shifts.
          </p>
        </div>

        <div className="bg-gray-800/70 p-4 rounded-xl border border-blue-500">
          <FaWater className="text-blue-400 text-2xl mb-2" />
          <h3 className="font-semibold text-lg">Salinity</h3>
          <p className="text-gray-400 text-sm">
            Key for understanding stratification and circulation.
          </p>
        </div>

        <div className="bg-gray-800/70 p-4 rounded-xl border border-green-500">
          <FaSeedling className="text-green-400 text-2xl mb-2" />
          <h3 className="font-semibold text-lg">Chlorophyll-a</h3>
          <p className="text-gray-400 text-sm">
            Reflects phytoplankton abundance and productivity.
          </p>
        </div>
      </motion.div>

      {/* 🧠 Floating Neritic Chatbot (Live Ocean Assistant) */}
      <Neritic_v2 />
    </div>
  );
}
