/**
 * `slate` — the default. Dark, quiet, scholarly.
 *
 * This reproduces the appearance the site shipped with, with one deliberate
 * change: the values that were previously shared between a brand token and a
 * semantic token have been separated.
 *
 * In the original stylesheet `--community`, `--accent` and `--warn` were all
 * literally `#d4a556`, and `--museum` and `--ok` were both `#7fb069`. That
 * looked like tidy reuse and was actually a trap. Rebranding the accent to a
 * corporate blue would have silently dragged the source-community role colour
 * to blue with it, landing it on top of `rolePublic` — and the person doing the
 * rebrand would have had no reason to suspect they had just made two disclosure
 * tiers look identical.
 *
 * The values below are still the same colours. They are simply no longer the
 * same variable, so a brand can move one without moving the other.
 */
import type { Theme } from "../tokens.js";

export const slate: Theme = {
  id: "slate",
  label: "Slate",
  description:
    "The project default. Dark, low-chroma, built for long reading and for screenshots that sit inside academic documents.",
  colorScheme: "dark",

  identity: {
    wordmark: "DPA",
    wordmarkAccent: ".",
    organisation: null,
  },

  brand: {
    bg: "#0b0d10",
    bgRaised: "#12151a",
    bgInset: "#080a0c",
    line: "#1e242c",
    lineBright: "#2c3540",
    text: "#e6e9ed",
    textDim: "#97a1ad",
    textFaint: "#5f6b78",
    accent: "#d4a556",
    accentDim: "#8a6c37",
    accentContrast: "#0b0d10",
  },

  semantic: {
    rolePublic: "#5b9dd9",
    roleSourceCommunity: "#d4a556",
    roleMuseum: "#7fb069",
    roleEnforcement: "#d97757",
    roleOwner: "#a98bd4",
    ok: "#7fb069",
    warn: "#d4a556",
    bad: "#d9646b",
  },

  typography: {
    sans: 'ui-sans-serif, -apple-system, "Segoe UI", Inter, Roboto, sans-serif',
    serif:
      '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
    mono: 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace',
    sizeMin: 15,
    sizeMax: 16.5,
    displayScale: 1,
  },

  shape: {
    radius: "7px",
    radiusLg: "10px",
    contentWidth: "1080px",
    navHeight: "56px",
    focusWidth: "2px",
  },
};
