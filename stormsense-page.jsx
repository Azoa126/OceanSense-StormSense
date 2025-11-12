'use client';
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Neritic_v2 from "@/components/Neritic_v2";

// 🗺️ Dynamic import for Leaflet
const Map = dynamic(() => import("@/components/MapComponent"), { ssr: false });

export default function StormSensePage() {
  const [cyclones, setCyclones] = useState([]);
  const [oceanParams, setOceanParams] = useState(null);
  const [currents, setCurrents] = useState([]);
  const [upwelling, setUpwelling] = useState([]);
  const [coords, setCoords] = useState({ lat: 15, lon: 80 }); // default Bay of Bengal
  const [region, setRegion] = useState("Bay of Bengal");
  const [loading, setLoading] = useState(true);

  // 🌍 Regions for cyclones
  const regions = {
    "Bay of Bengal": { lat: 15, lon: 80 },
    "Arabian Sea": { lat: 15, lon: 70 },
  };

  // 🌪️ Fetch live cyclone data
  useEffect(() => {
    const fetchCyclones = async () => {
      try {
        const res = await fetch("https://mausam.imd.gov.in/backend/imd_api/cyclone_info/active");
        const data = await res.json();
        setCyclones(data?.data || []);
      } catch (err) {
        console.error("Error fetching cyclone data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCyclones();
    const interval = setInterval(fetchCyclones, 3600000); // hourly
    return () => clearInterval(interval);
  }, []);

  // 📍 Update coordinates when region changes
  useEffect(() => {
    setCoords(regions[region]);
  }, [region]);

  // 🌡️ Fetch ocean parameters (SST, salinity, chl-a)
  useEffect(() => {
    const fetchOceanParams = async () => {
      try {
        const res = await fetch(`/api/ocean-parameters?lat=${coords.lat}&lon=${coords.lon}`);
        const data = await res.json();
        setOceanParams(data);
      } catch (err) {
        console.error("Error fetching ocean parameters:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOceanParams();
    const interval = setInterval(fetchOceanParams, 1800000);
    return () => clearInterval(interval);
  }, [coords]);

  // 🌊 Fetch ocean currents
  useEffect(() => {
    const fetchCurrents = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_CURRENTS_API}?lat=${coords.lat}&lon=${coords.lon}`);
        const data = await res.json();
        setCurrents(data.currents || []);
      } catch (err) {
        console.error("Error fetching currents:", err);
      }
    };
    fetchCurrents();
  }, [coords]);

  // 🌀 Fetch upwelling
  useEffect(() => {
    const fetchUpwelling = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_UPWELLING_API}?lat=${coords.lat}&lon=${coords.lon}`);
        const data = await res.json();
        setUpwelling(data.upwelling || []);
      } catch (err) {
        console.error("Error fetching upwelling:", err);
      }
    };
    fetchUpwelling();
  }, [coords]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-sky-900 to-blue-800 text-white p-6">
      <h1 className="text-3xl font-semibold mb-2">🌪️ StormSense — Live Cyclone Tracker</h1>
      <p className="text-gray-300 mb-6">Real-time visualization of cyclones with live ocean parameters.</p>

      {/* Region Selection */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block mb-2 font-medium">Select Region:</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="text-black p-2 rounded-md"
          >
            {Object.keys(regions).map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 🌍 Interactive Map */}
      <Map
        cyclones={cyclones}
        showCurrents={true}
        showUpwelling={true}
      />

      {/* 🌡️ Live Ocean Parameters */}
      <div className="mt-6">
        {loading ? (
          <p className="text-gray-400 italic">Fetching live ocean data...</p>
        ) : oceanParams ? (
          <div className="bg-gray-900/70 backdrop-blur-md border border-cyan-500 rounded-xl p-4 mt-2 w-full max-w-md">
            <h3 className="text-cyan-400 font-semibold mb-2">🌡️ Live Ocean Parameters</h3>
            <p><strong>Location:</strong> {coords.lat.toFixed(2)}, {coords.lon.toFixed(2)}</p>
            <p>SST: <span className="font-medium">{oceanParams.sst} °C</span></p>
            <p>Salinity: <span className="font-medium">{oceanParams.salinity} PSU</span></p>
            <p>Chlorophyll-a: <span className="font-medium">{oceanParams.chl} mg/m³</span></p>
            <p>Currents: <span className="font-medium">{currents[0]?.speed || "N/A"} m/s</span></p>
            <p>Upwelling Index: <span className="font-medium">{upwelling[0]?.index || "N/A"}</span></p>
          </div>
        ) : (
          <p className="text-red-400 italic">⚠️ Failed to fetch live ocean data.</p>
        )}
      </div>

      {/* 🤖 Neritic Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        <Neritic_v2 />
      </div>
    </div>
  );
}
