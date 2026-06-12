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
      { error: "You must be signed in to generate the itinerary." },
      { status: 401 }
    );
  }

  try {
    const { tripId } = await params;

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
    
    // Check if already AI generated
    if (currentItinerary.aiGenerated) {
      return NextResponse.json(
        { success: true, trip, alreadyGenerated: true },
        { status: 200 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 }
      );
    }

    const systemInstruction = `You are an expert travel planner. Your task is to plan a detailed ${trip.days}-day trip to ${trip.destination} for ${trip.travelers} travelers.
The travel style is "${trip.travelStyle}" and the total budget is ${trip.budget} INR.
Provide a specific, creative, and localized plan for every single day.
Ensure each day lists 3 highly specific local activities, 1 specific best place to visit on that day, and 1 specific local food to try on that day.`;

    const userPrompt = `Generate a daily itinerary for all ${trip.days} days of the trip to ${trip.destination}.
Ensure each day has:
1. A descriptive title (e.g., "Day 1: Exploring Lake Pichola & Palaces")
2. Exactly 3 activities (detailed, creative, specific to local landmarks and sights)
3. The best place/attraction to visit on that day
4. The best local food/dish/cuisine to try on that day

Return the response as a JSON object matching this schema:
{
  "days": [
    {
      "day": 1,
      "title": "Day 1 Title",
      "activities": [
        { "text": "Activity 1", "completed": false },
        { "text": "Activity 2", "completed": false },
        { "text": "Activity 3", "completed": false }
      ],
      "bestPlace": "Name of best place to visit",
      "bestFood": "Name of best local food to try"
    },
    ...
  ]
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
            description: "Suggested itinerary for all days",
            properties: {
              days: {
                type: "ARRAY",
                description: `Itinerary details for each of the ${trip.days} days`,
                items: {
                  type: "OBJECT",
                  properties: {
                    day: {
                      type: "INTEGER",
                      description: "The day number (1-indexed)"
                    },
                    title: {
                      type: "STRING",
                      description: "Descriptive title for this day"
                    },
                    activities: {
                      type: "ARRAY",
                      description: "List of exactly 3 travel activities",
                      items: {
                        type: "OBJECT",
                        properties: {
                          text: {
                            type: "STRING",
                            description: "A descriptive activity recommendation (creative, specific, detailed, mentioning specific local landmarks)"
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
                  required: ["day", "title", "activities", "bestPlace", "bestFood"]
                }
              }
            },
            required: ["days"]
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

    let rawDays = parsedResponse.days;
    if (!Array.isArray(rawDays)) {
      throw new Error("Invalid days array in Gemini response");
    }

    // Map and sanitize the generated days
    const formattedDays = Array.from({ length: trip.days }, (_, i) => {
      const dayNum = i + 1;
      const genDay = rawDays.find((d: any) => d.day === dayNum) || {};
      
      let activities = genDay.activities || [];
      if (!Array.isArray(activities)) {
        activities = [];
      }
      
      const formattedActivities = activities.slice(0, 3).map((act: any) => ({
        text: String(act.text || "Explore the local area").trim(),
        completed: false
      }));

      while (formattedActivities.length < 3) {
        formattedActivities.push({
          text: "Discover more of the local culture and landmarks",
          completed: false
        });
      }

      const defaultTitle = dayNum === 1 
        ? `Day 1: ${currentItinerary.startLocation || "Start"} to ${trip.destination}`
        : `Day ${dayNum} in ${trip.destination}`;

      return {
        day: dayNum,
        title: String(genDay.title || defaultTitle).trim(),
        activities: formattedActivities,
        bestPlace: String(genDay.bestPlace || `Sights around ${trip.destination}`).trim(),
        bestFood: String(genDay.bestFood || "Traditional local specialties").trim(),
        estimatedCost: currentItinerary.dailyBudget || Math.floor(trip.budget / trip.days)
      };
    });

    const updatedItinerary = {
      ...currentItinerary,
      days: formattedDays,
      aiGenerated: true
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
    console.error("Error generating full AI itinerary:", error);
    return NextResponse.json(
      { error: "Failed to generate AI itinerary. Please try again." },
      { status: 500 }
    );
  }
}
