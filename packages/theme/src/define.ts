/**
 * `defineTheme` — build a theme by overriding the default.
 *
 * Almost every real brand is "the default, but our colours and our name". The
 * full `Theme` interface is deliberately exhaustive so that nothing is
 * implicit, but nobody should have to restate a font stack to change an accent.
 *
 * The merge is one level deep per group, which is the right depth: every group
 * is a flat record of scalars, so a deeper merge would have nothing to do.
 */
import type { Theme, ThemeOverrides } from "./tokens.js";
import { slate } from "./themes/slate.js";

export function defineTheme(overrides: ThemeOverrides, base: Theme = slate): Theme {
  return {
    id: overrides.id,
    label: overrides.label,
    description: overrides.description,
    colorScheme: overrides.colorScheme ?? base.colorScheme,
    identity: { ...base.identity, ...overrides.identity },
    brand: { ...base.brand, ...overrides.brand },
    semantic: { ...base.semantic, ...overrides.semantic },
    typography: { ...base.typography, ...overrides.typography },
    shape: { ...base.shape, ...overrides.shape },
  };
}
