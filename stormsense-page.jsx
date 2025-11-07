'use client';
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

export default function StormSense() {
  const [cyclones, setCyclones] = useState([]);

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
    const interval = setInterval(fetchCyclones, 3600000); // update hourly
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl font-semibold mb-4">🌪️ StormSense — Live Cyclone Tracker</h1>
      <MapContainer center={[15, 80]} zoom={4} style={{ height: "70vh", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {cyclones.map((c, i) => (
          <Polyline
            key={i}
            positions={c.track.map((p) => [p.lat, p.lon])}
            color="orange"
            weight={3}
          >
            {c.track.map((p, j) => (
              <Marker position={[p.lat, p.lon]} key={j}>
                <Popup>
                  <b>{c.name}</b><br />
                  {p.datetime}<br />
                  Wind: {p.wind_speed} knots<br />
                  Pressure: {p.pressure} hPa
                </Popup>
              </Marker>
            ))}
          </Polyline>
        ))}
      </MapContainer>
    </div>
  );
}
