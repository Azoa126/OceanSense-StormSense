// src/app/api/neritic/route.js
import OpenAI from "openai";
import { NextResponse } from "next/server";

// Create a new OpenAI client using your API key from .env.local
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { message, context } = await req.json();

    // Context helps Neritic know which module it's assisting in (OceanSense or StormSense)
    const systemPrompt = `
You are Neritic v3 — an AI assistant integrated within Ocean-Sense, a platform that visualizes the intersection of marine fisheries and tropical cyclones across the Indian Ocean.
Your mission:
- Provide **accurate, credible, and referenced** information.
- Focus on data, analysis, and conservation — avoid speculation.
- When unsure, state your uncertainty.
- Source information from **peer-reviewed, recognized, and official repositories** (NOAA, IMD, CMFRI, FAO, etc.), never Wikipedia.
- Occasionally ask the user for feedback or suggestions to improve the platform.

The current section is: ${context}.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.6,
      max_tokens: 300,
    });

    const reply = completion.choices[0].message.content.trim();
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Neritic API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
