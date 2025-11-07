'use client';

import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import Papa from "papaparse";
import Neritic_v2 from "../../components/Neritic_v2"; // ✅ Ensure this file exists

export default function OceanSensePage() {
  const [registry, setRegistry] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState("All Species");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [filtered, setFiltered] = useState([]);

  // --- Load Species Registry (top 50 by default) ---
  useEffect(() => {
    fetch("/species_registry_top50.json")
      .then((res) => res.json())
      .then((data) => setRegistry(data))
      .catch(() => console.warn("⚠️ Species registry not found."));
  }, []);

  // --- Load CSV Fisheries Data ---
  useEffect(() => {
    fetch("/OBIS_Fisheries_Merged.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
        const valid = parsed.filter(
          (d) =>
            d.decimalLatitude &&
            d.decimalLongitude &&
            !isNaN(d.decimalLatitude) &&
            !isNaN(d.decimalLongitude)
        );
        setCsvData(valid);
        setFiltered(valid);
      })
      .catch(() => console.warn("⚠️ CSV file not found."));
  }, []);

  // --- Filter by species and category ---
  useEffect(() => {
    let result = csvData;

    if (selectedSpecies !== "All Species") {
      result = result.filter((d) => d.scientificName === selectedSpecies);
    }

    if (selectedCategory !== "All Categories") {
      const catSpecies = registry
        .filter((r) => r.category === selectedCategory)
        .map((r) => r.scientificName);
      result = result.filter((d) => catSpecies.includes(d.scientificName));
    }

    setFiltered(result);
  }, [selectedSpecies, selectedCategory, csvData, registry]);

  // --- Group data for mapping ---
  const grouped = {};
  filtered.forEach((d) => {
    const key = `${d.decimalLatitude},${d.decimalLongitude}`;
    if (!grouped[key]) {
      grouped[key] = {
        lat: parseFloat(d.decimalLatitude),
        lon: parseFloat(d.decimalLongitude),
        species: new Set(),
        count: 0,
      };
    }
    grouped[key].species.add(d.scientificName || "Unknown");
    grouped[key].count++;
  });
  const points = Object.values(grouped);

  // --- Aggregate time series ---
  const yearCount = {};
  filtered.forEach((d) => {
    const year = d.year || new Date(d.eventDate).getFullYear();
    if (year && !isNaN(year)) yearCount[year] = (yearCount[year] || 0) + 1;
  });
  const years = Object.keys(yearCount).sort((a, b) => a - b);
  const counts = years.map((y) => yearCount[y]);

  // --- Compute Top 10 species by records ---
  const speciesCount = {};
  filtered.forEach((d) => {
    if (d.scientificName) {
      speciesCount[d.scientificName] = (speciesCount[d.scientificName] || 0) + 1;
    }
  });
  const top10 = Object.entries(speciesCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // --- Plot layout styles ---
  const plotLayout = {
    paper_bgcolor: "#1e293b",
    plot_bgcolor: "#1e293b",
    font: { color: "white" },
  };

  // --- Render UI ---
  return (
    <>
      <section className="p-8 bg-slate-900 min-h-screen text-white">
        {/* Title */}
        <h1 className="text-3xl font-bold text-sky-400 mb-2">
          🌊 OceanSense — Fisheries Dashboard
        </h1>
        <p className="text-sky-200 mb-6">
          Explore species distributions and fisheries trends across the Indian Ocean region.
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Species Dropdown */}
          <div>
            <label className="block mb-1 text-sky-300 font-semibold">Species</label>
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="bg-slate-800 border border-sky-400 p-2 rounded-lg text-white"
            >
              <option>All Species</option>
              {registry.map((r) => (
                <option key={r.scientificName}>{r.scientificName}</option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block mb-1 text-sky-300 font-semibold">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-sky-400 p-2 rounded-lg text-white"
            >
              <option>All Categories</option>
              {[...new Set(registry.map((r) => r.category))].map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fisheries Distribution Map */}
        <div className="bg-slate-800 p-6 rounded-2xl shadow mb-10">
          <h2 className="text-xl font-semibold text-sky-300 mb-4">
            Fisheries Distribution Map
          </h2>
          <Plot
            data={[
              {
                type: "scattergeo",
                mode: "markers",
                lat: points.map((p) => p.lat),
                lon: points.map((p) => p.lon),
                text: points.map(
                  (p) => `<b>${Array.from(p.species).join(", ")}</b><br>Records: ${p.count}`
                ),
                marker: {
                  color: points.map((p) => p.count),
                  colorscale: "Viridis",
                  size: points.map((p) =>
                    Math.min(4 + Math.log(p.count + 1) * 3, 15)
                  ),
                  opacity: 0.8,
                  colorbar: { title: "Records" },
                },
                hovertemplate: "%{text}<extra></extra>",
              },
            ]}
            layout={{
              geo: {
                scope: "asia",
                projection: { type: "mercator" },
                showland: true,
                landcolor: "#1e293b",
                oceancolor: "#0f172a",
                showcountries: true,
                countrycolor: "#64748b",
              },
              height: 600,
              margin: { t: 0, b: 0, l: 0, r: 0 },
              ...plotLayout,
            }}
          />
        </div>

        {/* Temporal Trends */}
        <div className="bg-slate-800 p-6 rounded-2xl shadow mb-10">
          <h2 className="text-xl font-semibold text-sky-300 mb-4">
            Temporal Trends in Fisheries Records
          </h2>
          <Plot
            data={[
              {
                x: years,
                y: counts,
                type: "scatter",
                mode: "lines+markers",
                line: { color: "#38bdf8" },
                marker: { color: "#38bdf8" },
              },
            ]}
            layout={{
              xaxis: { title: "Year" },
              yaxis: { title: "Number of Records" },
              height: 400,
              margin: { t: 20 },
              ...plotLayout,
            }}
          />
        </div>

        {/* Top 10 Species */}
        <div className="bg-slate-800 p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold text-sky-300 mb-4">
            Top 10 Recorded Species
          </h2>
          <Plot
            data={[
              {
                x: top10.map((t) => t[0]),
                y: top10.map((t) => t[1]),
                type: "bar",
                marker: { color: "#38bdf8" },
              },
            ]}
            layout={{
              xaxis: { title: "Species" },
              yaxis: { title: "Records" },
              height: 400,
              margin: { t: 20 },
              ...plotLayout,
            }}
          />
        </div>
      </section>

      {/* 💬 Floating Neritic Assistant */}
      <Neritic_v2 />
    </>
  );
}
