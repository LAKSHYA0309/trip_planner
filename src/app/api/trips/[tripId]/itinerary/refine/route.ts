import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to refine your itinerary." },
      { status: 401 }
    );
  }

  try {
    const { tripId } = await params;
    const body = await request.json();
    const { dayNumber, prompt } = body as { dayNumber: number; prompt: string };

    if (!dayNumber || !prompt?.trim()) {
      return NextResponse.json(
        { error: "Day number and refinement prompt are required." },
        { status: 400 }
      );
    }

    // Verify ownership
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: user.id,
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found or unauthorized." },
        { status: 404 }
      );
    }

    const currentItinerary = (trip.itinerary || {}) as Record<string, any>;
    const days = currentItinerary.days ? [...currentItinerary.days] : [];
    const targetDayIndex = days.findIndex((d: any) => d.day === dayNumber);

    if (targetDayIndex === -1) {
      return NextResponse.json(
        { error: "Selected day not found in itinerary." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 }
      );
    }

    const currentActivities = days[targetDayIndex].activities || [];
    const currentActivitiesText = currentActivities
      .map((a: any) => typeof a === "string" ? a : a.text)
      .join("\n");

    const systemInstruction = `You are an expert travel planner. Your task is to plan Day ${dayNumber} of a trip to ${trip.destination}.
The user has requested the following change or refinement: "${prompt}".
Please tailor the plan to fit their request. Make recommendations specific, creative, and detailed, including names of specific local highlights or monuments and traditional foods where appropriate.`;

    const userPrompt = `Based on the user request, suggest:
1. Exactly 3 activities for Day ${dayNumber} of the trip to ${trip.destination}.
2. The single best place/attraction to visit on this day.
3. The single best food/dish/cuisine to try on this day.

Context of current activities for this day (to build on, refine, or replace based on the prompt):
${currentActivitiesText}

Return the response as a JSON object of this structure:
{
  "activities": [
    { "text": "Activity 1", "completed": false },
    { "text": "Activity 2", "completed": false },
    { "text": "Activity 3", "completed": false }
  ],
  "bestPlace": "The best place to visit",
  "bestFood": "The best food/cuisine to try"
}`;

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
                text: `${systemInstruction}\n\n${userPrompt}`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            description: "Suggested itinerary items for this day",
            properties: {
              activities: {
                type: "ARRAY",
                description: "List of exactly 3 travel activities",
                items: {
                  type: "OBJECT",
                  properties: {
                    text: {
                      type: "STRING",
                      description: "A descriptive activity recommendation (creative, specific, detailed, mentioning specific local landmarks where appropriate)"
                    },
                    completed: {
                      type: "BOOLEAN",
                      description: "Must be false"
                    }
                  },
                  required: ["text", "completed"]
                }
              },
              bestPlace: {
                type: "STRING",
                description: "The name and brief detail of the single best place/attraction to visit on this day"
              },
              bestFood: {
                type: "STRING",
                description: "The name and brief detail of the single best local food/dish/cuisine to try on this day"
              }
            },
            required: ["activities", "bestPlace", "bestFood"]
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Gemini API error: ${response.statusText || response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      console.error("Empty response from Gemini API:", JSON.stringify(data));
      return NextResponse.json(
        { error: "Received empty response from the AI model." },
        { status: 502 }
      );
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", responseText, parseError);
      return NextResponse.json(
        { error: "AI response failed to parse as valid JSON." },
        { status: 502 }
      );
    }

    let newActivities = parsedResponse.activities;
    if (!Array.isArray(newActivities)) {
      newActivities = [];
    }

    // Standardize structure to ensure text and completed properties
    newActivities = newActivities.slice(0, 3).map((act: any) => ({
      text: String(act.text || "Explore the local area").trim(),
      completed: false
    }));

    // Ensure we have exactly 3
    while (newActivities.length < 3) {
      newActivities.push({
        text: "Discover more of the local culture and landmarks",
        completed: false
      });
    }

    const currentDay = days[targetDayIndex];

    // Replace activities on target day
    days[targetDayIndex] = {
      ...currentDay,
      activities: newActivities,
      bestPlace: String(parsedResponse.bestPlace || currentDay.bestPlace || `Sights around ${trip.destination}`).trim(),
      bestFood: String(parsedResponse.bestFood || currentDay.bestFood || "Traditional local specialties").trim(),
    };

    const updatedItinerary = {
      ...currentItinerary,
      days,
    };

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        itinerary: updatedItinerary,
      },
    });

    return NextResponse.json(
      { success: true, trip: updatedTrip },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error refining itinerary:", error);
    return NextResponse.json(
      { error: "Failed to refine itinerary. Please try again." },
      { status: 500 }
    );
  }
}
