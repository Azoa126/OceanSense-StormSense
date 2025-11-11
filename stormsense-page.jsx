'use client';
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { motion } from "framer-motion";
import { FaWind } from "react-icons/fa";
import Neritic_v2 from "@/components/Neritic_v2";

// ✅ Dynamic imports for Leaflet (prevents SSR errors)
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

export default function StormSensePage() {
  const [cyclones, setCyclones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🌪️ Fetch live cyclone data (IMD)
  useEffect(() => {
    const fetchCyclones = async () => {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_IMD_API || "https://mausam.imd.gov.in/backend/imd_api/cyclone_info/active");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCyclones(data?.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching cyclone data:", err);
        setError("⚠️ Unable to fetch live cyclone data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCyclones();
    const interval = setInterval(fetchCyclones, 3600000); // update hourly
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-sky-900 to-blue-800 text-white p-6">
      <Head>
        <title>StormSense 🌪️ — Live Cyclone Tracker</title>
        <meta
          name="description"
          content="Real-time visualization of active cyclones in the Indian Ocean using live data from IMD."
        />
      </Head>

      {/* Header */}
      <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
        <FaWind className="text-cyan-400" /> StormSense — Live Cyclone Tracker
      </h1>
      <p className="text-gray-300 mb-6">
        Real-time visualization of tropical cyclones in and around the Indian Ocean.
      </p>

      {/* Loading / Error states */}
      {loading && (
        <motion.p
          className="text-gray-400 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Fetching live cyclone data...
        </motion.p>
      )}

      {error && (
        <p className="text-red-400 font-medium mb-4">{error}</p>
      )}

      {/* ✅ Main Cyclone Map */}
      {!loading && !error && (
        <>
          {cyclones.length === 0 ? (
            <p className="text-green-400 italic">✅ No active cyclones at the moment.</p>
          ) : (
            <MapContainer center={[15, 80]} zoom={4} style={{ height: "75vh", width: "100%", borderRadius: "1rem" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {cyclones.map((c, i) => (
                <Polyline
                  key={i}
                  positions={c.track.map((p) => [p.lat, p.lon])}
                  color="orange"
                  weight={3}
                  opacity={0.8}
                >
                  {c.track.map((p, j) => (
                    <Marker position={[p.lat, p.lon]} key={j}>
                      <Popup>
                        <b>{c.name}</b> <br />
                        Date: {p.datetime}<br />
                        Wind: {p.wind_speed} knots<br />
                        Pressure: {p.pressure} hPa
                      </Popup>
                    </Marker>
                  ))}
                </Polyline>
              ))}
            </MapContainer>
          )}
        </>
      )}

      {/* 🌀 Cyclone Info Section */}
      {cyclones.length > 0 && (
        <motion.div
          className="mt-6 bg-gray-800/70 p-4 rounded-xl shadow-md border border-cyan-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold mb-3">🌀 Active Cyclone Summary</h2>
          {cyclones.map((c, i) => (
            <div key={i} className="mb-3 border-b border-gray-600 pb-2">
              <p className="font-bold text-cyan-400">{c.name}</p>
              <p>Region: {c.basin || "Unknown"}</p>
              <p>Current wind speed: {c.track[0]?.wind_speed} knots</p>
              <p>Central pressure: {c.track[0]?.pressure} hPa</p>
              <p>Last updated: {c.track[0]?.datetime}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* 🤖 Neritic Chatbot */}
      <Neritic_v2 />
    </div>
  );
}
