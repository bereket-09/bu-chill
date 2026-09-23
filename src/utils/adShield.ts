export type AdShieldMode = "strict" | "balanced" | "direct";

export function getAdShieldMode(): AdShieldMode {
  if (typeof window === "undefined") return "strict";
  try {
    return (localStorage.getItem("buchill_adshield_mode") as AdShieldMode) || "strict";
  } catch {
    return "strict";
  }
}

export function setAdShieldMode(mode: AdShieldMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("buchill_adshield_mode", mode);
    window.dispatchEvent(new CustomEvent("buchill_adshield_changed", { detail: mode }));
  } catch (e) {
    console.error("Failed to save AdShield mode:", e);
  }
}
