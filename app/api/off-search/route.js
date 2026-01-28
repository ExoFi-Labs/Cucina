import { NextResponse } from "next/server";

const USER_AGENT = "CucinaDietApp/0.1 (youremail@example.com)";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 },
    );
  }

  const url = new URL("https://world.openfoodfacts.org/api/v2/search");
  url.searchParams.set("search_text", query);
  url.searchParams.set("page_size", "20");
  url.searchParams.set(
    "fields",
    [
      "code",
      "product_name",
      "brands",
      "nutriments",
      "image_small_url",
      "categories",
    ].join(","),
  );

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": USER_AGENT,
    },
    // Keep this server-side; no caching for now while developing
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to query Open Food Facts" },
      { status: 502 },
    );
  }

  const data = await res.json();

  const items =
    data.products?.map((p) => ({
      code: p.code,
      name: p.product_name || "Unnamed product",
      brand: p.brands || "",
      image: p.image_small_url || null,
      caloriesPer100g: p.nutriments?.["energy-kcal_100g"] ?? null,
      proteinPer100g: p.nutriments?.["proteins_100g"] ?? null,
      carbsPer100g: p.nutriments?.["carbohydrates_100g"] ?? null,
      fatPer100g: p.nutriments?.["fat_100g"] ?? null,
      categories: p.categories || "",
    })) ?? [];

  return NextResponse.json({ count: items.length, items });
}

