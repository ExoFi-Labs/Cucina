"use client";

import styles from "./page.module.css";
import { Suspense, useState } from "react";

export default function Home() {
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
          <div className={styles.tagline}>
            <span className={styles.pillDot} />
            Smart companion, not just a food log.
          </div>
        </header>

        <section className={styles.contentRow}>
          <div className={styles.heroCopy}>
            <h2 className={styles.heroTitle}>
              Find foods, track your day,
              <br />
              and get gentle nudges in the right direction.
            </h2>
            <p className={styles.heroSubtitle}>
              Start by searching for something you ate today. We&apos;ll use
              Llama 4 to understand it and estimate calories and macros you can
              build on.
            </p>
            <div className={styles.chips}>
              <span className={`${styles.chip} ${styles.chipAccent}`}>
                Fresh green, science‑backed
              </span>
              <span className={styles.chip}>Global food database</span>
              <span className={styles.chip}>Daily guidance coming soon</span>
            </div>

            <Suspense fallback={null}>
              <SearchCard />
            </Suspense>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.panel}>
              <h3>Step 1: Your survey</h3>
              <p>
                Before we can really coach you, we&apos;ll ask a few quick questions
                about your goals, how you like to eat and your typical day.
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
            <SearchResultsPreview />
            <p className={styles.footnote}>
              Early prototype – we&apos;ll add your survey, recipes and daily
              coaching flows next.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function SearchResultsPreview() {
  return (
    <div className={styles.resultsCard}>
      <div className={styles.resultsHeader}>
        <span>Recent matches</span>
        <span className={styles.resultsBadge}>Live from Open Food Facts</span>
      </div>
      <SearchResults />
    </div>
  );
}

function SearchResults() {
  return (
    <p className={styles.emptyState}>
      Start typing on the left to see energy and macros here.
    </p>
  );
}

function SearchCard() {
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
        body: JSON.stringify({ query: query.trim() }),
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
        <div className={styles.metaRow}>
          <span>
            Uses Open Food Facts. <strong>No account needed.</strong>
          </span>
          <span>We&apos;ll turn this into a full log &amp; coach next.</span>
        </div>
        {error && <p className={styles.statusText}>{error}</p>}
      </form>
      <ClientResults results={results} />
    </>
  );
}

function ClientResults({ results }) {
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
          </div>
        </div>
      ))}
    </div>
  );
}
