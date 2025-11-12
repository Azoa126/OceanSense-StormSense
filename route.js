// app/api/neritic/route.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ reply: "⚠️ Please ask a valid question." }),
        { status: 400 }
      );
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Neritic, an AI assistant focused on coastal oceanography, marine biology, and weather science. Provide concise, factual, and engaging answers.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "❌ Sorry, I couldn’t process that.";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Neritic API Error:", error);
    return new Response(
      JSON.stringify({
        reply:
          "🚧 Neritic is experiencing technical issues. Please try again later.",
      }),
      { status: 500 }
    );
  }
}
