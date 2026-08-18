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
