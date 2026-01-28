"use client";

import styles from "../page.module.css";
import { useState } from "react";

const goals = [
  { id: "lose", label: "Lose body weight" },
  { id: "maintain", label: "Maintain where I am" },
  { id: "gain", label: "Gain muscle / strength" },
];

const diets = [
  "No preference",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Low-carb / keto-ish",
  "Mediterranean-style",
];

export default function SurveyPage() {
  const [goal, setGoal] = useState("lose");
  const [diet, setDiet] = useState("No preference");
  const [dislikes, setDislikes] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState("moderate");
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    // For now, just compute a very simple target and keep it client-side.
    const base = 2000;
    const goalAdjust = goal === "lose" ? -300 : goal === "gain" ? 300 : 0;
    const activityAdjust =
      activity === "low" ? -150 : activity === "high" ? 150 : 0;

    const targetCalories = base + goalAdjust + activityAdjust;

    setSummary({
      goal,
      diet,
      dislikes,
      height,
      weight,
      activity,
      targetCalories,
    });

    setSaving(false);
  }

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <header className={styles.headerRow}>
          <div className={styles.brand}>
            <div className={styles.logoDot}>C</div>
            <div className={styles.brandText}>
              <h1>Cucina</h1>
              <p>Tell us how you like to eat.</p>
            </div>
          </div>
          <div className={styles.tagline}>
            <span className={styles.pillDot} />
            This survey will power your plans.
          </div>
        </header>

        <section className={styles.contentRow}>
          <form onSubmit={handleSubmit} className={styles.rightCol}>
            <div className={styles.panel}>
              <h3>Your main goal</h3>
              <div className={styles.badgeRow}>
                {goals.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className={styles.tinyBadge}
                    style={
                      goal === g.id
                        ? {
                            backgroundColor: "var(--color-accent-soft)",
                            borderColor: "var(--color-accent-dark)",
                            color: "#166534",
                          }
                        : undefined
                    }
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.panel}>
              <h3>How do you like to eat?</h3>
              <p>Select the pattern that sounds closest to you.</p>
              <select
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                style={{
                  marginTop: 8,
                  width: "100%",
                  borderRadius: 999,
                  padding: "8px 12px",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                {diets.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <p style={{ marginTop: 10 }}>
                Foods you{" "}
                <span className={styles.panelStrong}>never</span> want to see:
              </p>
              <textarea
                value={dislikes}
                onChange={(e) => setDislikes(e.target.value)}
                placeholder="e.g. mushrooms, tuna, spicy food…"
                rows={2}
                style={{
                  marginTop: 6,
                  width: "100%",
                  borderRadius: 12,
                  padding: "8px 10px",
                  border: "1px solid var(--color-border-subtle)",
                  resize: "vertical",
                }}
              />
            </div>

            <div className={styles.panel}>
              <h3>Optional body data</h3>
              <p>
                You can skip this for now. It just helps us estimate calories a
                bit better.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <div>
                  <label style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 175"
                    style={{
                      marginTop: 4,
                      width: "100%",
                      borderRadius: 999,
                      padding: "8px 10px",
                      border: "1px solid var(--color-border-subtle)",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 70"
                    style={{
                      marginTop: 4,
                      width: "100%",
                      borderRadius: 999,
                      padding: "8px 10px",
                      border: "1px solid var(--color-border-subtle)",
                    }}
                  />
                </div>
              </div>

              <p style={{ marginTop: 10 }}>How active are most of your days?</p>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                style={{
                  marginTop: 6,
                  width: "100%",
                  borderRadius: 999,
                  padding: "8px 12px",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <option value="low">Mostly sitting / low movement</option>
                <option value="moderate">On your feet sometimes</option>
                <option value="high">On your feet most of the day</option>
              </select>
            </div>

            <button
              type="submit"
              className={styles.searchButton}
              disabled={saving}
              style={{ alignSelf: "flex-end", marginTop: 4 }}
            >
              {saving ? "Saving…" : "Save survey"}
            </button>
          </form>

          <div className={styles.heroCopy}>
            <h2 className={styles.heroTitle}>
              Your plan starts with
              <br />
              how you actually live.
            </h2>
            <p className={styles.heroSubtitle}>
              We&apos;ll use these answers to set a gentle calorie target and
              shape recipes and suggestions that feel realistic, not rigid.
            </p>

            {summary && (
              <div className={styles.resultsCard}>
                <div className={styles.resultsHeader}>
                  <span>Your current profile</span>
                  <span className={styles.resultsBadge}>
                    Draft guidance target
                  </span>
                </div>
                <div className={styles.resultBody}>
                  <div className={styles.resultMeta}>
                    <span className={styles.macroTag}>
                      Goal: {summary.goal}
                    </span>
                    <span className={styles.macroTagSoft}>
                      Eating style: {summary.diet}
                    </span>
                    <span className={styles.macroTag}>
                      Target: ~{summary.targetCalories} kcal / day
                    </span>
                  </div>
                  {summary.dislikes && (
                    <p className={styles.statusText}>
                      Avoid: {summary.dislikes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

