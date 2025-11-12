"use client";

import { useState } from "react";

export default function Neritic_v2() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hello! I'm Neritic — your coastal ocean AI assistant." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/neritic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "⚠️ No response received." },
      ]);
    } catch (err) {
      console.error("Neritic API error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Sorry, I’m having trouble connecting right now." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-slate-900/90 text-white rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden border border-cyan-600">
      <div className="bg-cyan-600/20 px-4 py-3 font-semibold text-cyan-300">
        🌊 Neritic Assistant
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm max-h-64">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg ${
              msg.role === "assistant"
                ? "bg-slate-800 text-cyan-200"
                : "bg-cyan-600/30 text-white self-end"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && <p className="text-cyan-400 italic">Analyzing data...</p>}
      </div>

      <div className="flex border-t border-slate-700">
        <input
          className="flex-1 bg-transparent text-white p-2 text-sm focus:outline-none"
          placeholder="Ask Neritic..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-cyan-600 px-4 text-white font-semibold hover:bg-cyan-500 transition"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
