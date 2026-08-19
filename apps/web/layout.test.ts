/**
 * The page template contract.
 *
 * These assertions exist because the template was a convention rather than a
 * rule, and conventions drift silently. Measured on one 1920px viewport before
 * this test was written, the eight routes in the navigation disagreed about
 * where the page starts:
 *
 *   /demo /coverage /disclosure /exhibit /brand /plan   left edge 229px
 *   /                                                   left edge 198px
 *   /capture                                            left edge   0px
 *
 * `/capture` ran edge to edge with its text against the window, because it had
 * never been given the container class. The home page sat 31px left of the
 * others because `.hero`'s `padding: X 0 Y` shorthand reset the horizontal
 * padding the container had just set. Neither failed a build, a typecheck or a
 * test. Both were plainly visible to anyone looking at two pages in sequence.
 *
 * The frame now lives on `main` in `globals.css`, so it applies to every route
 * whether or not the author remembers it. What remains checkable in source is
 * that no page re-declares the frame, invents its own, or opens differently
 * from its neighbours — which is what these tests do.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(here, "app");

/** Every route reachable from the navigation. */
const ROUTES = [
  "page.tsx",
  "demo/page.tsx",
  "capture/page.tsx",
  "coverage/page.tsx",
  "disclosure/page.tsx",
  "exhibit/page.tsx",
  "brand/page.tsx",
  "plan/page.tsx",
];

const read = (rel: string) => fs.readFileSync(path.join(APP, rel), "utf8");
const globals = () => fs.readFileSync(path.join(APP, "globals.css"), "utf8");

/**
 * Components render most of what is actually on screen: `/demo` is RoleSwitcher,
 * `/capture` is CaptureSimulator, `/exhibit` is ExhibitViewer. Their roots are
 * fragments, so their children are direct children of `main` and are page rhythm
 * in every sense that matters. Checking only `app/**` missed 31 of the 40 inline
 * spacing literals in the app.
 */
const COMPONENTS = path.join(here, "components");
const componentFiles = fs
  .readdirSync(COMPONENTS)
  .filter((f) => f.endsWith(".tsx"));
const readComponent = (f: string) =>
  fs.readFileSync(path.join(COMPONENTS, f), "utf8");

describe("the frame is applied to main, not opted into per page", () => {
  it("globals.css sets the frame on the main element itself", () => {
    // An element selector, so a new route cannot fail to inherit it. If this
    // becomes a class again, every page has to remember it and one will not.
    expect(globals()).toMatch(/^main\s*\{[^}]*max-width:\s*var\(--w\)/m);
  });

  it("the frame's width and gutter come from theme tokens, not literals", () => {
    const rule = /^main\s*\{([^}]*)\}/m.exec(globals())?.[1] ?? "";
    expect(rule).toContain("var(--w)");
    expect(rule).toContain("var(--pad-page)");
    // A px or rem literal here would mean a rebrand could not move the frame.
    expect(rule).not.toMatch(/\d+(px|rem)/);
  });

  it("a nested .wrap inside main is neutralised rather than double-padded", () => {
    // The footer legitimately uses .wrap outside main. A page copied from it
    // should land correctly instead of being indented twice.
    expect(globals()).toMatch(/main\s+\.wrap\s*\{[^}]*padding-left:\s*0/);
  });

  for (const route of ROUTES) {
    it(`${route} does not re-declare the frame`, () => {
      expect(read(route)).not.toMatch(/className="wrap"|className="wrap /);
    });

    it(`${route} does not declare its own <main>`, () => {
      // The layout already renders one. A second is invalid HTML and gives
      // assistive technology two "main" landmarks to choose between.
      expect(read(route)).not.toMatch(/<main[\s>]/);
    });
  }
});

describe("every route opens the same way", () => {
  for (const route of ROUTES) {
    it(`${route} opens with exactly one page head`, () => {
      const src = read(route);
      const heads =
        (src.match(/className="page-head"/g) ?? []).length +
        (src.match(/className="hero"/g) ?? []).length;
      expect(heads).toBe(1);
    });
  }

  it("only the landing page uses the taller hero treatment", () => {
    const heroes = ROUTES.filter((r) => /className="hero"/.test(read(r)));
    expect(heroes).toEqual(["page.tsx"]);
  });

  it("the hero's extra height is a stated multiple of the shared head padding", () => {
    // Not an independent number. If the two drift apart the landing page stops
    // being a deliberate variation and becomes an inconsistency.
    expect(globals()).toMatch(/\.hero\s*\{[^}]*calc\(var\(--head-top\)\s*\*/);
  });

  it("the head rhythm is defined once, as variables", () => {
    const css = globals();
    expect(css).toMatch(/--head-top:/);
    expect(css).toMatch(/--head-bottom:/);
    expect(css).toMatch(/\.page-head\s*\{[^}]*var\(--head-top\)[^}]*var\(--head-bottom\)/);
  });
});

describe("vertical rhythm is set by the template, not per page", () => {
  it("the space between page blocks is defined once", () => {
    expect(globals()).toMatch(/main\s*>\s*\*\s*\+\s*\*\s*\{[^}]*margin-top:\s*var\(--gap-lg\)/);
  });

  it("elements that own their spacing are exempted rather than double-spaced", () => {
    const css = globals();
    expect(css).toMatch(/main\s*>\s*\.page-head\s*\+\s*\*\s*\{[^}]*margin-top:\s*0/);
    expect(css).toMatch(/main\s*>\s*\.section\s*\{[^}]*margin-top:\s*0/);
  });

  for (const route of ROUTES) {
    it(`${route} sets no block spacing inline`, () => {
      // A sole-property `marginTop`/`paddingTop` is always page rhythm, and
      // rhythm belongs to the template. There were ~30 of these across the
      // seven content routes and they disagreed: 24px after the heading on some
      // pages, 18px on others, trailing notes 10px here and 12px there.
      //
      // They were also all frozen desktop values. `--gap` is fluid(12,18) and
      // `--gap-lg` fluid(16,24), so every literal `18` and `24` was the widest
      // viewport's value of a token that is supposed to contract on a phone.
      const src = read(route);
      expect(src).not.toMatch(/style=\{\{\s*marginTop:\s*[^,}]+\s*\}\}/);
      expect(src).not.toMatch(/style=\{\{\s*paddingTop:\s*[^,}]+\s*\}\}/);
    });

    it(`${route} expresses any remaining inline spacing in tokens or sub-token detail`, () => {
      // Multi-property inline styles are allowed for typographic detail inside a
      // component, but a raw value at or above the token scale is page rhythm
      // wearing a different hat.
      const src = read(route);
      for (const m of src.matchAll(/(margin|padding)(Top|Bottom):\s*(\d+)/g)) {
        expect(Number(m[3])).toBeLessThan(12);
      }
    });
  }

  for (const f of componentFiles) {
    it(`components/${f} sets no block spacing inline`, () => {
      const src = readComponent(f);
      expect(src).not.toMatch(/style=\{\{\s*marginTop:\s*\d{2,}\s*\}\}/);
      expect(src).not.toMatch(/style=\{\{\s*marginBottom:\s*\d{2,}\s*\}\}/);
      for (const m of src.matchAll(/(margin|padding)(Top|Bottom):\s*(\d+)/g)) {
        expect(Number(m[3])).toBeLessThan(12);
      }
    });
  }
});


/**
 * THE READING COLUMN.
 *
 * The frame above fixed where a page starts. It did not fix how wide the things
 * inside it are allowed to get, and on a large display that turned out to be the
 * more visible defect. Measured in Chromium at 2560px before these tests were
 * written: the frame gave `main` 1886px of usable width, a card holding nothing
 * but prose spanned all 1886px of it, and the text inside that card wrapped at
 * 720px. The box was 2.6x wider than anything it contained, and the line length
 * was correct all along — so "the text is too narrow" was the wrong diagnosis
 * and widening the measure would have made it worse.
 *
 * `main` and `.section` now lay out on named tracks. Sentences occupy a column
 * one measure wide; tables, card grids and the 3D viewer break out to the full
 * band. Two vertical edges for the whole document, at any depth of nesting.
 */
describe("prose is capped at a reading measure and structure breaks out", () => {
  it("the reading width is derived from existing tokens, not a new number", () => {
    expect(globals()).toMatch(
      /--reading:\s*calc\(\s*var\(--measure\)\s*\+\s*2\s*\*\s*var\(--pad-card\)\s*\)/
    );
  });

  it("the reading width is registered, so `ch` resolves once at the root", () => {
    // `ch` is relative to the font of the element that USES a variable, not the
    // one that declares it. Unregistered, a card with smaller type computed a
    // narrower --reading than main did and sat visibly off the column edge.
    const css = globals();
    expect(css).toMatch(/@property\s+--reading\s*\{[^}]*syntax:\s*"<length>"/s);
    expect(css).toMatch(/@property\s+--reading\s*\{[^}]*inherits:\s*true/s);
  });

  it("main and .section share one set of tracks", () => {
    const css = globals();
    const rule = css.match(/main,\s*\.section\s*\{[^}]*\}/s)?.[0] ?? "";
    expect(rule).toMatch(/display:\s*grid/);
    expect(rule).toMatch(/\[full-start\]/);
    expect(rule).toMatch(/\[content-start\]\s*min\(100%,\s*var\(--reading\)\)/);
    expect(rule).toMatch(/\[content-end\]/);
    expect(rule).toMatch(/\[full-end\]/);
  });

  it("a nested section hands its children the same column", () => {
    // Without this the landing page put a section heading on the full band's
    // edge and the card grid inside that same section on another, which is two
    // left edges inside one visual block.
    expect(globals()).toMatch(/main\s*>\s*\*,\s*\.section\s*>\s*\*\s*\{\s*grid-column:\s*content/s);
  });

  it("breakout is granted by what a container holds, not only by class", () => {
    // A class list goes stale the moment someone puts a table in a card and
    // does not think to widen it. :has() makes the container widen itself.
    const css = globals();
    const has = css.match(/:is\(main, \.section\) > :has\(([^)]*)\)/)?.[1] ?? "";
    for (const token of ["table", "canvas", ".grid", ".tbl-scroll", ".kv"]) {
      expect(has).toContain(token);
    }
  });

  it("a prose-only card is capped wherever it lands", () => {
    // The safety net for the next container somebody adds with its own
    // grid-template-columns. Should be a no-op; costs nothing if it is.
    const css = globals();
    const rule = css.match(/\.card:not\(:has\([^)]*\)\)\s*\{[^}]*\}/s)?.[0] ?? "";
    expect(rule).toMatch(/max-width:\s*var\(--reading\)/);
    expect(rule).toMatch(/margin-inline:\s*auto/);
    // Load-bearing: a grid item with auto inline margins loses `stretch` and
    // falls back to fit-content, which collapsed these cards to 47px.
    expect(rule).toMatch(/width:\s*100%/);
  });

  it("grid tracks cap at the reading width instead of absorbing the display", () => {
    const css = globals();
    for (const cls of ["grid-2", "grid-3"]) {
      const rule = css.match(new RegExp(`\\.${cls}\\s*\\{[^}]*\\}`, "s"))?.[0] ?? "";
      expect(rule).toMatch(/min\(100%,\s*var\(--reading\)\)/);
      expect(rule).not.toMatch(/,\s*1fr\)\)/);
    }
  });

  it("no page or component hardcodes a width for a text container", () => {
    // Widths belong to the template. A page that sets its own is how the eight
    // routes came to disagree in the first place.
    for (const r of ROUTES) {
      expect(read(r)).not.toMatch(/(maxWidth|max-width):\s*["']?\d+(px|rem)/);
    }
    for (const f of componentFiles) {
      expect(readComponent(f)).not.toMatch(/(maxWidth|max-width):\s*["']?\d+(px|rem)/);
    }
  });
});

/**
 * TYPEFACE BY ROLE.
 *
 * The site shipped with two typefaces on one page and no rule saying which was
 * which, because the serif was assigned by CONTAINER rather than by role. On
 * /brand, an h2 inside a card rendered serif while an h2 at the top level of the
 * same page rendered sans. The h1 on the landing page was the only h1 on the
 * site that was not serif. Nothing was wrong with having two faces; what was
 * wrong was that which one you got depended on where you happened to sit.
 */
describe("typeface is chosen by role, never by container", () => {
  it("every heading in the document body takes the editorial face", () => {
    expect(globals()).toMatch(
      /:where\(main,\s*footer\)\s*:where\(h1,\s*h2,\s*h3,\s*h4\)\s*\{\s*font-family:\s*var\(--serif\)/
    );
  });

  it("no container re-assigns a typeface to a heading", () => {
    // `.card h2 { font-family: ... }` is the exact shape of the original bug.
    const css = globals();
    for (const m of css.matchAll(/^\s*([^@{}\n][^{}\n]*)\{([^}]*)\}/gm)) {
      const selector = m[1] ?? "";
      const body = m[2] ?? "";
      if (!/font-family/.test(body)) continue;
      if (!/\bh[1-4]\b/.test(selector)) continue;
      // The one role rule is allowed; anything else scoping a face to a
      // heading by its surroundings is the defect coming back.
      expect(selector.replace(/\s+/g, " ").trim()).toBe(
        ":where(main, footer) :where(h1, h2, h3, h4)"
      );
    }
  });

  it("a face is only ever set to re-resolve a nested theme scope", () => {
    // `font-family` is inherited and therefore already resolved at `body`
    // against the page's tokens. An element that renders a DIFFERENT theme
    // must restate it or the preview silently shows the page's face. That is
    // the only defensible reason to name a face outside the role rule, so the
    // test allows it exactly there and nowhere else.
    for (const r of ROUTES) expect(read(r)).not.toMatch(/fontFamily/);
    for (const f of componentFiles) {
      const src = readComponent(f);
      if (!/fontFamily/.test(src)) continue;
      expect(src, `${f} names a typeface`).toMatch(/data-theme/);
      // and only for the body face — headings are the role rule's business
      for (const m of src.matchAll(/fontFamily:\s*"([^"]*)"/g)) {
        expect(m[1]).toBe("var(--sans)");
      }
    }
  });
});


/**
 * The guide is only worth writing if it cannot quietly rot. These assertions
 * keep it present, reachable, and honest about which tests back it — so a rule
 * cannot be removed from the code while the document still claims it holds.
 */
describe("the design system document stays honest", () => {
  const ROOT = path.join(here, "..", "..");
  const guide = () =>
    fs.readFileSync(path.join(ROOT, "docs", "DESIGN-SYSTEM.md"), "utf8");

  it("exists and is reachable from the README and the site", () => {
    expect(fs.existsSync(path.join(ROOT, "docs", "DESIGN-SYSTEM.md"))).toBe(true);
    expect(fs.readFileSync(path.join(ROOT, "README.md"), "utf8")).toContain(
      "docs/DESIGN-SYSTEM.md"
    );
    // /plan renders the docs, so the guide ships with the deployed site
    expect(read("plan/page.tsx")).toContain("docs/DESIGN-SYSTEM.md");
  });

  it("every test file it names actually exists", () => {
    for (const m of guide().matchAll(/`((?:apps|packages)\/[^`]+\.test\.ts)`/g)) {
      const cited = m[1] ?? "";
      expect(fs.existsSync(path.join(ROOT, cited)), `${cited} is cited but missing`).toBe(true);
    }
  });

  it("documents the rules this file enforces", () => {
    const g = guide();
    for (const claim of [
      "--reading",
      ":has(",
      "grid-column: full",
      "var(--serif)",
      ".stack",
      "data-theme",
    ]) {
      expect(g, `the guide never mentions ${claim}`).toContain(claim);
    }
  });
});
