'use client';
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";

export default function OceanSensePage() {
  const [speciesData, setSpeciesData] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState("Rastrelliger kanagurta");

  useEffect(() => {
    const fetchSpeciesData = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_OBIS_API}?scientificname=${encodeURIComponent(selectedSpecies)}&limit=100`;
        const res = await fetch(url);
        const data = await res.json();
        setSpeciesData(data.results);
      } catch (err) {
        console.error("Error fetching OBIS data:", err);
      }
    };

    fetchSpeciesData();
  }, [selectedSpecies]);

  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl font-semibold mb-4">🌊 OceanSense — Live Fisheries Data</h1>

      <select
        value={selectedSpecies}
        onChange={(e) => setSelectedSpecies(e.target.value)}
        className="text-black p-2 rounded mb-4"
      >
        <option value="Rastrelliger kanagurta">Indian Mackerel</option>
        <option value="Thunnus albacares">Yellowfin Tuna</option>
        <option value="Sardinella longiceps">Indian Oil Sardine</option>
      </select>

      <Plot
        data={[
          {
            x: speciesData.map((d) => d.decimalLongitude),
            y: speciesData.map((d) => d.decimalLatitude),
            mode: "markers",
            type: "scatter",
            marker: { size: 6 },
          },
        ]}
        layout={{
          title: `${selectedSpecies} — Live Distribution Points`,
          xaxis: { title: "Longitude" },
          yaxis: { title: "Latitude" },
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
        }}
        style={{ width: "100%", height: "70vh" }}
      />
    </div>
  );
}
