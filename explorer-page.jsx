"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Papa from "papaparse";

// Plotly must be client-only to avoid SSR crashes
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Path assumptions:
// - /public/OBIS_Fisheries_Merged.csv
// - /public/seasonalFrequency_sc_Monsoon1891-2021.csv
// - /public/seasonalFrequency_cd_Post-Monsoon1891-2021.csv
// - /public/seasonalFrequency_cd_Winter-1891-2021.csv
// - /public/species_registry_top50.json

export default function ExplorerPage() {
  // raw datasets
  const [fisheries, setFisheries] = useState([]);
  const [monsoon, setMonsoon] = useState([]);
  const [post, setPost] = useState([]);
  const [winter, setWinter] = useState([]);
  const [registry, setRegistry] = useState([]);

  // UI state
  const [season, setSeason] = useState("All");
  const [selectedSpecies, setSelectedSpecies] = useState("All Species");
  const [yearRange, setYearRange] = useState([1900, 2021]); // will be updated once data loads

  // fetch CSVs and registry
  useEffect(() => {
    fetch("/OBIS_Fisheries_Merged.csv").then((r) => r.text()).then((txt) => {
      const parsed = Papa.parse(txt, { header: true, skipEmptyLines: true }).data;
      // normalize: ensure eventDate/year and decimalLatitude/Longitude exist
      const cleaned = parsed.map((d) => ({
        ...d,
        eventDate: d.eventDate || d.eventdate || "",
        year: d.year ? parseInt(d.year) : (d.eventDate ? new Date(d.eventDate).getFullYear() : NaN),
        decimalLatitude: parseFloat(d.decimalLatitude || d.decimallatitude || d.decLat || NaN),
        decimalLongitude: parseFloat(d.decimalLongitude || d.decimallongitude || d.decLong || NaN),
        scientificName: d.scientificName || d.scientificname || d.sciname || "",
      })).filter(d => !isNaN(d.year));
      setFisheries(cleaned);
    }).catch(()=>console.warn("fisheries CSV not found"));
  }, []);

  useEffect(() => {
    const loadCSV = async (path, setter) => {
      try {
        const res = await fetch(path);
        const txt = await res.text();
        const rows = txt.split("\n").map(r => r.split(","));
        const headers = rows[0];
        const records = rows.slice(1).filter(r=>r.length>1).map(r => Object.fromEntries(r.map((v,i)=>[headers[i],v])));
        setter(records);
      } catch (e) {
        console.warn("CSV load error", path, e);
      }
    };
    loadCSV("/seasonalFrequency_sc_Monsoon1891-2021.csv", setMonsoon);
    loadCSV("/seasonalFrequency_cd_Post-Monsoon1891-2021.csv", setPost);
    loadCSV("/seasonalFrequency_cd_Winter-1891-2021.csv", setWinter);
    fetch("/species_registry_top50.json")
      .then(r=>r.json())
      .then(data=>setRegistry(data))
      .catch(()=>console.warn("registry not found"));
  }, []);

  // derive year extents once data available
  useEffect(() => {
    const years = [];
    [monsoon, post, winter].forEach(arr => arr && arr.forEach(d => {
      const y = parseInt(d.Year || d.Year || d["Year"]);
      if (!isNaN(y)) years.push(y);
    }));
    if (fisheries.length) {
      fisheries.forEach(d => { if (!isNaN(d.year)) years.push(d.year); });
    }
    if (years.length) {
      const minY = Math.min(...years), maxY = Math.max(...years);
      setYearRange([minY, maxY]);
    }
  }, [monsoon, post, winter, fisheries]);

  // helper to extract year->total from seasonal CSV rows
  const extractSeasonCounts = (arr) => {
    if (!arr || !arr.length) return { years: [], totals: [] };
    const headers = Object.keys(arr[0]);
    const totalCol = headers.find(h => /TOTAL/i.test(h)) || headers.find(h => /Total/i.test(h));
    const years = arr.map(r => parseInt(r.Year || r["Year"])).filter(y=>!isNaN(y));
    const totals = arr.map(r => parseFloat(r[totalCol] || 0));
    return { years, totals };
  };

  const mon = extractSeasonCounts(monsoon);
  const pst = extractSeasonCounts(post);
  const win = extractSeasonCounts(winter);

  // Filter fisheries by species and year-range
  const filteredFisheries = useMemo(() => {
    let arr = fisheries;
    if (selectedSpecies !== "All Species") {
      arr = arr.filter(d => d.scientificName === selectedSpecies);
    }
    arr = arr.filter(d => d.year >= yearRange[0] && d.year <= yearRange[1]);
    return arr;
  }, [fisheries, selectedSpecies, yearRange]);

  // compute yearly fisheries counts (records per year)
  const fisheriesByYear = useMemo(() => {
    const map = {};
    filteredFisheries.forEach(d => { const y = d.year; map[y] = (map[y] || 0) + 1; });
    const ys = Object.keys(map).map(y=>parseInt(y)).sort((a,b)=>a-b);
    return { years: ys, totals: ys.map(y => map[y]) };
  }, [filteredFisheries]);

  // compute cyclone counts per year for the selected season(s)
  const cycloneCountsByYear = useMemo(() => {
    const combined = { All: {} , Monsoon: {}, Post: {}, Winter: {} };
    const addTo = (objArr, key) => {
      const { years, totals } = extractSeasonCounts(objArr);
      years.forEach((y, i) => {
        const val = Number.isFinite(totals[i]) ? totals[i] : parseFloat(totals[i] || 0);
        combined.All[y] = (combined.All[y] || 0) + (val || 0);
      });
    };
    addTo(monsoon);
    addTo(post);
    addTo(winter);
    // also fill individual seasons
    const fillSeason = (arr, label) => {
      const { years, totals } = extractSeasonCounts(arr);
      years.forEach((y,i) => { combined[label][y] = (combined[label][y] || 0) + (Number.isFinite(totals[i]) ? totals[i] : parseFloat(totals[i] || 0)); });
    };
    fillSeason(monsoon,"Monsoon");
    fillSeason(post,"Post");
    fillSeason(winter,"Winter");

    // produce arrays limited to selected yearRange
    const cyMap = (obj) => {
      const mapYears = Object.keys(obj).map(y=>parseInt(y)).filter(y => y>=yearRange[0] && y<=yearRange[1]).sort((a,b)=>a-b);
      return { years: mapYears, totals: mapYears.map(y => obj[y] || 0) };
    };

    if (season === "All") return { All: cyMap(combined.All), Monsoon: cyMap(combined.Monsoon), Post: cyMap(combined.Post), Winter: cyMap(combined.Winter) };
    if (season === "Monsoon") return { Monsoon: cyMap(combined.Monsoon) };
    if (season === "Post") return { Post: cyMap(combined.Post) };
    return { Winter: cyMap(combined.Winter) };
  }, [monsoon, post, winter, season, yearRange]);

  // helper to compute scatter points: (cycloneCount, fishRecords) per year
  const scatterPoints = useMemo(() => {
    // choose cyclone series to use for x depending on season selection (All -> All)
    const series = (season === "All") ? cycloneCountsByYear.All :
                   (season === "Monsoon") ? cycloneCountsByYear.Monsoon :
                   (season === "Post") ? cycloneCountsByYear.Post : cycloneCountsByYear.Winter;

    if (!series || !series.years || series.years.length===0) return { x: [], y: [], labels: [] };

    // align years between fisheriesByYear and selected cyclone series
    const yearSet = new Set(series.years);
    const fishMap = {};
    fisheriesByYear.years.forEach((y,i) => { fishMap[y] = fisheriesByYear.totals[i]; });

    const xs = [], ys = [], labels = [];
    series.years.forEach((y,i) => {
      if (y >= yearRange[0] && y <= yearRange[1]) {
        const ccount = series.totals[i] || 0;
        const frec = fishMap[y] || 0;
        xs.push(ccount);
        ys.push(frec);
        labels.push(String(y));
      }
    });
    return { x: xs, y: ys, labels };
  }, [cycloneCountsByYear, fisheriesByYear, season, yearRange]);

  // Map points: aggregate fisheries points by lat/lon (size by count)
  const mapPoints = useMemo(() => {
    const agg = {};
    filteredFisheries.forEach(d => {
      if (!isFinite(d.decimalLatitude) || !isFinite(d.decimalLongitude)) return;
      const key = `${d.decimalLatitude.toFixed(4)},${d.decimalLongitude.toFixed(4)}`;
      if (!agg[key]) agg[key] = { lat: d.decimalLatitude, lon: d.decimalLongitude, species: new Set(), count: 0 };
      agg[key].count++;
      agg[key].species.add(d.scientificName || "Unknown");
    });
    return Object.values(agg).slice(0, 2000); // limit points for performance
  }, [filteredFisheries]);

  // UI helpers for slider
  const [sliderMin, sliderMax] = useMemo(() => {
    const [a,b] = yearRange;
    return [a, b];
  }, [yearRange]);

  // --- Render ---
  return (
    <section className="p-6 bg-slate-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold text-sky-300 mb-4">Interactive Explorer — OceanSense + StormSense</h1>
      <p className="text-sky-200 mb-6 max-w-3xl">Compare cyclone seasonality with fisheries records. Use the controls to filter by species, season and year range. Hover charts to inspect values per year.</p>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start mb-6">
        <div className="flex gap-3 items-center">
          <label className="text-sky-300 font-semibold">Season</label>
          <select className="bg-slate-800 p-2 rounded" value={season} onChange={e=>setSeason(e.target.value)}>
            <option value="All">All (sum)</option>
            <option value="Monsoon">Monsoon</option>
            <option value="Post">Post-Monsoon</option>
            <option value="Winter">Winter</option>
          </select>
        </div>

        <div className="flex gap-3 items-center">
          <label className="text-sky-300 font-semibold">Species</label>
          <select className="bg-slate-800 p-2 rounded" value={selectedSpecies} onChange={e=>setSelectedSpecies(e.target.value)}>
            <option>All Species</option>
            {registry.map(r => <option key={r.scientificName} value={r.scientificName}>{r.scientificName}</option>)}
          </select>
        </div>

        <div className="flex gap-3 items-center">
          <label className="text-sky-300 font-semibold">Years</label>
          <div className="flex items-center gap-2">
            <input type="number" className="bg-slate-800 p-2 rounded w-24" value={yearRange[0]} onChange={e=> { const v=Number(e.target.value); setYearRange([v, yearRange[1]]); } } />
            <span className="text-sky-400">—</span>
            <input type="number" className="bg-slate-800 p-2 rounded w-24" value={yearRange[1]} onChange={e=> { const v=Number(e.target.value); setYearRange([yearRange[0], v]); } } />
          </div>
        </div>
      </div>

      {/* Combined time-series (cyclones lines per season + fisheries on secondary axis) */}
      <div className="bg-slate-800 p-4 rounded-2xl shadow mb-8">
        <h2 className="text-lg font-semibold text-sky-300 mb-3">Time-series: Cyclones vs Fisheries Records</h2>
        <Plot
          data={[
            // Cyclone series (only include a trace if it has data in the selected year range)
            ...(season === "All" || season === "Monsoon" ? [{ x: (season==="All"? cycloneCountsByYear.All.years : cycloneCountsByYear.Monsoon.years), y: (season==="All"? cycloneCountsByYear.All.totals : cycloneCountsByYear.Monsoon.totals), name: "Monsoon (cyclones)", yaxis: "y1", type: "scatter", mode: "lines", line: { color: "#38bdf8" } }] : []),
            ...(season === "All" || season === "Post" ? [{ x: (season==="All"? cycloneCountsByYear.All.years : cycloneCountsByYear.Post.years), y: (season==="All"? cycloneCountsByYear.All.totals : cycloneCountsByYear.Post.totals), name: "Post-Monsoon (cyclones)", yaxis: "y1", type: "scatter", mode: "lines", line: { color: "#fbbf24" } }] : []),
            ...(season === "All" || season === "Winter" ? [{ x: (season==="All"? cycloneCountsByYear.All.years : cycloneCountsByYear.Winter.years), y: (season==="All"? cycloneCountsByYear.All.totals : cycloneCountsByYear.Winter.totals), name: "Winter (cyclones)", yaxis: "y1", type: "scatter", mode: "lines", line: { color: "#67e8f9" } }] : []),

            // Fisheries series (secondary axis)
            { x: fisheriesByYear.years, y: fisheriesByYear.totals, name: "Fisheries records", yaxis: "y2", type: "scatter", mode: "lines+markers", line: { color: "#ef9a9a" } },
          ]}
          layout={{
            paper_bgcolor: "#0f172a",
            plot_bgcolor: "#0f172a",
            font: { color: "#e2e8f0" },
            xaxis: { title: "Year" },
            yaxis: { title: "Cyclone count", side: "left" },
            yaxis2: { title: "Fisheries records (count)", overlaying: "y", side: "right" },
            height: 480,
            legend: { orientation: "h", x: 0.5, xanchor: "center" },
            margin: { t: 30, b: 40, l: 60, r: 60 },
          }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Scatter (cyclone count vs fisheries records) */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800 p-4 rounded-2xl shadow">
          <h3 className="text-sky-300 font-semibold mb-3">Scatter: Cyclone count vs Fisheries records (per year)</h3>
          <Plot
            data={[
              {
                x: scatterPoints.x,
                y: scatterPoints.y,
                text: scatterPoints.labels,
                mode: "markers",
                type: "scatter",
                marker: { size: 8, color: "#f97316", opacity: 0.8 },
              },
            ]}
            layout={{
              paper_bgcolor: "#0f172a",
              plot_bgcolor: "#0f172a",
              font: { color: "#e2e8f0" },
              xaxis: { title: "Cyclone count (selected season)" },
              yaxis: { title: "Fisheries records (count)" },
              height: 360,
            }}
            style={{ width: "100%" }}
          />
        </div>

        {/* Map */}
        <div className="bg-slate-800 p-4 rounded-2xl shadow">
          <h3 className="text-sky-300 font-semibold mb-3">Map: Fisheries observation points</h3>
          <Plot
            data={[
              {
                type: "scattergeo",
                mode: "markers",
                lat: mapPoints.map(p => p.lat),
                lon: mapPoints.map(p => p.lon),
                text: mapPoints.map(p => `<b>Records:</b> ${p.count}<br/><b>Species:</b> ${Array.from(p.species).slice(0,3).join(", ")}`),
                marker: {
                  size: mapPoints.map(p => Math.min(4 + Math.log(p.count + 1) * 3, 18)),
                  color: mapPoints.map(p => Math.min(1 + Math.log(p.count + 1), 8)),
                  colorscale: "Viridis",
                  opacity: 0.8,
                },
                hovertemplate: "%{text}<extra></extra>",
              },
            ]}
            layout={{
              geo: {
                scope: "asia",
                projection: { type: "mercator" },
                showland: true,
                landcolor: "#0b1220",
                oceancolor: "#041025",
                showcountries: true,
                coastlinecolor: "#334155",
              },
              height: 360,
              margin: { t: 0, b: 0, l: 0, r: 0 },
              paper_bgcolor: "#0f172a",
              font: { color: "#e2e8f0" },
            }}
            style={{ width: "100%" }}
          />
          <p className="text-xs text-sky-300 mt-2">Note: points are aggregated by rounded coordinates for performance.</p>
        </div>
      </div>

      <p className="text-sky-400 text-sm">Tip: Try selecting a single season and narrow the year range to explore correlations more clearly.</p>
    </section>
  );
}
