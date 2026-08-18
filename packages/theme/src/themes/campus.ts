/**
 * `campus` — a teaching theme for a university or school deployment.
 *
 * The brief this answers is different from a museum's. A lecture room projector
 * loses shadow detail and low-chroma distinctions, and the person at the back
 * is reading a table of role colours from six metres away. So this theme trades
 * subtlety for separation: stronger contrast, more saturated semantics, larger
 * type, wider measure.
 *
 * It is also the theme that stresses the distinctness rule hardest, because
 * pushing every role colour towards maximum saturation is precisely what pushes
 * them towards each other in hue.
 */
import { defineTheme } from "../define.js";

export const campus = defineTheme({
  id: "campus",
  label: "Campus",
  description:
    "High-contrast and larger type, for lecture projection and for teaching the coverage argument to a room.",
  colorScheme: "dark",

  identity: {
    wordmark: "DPA",
    wordmarkAccent: " Teaching",
    organisation: "Example academic branding — not affiliated with any institution.",
  },

  brand: {
    bg: "#06080f",
    bgRaised: "#101625",
    bgInset: "#03050a",
    line: "#243149",
    lineBright: "#3a4d70",
    text: "#f4f7fb",
    textDim: "#b3c0d4",
    textFaint: "#7f8da0",
    accent: "#4d9fff",
    accentDim: "#2c5c96",
    accentContrast: "#06080f",
  },

  semantic: {
    rolePublic: "#4db8ff",
    roleSourceCommunity: "#ffc247",
    roleMuseum: "#5fd97f",
    roleEnforcement: "#ff7a4d",
    roleOwner: "#c48cff",
    ok: "#5fd97f",
    warn: "#ffc247",
    bad: "#ff6b7a",
  },

  typography: {
    sizeMin: 16,
    sizeMax: 18.5,
    displayScale: 1.12,
  },

  shape: {
    radius: "8px",
    radiusLg: "12px",
    contentWidth: "1180px",
    navHeight: "60px",
    focusWidth: "3px",
  },
});
