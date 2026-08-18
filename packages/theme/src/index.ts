/**
 * @dpa/theme — one definition of every visual token in the solution.
 *
 * The point of this package is that an institution can deploy the Digital
 * Passport under its own identity without editing a stylesheet, and cannot
 * accidentally break the disclosure model while doing it. See `tokens.ts` for
 * why those are the same concern.
 *
 * Adding a brand:
 *
 *   1. Create `src/themes/<id>.ts` using `defineTheme({ ... })`.
 *   2. Add it to `THEMES` below.
 *   3. Run `pnpm --filter @dpa/theme test`. The suite validates every
 *      registered theme, so a brand that hurts legibility fails CI.
 *
 * Selecting a brand at build time: `NEXT_PUBLIC_THEME=atrium pnpm build:web`.
 */
export type {
  Theme,
  ThemeOverrides,
  BrandTokens,
  SemanticTokens,
  TypographyTokens,
  ShapeTokens,
  BrandIdentity,
  Hex,
} from "./tokens.js";

export { defineTheme } from "./define.js";
export {
  parseHex,
  luminance,
  contrast,
  toLab,
  distance,
  rgba,
  mix,
} from "./color.js";
export type { Rgb, Lab } from "./color.js";
export {
  validateTheme,
  assertValidTheme,
  THRESHOLDS,
} from "./validate.js";
export type { Finding, ValidationResult } from "./validate.js";
export {
  themeVariables,
  rootCss,
  themesCss,
  fluid,
} from "./css.js";

import type { Theme } from "./tokens.js";
import { slate } from "./themes/slate.js";
import { atrium } from "./themes/atrium.js";
import { campus } from "./themes/campus.js";

export { slate, atrium, campus };

/** Every theme shipped with the repository. Order drives the switcher. */
export const THEMES: Theme[] = [slate, atrium, campus];

export const DEFAULT_THEME_ID = "slate";

export function getTheme(id: string | undefined): Theme {
  if (!id) return slate;
  return THEMES.find((t) => t.id === id) ?? slate;
}
