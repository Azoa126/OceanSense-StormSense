'use client';
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaThermometerHalf, FaTint, FaLeaf, FaMapMarkerAlt, FaWater, FaFish } from "react-icons/fa";
import Plot from "react-plotly.js";
import Neritic_v3 from "../../components/Neritic_v3";

export default function ExplorerPage() {
  const [params, setParams] = useState({ sst: "Loading...", chl: "Loading...", salinity: "Loading..." });
  const [cyclones, setCyclones] = useState([]);
  const [speciesData, setSpeciesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🌍 Filters
  const [region, setRegion] = useState("Arabian Sea");
  const [speciesGroup, setSpeciesGroup] = useState("All");

  // 🌐 Region coordinates
  const regionCoords = {
    "Arabian Sea": { lat: 15, lon: 68 },
    "Bay of Bengal": { lat: 15, lon: 87 },
    "Lakshadweep": { lat: 10.5, lon: 73 },
    "Andaman Sea": { lat: 12, lon: 94 },
    "Gulf of Mannar": { lat: 9, lon: 79 },
  };

  // 🌊 Fetch ocean parameters
  const fetchOceanParams = async (lat, lon) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ocean-parameters?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setParams(data);
    } catch (err) {
      console.error("Ocean data error:", err);
      setError("⚠️ Unable to fetch live ocean data.");
      setParams({ sst: "N/A", chl: "N/A", salinity: "N/A" });
    } finally {
      setLoading(false);
    }
  };

  // 🌪️ Cyclone data (IMD)
  const fetchCyclones = async () => {
    try {
      const res = await fetch("https://mausam.imd.gov.in/backend/imd_api/cyclone_info/active");
      const json = await res.json();
      setCyclones(json?.data || []);
    } catch (err) {
      console.error("Cyclone data error:", err);
    }
  };

  // 🐠 OBIS species data
  const fetchSpecies = async (lat, lon, group) => {
    try {
      let filter = group !== "All" ? `&taxon_class=${group}` : "";
      const url = `https://api.obis.org/v3/occurrence?geometry=POINT(${lon}%20${lat})${filter}&size=200`;
      const res = await fetch(url);
      const json = await res.json();
      setSpeciesData(json?.results || []);
    } catch (err) {
      console.error("OBIS fetch error:", err);
      setSpeciesData([]);
    }
  };

  // 🔁 On filter change
  useEffect(() => {
    const { lat, lon } = regionCoords[region];
    fetchOceanParams(lat, lon);
    fetchCyclones();
    fetchSpecies(lat, lon, speciesGroup);
  }, [region, speciesGroup]);

  // 🌀 Cyclone traces
  const cycloneTraces = cyclones.flatMap((c) =>
    c.track.map((p) => ({
      x: [p.lon],
      y: [p.lat],
      mode: "markers",
      type: "scatter",
      name: `${c.name}`,
      marker: { size: 10, color: "orange", symbol: "triangle-up" },
      text: `${c.name}<br>${p.datetime}<br>Wind: ${p.wind_speed} kn<br>Pressure: ${p.pressure} hPa`,
      hoverinfo: "text",
    }))
  );

  // 🐟 Species traces
  const speciesTraces = speciesData.map((sp) => ({
    x: [sp.decimalLongitude],
    y: [sp.decimalLatitude],
    mode: "markers",
    type: "scatter",
    name: sp.species || "Unknown",
    marker: { size: 6, color: "cyan", opacity: 0.7 },
    text: `${sp.species || "Unknown"}<br>${sp.scientificNameAuthorship || ""}`,
    hoverinfo: "text",
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-cyan-900 text-white p-6 relative overflow-hidden">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">🌊 OceanSense x StormSense Explorer</h1>
        <p className="text-gray-400">Explore live ocean data, cyclone tracks & biodiversity layers.</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="bg-gray-900 border border-cyan-700 rounded-xl p-3 text-sm text-cyan-300"
        >
          {Object.keys(regionCoords).map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>

        <select
          value={speciesGroup}
          onChange={(e) => setSpeciesGroup(e.target.value)}
          className="bg-gray-900 border border-green-700 rounded-xl p-3 text-sm text-green-300"
        >
          {["All", "Actinopterygii", "Mollusca", "Crustacea", "Cnidaria", "Echinodermata"].map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* Parameter Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <ParameterCard
          icon={<FaThermometerHalf className="text-cyan-400 text-3xl" />}
          title="Sea Surface Temperature"
          value={`${params.sst} °C`}
          desc={params.sst > 28 ? "Warm waters — stratified layers." : "Cooler upwelling — high productivity."}
          border="border-cyan-700"
        />
        <ParameterCard
          icon={<FaLeaf className="text-green-400 text-3xl" />}
          title="Chlorophyll-a"
          value={`${params.chl} mg/m³`}
          desc={params.chl > 0.3 ? "Rich phytoplankton — fertile zone." : "Low chlorophyll — limited productivity."}
          border="border-green-700"
        />
        <ParameterCard
          icon={<FaTint className="text-blue-400 text-3xl" />}
          title="Salinity"
          value={`${params.salinity} PSU`}
          desc={params.salinity < 33 ? "Freshwater influence." : "Stable marine salinity."}
          border="border-blue-700"
        />
      </motion.div>

      {/* Interactive Map */}
      <motion.div
        className="mt-12 border border-cyan-800 rounded-2xl bg-gray-900/70 backdrop-blur-md p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
          <FaWater /> Live Map — Cyclones & Biodiversity
        </h2>
        <Plot
          data={[...cycloneTraces, ...speciesTraces]}
          layout={{
            title: `${region} — ${speciesGroup} Distribution`,
            xaxis: { title: "Longitude", gridcolor: "#333" },
            yaxis: { title: "Latitude", gridcolor: "#333" },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            font: { color: "white" },
            showlegend: true,
            legend: { bgcolor: "rgba(0,0,0,0.5)", font: { color: "white" } },
          }}
          style={{ width: "100%", height: "75vh" }}
          config={{ responsive: true }}
        />
      </motion.div>

      {/* Neritic Assistant */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="fixed bottom-6 right-6 z-50">
        <Neritic_v3 />
      </motion.div>

      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/50 text-cyan-400 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Fetching live data...
        </motion.div>
      )}
    </div>
  );
}

function ParameterCard({ icon, title, value, desc, border }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} className={`bg-gray-900 border ${border} rounded-2xl p-6 shadow-lg`}>
      <div className="flex items-center justify-between">
        {icon}
        <p className="text-sm text-gray-500">{title}</p>
      </div>
      <h2 className="text-2xl font-bold mt-3">{value}</h2>
      <p className="text-sm mt-2 text-gray-400">{desc}</p>
    </motion.div>
  );
}
