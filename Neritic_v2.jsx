'use client';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaRobot, FaThermometerHalf, FaTint, FaLeaf } from "react-icons/fa";
import ReactMarkdown from "react-markdown";

export default function Neritic_v2() {
  const [messages, setMessages] = useState([
    { role: "neritic", content: "Hello! I'm Neritic 🌊 — your live ocean intelligence assistant. Ask me about fish species, cyclones, or ocean conditions like SST, chlorophyll, or salinity!" }
  ]);
  const [input, setInput] = useState("");
  const [cyclones, setCyclones] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔄 Fetch live cyclone data on load
  useEffect(() => {
    const fetchCyclones = async () => {
      try {
        const res = await fetch("https://mausam.imd.gov.in/backend/imd_api/cyclone_info/active");
        const data = await res.json();
        setCyclones(data?.data || []);
      } catch (err) {
        console.error("Cyclone API error:", err);
      }
    };
    fetchCyclones();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    let reply = "";

    try {
      // 🌀 Cyclone info
      if (input.toLowerCase().includes("cyclone")) {
        if (cyclones.length > 0) {
          const active = cyclones[0];
          reply = `🌪️ **Active Cyclone:** ${active.name}\n\n📍 Location: ${active.lat}°N, ${active.lon}°E\n💨 Wind Speed: ${active.wind_speed} knots\n🔽 Pressure: ${active.pressure} hPa`;
        } else {
          reply = "There are no active cyclones right now near the Indian subcontinent.";
        }
      }

      // 🐟 Fish data
      else if (input.toLowerCase().includes("fish") || input.toLowerCase().includes("species")) {
        const res = await fetch(`https://api.obis.org/v3/occurrence?scientificname=Rastrelliger%20kanagurta&limit=3`);
        const data = await res.json();
        const count = data?.results?.length || 0;
        reply = `🐟 The **Indian Mackerel (_Rastrelliger kanagurta_)** currently has about **${count} recent records** in the OBIS database.\nIt's a vital pelagic fish, important for coastal communities and diets.`;
      }

      // 🌡️ Ocean parameters
      else if (input.toLowerCase().includes("sst") || input.toLowerCase().includes("temperature") ||
               input.toLowerCase().includes("salinity") || input.toLowerCase().includes("chlorophyll")) {
        const coords = { lat: 9.9, lon: 76.3 }; // Default: Kochi, can be dynamic later
        const res = await fetch(`/api/ocean-parameters?lat=${coords.lat}&lon=${coords.lon}`);
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        const { sst, chl, salinity } = data;
        reply = `🌡️ **Sea Surface Temperature (SST):** ${sst}°C\n🌿 **Chlorophyll-a:** ${chl} mg/m³\n🧂 **Salinity:** ${salinity} PSU\n\nThese parameters together indicate ${sst > 28 ? "warmer, stratified waters" : "cool, nutrient-rich conditions"} — ${chl > 0.3 ? "supporting higher productivity and fish abundance" : "with relatively lower primary productivity"}.`;
      }

      // 🌊 Interactions
      else if (input.toLowerCase().includes("interaction") || input.toLowerCase().includes("effect")) {
        reply = `🌊 Cyclones can disrupt fisheries by stirring sediments and reducing coastal salinity.\nBut post-cyclone nutrient upwelling often boosts phytoplankton growth — leading to short-term increases in fish productivity.`;
      }

      // Default fallback
      else {
        reply = "I'm still learning 🌍 — try asking about 'active cyclone', 'Indian Mackerel', or 'chlorophyll near Kochi'.";
      }
    } catch (err) {
      console.error(err);
      reply = "⚠️ There was an error fetching live ocean data. Please try again later.";
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "neritic", content: reply }]);
      setLoading(false);
    }, 1000);

    setInput("");
  };

  return (
    <motion.div
      className="fixed bottom-6 right-6 bg-gray-900/90 backdrop-blur-lg p-4 rounded-2xl shadow-xl w-80 border border-cyan-700"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-3 text-cyan-400">
        <FaRobot /> <h2 className="font-semibold text-lg">Neritic Chatbot</h2>
      </div>

      <div className="h-64 overflow-y-auto mb-3 bg-gray-800/70 p-2 rounded-lg">
        {messages.map((msg, i) => (
          <div key={i} className={`my-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
            <span
              className={`inline-block px-3 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-700 text-cyan-200"
              }`}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </span>
          </div>
        ))}
        {loading && <p className="text-gray-400 italic">Neritic is thinking...</p>}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          className="flex-1 rounded-lg bg-gray-700 text-white p-2 outline-none"
          placeholder="Ask about fish, SST, or cyclones..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="bg-cyan-600 px-3 py-2 rounded-lg hover:bg-cyan-500 transition"
        >
          Send
        </button>
      </form>
    </motion.div>
  );
}

