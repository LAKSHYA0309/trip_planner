import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";

export async function GET(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to access autocomplete." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() || "";

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured." },
      { status: 500 }
    );
  }

  try {
    const prompt = `Provide a list of up to 6 real Indian cities, towns, major travel destinations, or tourist spots that match, start with, or are relevant to the autocomplete query: "${query}". Format each result as "CityName, StateName" (e.g. "Mumbai, Maharashtra", "Jaipur, Rajasthan"). Keep the results accurate and strictly located in India. Return a JSON array of strings.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            description: "List of autocompleted Indian city names with their states",
            items: {
              type: "STRING"
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (textResult) {
      const parsed = JSON.parse(textResult);
      if (Array.isArray(parsed)) {
        return NextResponse.json(parsed);
      }
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Autocomplete API error:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
