/**
 * Theme to CSS custom properties.
 *
 * Every visual decision in the web app resolves to one of the variables emitted
 * here. Nothing in `globals.css` may contain a literal colour — if it does, that
 * value is invisible to branding and will survive a rebrand unchanged, which is
 * how a site ends up with one stubborn dark-grey border on a white theme.
 *
 * FLUID SCALES
 *
 * Type and spacing interpolate with `clamp()` rather than stepping at
 * breakpoints. A layout that changes at exactly 768px is fine on the two
 * devices it was tested on and awkward on everything between them; a layout
 * that interpolates is right everywhere, and it means the gallery kiosk at some
 * arbitrary 1366×768 does not get the phone treatment. Breakpoints are then
 * reserved for genuine changes of arrangement — the navigation collapsing, a
 * two-column grid becoming one — rather than for resizing.
 */
import { mix, rgba } from "./color.js";
import type { Theme } from "./tokens.js";

/** Viewport width, in px, at which fluid values reach their minimum. */
const VIEWPORT_MIN = 380;
/** Viewport width, in px, at which fluid values reach their maximum. */
const VIEWPORT_MAX = 1280;

/**
 * The viewport range over which the content FRAME grows.
 *
 * Deliberately different from the type range above, and it has to be. Type
 * stops growing at a laptop width because past that point the limit is the
 * reader's eye at desk distance, not the panel: 17px is 17px whether the
 * monitor is 24" or 49". Layout is the opposite — a 3440px display has room to
 * show three times as much, and refusing to use it is what leaves a narrow
 * column stranded in the middle of a Surface Hub.
 *
 * The upper bound is 3440 rather than 2560 so that the ramp stays gentle enough
 * to hold a roughly constant PROPORTION of the viewport — about 74–84% all the
 * way up. Ending the ramp at 2560 made the frame equal to the viewport there
 * (no gutters at all) and then fall to 65% of a 3440px ultrawide, so the widest
 * display got the worst ratio. Proportion is what the eye reads, not pixels.
 *
 * Viewport width cannot tell us viewing distance, so we do not guess: an
 * ultrawide at 60cm and a wall panel across a room report the same number and
 * want opposite type sizes. Room-scale deployments select the `campus` theme,
 * which raises the whole type scale explicitly. That is a deployment decision
 * with a human behind it, which is the only honest way to make it.
 */
const FRAME_MIN = 1280;
const FRAME_MAX = 3440;

/**
 * A `clamp()` that interpolates linearly against viewport width.
 *
 * Expressed in rem so that a user who has raised their browser's default font
 * size is respected. A `vw`-only scale ignores that preference entirely, which
 * is an accessibility regression dressed up as responsiveness.
 */
export function fluid(
  minPx: number,
  maxPx: number,
  fromVw: number = VIEWPORT_MIN,
  toVw: number = VIEWPORT_MAX,
): string {
  const slope = (maxPx - minPx) / (toVw - fromVw);
  const intercept = minPx - slope * fromVw;
  const n = (v: number, dp: number): string =>
    Number(v.toFixed(dp)).toString();
  return `clamp(${n(minPx / 16, 4)}rem, ${n(intercept / 16, 4)}rem + ${n(slope * 100, 4)}vw, ${n(maxPx / 16, 4)}rem)`;
}

/**
 * The custom-property block for a theme, without a selector.
 */
export function themeVariables(theme: Theme): Record<string, string> {
  const { brand, semantic, typography: t, shape } = theme;
  const d = theme.colorScheme === "dark";

  return {
    "color-scheme": theme.colorScheme,

    // Brand chrome.
    "--bg": brand.bg,
    "--bg-raised": brand.bgRaised,
    "--bg-inset": brand.bgInset,
    "--line": brand.line,
    "--line-bright": brand.lineBright,
    "--text": brand.text,
    "--text-dim": brand.textDim,
    "--text-faint": brand.textFaint,
    "--accent": brand.accent,
    "--accent-dim": brand.accentDim,
    "--accent-contrast": brand.accentContrast,

    // Derived surfaces. These are the values that used to be hard-coded rgba()
    // literals in the stylesheet and therefore silently ignored every rebrand.
    "--nav-bg": rgba(brand.bg, 0.9),
    "--accent-wash": rgba(brand.accent, d ? 0.1 : 0.08),
    "--accent-wash-soft": rgba(brand.accent, d ? 0.07 : 0.05),
    "--hatch": rgba(d ? "#ffffff" : "#000000", d ? 0.012 : 0.025),
    "--shadow": d
      ? "0 8px 24px rgba(0, 0, 0, .45)"
      : "0 6px 20px rgba(28, 26, 23, .1)",
    "--overlay": rgba(brand.bg, 0.65),
    "--line-soft": mix(brand.line, brand.bg, 0.45),

    // Semantics.
    "--public": semantic.rolePublic,
    "--community": semantic.roleSourceCommunity,
    "--museum": semantic.roleMuseum,
    "--enforcement": semantic.roleEnforcement,
    "--owner": semantic.roleOwner,
    "--ok": semantic.ok,
    "--warn": semantic.warn,
    "--bad": semantic.bad,

    // Typography. Every step is derived from the theme's own base size, so a
    // brand that raises `sizeMin`/`sizeMax` for a lecture-hall projector moves
    // the whole scale rather than just body text — which would otherwise leave
    // headings looking oddly small against enlarged prose.
    "--sans": t.sans,
    "--serif": t.serif,
    "--mono": t.mono,
    "--fs-root": fluid(t.sizeMin, t.sizeMax),
    "--fs-display": fluid(
      t.sizeMin * 1.75 * t.displayScale,
      t.sizeMax * 2.4 * t.displayScale,
    ),
    "--fs-h2": fluid(
      t.sizeMin * 1.27 * t.displayScale,
      t.sizeMax * 1.45 * t.displayScale,
    ),
    "--fs-h3": fluid(
      t.sizeMin * 1.07 * t.displayScale,
      t.sizeMax * 1.1 * t.displayScale,
    ),
    "--fs-lede": fluid(t.sizeMin * 1.06, t.sizeMax * 1.09),
    "--fs-small": fluid(t.sizeMin * 0.87, t.sizeMax * 0.87),
    "--fs-tiny": fluid(t.sizeMin * 0.78, t.sizeMax * 0.78),
    "--fs-micro": fluid(t.sizeMin * 0.72, t.sizeMax * 0.72),

    // Shape and rhythm.
    "--radius": shape.radius,
    "--radius-lg": shape.radiusLg,
    // The frame grows with the display; prose does not. `--measure` is in `ch`
    // so it tracks this theme's own type size rather than a fixed pixel width.
    "--w": fluid(shape.contentWidth, shape.contentWidthWide, FRAME_MIN, FRAME_MAX),
    "--w-base": `${shape.contentWidth / 16}rem`,
    "--measure": `${shape.proseMeasure}ch`,
    "--nav-h": shape.navHeight,
    "--focus-w": shape.focusWidth,
    "--gap": fluid(12, 18),
    "--gap-lg": fluid(16, 24),
    "--pad-card": fluid(16, 22),
    // Page gutters grow on wide displays too. Content pinned to the very edge
    // of a 49" panel is as uncomfortable to read as a column stranded mid-screen.
    "--pad-page": `calc(${fluid(16, 24)} + ${fluid(0, 24, FRAME_MIN, FRAME_MAX)})`,
    "--section": fluid(28, 48),
  };
}

function block(selector: string, vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  return `${selector} {\n${body}\n}`;
}

/** The default theme, as `:root`. */
export function rootCss(theme: Theme): string {
  return block(":root", themeVariables(theme));
}

/**
 * Every theme as a `[data-theme]` block, plus the default on `:root`.
 *
 * All themes are emitted because the site is a static export: there is no
 * server to pick one per request, so switching has to be a matter of changing
 * an attribute on `<html>`. The cost is a few hundred bytes per extra theme,
 * which buys the ability to show an institution its own branding live rather
 * than describing it.
 */
export function themesCss(themes: Theme[], defaultId: string): string {
  const fallback = themes[0];
  if (!fallback) throw new Error("themesCss requires at least one theme");
  const base = themes.find((t) => t.id === defaultId) ?? fallback;

  return [
    "/* Generated by @dpa/theme. Do not edit — change the theme, not the CSS. */",
    rootCss(base),
    ...themes.map((t) =>
      block(`[data-theme="${t.id}"]`, themeVariables(t)),
    ),
  ].join("\n\n");
}
