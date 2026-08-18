/**
 * Theme validation.
 *
 * A brand is a pull request like any other, and this is what reviews it. The
 * rules below are the ones that, if broken, produce a site that looks
 * professionally designed and is quietly wrong.
 */
import { contrast, distance } from "./color.js";
import type { Theme } from "./tokens.js";

export interface Finding {
  severity: "error" | "warning";
  rule: string;
  detail: string;
  /** Measured value and the threshold it had to meet. */
  measured: number;
  required: number;
}

export interface ValidationResult {
  themeId: string;
  valid: boolean;
  findings: Finding[];
}

/**
 * WCAG AA for body text. Anything below this is not a style preference.
 */
const TEXT_CONTRAST = 4.5;

/**
 * Tertiary text — labels and captions — is held to the large-text/non-text
 * threshold rather than the body threshold. It is set in small caps at
 * .74rem and is genuinely decorative in places, but it still has to be
 * readable by someone who is trying.
 */
const FAINT_CONTRAST = 3;

/**
 * Role and coverage colours are non-text meaningful elements: they appear as
 * tags, dots and small labels. WCAG 1.4.11 puts those at 3:1.
 */
const SEMANTIC_CONTRAST = 3;

/**
 * Minimum perceptual separation between any two role colours, in CIELAB.
 *
 * The just-noticeable difference is around 2.3. This is set an order of
 * magnitude higher because the comparison these colours have to survive is not
 * two swatches side by side under good light — it is a reader glancing at a
 * matrix of five columns, at small size, possibly projected, and deciding
 * whether the row they are looking at is the enforcement view or the public
 * one. That decision has to be instant and it has to be right.
 */
const ROLE_SEPARATION = 22;

/**
 * Coverage colours may sit closer than role colours: they are almost always
 * accompanied by the class name in text, and the traffic-light convention does
 * a lot of the work. But they must not be interchangeable.
 */
const COVERAGE_SEPARATION = 18;

function checkContrast(
  findings: Finding[],
  name: string,
  fg: string,
  bg: string,
  required: number,
  severity: Finding["severity"] = "error",
): void {
  const measured = contrast(fg, bg);
  if (measured < required) {
    findings.push({
      severity,
      rule: "contrast",
      detail: `${name} (${fg}) against the background (${bg}) is ${measured.toFixed(2)}:1, below the ${required}:1 required.`,
      measured: Number(measured.toFixed(2)),
      required,
    });
  }
}

export function validateTheme(theme: Theme): ValidationResult {
  const findings: Finding[] = [];
  const { brand, semantic } = theme;

  // --- Text legibility on both surfaces a reader actually meets. ------------
  for (const [surfaceName, surface] of [
    ["page background", brand.bg],
    ["raised surface", brand.bgRaised],
  ] as const) {
    checkContrast(
      findings,
      `Body text on the ${surfaceName}`,
      brand.text,
      surface,
      TEXT_CONTRAST,
    );
    checkContrast(
      findings,
      `Secondary text on the ${surfaceName}`,
      brand.textDim,
      surface,
      TEXT_CONTRAST,
    );
    checkContrast(
      findings,
      `Tertiary text on the ${surfaceName}`,
      brand.textFaint,
      surface,
      FAINT_CONTRAST,
    );
  }

  checkContrast(findings, "Accent", brand.accent, brand.bg, SEMANTIC_CONTRAST);
  checkContrast(
    findings,
    "Text on the accent colour",
    brand.accentContrast,
    brand.accent,
    TEXT_CONTRAST,
  );

  // --- Surfaces must be distinguishable from each other. --------------------
  // A card that cannot be told from the page is not a card, and the whole
  // layout collapses into one undifferentiated sheet.
  const surfaceSeparation = distance(brand.bg, brand.bgRaised);
  if (surfaceSeparation < 2) {
    findings.push({
      severity: "warning",
      rule: "surface-separation",
      detail: `The raised surface (${brand.bgRaised}) is nearly identical to the page background (${brand.bg}). Cards and the nav bar will not read as separate layers.`,
      measured: Number(surfaceSeparation.toFixed(2)),
      required: 2,
    });
  }

  // --- The disclosure colours. This is the rule that matters. ---------------
  const roles: [string, string][] = [
    ["public", semantic.rolePublic],
    ["source-community", semantic.roleSourceCommunity],
    ["museum", semantic.roleMuseum],
    ["enforcement", semantic.roleEnforcement],
    ["owner", semantic.roleOwner],
  ];

  for (const [name, hex] of roles) {
    checkContrast(
      findings,
      `Role colour "${name}"`,
      hex,
      brand.bg,
      SEMANTIC_CONTRAST,
    );
  }

  for (let i = 0; i < roles.length; i++) {
    for (let j = i + 1; j < roles.length; j++) {
      const a = roles[i] as [string, string];
      const b = roles[j] as [string, string];
      const measured = distance(a[1], b[1]);
      if (measured < ROLE_SEPARATION) {
        findings.push({
          severity: "error",
          rule: "role-distinctness",
          detail: `Roles "${a[0]}" (${a[1]}) and "${b[0]}" (${b[1]}) are only ${measured.toFixed(1)} apart in CIELAB. A reader cannot reliably tell which disclosure tier they are looking at, which makes this a correctness problem rather than a styling one.`,
          measured: Number(measured.toFixed(1)),
          required: ROLE_SEPARATION,
        });
      }
    }
  }

  // --- Coverage colours. --------------------------------------------------
  const coverage: [string, string][] = [
    ["well-covered", semantic.ok],
    ["partially-covered", semantic.warn],
    ["structurally-uncovered", semantic.bad],
  ];

  for (const [name, hex] of coverage) {
    checkContrast(
      findings,
      `Coverage colour "${name}"`,
      hex,
      brand.bg,
      SEMANTIC_CONTRAST,
    );
  }

  for (let i = 0; i < coverage.length; i++) {
    for (let j = i + 1; j < coverage.length; j++) {
      const a = coverage[i] as [string, string];
      const b = coverage[j] as [string, string];
      const measured = distance(a[1], b[1]);
      if (measured < COVERAGE_SEPARATION) {
        findings.push({
          severity: "error",
          rule: "coverage-distinctness",
          detail: `Coverage classes "${a[0]}" (${a[1]}) and "${b[0]}" (${b[1]}) are only ${measured.toFixed(1)} apart in CIELAB. These carry the warning about whether a score can be read at all.`,
          measured: Number(measured.toFixed(1)),
          required: COVERAGE_SEPARATION,
        });
      }
    }
  }

  return {
    themeId: theme.id,
    valid: findings.every((f) => f.severity !== "error"),
    findings,
  };
}

/** Throws with a readable report. For build scripts and tests. */
export function assertValidTheme(theme: Theme): void {
  const result = validateTheme(theme);
  const errors = result.findings.filter((f) => f.severity === "error");
  if (errors.length === 0) return;
  throw new Error(
    `Theme "${theme.id}" is not usable:\n` +
      errors.map((e) => `  [${e.rule}] ${e.detail}`).join("\n"),
  );
}

export const THRESHOLDS = {
  TEXT_CONTRAST,
  FAINT_CONTRAST,
  SEMANTIC_CONTRAST,
  ROLE_SEPARATION,
  COVERAGE_SEPARATION,
} as const;
