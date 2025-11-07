import Link from 'next/link'

export default function Home() {
  return (
    <section className="main-container p-8 text-white bg-slate-900 min-h-screen">
      <div className="card p-8 mb-6 bg-slate-800 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold text-sky-400">Ocean Sense</h1>
        <p className="mt-3 text-sky-200 text-lg max-w-3xl">
          Connecting ocean, atmosphere, and life —{" "}
          <span className="font-semibold text-sky-300">Ocean Sense</span> and{" "}
          <span className="font-semibold text-amber-400">StormSense</span> provide
          data-driven insight into fisheries and cyclones across the Indian Subcontinent.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/oceansense"
            className="btn"
          >
            Explore Fisheries
          </Link>

          <Link
            href="/stormsense"
            className="px-4 py-2 bg-amber-400 text-black hover:bg-amber-500 transition rounded font-medium"
          >
            Open StormSense
          </Link>

          <Link
            href="/explorer"
            className="px-4 py-2 border border-sky-300 hover:bg-sky-300 hover:text-black transition rounded font-medium"
          >
            Interactive Explorer
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 bg-slate-800 rounded-2xl shadow-lg">
          <h3 className="font-bold text-xl text-sky-400">Latest Insights</h3>
          <p className="mt-2 text-sky-200">
            Dynamic visualizations combining cyclone trends with fisheries responses, offering a holistic view of the Indian Ocean’s changing systems.
          </p>
        </div>

        <div className="card p-6 bg-slate-800 rounded-2xl shadow-lg">
          <h3 className="font-bold text-xl text-sky-400">Data Sources</h3>
          <ul className="mt-2 text-sky-200 list-disc list-inside">
            <li>IMD / IBTrACS — Cyclone Data</li>
            <li>OBIS / CMFRI — Fisheries Data</li>
            <li>NOAA / NASA — Climate Inputs</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
