export function loadProfile() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("cucinaProfile");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("cucinaProfile", JSON.stringify(profile));
  } catch {
    // ignore
  }
}

