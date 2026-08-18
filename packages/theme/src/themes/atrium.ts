/**
 * `atrium` — a light theme for a museum or gallery deployment.
 *
 * Written as a worked example of rebranding, and as a real test of the token
 * contract: it inverts the colour scheme entirely. If the stylesheet had
 * hard-coded a single `rgba(255,255,255,.04)` hairline or a dark-only shadow,
 * this theme would expose it immediately, which is exactly why it exists.
 *
 * The semantic colours are darkened rather than reused. The default role
 * colours were chosen to sit on near-black; dropped onto paper they wash out
 * and `roleSourceCommunity` in particular becomes an illegible pale gold. The
 * validator catches this — an earlier draft of this file failed the contrast
 * assertion on exactly that token, which is the check doing its job.
 */
import { defineTheme } from "../define.js";

export const atrium = defineTheme({
  id: "atrium",
  label: "Atrium",
  description:
    "A light, high-legibility theme for gallery kiosks and printed handouts, where the surrounding room is bright and the screen cannot be.",
  colorScheme: "light",

  identity: {
    wordmark: "Atrium",
    wordmarkAccent: " Collection",
    organisation: "Deployed by a partner institution — example branding only.",
  },

  brand: {
    bg: "#faf8f5",
    bgRaised: "#ffffff",
    bgInset: "#f1ede7",
    line: "#e2dcd2",
    lineBright: "#c8bfb1",
    text: "#1c1a17",
    textDim: "#55504a",
    textFaint: "#7d766d",
    accent: "#8a5a2b",
    accentDim: "#b99a72",
    accentContrast: "#ffffff",
  },

  semantic: {
    rolePublic: "#1f5c94",
    roleSourceCommunity: "#8a5a2b",
    roleMuseum: "#3d6b2c",
    roleEnforcement: "#a63e1c",
    roleOwner: "#5c3d8a",
    ok: "#3d6b2c",
    warn: "#8a5a2b",
    bad: "#a3232c",
  },

  typography: {
    sizeMin: 15.5,
    sizeMax: 17.5,
    displayScale: 1.05,
  },

  shape: {
    radius: "4px",
    radiusLg: "6px",
    contentWidth: "1120px",
  },
});
