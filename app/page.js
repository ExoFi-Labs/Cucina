"use client";

import styles from "./page.module.css";
import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadProfile } from "../lib/profileStorage";

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [todayItems, setTodayItems] = useState([]);
  const [meals, setMeals] = useState([]);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [mealsError, setMealsError] = useState("");

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.push("/survey");
      return;
    }
    setProfile(p);
  }, [router]);

  useEffect(() => {
    // Auto-load meal suggestions when profile becomes available
    if (profile) {
      refreshMeals();
    }
  }, [profile]);

  async function refreshMeals() {
    if (!profile) return;
    setMealsLoading(true);
    setMealsError("");
    try {
      const res = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, todayItems }),
      });
      if (!res.ok) throw new Error("Failed to fetch meals");
      const data = await res.json();
      setMeals(data.meals ?? []);
    } catch (e) {
      console.error(e);
      setMealsError("Could not load suggestions right now.");
    } finally {
      setMealsLoading(false);
    }
  }

  const totals = todayItems.reduce(
    (acc, item) => {
      if (typeof item.approxCaloriesPer100g === "number") {
        acc.kcal += item.approxCaloriesPer100g;
      }
      if (typeof item.approxProteinPer100g === "number") {
        acc.protein += item.approxProteinPer100g;
      }
      if (typeof item.approxCarbsPer100g === "number") {
        acc.carbs += item.approxCarbsPer100g;
      }
      if (typeof item.approxFatPer100g === "number") {
        acc.fat += item.approxFatPer100g;
      }
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  function handleAddToToday(item) {
    setTodayItems((prev) => [...prev, item]);
  }

  useEffect(() => {
    // Refresh meals when todayItems change (after a short delay to batch updates)
    if (profile && todayItems.length > 0) {
      const timer = setTimeout(() => {
        refreshMeals();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [todayItems.length]);

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <header className={styles.headerRow}>
          <div className={styles.brand}>
            <div className={styles.logoDot}>C</div>
            <div className={styles.brandText}>
              <h1>Cucina</h1>
              <p>Meal planning that actually fits your life.</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className={styles.tagline}>
              <span className={styles.pillDot} />
              Smart companion, not just a food log.
            </div>
            {profile && (
              <a
                href="/settings"
                className={styles.searchButton}
                style={{ paddingInline: 14, height: 32, fontSize: 13 }}
              >
                Settings
              </a>
            )}
          </div>
        </header>

        <section className={styles.contentRow}>
          <div className={styles.heroCopy}>
            <h2 className={styles.heroTitle}>
              Find foods, track your day,
              <br />
              and get clear, practical guidance.
            </h2>
            <p className={styles.heroSubtitle}>
              Start by searching for something you ate today. We&apos;ll turn
              that into estimated calories and macros you can build on.
            </p>
            {profile && (
              <p className={styles.heroSubtitle}>
                Today&apos;s focus:{" "}
                <strong>
                  ~{profile.targetCalories} kcal
                </strong>{" "}
                for{" "}
                <strong>
                  {profile.goal} / {profile.diet}
                </strong>
                .
              </p>
            )}
            <div className={styles.chips}>
              <span className={`${styles.chip} ${styles.chipAccent}`}>
                Fresh green, science‑backed
              </span>
              <span className={styles.chip}>Global food database</span>
              <span className={styles.chip}>Daily guidance coming soon</span>
            </div>

            <Suspense fallback={null}>
              <SearchCard profile={profile} onAddToToday={handleAddToToday} />
            </Suspense>
          </div>

          <div className={styles.rightCol}>
            {!profile && (
              <div className={styles.panel}>
                <h3>Step 1: Your survey</h3>
                <p>
                  Before we can really coach you, we&apos;ll ask a few quick
                  questions about your goals, how you like to eat and your typical
                  day.
                </p>
                <p style={{ marginTop: 8 }}>
                  It&apos;s optional, but it&apos;s what will power personalised
                  calorie targets and recipe suggestions.
                </p>
                <div className={styles.badgeRow} style={{ marginTop: 10 }}>
                  <a href="/survey" className={styles.searchButton}>
                    Fill out the survey
                  </a>
                </div>
              </div>
            )}
            <div className={styles.panel}>
              <h3>What this screen does</h3>
              <p>
                This is your food finder. Type a food, meal or product name and
                we ask Llama 4 to turn it into estimated energy and macros per
                100g.
              </p>
              <ul>
                <li>
                  <span className={styles.panelStrong}>Today</span> – quick
                  lookups and logging.
                </li>
                <li>Next – survey, daily goals and recipe companions.</li>
              </ul>
              <div className={styles.badgeRow}>
                <span className={styles.tinyBadge}>Powered by Llama 4</span>
                <span className={styles.tinyBadge}>Numbers are estimates</span>
              </div>
            </div>
            <TodayPanel
              items={todayItems}
              totals={totals}
              target={profile?.targetCalories}
            />
            <MealSuggestions
              meals={meals}
              loading={mealsLoading}
              error={mealsError}
              onRefresh={refreshMeals}
              hasProfile={!!profile}
            />
            <p className={styles.footnote}>Prototype – tuning the coach as we go.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

function TodayPanel({ items, totals, target }) {
  const remaining =
    typeof target === "number" ? Math.max(target - totals.kcal, 0) : null;

  return (
    <div className={styles.resultsCard}>
      <div className={styles.resultsHeader}>
        <span>Today&apos;s log (100g basis)</span>
        {typeof target === "number" && (
          <span className={styles.resultsBadge}>
            Target ~{Math.round(target)} kcal
          </span>
        )}
      </div>
      <div className={styles.resultBody}>
        <div className={styles.resultMeta}>
          <span className={styles.macroTag}>
            {Math.round(totals.kcal)} kcal logged
          </span>
          <span className={styles.macroTagSoft}>
            {totals.protein.toFixed(1)} g protein
          </span>
          <span className={styles.macroTag}>{totals.carbs.toFixed(1)} g carbs</span>
          <span className={styles.macroTag}>{totals.fat.toFixed(1)} g fat</span>
        </div>
        {typeof remaining === "number" && (
          <p className={styles.statusText}>
            Roughly <strong>{Math.round(remaining)} kcal</strong> left in today&apos;s
            target.
          </p>
        )}
        {items && items.length > 0 && (
          <div
            className={styles.resultsList}
            style={{ marginTop: 10, maxHeight: 220 }}
          >
            {items.map((item, index) => (
              <div key={index} className={styles.resultItem}>
                <div className={styles.resultBody}>
                  <div className={styles.resultTitleRow}>
                    <div>
                      <div className={styles.resultName}>{item.name}</div>
                      {item.notes && (
                        <div className={styles.resultBrand}>{item.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className={styles.resultMeta}>
                    {typeof item.approxCaloriesPer100g === "number" && (
                      <span className={styles.macroTag}>
                        {Math.round(item.approxCaloriesPer100g)} kcal / 100g
                      </span>
                    )}
                    {typeof item.approxProteinPer100g === "number" && (
                      <span
                        className={`${styles.macroTag} ${styles.macroTagSoft}`}
                      >
                        {item.approxProteinPer100g.toFixed(1)} g protein / 100g
                      </span>
                    )}
                    {typeof item.approxCarbsPer100g === "number" && (
                      <span className={styles.macroTag}>
                        {item.approxCarbsPer100g.toFixed(1)} g carbs / 100g
                      </span>
                    )}
                    {typeof item.approxFatPer100g === "number" && (
                      <span className={styles.macroTag}>
                        {item.approxFatPer100g.toFixed(1)} g fat / 100g
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchCard({ profile, onAddToToday }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 2) {
      setError("Type at least 2 characters.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/llama-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), profile: profile || null }),
      });
      if (!res.ok) {
        throw new Error("Search failed");
      }
      const data = await res.json();
      const items = data.items ?? [];
      setResults(items);
    } catch (err) {
      console.error(err);
      setError("Something went wrong talking to Llama 4.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form className={styles.searchCard} onSubmit={handleSearch}>
        <div className={styles.searchHeader}>
          <span>Search the global food database</span>
          <span className={styles.searchBadge}>Text search first</span>
        </div>
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrapper}>
            <div className={styles.searchInputIcon}>⌕</div>
            <input
              className={styles.searchInput}
              placeholder="e.g. greek yogurt, chicken breast, oat milk…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className={styles.searchButton}
            disabled={loading}
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
        {profile && (
          <div className={styles.metaRow}>
            <span>
              Goal: <strong>{profile.goal}</strong>, style:{" "}
              <strong>{profile.diet}</strong>.
            </span>
            <span>
              Approx. target: <strong>{profile.targetCalories} kcal</strong>.
            </span>
          </div>
        )}
        {error && <p className={styles.statusText}>{error}</p>}
      </form>
      <ClientResults results={results} onAddToToday={onAddToToday} />
    </>
  );
}

function ClientResults({ results, onAddToToday }) {
  if (!results || results.length === 0) {
    return (
      <p className={styles.emptyState}>
        No foods loaded yet. Try searching for something you ate today.
      </p>
    );
  }

  return (
    <div className={styles.resultsList}>
      {results.map((item) => (
        <div key={item.name + (item.notes || "")} className={styles.resultItem}>
          <div className={styles.resultImage}>
            {item.name?.[0]?.toUpperCase() || "FO"}
          </div>
          <div className={styles.resultBody}>
            <div className={styles.resultTitleRow}>
              <div>
                <div className={styles.resultName}>{item.name}</div>
                {item.notes && (
                  <div className={styles.resultBrand}>{item.notes}</div>
                )}
              </div>
            </div>
            <div className={styles.resultMeta}>
              {typeof item.approxCaloriesPer100g === "number" && (
                <span className={styles.macroTag}>
                  {Math.round(item.approxCaloriesPer100g)} kcal / 100g
                </span>
              )}
              {typeof item.approxProteinPer100g === "number" && (
                <span className={`${styles.macroTag} ${styles.macroTagSoft}`}>
                  {item.approxProteinPer100g.toFixed(1)} g protein / 100g
                </span>
              )}
              {typeof item.approxCarbsPer100g === "number" && (
                <span className={styles.macroTag}>
                  {item.approxCarbsPer100g.toFixed(1)} g carbs / 100g
                </span>
              )}
              {typeof item.approxFatPer100g === "number" && (
                <span className={styles.macroTag}>
                  {item.approxFatPer100g.toFixed(1)} g fat / 100g
                </span>
              )}
            </div>
            {onAddToToday && (
              <div style={{ marginTop: 4 }}>
                <button
                  type="button"
                  className={styles.searchButton}
                  style={{ paddingInline: 12, height: 30, fontSize: 12 }}
                  onClick={() => onAddToToday(item)}
                >
                  Add to today
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MealSuggestions({ meals, loading, error, onRefresh, hasProfile }) {
  return (
    <div className={styles.mealsCard}>
      <div className={styles.mealsHeader}>
        <span>Today&apos;s meal suggestions</span>
        <div className={styles.mealBadges}>
          {hasProfile && (
            <button
              type="button"
              className={styles.searchButton}
              style={{ paddingInline: 12, height: 30, fontSize: 12 }}
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? "Thinking…" : "Refresh"}
            </button>
          )}
        </div>
      </div>
      {error && <p className={styles.statusText}>{error}</p>}
      {!loading && (!meals || meals.length === 0) && (
        <p className={styles.emptyState}>
          Tap &quot;Refresh&quot; to get 3–4 simple ideas that fit your goal and diet.
        </p>
      )}
      {meals &&
        meals.map((meal, idx) => (
          <div key={idx} className={styles.mealItem}>
            <div className={styles.mealTitleRow}>
              <span className={styles.mealLabel}>{meal.label || "Meal"}</span>
              {typeof meal.approxCalories === "number" && (
                <span className={styles.macroTag}>
                  ~{Math.round(meal.approxCalories)} kcal
                </span>
              )}
            </div>
            <div className={styles.mealName}>{meal.name}</div>
            {meal.description && (
              <p className={styles.mealDesc}>{meal.description}</p>
            )}
            {meal.notes && <p className={styles.mealNotes}>{meal.notes}</p>}
          </div>
        ))}
    </div>
  );
}
