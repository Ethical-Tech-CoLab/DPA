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
