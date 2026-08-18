/**
 * The theme contract.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE ARE TWO CLASSES OF TOKEN
 *
 * A museum, a university or a ministry will want this to look like theirs. That
 * is a reasonable thing to want and the whole point of this package. But not
 * every colour on the page is decoration.
 *
 * `brand` tokens are chrome: page background, surfaces, rules, body text, the
 * accent used for links and focus. Change them freely. Nothing about the
 * meaning of a passport depends on whether the background is near-black or
 * paper-white.
 *
 * `semantic` tokens are not chrome. The five role colours tell a reader which
 * disclosure tier they are looking at, and the three coverage colours tell them
 * whether a score can be trusted at all. If a rebrand quietly collapses
 * `enforcement` and `public` into two indistinguishable blues, the site has not
 * been restyled — it has developed a disclosure bug wearing a stylesheet, and
 * it will look completely fine to the person who shipped it.
 *
 * So semantic tokens are themeable too, but they are validated. `validateTheme`
 * enforces that the five role colours stay perceptually distinct from each
 * other and legible against the background, and every theme in this repository
 * is checked by a test. A brand cannot be merged if it makes the disclosure
 * model harder to read.
 * ---------------------------------------------------------------------------
 */

/** A CSS colour. Hex is required — the validator has to be able to parse it. */
export type Hex = string;

/**
 * Chrome. Freely themeable.
 */
export interface BrandTokens {
  /** Page background. */
  bg: Hex;
  /** Raised surfaces: cards, the nav bar. */
  bgRaised: Hex;
  /** Inset surfaces: code blocks, score boxes, wells. */
  bgInset: Hex;
  /** Hairline rules and default borders. */
  line: Hex;
  /** Borders that need to be seen: inputs, buttons, active edges. */
  lineBright: Hex;
  /** Primary body text. */
  text: Hex;
  /** Secondary text. Still meant to be read. */
  textDim: Hex;
  /** Tertiary text: labels, captions, things you skim. */
  textFaint: Hex;
  /** Links, focus rings, the active nav indicator. */
  accent: Hex;
  /** A muted accent for borders and quiet emphasis. */
  accentDim: Hex;
  /** Text and icons sitting ON the accent colour. */
  accentContrast: Hex;
}

/**
 * Meaning. Themeable but constrained — see the note at the top of this file.
 */
export interface SemanticTokens {
  /** The five disclosure roles. These must remain distinguishable. */
  rolePublic: Hex;
  roleSourceCommunity: Hex;
  roleMuseum: Hex;
  roleEnforcement: Hex;
  roleOwner: Hex;
  /** well-covered — the registers could look, and did. */
  ok: Hex;
  /** partially-covered — read the number with care. */
  warn: Hex;
  /** structurally-uncovered — the number is not about the object. */
  bad: Hex;
}

export interface TypographyTokens {
  /** UI and body. */
  sans: string;
  /** Display headings. The programme's documents have a scholarly register. */
  serif: string;
  /** Hashes, field paths, anything that must not be mistaken for prose. */
  mono: string;
  /**
   * Root font size in px at the NARROW end of the viewport. Type interpolates
   * between this and `sizeMax` with clamp(), so the site does not jump between
   * two fixed sizes at a breakpoint.
   */
  sizeMin: number;
  /** Root font size in px at the WIDE end. */
  sizeMax: number;
  /** Multiplier applied to display headings only. Lets a brand shout quietly. */
  displayScale: number;
}

export interface ShapeTokens {
  /** Corner radius for buttons, tags, inputs. */
  radius: string;
  /** Corner radius for cards and panels. */
  radiusLg: string;
  /**
   * Content frame width, in px, on a standard laptop (viewport ~1280).
   *
   * This is a MINIMUM, not a cap — see `contentWidthWide`.
   */
  contentWidth: number;
  /**
   * Content frame width, in px, on a very wide display (viewport ~2560 and up).
   *
   * The frame interpolates between the two, so a double-wide monitor, a Surface
   * Hub or a 4K panel gets substantially more usable width instead of a narrow
   * column marooned in the middle of the screen. Any viewport in between gets a
   * width proportional to what it actually has, rather than the next step down.
   *
   * Widening the FRAME is not the same as widening the TEXT, and the two must
   * not be confused. Prose is capped separately by `proseMeasure` — a paragraph
   * 2,000px wide is unreadable no matter how large the display, because the eye
   * loses the start of the next line. What the extra width is for is showing
   * MORE AT ONCE: every column of a register table without scrolling, the
   * disclosure matrix beside its proof, the pipeline in two columns.
   */
  contentWidthWide: number;
  /**
   * Maximum line length for running prose, in `ch`.
   *
   * In `ch` rather than px so it tracks the theme's own type size: a brand that
   * enlarges text for a lecture hall should get a proportionally wider column,
   * not the same pixel width holding fewer words.
   */
  proseMeasure: number;
  /** Height of the navigation bar on wide viewports. */
  navHeight: string;
  /** Border width used for the active-state indicator. */
  focusWidth: string;
}

/** Optional wordmark. Text only — no image assets, so no build step. */
export interface BrandIdentity {
  /** Shown in the nav. Keep it short; it sits next to six links. */
  wordmark: string;
  /**
   * A single accented character or short suffix rendered in the accent colour
   * after the wordmark. Set to null for a plain wordmark.
   */
  wordmarkAccent: string | null;
  /** Shown in the footer. One line. */
  organisation: string | null;
}

export interface Theme {
  /** Stable id. Used as `data-theme` and in NEXT_PUBLIC_THEME. */
  id: string;
  /** Human label for the switcher. */
  label: string;
  /** One sentence on who this is for. */
  description: string;
  /** Drives the CSS `color-scheme` property, so form controls match. */
  colorScheme: "dark" | "light";
  identity: BrandIdentity;
  brand: BrandTokens;
  semantic: SemanticTokens;
  typography: TypographyTokens;
  shape: ShapeTokens;
}

/**
 * A partial theme, for the common case: "the default, but our colours".
 * See `defineTheme`.
 */
export interface ThemeOverrides {
  id: string;
  label: string;
  description: string;
  colorScheme?: "dark" | "light";
  identity?: Partial<BrandIdentity>;
  brand?: Partial<BrandTokens>;
  semantic?: Partial<SemanticTokens>;
  typography?: Partial<TypographyTokens>;
  shape?: Partial<ShapeTokens>;
}
