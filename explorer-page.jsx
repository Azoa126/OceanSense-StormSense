'use client';

import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import Plot from 'react-plotly.js';
import { motion } from 'framer-motion';
import { FaThermometerHalf, FaTint, FaLeaf, FaMapMarkerAlt } from 'react-icons/fa';
import Neritic_v3 from '../../components/Neritic_v3';

/**
 * Explorer Page (Enhanced Plotly)
 * - Combined OceanSense + StormSense + OBIS layer
 * - Filters: Region & Species group
 * - CSV download of species occurrences + region parameters
 */

const REGION_COORDS = {
  'Indian Coast (default)': { lat: 15, lon: 80 },
  'Arabian Sea': { lat: 15, lon: 68 },
  'Bay of Bengal': { lat: 15, lon: 87 },
  'Lakshadweep': { lat: 10.5, lon: 73 },
  'Andaman Sea': { lat: 12, lon: 94 },
  'Gulf of Mannar': { lat: 9, lon: 79 },
};

const SPECIES_GROUPS = ['All', 'Actinopterygii', 'Mollusca', 'Crustacea', 'Cnidaria', 'Echinodermata'];

export default function ExplorerPage() {
  const [region, setRegion] = useState('Indian Coast (default)');
  const [speciesGroup, setSpeciesGroup] = useState('All');

  const [params, setParams] = useState({ sst: 'N/A', chl: 'N/A', salinity: 'N/A' });
  const [speciesData, setSpeciesData] = useState([]);
  const [cyclones, setCyclones] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const regionCenter = useMemo(() => REGION_COORDS[region] ?? REGION_COORDS['Indian Coast (default)'], [region]);

  // Fetch ocean params for the region (your API route)
  const fetchOceanParams = async (lat, lon) => {
    try {
      setError(null);
      const res = await fetch(`/api/ocean-parameters?lat=${lat}&lon=${lon}`);
      const json = await res.json();
      if (json?.error) throw new Error(json.error || 'No ocean data');
      setParams({
        sst: json.sst ?? 'N/A',
        chl: json.chl ?? 'N/A',
        salinity: json.salinity ?? 'N/A',
      });
    } catch (err) {
      console.error('ocean params error', err);
      setError('Unable to fetch ocean parameters.');
      setParams({ sst: 'N/A', chl: 'N/A', salinity: 'N/A' });
    }
  };

  // Fetch IMD cyclone data (active)
  const fetchCyclones = async () => {
    try {
      const url = process.env.NEXT_PUBLIC_IMD_API || 'https://mausam.imd.gov.in/backend/imd_api/cyclone_info/active';
      const res = await fetch(url);
      const json = await res.json();
      setCyclones(json?.data || []);
    } catch (err) {
      console.error('cyclone fetch error', err);
      // non-fatal; keep UI
    }
  };

  // Fetch OBIS occurrences for a point (region center)
  const fetchSpecies = async (lat, lon, group = 'All') => {
    try {
      const base = process.env.NEXT_PUBLIC_OBIS_API || 'https://api.obis.org/v3/occurrence';
      const groupFilter = group !== 'All' ? `&taxon_class=${encodeURIComponent(group)}` : '';
      const url = `${base}?geometry=POINT(${lon}%20${lat})${groupFilter}&size=300`;
      const res = await fetch(url);
      const json = await res.json();
      setSpeciesData(json?.results || []);
    } catch (err) {
      console.error('OBIS fetch error', err);
      setSpeciesData([]);
    }
  };

  // Combined refresh for region or filter updates
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const { lat, lon } = regionCenter;

    Promise.allSettled([
      fetchOceanParams(lat, lon),
      fetchCyclones(),
      fetchSpecies(lat, lon, speciesGroup),
    ]).finally(() => {
      if (mounted) setLoading(false);
    });

    // refresh cyclones every hour
    const interval = setInterval(fetchCyclones, 3600 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [region, speciesGroup, regionCenter]);

  // Prepare Plotly traces
  const speciesTrace = {
    x: speciesData.map((d) => d.decimalLongitude).filter(Boolean),
    y: speciesData.map((d) => d.decimalLatitude).filter(Boolean),
    mode: 'markers',
    type: 'scatter',
    name: 'Species occurrences',
    marker: {
      size: 6,
      color: speciesData.map((_, i) => `rgba(0, ${180 + (i % 60)}, ${220 - (i % 60)}, 0.85)`),
      line: { width: 0.5, color: '#0ff' },
    },
    text: speciesData.map((d) => `${d.scientificName || d.species || 'Unknown'}<br>${d.eventDate || d.year || ''}`),
    hoverinfo: 'text',
  };

  // Cyclone traces: lines + markers
  const cycloneLineTraces = cyclones.flatMap((c) => {
    const lats = c.track.map((p) => p.lat);
    const lons = c.track.map((p) => p.lon);
    return [
      {
        x: lons,
        y: lats,
        mode: 'lines',
        type: 'scatter',
        name: `${c.name} (path)`,
        line: { color: 'orange', width: 2 },
        hoverinfo: 'none',
      },
      {
        x: c.track.map((p) => p.lon),
        y: c.track.map((p) => p.lat),
        mode: 'markers',
        type: 'scatter',
        name: `${c.name} (points)`,
        marker: { size: 8, color: 'rgba(255,140,0,0.9)', symbol: 'triangle-up' },
        text: c.track.map((p) => `${c.name}<br>${p.datetime || ''}<br>Wind: ${p.wind_speed || ''} kn`),
        hoverinfo: 'text',
      },
    ];
  });

  // Layout: dark marine theme, clean legend, responsive
  const layout = {
    title: `${region} — Cyclones & Species Distribution`,
    autosize: true,
    showlegend: true,
    legend: { orientation: 'h', x: 0.02, y: 1.02, font: { color: '#ddd' } },
    paper_bgcolor: 'rgba(2,8,23,0.95)',
    plot_bgcolor: 'rgba(3,18,40,0.85)',
    font: { color: '#ddd' },
    xaxis: {
      title: 'Longitude',
      gridcolor: '#133048',
      zerolinecolor: '#133048',
    },
    yaxis: {
      title: 'Latitude',
      gridcolor: '#133048',
      zerolinecolor: '#133048',
    },
    margin: { t: 60, l: 60, r: 20, b: 60 },
  };

  const plotData = [speciesTrace, ...cycloneLineTraces];

  // CSV builder (simple)
  const downloadCSV = () => {
    if (!speciesData || speciesData.length === 0) {
      alert('No species data to export for the selected region/filters.');
      return;
    }
    const header = ['species', 'scientificName', 'decimalLatitude', 'decimalLongitude', 'eventDate', 'datasetName'];
    const rows = speciesData.map((d) => [
      (d.species || '').replace(/,/g, ' '),
      (d.scientificName || '').replace(/,/g, ' '),
      d.decimalLatitude ?? '',
      d.decimalLongitude ?? '',
      d.eventDate ?? '',
      d.datasetName ?? '',
    ]);
    // Append a parameter summary row at the end
    rows.push(['', '', '', '', '', '']);
    rows.push(['Region', region, '', '', '']);
    rows.push(['SST', params.sst, '', '', '']);
    rows.push(['Chlorophyll', params.chl, '', '', '']);
    rows.push(['Salinity', params.salinity, '', '', '']);
    const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `species_${region.replace(/\s+/g, '_')}_${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head>
        <title>OceanSense x StormSense Explorer</title>
        <meta name="description" content="Real-time explorer combining fisheries, cyclone tracks and ocean health parameters along the Indian coast." />
      </Head>

      <div className="min-h-screen p-6" style={{ background: 'linear-gradient(180deg,#021226 0%, #01263b 60%, #00344a 100%)' }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="text-3xl font-bold text-cyan-300">🌊 OceanSense × StormSense Explorer</h1>
          <p className="text-gray-300 mt-2">Interactive map of species occurrences, cyclones and live ocean parameters.</p>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-800 text-cyan-200 border border-cyan-700">
            {Object.keys(REGION_COORDS).map((r) => <option key={r}>{r}</option>)}
          </select>

          <select value={speciesGroup} onChange={(e) => setSpeciesGroup(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-800 text-green-200 border border-green-700">
            {SPECIES_GROUPS.map((g) => <option key={g}>{g}</option>)}
          </select>

          <button onClick={downloadCSV} className="ml-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white shadow">
            📥 Download CSV
          </button>
        </div>

        {/* Parameter cards */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SmallCard icon={<FaThermometerHalf className="text-cyan-400" />} title="Sea Surface Temp" value={`${params.sst}`} unit="°C" />
          <SmallCard icon={<FaLeaf className="text-green-400" />} title="Chlorophyll-a" value={`${params.chl}`} unit="mg/m³" />
          <SmallCard icon={<FaTint className="text-blue-400" />} title="Salinity" value={`${params.salinity}`} unit="PSU" />
        </div>

        {/* Map */}
        <div className="max-w-7xl mx-auto bg-transparent rounded-xl p-2" style={{ minHeight: '70vh' }}>
          {loading ? (
            <div className="flex items-center justify-center h-80 text-cyan-300">Loading live data...</div>
          ) : (
            <Plot
              data={plotData}
              layout={{
                ...layout,
                // center the view on the region:
                xaxis: { ...layout.xaxis, range: [regionCenter.lon - 20, regionCenter.lon + 20] },
                yaxis: { ...layout.yaxis, range: [regionCenter.lat - 12, regionCenter.lat + 12] },
              }}
              style={{ width: '100%', height: '70vh' }}
              config={{ responsive: true, displayModeBar: true }}
            />
          )}
        </div>

        {/* Neritic assistant */}
        <div className="fixed bottom-6 right-6 z-50">
          <Neritic_v3 />
        </div>

        {/* Error */}
        {error && <div className="text-center mt-4 text-red-400">{error}</div>}
      </div>
    </>
  );
}

// Small parameter card
function SmallCard({ icon, title, value, unit }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="bg-gray-900/60 border border-cyan-700 rounded-2xl p-4 flex items-center gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-sm text-gray-400">{title}</div>
        <div className="text-xl font-semibold text-white">{value} {unit}</div>
      </div>
    </motion.div>
  );
}
