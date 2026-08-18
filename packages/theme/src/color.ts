/**
 * Colour maths, with no dependencies.
 *
 * Two questions need answering about any submitted theme, and neither can be
 * answered by looking at hex strings: is this text readable on this background,
 * and are these two role colours actually different to a human eye?
 *
 * WCAG contrast answers the first. It is a luminance ratio, so it says nothing
 * about hue — two colours can have identical contrast against the background
 * and be indistinguishable from each other.
 *
 * The second needs a perceptual distance, which means leaving sRGB. Hex
 * arithmetic is famously misleading here: #0000ff and #00ff00 differ by an
 * enormous amount numerically and are obviously different, while #7fb069 and
 * #8ab472 differ by very little and are the same green to anyone glancing at a
 * table. CIELAB was built so that geometric distance approximates perceived
 * difference, so the role-distinctness check runs there.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Lab {
  l: number;
  a: number;
  b: number;
}

export function parseHex(hex: string): Rgb {
  const s = hex.trim().replace(/^#/, "");
  const full =
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Not a hex colour: "${hex}"`);
  }
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** sRGB channel to linear light. */
function linearise(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return (
    0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b)
  );
}

/**
 * WCAG contrast ratio, 1 (identical) to 21 (black on white).
 *
 * Thresholds worth remembering: 4.5 is the AA requirement for body text, 3 is
 * AA for large text and for non-text elements that carry meaning, and 7 is AAA.
 */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** sRGB to CIELAB, D65. */
export function toLab(hex: string): Lab {
  const { r, g, b } = parseHex(hex);
  const rl = linearise(r);
  const gl = linearise(g);
  const bl = linearise(b);

  // Linear sRGB to CIEXYZ.
  const x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  const y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175;
  const z = (rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041) / 1.08883;

  const f = (t: number): number =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/**
 * Perceptual distance in CIELAB (CIE76).
 *
 * Rough calibration: under 2.3 is the "just noticeable difference" and is
 * invisible side by side; around 10 is a clear difference; above 25 the two
 * colours read as unrelated. The role-distinctness threshold is set well above
 * the JND because these colours are read at small sizes, in a table, by someone
 * who is not comparing them deliberately.
 */
export function distance(a: string, b: string): number {
  const la = toLab(a);
  const lb = toLab(b);
  return Math.sqrt(
    (la.l - lb.l) ** 2 + (la.a - lb.a) ** 2 + (la.b - lb.b) ** 2,
  );
}

/** `rgba(r, g, b, alpha)` from a hex colour — for translucent surfaces. */
export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Blend two colours in linear-ish sRGB. `t` of 0 returns `a`. */
export function mix(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  const ch = (x: number, y: number): string =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(ca.r, cb.r)}${ch(ca.g, cb.g)}${ch(ca.b, cb.b)}`;
}
