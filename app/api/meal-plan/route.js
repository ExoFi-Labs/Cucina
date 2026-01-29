import { NextResponse } from "next/server";
import { getAccessToken } from "../../../lib/gcpAuth";

const endpoint = process.env.LLAMA_ENDPOINT || "us-east5-aiplatform.googleapis.com";
const region = process.env.LLAMA_REGION || "us-east5";
const projectId = process.env.LLAMA_PROJECT_ID || "burnished-ray-380807";
const model =
  process.env.LLAMA_MODEL || "meta/llama-4-maverick-17b-128e-instruct-maas";

export async function POST(req) {
  let accessToken;
  try {
    accessToken = await getAccessToken();
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Auth configuration error – see server logs." },
      { status: 500 },
    );
  }

  const body = await req.json();
  const profile = body.profile || null;
  const todayItems = Array.isArray(body.todayItems) ? body.todayItems : [];

  if (!profile) {
    return NextResponse.json(
      { error: "Profile is required to generate a meal plan." },
      { status: 400 },
    );
  }

  const url = `https://${endpoint}/v1/projects/${projectId}/locations/${region}/endpoints/openapi/chat/completions`;

  const systemPrompt = `
You are a calm, practical nutrition coach.
Create simple daily meal ideas that align with the user's profile.

Return STRICT JSON only, no extra text, in this shape:

{
  "meals": [
    {
      "label": "Breakfast" | "Lunch" | "Dinner" | "Snack",
      "name": "short meal name",
      "description": "1–2 friendly sentences about the meal",
      "approxCalories": number | null,
      "notes": "short note on why it fits the profile"
    }
  ]
}

Rules:
- ALWAYS return exactly 4 meals: one Breakfast, one Lunch, one Dinner, and one Snack.
- Use the profile's goal, diet style, target calories, cooking time preference, and meal prep preference to guide choices.
- Respect any foods to avoid if present (dislikes).
- If cookingTime is "quick", suggest meals that take 15–20 minutes max.
- If mealPrep is "often", include at least one meal that can be batch-cooked.
- If todayItems are provided, try to balance the remaining meals so the day
  roughly lands near the target calories instead of repeating the same macros.
- Prefer simple, realistic meals over elaborate recipes.
- Each meal's approxCalories should roughly add up to the target calories when combined.
`;

  const payload = {
    model,
    stream: false,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "system",
        content: `User profile JSON:\n${JSON.stringify(profile)}`,
      },
      todayItems.length
        ? {
            role: "system",
            content: `Foods already eaten today (approx):\n${JSON.stringify(todayItems)}`,
          }
        : null,
      {
        role: "user",
        content:
          "Propose exactly 4 meals for today: one Breakfast, one Lunch, one Dinner, and one Snack. Make sure they align with the profile's cooking time and meal prep preferences.",
      },
    ].filter(Boolean),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Llama meal-plan API error", res.status, text);
    return NextResponse.json(
      { error: "Llama 4 meal-plan request failed" },
      { status: 502 },
    );
  }

  const data = await res.json();

  const content =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.message ??
    "";

  let parsed;
  try {
    parsed = typeof content === "string" ? JSON.parse(content) : content;
  } catch (e) {
    console.error("Failed to parse meal-plan JSON", e, content);
    return NextResponse.json(
      { error: "Model did not return valid JSON" },
      { status: 500 },
    );
  }

  const meals = Array.isArray(parsed.meals) ? parsed.meals : [];

  return NextResponse.json({ meals });
}

