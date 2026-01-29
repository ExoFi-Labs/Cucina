"use client";

import styles from "../page.module.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveProfile, loadProfile } from "../../lib/profileStorage";

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
  "Gluten-free",
  "Paleo",
  "High-protein",
  "Intermittent fasting-friendly",
  "Dairy-free",
  "Nut-free",
  "Whole foods / unprocessed",
];

export default function SettingsPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("lose");
  const [diet, setDiet] = useState("No preference");
  const [dislikes, setDislikes] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState("moderate");
  const [cookingTime, setCookingTime] = useState("medium");
  const [mealPrep, setMealPrep] = useState("sometimes");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = loadProfile();
    if (!existing) {
      router.push("/survey");
      return;
    }
    // Load existing values
    setGoal(existing.goal || "lose");
    setDiet(existing.diet || "No preference");
    setDislikes(existing.dislikes || "");
    setHeight(existing.height || "");
    setWeight(existing.weight || "");
    setActivity(existing.activity || "moderate");
    setCookingTime(existing.cookingTime || "medium");
    setMealPrep(existing.mealPrep || "sometimes");
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    // Recalculate target calories
    const base = 2000;
    const goalAdjust = goal === "lose" ? -300 : goal === "gain" ? 300 : 0;
    const activityAdjust =
      activity === "low" ? -150 : activity === "high" ? 150 : 0;

    const targetCalories = base + goalAdjust + activityAdjust;

    const profile = {
      goal,
      diet,
      dislikes,
      height,
      weight,
      activity,
      cookingTime,
      mealPrep,
      targetCalories,
    };

    saveProfile(profile);
    setSaving(false);
    setSaved(true);

    setTimeout(() => {
      router.push("/");
    }, 1000);
  }

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <header className={styles.headerRow}>
          <div className={styles.brand}>
            <div className={styles.logoDot}>C</div>
            <div className={styles.brandText}>
              <h1>Settings</h1>
              <p>Update your preferences anytime.</p>
            </div>
          </div>
          <div className={styles.tagline}>
            <span className={styles.pillDot} />
            Changes save automatically
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
              <h3>Body data</h3>
              <p>
                Optional – helps us estimate calories more accurately.
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

            <div className={styles.panel}>
              <h3>Cooking & meal prep</h3>
              <p>
                How much time do you usually have for cooking on weekdays?
              </p>
              <select
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                style={{
                  marginTop: 8,
                  width: "100%",
                  borderRadius: 999,
                  padding: "8px 12px",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <option value="quick">Quick (15–20 min max)</option>
                <option value="medium">Medium (30–45 min)</option>
                <option value="long">I enjoy longer cooking</option>
              </select>
              <p style={{ marginTop: 10 }}>
                Do you meal prep or batch cook?
              </p>
              <select
                value={mealPrep}
                onChange={(e) => setMealPrep(e.target.value)}
                style={{
                  marginTop: 6,
                  width: "100%",
                  borderRadius: 999,
                  padding: "8px 12px",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <option value="never">Never, I cook fresh each time</option>
                <option value="sometimes">Sometimes, when I have time</option>
                <option value="often">Often, I like batch cooking</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="submit"
                className={styles.searchButton}
                disabled={saving}
                style={{ alignSelf: "flex-end", marginTop: 4 }}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              {saved && (
                <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 500 }}>
                  ✓ Saved! Redirecting…
                </span>
              )}
            </div>
          </form>

          <div className={styles.heroCopy}>
            <h2 className={styles.heroTitle}>
              Adjust your profile
              <br />
              whenever you need to.
            </h2>
            <p className={styles.heroSubtitle}>
              Your meal suggestions and calorie targets will update automatically
              based on these preferences. Change them as your goals or lifestyle
              shifts.
            </p>
            <div className={styles.chips}>
              <span className={`${styles.chip} ${styles.chipAccent}`}>
                All changes saved locally
              </span>
              <span className={styles.chip}>No account needed</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
