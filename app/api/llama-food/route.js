import { NextResponse } from "next/server";

const endpoint = process.env.LLAMA_ENDPOINT || "us-east5-aiplatform.googleapis.com";
const region = process.env.LLAMA_REGION || "us-east5";
const projectId = process.env.LLAMA_PROJECT_ID || "burnished-ray-380807";
const model =
  process.env.LLAMA_MODEL || "meta/llama-4-maverick-17b-128e-instruct-maas";

// For local development, you can set GCP_ACCESS_TOKEN in .env.local
// using: GCP_ACCESS_TOKEN=$(gcloud auth print-access-token)
const accessToken = process.env.GCP_ACCESS_TOKEN;

export async function POST(req) {
  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          "Missing GCP_ACCESS_TOKEN env var. Run `gcloud auth print-access-token` and paste it into .env.local as GCP_ACCESS_TOKEN for local testing.",
      },
      { status: 500 },
    );
  }

  const body = await req.json();
  const query = (body.query || "").trim();
  const profile = body.profile || null;

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const url = `https://${endpoint}/v1/projects/${projectId}/locations/${region}/endpoints/openapi/chat/completions`;

  const systemPrompt = `
You are a nutrition assistant. The user will describe foods they ate or want to eat.
You may also be given a brief profile describing their goal, eating style and daily target calories.
Use the profile only as background context, not as something to restate.

Return STRICT JSON only, no extra text, in this shape:

{
  "items": [
    {
      "name": "string",
      "approxCaloriesPer100g": number | null,
      "approxProteinPer100g": number | null,
      "approxCarbsPer100g": number | null,
      "approxFatPer100g": number | null,
      "notes": "short clarification or assumption"
    }
  ]
}

Rules:
- Always respond with valid JSON that can be parsed directly.
- If you are unsure about any nutrient, set its field to null instead of guessing.
- If the user mentions a single mixed meal (e.g. "2 eggs and toast with butter"),
  you may return multiple items (e.g. "eggs", "toast with butter").
`;

  const payload = {
    model,
    stream: false,
    messages: [
      { role: "system", content: systemPrompt },
      profile
        ? {
            role: "system",
            content: `User profile JSON:\n${JSON.stringify(profile)}`,
          }
        : null,
      { role: "user", content: query },
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
    console.error("Llama API error", res.status, text);
    return NextResponse.json(
      { error: "Llama 4 API request failed" },
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
    console.error("Failed to parse model JSON", e, content);
    return NextResponse.json(
      { error: "Model did not return valid JSON" },
      { status: 500 },
    );
  }

  const items = Array.isArray(parsed.items) ? parsed.items : [];

  return NextResponse.json({ items });
}

