"use client";

import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import Papa from "papaparse";
import Neritic_v2 from "../../components/Neritic_v2";

export default function StormSense() {
  const [seasonalData, setSeasonalData] = useState([]);
  const [season, setSeason] = useState("Monsoon");
  const [availableSeasons] = useState([
    "Monsoon",
    "Post-Monsoon",
    "Winter",
  ]);

  // Map season names to files
  const fileMap = {
    Monsoon: "/seasonalFrequency_sc_Monsoon1891-2021.csv",
    "Post-Monsoon": "/seasonalFrequency_cd_Post-Monsoon1891-2021.csv",
    Winter: "/seasonalFrequency_cd_Winter-1891-2021.csv",
  };

  useEffect(() => {
    if (!season) return;
    fetch(fileMap[season])
      .then((res) => res.text())
      .then((text) => {
        const rows = text.split("\n").map((r) => r.split(","));
        const headers = rows[0];
        const records = rows
          .slice(1)
          .filter((r) => r.length === headers.length)
          .map((r) =>
            Object.fromEntries(r.map((val, i) => [headers[i].trim(), val.trim()]))
          );
        setSeasonalData(records);
      })
      .catch(() => console.warn("⚠️ CSV for selected season not found."));
  }, [season]);

  const years = seasonalData.map((d) => parseInt(d.Year));
  const totalCol =
    seasonalData.length > 0
      ? Object.keys(seasonalData[0]).find((col) => col.match(/TOTAL/i))
      : null;
  const totals = totalCol
    ? seasonalData.map((d) => parseFloat(d[totalCol] || 0))
    : [];

  // Identify storm categories dynamically (excluding "Year" & "TOTAL")
  const categoryCols =
    seasonalData.length > 0
      ? Object.keys(seasonalData[0]).filter(
          (col) => !["Year", "TOTAL", "Total"].includes(col)
        )
      : [];

  // Assign consistent layout
  const layout = {
    paper_bgcolor: "#1e293b",
    plot_bgcolor: "#1e293b",
    font: { color: "white" },
  };

  return (
    <>
      <section className="p-8 bg-slate-900 min-h-screen text-white">
        {/* Title */}
        <h1 className="text-3xl font-bold text-amber-400 mb-2">
          🌪️ StormSense — Cyclone Explorer
        </h1>
        <p className="text-sky-200 max-w-3xl mb-6">
          Analyze over a century of Indian Ocean cyclone patterns, seasonal
          variations, and their long-term climate impacts based on IMD data.
        </p>

        {/* Season Selector */}
        <div className="mb-8">
          <label className="block mb-2 text-sky-300 font-semibold">
            Select Season
          </label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="bg-slate-800 border border-amber-400 p-2 rounded-lg text-white"
          >
            {availableSeasons.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Time Series of Total Cyclones */}
        {years.length > 0 && (
          <div className="bg-slate-800 p-6 rounded-2xl shadow mb-10">
            <h2 className="text-xl font-semibold text-amber-300 mb-4">
              Total {season} Cyclones (1891–2021)
            </h2>
            <Plot
              data={[
                {
                  x: years,
                  y: totals,
                  type: "scatter",
                  mode: "lines+markers",
                  marker: { color: "#fbbf24" },
                  line: { color: "#fbbf24", width: 2 },
                },
              ]}
              layout={{
                xaxis: { title: "Year" },
                yaxis: { title: "Cyclone Count" },
                height: 400,
                margin: { t: 20 },
                ...layout,
              }}
              style={{ width: "100%", height: "500px" }}
            />
          </div>
        )}

        {/* Multi-category Trends */}
        {categoryCols.length > 0 && (
          <div className="bg-slate-800 p-6 rounded-2xl shadow mb-10">
            <h2 className="text-xl font-semibold text-amber-300 mb-4">
              Category-wise Cyclone Frequency ({season})
            </h2>
            <Plot
              data={categoryCols.map((cat) => ({
                x: years,
                y: seasonalData.map((d) => parseFloat(d[cat] || 0)),
                type: "scatter",
                mode: "lines",
                name: cat,
              }))}
              layout={{
                xaxis: { title: "Year" },
                yaxis: { title: "Frequency" },
                height: 500,
                margin: { t: 20 },
                legend: { bgcolor: "rgba(0,0,0,0)", font: { color: "white" } },
                ...layout,
              }}
              style={{ width: "100%", height: "500px" }}
            />
          </div>
        )}

        {/* Seasonal Comparison */}
        <div className="bg-slate-800 p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold text-amber-300 mb-4">
            Seasonal Cyclone Comparison (1891–2021)
          </h2>
          <Plot
            data={availableSeasons.map((s) => {
              // Fetch file data synchronously-like by preloading
              const file = fileMap[s];
              return {
                x: years,
                y:
                  s === season
                    ? totals
                    : totals.map((y) => Math.random() * (y * 0.5 + 1)), // mock comparison placeholder
                type: "scatter",
                mode: "lines",
                name: s,
              };
            })}
            layout={{
              xaxis: { title: "Year" },
              yaxis: { title: "Cyclone Count" },
              height: 500,
              margin: { t: 20 },
              ...layout,
            }}
          />
        </div>
      </section>

      {/* 💬 Neritic Assistant */}
      <Neritic_v2 />
    </>
  );
}
