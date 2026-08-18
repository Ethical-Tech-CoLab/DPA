import { describe, it, expect } from "vitest";
import {
  THEMES,
  DEFAULT_THEME_ID,
  getTheme,
  slate,
  atrium,
  campus,
  defineTheme,
  validateTheme,
  assertValidTheme,
  themeVariables,
  themesCss,
  contrast,
  distance,
  fluid,
  THRESHOLDS,
} from "./index.js";

/**
 * Resolve a `clamp(Arem, Brem + Cvw, Drem)` at a given viewport width, in px.
 *
 * Written because asserting on the STRING would test the formatting rather than
 * the behaviour: the interesting question is not "does it say 135rem" but "how
 * wide is the frame on the display in the meeting room".
 */
function evalClamp(css: string, viewportPx: number, rootPx = 16): number {
  const m = /^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem \+ (-?[\d.]+)vw, (-?[\d.]+)rem\)$/.exec(
    css,
  );
  if (!m) throw new Error(`not a fluid clamp: ${css}`);
  const [lo, intercept, slope, hi] = m.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
  ];
  const preferred = intercept * rootPx + (slope / 100) * viewportPx;
  return Math.min(Math.max(preferred, lo * rootPx), hi * rootPx);
}

describe("every shipped theme is usable", () => {
  // This is the test that makes branding safe to accept from outside. A theme
  // is a pull request; this suite is the review.
  for (const theme of THEMES) {
    it(`${theme.id} passes validation`, () => {
      const result = validateTheme(theme);
      const errors = result.findings.filter((f) => f.severity === "error");
      expect(
        errors.map((e) => e.detail),
        `${theme.id} produced errors`,
      ).toEqual([]);
      expect(result.valid).toBe(true);
    });

    it(`${theme.id} keeps the five role colours apart`, () => {
      const roles = Object.entries({
        public: theme.semantic.rolePublic,
        community: theme.semantic.roleSourceCommunity,
        museum: theme.semantic.roleMuseum,
        enforcement: theme.semantic.roleEnforcement,
        owner: theme.semantic.roleOwner,
      });

      for (let i = 0; i < roles.length; i++) {
        for (let j = i + 1; j < roles.length; j++) {
          const a = roles[i]!;
          const b = roles[j]!;
          expect(
            distance(a[1], b[1]),
            `${theme.id}: ${a[0]} vs ${b[0]}`,
          ).toBeGreaterThanOrEqual(THRESHOLDS.ROLE_SEPARATION);
        }
      }
    });

    it(`${theme.id} keeps body text readable`, () => {
      expect(
        contrast(theme.brand.text, theme.brand.bg),
      ).toBeGreaterThanOrEqual(THRESHOLDS.TEXT_CONTRAST);
      expect(
        contrast(theme.brand.textDim, theme.brand.bgRaised),
      ).toBeGreaterThanOrEqual(THRESHOLDS.TEXT_CONTRAST);
    });
  }
});

describe("the validator actually catches the failures it claims to", () => {
  it("rejects a rebrand that collapses two disclosure roles", () => {
    // The realistic accident: an institution supplies one corporate blue and it
    // gets applied to both the public tier and the owner tier.
    const collapsed = defineTheme({
      id: "collapsed",
      label: "Collapsed",
      description: "Two roles wearing the same blue.",
      semantic: {
        rolePublic: "#2f6fb5",
        roleOwner: "#3372b8",
      },
    });

    const result = validateTheme(collapsed);
    expect(result.valid).toBe(false);
    const rule = result.findings.find((f) => f.rule === "role-distinctness");
    expect(rule).toBeDefined();
    expect(rule?.detail).toMatch(/public/);
    expect(rule?.detail).toMatch(/owner/);
    // The message has to say why this is not a matter of taste.
    expect(rule?.detail).toMatch(/correctness problem rather than a styling one/);
  });

  it("rejects unreadable body text", () => {
    const washed = defineTheme({
      id: "washed",
      label: "Washed",
      description: "Grey on grey.",
      brand: { bg: "#606060", text: "#6e6e6e" },
    });
    const result = validateTheme(washed);
    expect(result.valid).toBe(false);
    expect(result.findings.some((f) => f.rule === "contrast")).toBe(true);
  });

  it("warns when cards cannot be told from the page", () => {
    const flat = defineTheme({
      id: "flat",
      label: "Flat",
      description: "Raised surface that is not raised.",
      brand: { bgRaised: slate.brand.bg },
    });
    const result = validateTheme(flat);
    expect(
      result.findings.some((f) => f.rule === "surface-separation"),
    ).toBe(true);
  });

  it("rejects coverage colours that are interchangeable", () => {
    const muddled = defineTheme({
      id: "muddled",
      label: "Muddled",
      description: "well-covered and structurally-uncovered look alike.",
      semantic: { ok: "#7fb069", bad: "#84b46e" },
    });
    expect(validateTheme(muddled).valid).toBe(false);
    expect(() => assertValidTheme(muddled)).toThrow(/coverage-distinctness/);
  });

  it("assertValidTheme is silent on a good theme", () => {
    expect(() => assertValidTheme(slate)).not.toThrow();
    expect(() => assertValidTheme(atrium)).not.toThrow();
    expect(() => assertValidTheme(campus)).not.toThrow();
  });
});

describe("brand and semantic tokens are genuinely independent", () => {
  // The regression this locks: the original stylesheet used one literal
  // (#d4a556) for the accent, the source-community role AND the warn state.
  // Rebranding the accent would have silently moved a disclosure colour.
  it("changing the accent does not move any role colour", () => {
    const rebranded = defineTheme({
      id: "rebranded",
      label: "Rebranded",
      description: "Accent moved to a corporate blue.",
      brand: { accent: "#1f5c94", accentDim: "#143d63" },
    });

    expect(rebranded.semantic).toEqual(slate.semantic);
    expect(rebranded.semantic.roleSourceCommunity).toBe(
      slate.semantic.roleSourceCommunity,
    );
    expect(rebranded.semantic.warn).toBe(slate.semantic.warn);
  });

  it("changing a role colour does not move the accent", () => {
    const rebranded = defineTheme({
      id: "role-shift",
      label: "Role shift",
      description: "Community role moved.",
      semantic: { roleSourceCommunity: "#b5651d" },
    });
    expect(rebranded.brand.accent).toBe(slate.brand.accent);
  });
});

describe("defineTheme", () => {
  it("inherits everything not overridden", () => {
    const t = defineTheme({
      id: "minimal",
      label: "Minimal",
      description: "One change only.",
      brand: { accent: "#ff0000" },
    });
    expect(t.brand.accent).toBe("#ff0000");
    expect(t.brand.bg).toBe(slate.brand.bg);
    expect(t.typography.sans).toBe(slate.typography.sans);
    expect(t.shape.contentWidth).toBe(slate.shape.contentWidth);
  });

  it("can build on a theme other than the default", () => {
    const t = defineTheme(
      { id: "atrium-wide", label: "Atrium wide", description: "Wider." },
      atrium,
    );
    expect(t.colorScheme).toBe("light");
    expect(t.brand.bg).toBe(atrium.brand.bg);
  });
});

describe("CSS emission", () => {
  it("emits every token the stylesheet relies on", () => {
    const vars = themeVariables(slate);
    for (const key of [
      "--bg",
      "--text",
      "--accent",
      "--public",
      "--owner",
      "--ok",
      "--bad",
      "--fs-root",
      "--fs-display",
      "--radius",
      "--nav-h",
      "--gap",
      "--nav-bg",
      "--accent-wash",
      "--shadow",
    ]) {
      expect(vars[key], `missing ${key}`).toBeTruthy();
    }
  });

  it("derives translucent surfaces from the brand rather than hard-coding them", () => {
    // The bug this prevents: a literal rgba(11,13,16,.92) nav background that
    // stays near-black on a paper-white theme.
    expect(themeVariables(slate)["--nav-bg"]).toBe("rgba(11, 13, 16, 0.9)");
    expect(themeVariables(atrium)["--nav-bg"]).toBe("rgba(250, 248, 245, 0.9)");
  });

  it("sets color-scheme so native controls follow the theme", () => {
    expect(themeVariables(atrium)["color-scheme"]).toBe("light");
    expect(themeVariables(campus)["color-scheme"]).toBe("dark");
  });

  it("emits a data-theme block per theme plus a :root default", () => {
    const css = themesCss(THEMES, DEFAULT_THEME_ID);
    expect(css).toContain(":root {");
    for (const t of THEMES) {
      expect(css).toContain(`[data-theme="${t.id}"] {`);
    }
  });

  it("puts the requested default on :root", () => {
    const css = themesCss(THEMES, "atrium");
    const root = css.slice(css.indexOf(":root {"), css.indexOf("[data-theme"));
    expect(root).toContain(atrium.brand.bg);
    expect(root).not.toContain(slate.brand.bg);
  });
});

describe("fluid scales", () => {
  it("clamps between the two ends", () => {
    const f = fluid(16, 24);
    expect(f).toMatch(/^clamp\(1rem, .+, 1\.5rem\)$/);
  });

  it("scales with the viewport, not only at breakpoints", () => {
    // A vw term must be present, otherwise this is just a fixed size wearing a
    // clamp() and the layout will step rather than flow.
    expect(fluid(14, 20)).toMatch(/vw/);
  });

  it("keeps the user's root font size meaningful by working in rem", () => {
    expect(fluid(14, 20)).not.toMatch(/px/);
  });

  it("interpolates over the range it is given, not a fixed one", () => {
    // The frame grows over a different viewport range than type does, because
    // the limits are different things: type is limited by the reader's eye at
    // desk distance, layout by the panel. Baking one range into `fluid` would
    // have forced the frame to finish growing at a laptop width.
    const narrow = fluid(100, 200, 380, 1280);
    const wide = fluid(100, 200, 1280, 2560);
    expect(evalClamp(narrow, 1280)).toBeCloseTo(200, 1);
    expect(evalClamp(wide, 1280)).toBeCloseTo(100, 1);
    expect(evalClamp(wide, 2560)).toBeCloseTo(200, 1);
  });

  it("derives the whole type scale from the theme's own base size", () => {
    // A brand that raises the base size for a lecture hall or a projected
    // kiosk must move headings too. If only body text grew, the page would end
    // up with headings smaller than the prose beneath them.
    const min = (v: string): number => Number(/^clamp\(([\d.]+)rem/.exec(v)![1]);

    const s = themeVariables(slate);
    const c = themeVariables(campus);

    expect(campus.typography.sizeMin).toBeGreaterThan(slate.typography.sizeMin);
    for (const key of [
      "--fs-root",
      "--fs-display",
      "--fs-h2",
      "--fs-h3",
      "--fs-lede",
      "--fs-small",
      "--fs-tiny",
      "--fs-micro",
    ]) {
      expect(min(c[key]!), `${key} did not follow the theme`).toBeGreaterThan(
        min(s[key]!),
      );
    }
  });

  it("keeps headings above body text at every step", () => {
    const min = (v: string): number => Number(/^clamp\(([\d.]+)rem/.exec(v)![1]);
    for (const t of THEMES) {
      const v = themeVariables(t);
      expect(min(v["--fs-display"]!)).toBeGreaterThan(min(v["--fs-h2"]!));
      expect(min(v["--fs-h2"]!)).toBeGreaterThan(min(v["--fs-h3"]!));
      expect(min(v["--fs-h3"]!)).toBeGreaterThan(min(v["--fs-root"]!));
      expect(min(v["--fs-root"]!)).toBeGreaterThan(min(v["--fs-small"]!));
      expect(min(v["--fs-small"]!)).toBeGreaterThan(min(v["--fs-micro"]!));
    }
  });
});

describe("the content frame uses the display it is given", () => {
  // The bug these lock down: `--w` used to be a single fixed string, so a
  // 3440px ultrawide and a Surface Hub both rendered a 1080px column marooned
  // in the middle of the panel with dead space either side. Nothing about the
  // page changed above roughly 1100px.

  it("grows with the viewport rather than stopping at a laptop width", () => {
    for (const t of THEMES) {
      const w = themeVariables(t)["--w"]!;
      const atLaptop = evalClamp(w, 1280);
      const atHub = evalClamp(w, 2560);
      expect(atHub, `${t.id} did not widen`).toBeGreaterThan(atLaptop);
      // Not a token gesture. Anything less than a third more width leaves the
      // extra pixels doing nothing, which is the complaint this answers.
      expect(atHub / atLaptop, `${t.id} barely widened`).toBeGreaterThan(1.33);
    }
  });

  it("is continuous, so there is no viewport where nothing happens", () => {
    // A step at exactly 1600px is right on the two monitors it was tested on
    // and wrong on everything between them. These are intermediate widths a
    // breakpoint scheme would round down.
    for (const t of THEMES) {
      const w = themeVariables(t)["--w"]!;
      const widths = [1280, 1440, 1600, 1920, 2200, 2560].map((v) =>
        evalClamp(w, v),
      );
      for (let i = 1; i < widths.length; i += 1) {
        expect(widths[i]!, `${t.id} flat between steps`).toBeGreaterThan(
          widths[i - 1]!,
        );
      }
    }
  });

  it("leaves laptop-width layouts exactly as they were", () => {
    // Widening must not be a redesign of the displays people actually use. At
    // and below the base width the frame is the theme's declared value.
    for (const t of THEMES) {
      const w = themeVariables(t)["--w"]!;
      expect(evalClamp(w, 1280)).toBeCloseTo(t.shape.contentWidth, 0);
      expect(evalClamp(w, 1024)).toBeCloseTo(t.shape.contentWidth, 0);
    }
  });

  it("holds a sensible proportion of the display at every width", () => {
    // The property that actually matters, and the one an absolute pixel cap
    // gets wrong. Ending the ramp at 2560 made the frame equal the viewport
    // there and then fall to 65% of a 3440px ultrawide — the widest display
    // got the worst ratio, which is precisely the complaint.
    //
    // The floor is the real assertion: below it the column is stranded in the
    // middle of the panel. The ceiling is loose because at and just above the
    // base width the theme's own declared `contentWidth` governs (campus sits
    // at 92% of 1280 by design, being the theme for large panels); it is there
    // to catch a frame that has swallowed its gutters entirely.
    for (const t of THEMES) {
      const w = themeVariables(t)["--w"]!;
      for (const vp of [1280, 1440, 1600, 1920, 2200, 2560, 3000, 3440]) {
        const ratio = evalClamp(w, vp) / vp;
        const msg = `${t.id} at ${vp}px used ${(ratio * 100).toFixed(0)}%`;
        expect(ratio, msg).toBeGreaterThan(0.72);
        expect(ratio, msg).toBeLessThan(0.95);
      }
    }
  });

  it("caps prose independently of the frame", () => {
    // The distinction the whole change rests on. If the measure tracked the
    // frame, a 2160px frame would give a 2160px paragraph and the site would
    // be less readable on a better display than on a worse one.
    for (const t of THEMES) {
      const v = themeVariables(t);
      expect(v["--measure"]).toMatch(/^\d+ch$/);
      // In `ch`, so a brand that enlarges type gets a proportionally wider
      // column holding the same number of words — not the same pixels holding
      // fewer.
      expect(v["--measure"]).not.toMatch(/rem|px|vw/);
      expect(t.shape.proseMeasure).toBeLessThanOrEqual(80);
      expect(t.shape.proseMeasure).toBeGreaterThanOrEqual(45);
    }
  });

  it("gives every theme a wide value above its base", () => {
    for (const t of THEMES) {
      expect(t.shape.contentWidthWide, t.id).toBeGreaterThan(
        t.shape.contentWidth,
      );
    }
  });
});

describe("theme lookup", () => {
  it("falls back to the default for an unknown id", () => {
    expect(getTheme("no-such-theme").id).toBe(DEFAULT_THEME_ID);
    expect(getTheme(undefined).id).toBe(DEFAULT_THEME_ID);
  });

  it("resolves each registered theme by id", () => {
    for (const t of THEMES) expect(getTheme(t.id).id).toBe(t.id);
  });

  it("has unique ids", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
