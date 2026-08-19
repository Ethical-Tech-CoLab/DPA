# Design system

This document exists because a day was lost to problems that should not have
cost an hour: page margins that differed per route, two typefaces on one page
with no rule saying which was which, and text wrapping at 720px inside a card
1,886px wide. None of it failed a build, a typecheck or a test. All of it was
obvious to anyone who looked at two pages in sequence.

The fixes are in the code. **This document is the part that stops them coming
back**, and it is written to be enforceable rather than admired. Every rule below
names the test that fails when the rule is broken. If a rule here has no test,
it is a preference and is labelled as one.

Read this before adding a page, a component, or a theme.

---

## 0. The one-paragraph version

Nothing in a page or a component may contain a colour, a font, a size, a margin
or a width. Those live in `packages/theme` as tokens, and in
`apps/web/app/globals.css` as the template that consumes them. A page supplies
content and semantic class names. If you find yourself typing a number into a
`.tsx` file, you have found either a missing token or a missing rule — add it in
the layer below and use it from above.

---

## 1. Why the failures happened

Each was the same mistake in a different costume: **a decision that should have
been made once was instead made per page, silently, by whoever wrote it last.**

| Symptom | Actual cause |
| --- | --- |
| Eight routes, three different left margins | The frame was an opt-in container class. `/capture` never opted in and ran edge to edge |
| Vertical spacing differed page to page | 40 inline `marginTop` literals. `18` and `24` were the *desktop* ends of fluid tokens, frozen — so the scale came apart on a phone |
| Two typefaces on one page | The serif was assigned by *container* (`.card h2`), so the same heading changed face depending on where it sat |
| A 1,886px card holding 720px of text | The measure was right; the container had no width rule at all and took everything the frame had |

The through-line: **conventions drift, structures do not.** Everything below is
expressed as a structure.

---

## 2. Token hierarchy

Three layers. Each may use the layer below it. Nothing may skip a layer.

```
packages/theme/src/themes/*.ts     what a brand decides    (colour, face, scale)
        ↓
packages/theme/src/css.ts          the variables emitted   (--bg, --measure, --gap)
        ↓
apps/web/app/globals.css           the template            (frame, rhythm, roles)
        ↓
app/**/page.tsx, components/*.tsx  content and class names (no values at all)
```

### Rules

1. **A page or component contains no raw value.** No hex, no `px`, no `rem`, no
   font name.
   *Enforced by* `layout.test.ts` — "no page or component hardcodes a width for a
   text container", "sets no block spacing inline", "a face is only ever set to
   re-resolve a nested theme scope".

2. **`globals.css` contains no colour literal** outside its print block.
   *Enforced by* `packages/theme/src/theme.test.ts`.

3. **A new token is added to `css.ts`, not to a page.** The variable list is
   asserted, so adding one is a deliberate act with a test change attached.

4. **Derive rather than add.** `--reading` is
   `calc(var(--measure) + 2 * var(--pad-card))` — not a new number. A rebrand
   that changes either token keeps them in step for free.

### The one exception, and why it is not a loophole

`BrandPreview` renders a *different* theme inside the current page and therefore
restates `font-family`. `font-family` is inherited, so it was already resolved
against the page's tokens at `body`; without restating it, a nested
`data-theme` scope silently shows the wrong face. The test allows a face to be
named **only** on an element that also carries `data-theme`, and only for the
body face. Headings need no equivalent, because the role rule resolves
`var(--serif)` at the heading, inside the scope.

---

## 3. Horizontal layout: the frame, the column, the breakout

Three concentric ideas. Learn them in this order.

### 3.1 The frame

`main` itself carries the page frame — width, gutters, top padding. It is an
**element selector**, specificity (0,0,1), weaker than any class. Two
consequences, both deliberate:

- every existing class rule still wins, so nothing had to be rewritten;
- **a new page cannot forget it**, because there is nothing to remember.

Do not add a wrapper div around a page's content. Do not add a second `<main>`.
*Enforced by* "the frame is applied to main, not opted into per page".

### 3.2 The reading column

`main` and `.section` lay out on named grid tracks:

```
[full-start]  1fr  [content-start]  min(100%, --reading)  [content-end]  1fr  [full-end]
```

Everything lands in `content` by default. That column is exactly one measure of
text plus a card's padding, so **a box that holds prose is the width of the prose
it holds**.

The column is *centred*, not pinned left. Capping children inside a wide centred
frame while pinning them left does not remove empty space, it moves it to the
right — which was the original complaint. Consequence, and it is intentional:

> **Prose and full-width content do not share a left edge. They share a centre
> axis.** The document has exactly two vertical edges — one for sentences, one
> for structure.

`.section` restates the same tracks so that a nested section hands its children
the same column. Without this the landing page put a section heading on one edge
and the card grid inside that same section on another.
*Enforced by* "main and .section share one set of tracks", "a nested section
hands its children the same column".

### 3.3 The breakout

Content that genuinely needs width spans `full`. That is what the extra space on
a large display is *for*: tables, card grids, the 3D viewer. Sentences are not.

Breakout is granted two ways, and both resolve to the same declaration:

```css
:is(main, .section) > :is(.section, .grid, .tbl-scroll, .exhibit-grid, …),  /* by class */
:is(main, .section) > :has(.grid, table, canvas, .kv, .timeline, …) {       /* by content */
  grid-column: full;
}
```

The `:has()` clause is the important one. **A class list goes stale the moment
somebody puts a table in a card and does not think to widen it.** With `:has()`
the container widens itself. Where `:has()` is unsupported the rule is skipped
and the container stays one measure wide — narrow, never broken.
*Enforced by* "breakout is granted by what a container holds, not only by class".

### 3.4 Grid tracks

`.grid-2` / `.grid-3` cap each track at `min(100%, var(--reading))` and centre
the row. With `1fr` each track absorbed whatever the frame had spare, so the
box-to-content mismatch *grew with the display* — worst on exactly the large
screens the responsive work was meant to serve (1.41× at 2560, 1.86× at 3440).

`min(100%, …)` is load-bearing: `var(--reading)` alone is a fixed length, and a
track will grow to it regardless of how narrow the container is. That overflowed
four routes at 390px.
*Enforced by* "grid tracks cap at the reading width instead of absorbing the display".

### 3.5 The safety net

```css
.card:not(:has(table, .grid, .kv, …)) { width: 100%; max-width: var(--reading); margin-inline: auto; }
```

A prose-only card is capped wherever it lands, including inside a container that
declares its own template. This should be a no-op — and it costs nothing if it
is. It is there so the *next* bespoke grid cannot silently reproduce the defect.

`width: 100%` is load-bearing and not redundant: a grid item with auto inline
margins loses its default `stretch` sizing and falls back to fit-content, which
collapsed these cards to 47px — the width of their own padding.

### 3.6 The single documented exception

`.hero` is the one full-bleed composition on the site. Above `120rem` it becomes
a two-column arrangement of title and lead, which is its own geometry and cannot
borrow the shared one. It begins on the `full` edge, so it aligns with the card
grid beneath it.

Below `120rem` it is an ordinary content-column child, because a single column of
prose belongs on the same edge as every other paragraph. **The breakout lives in
the media query, not in the base rule** — declaring it full-bleed at every width
put the landing page's opening sentence on a different edge from the rest of the
page at 1280px.

If you are about to add a second exception: don't. Add a class to the breakout
list instead, and if the geometry is genuinely bespoke, say so in a comment that
explains what the shared system could not express.

---

## 4. Vertical rhythm

Spacing between blocks is set **once**, by the template:

```css
main > * + * { margin-top: var(--gap-lg); }
```

- Headings are exempted and keep type-derived spacing: **more above** (a heading
  opens a section), **less below** (it binds to what it introduces). A flat
  rhythm flattens document structure, which is wrong on long-form routes.
- A container that owns its own spacing (`.page-head`, `.section`) is exempted
  rather than double-spaced.
- `.stack` is the primitive for a group of elements that need the standard gap
  inside a wrapper. Use it instead of margins on children.

**Never write spacing inline.** Not `style={{ marginTop: 24 }}`, not
`marginTop: "24px"`. The literals `18` and `24` are the large-viewport ends of
`--gap` and `--gap-lg`, which are fluid — hardcoding them freezes the desktop
value and the scale comes apart on a phone, at precisely the width where space
is scarcest.
*Enforced by* "the space between page blocks is defined once", and a per-file
assertion that no page or component sets a margin of 12px or more inline.

### The trap that was actually hit

`:not(.grid) > .card + .card` looked correct and was not: `.cap-metrics` and
`.cap-live` are `display: grid` **without** carrying the `.grid` class, so the
rule stacked a margin on top of the grid's own `gap` — a 27px step where every
other pair sat at 15px. **Do not select layout by class name when you mean to
select it by behaviour.** Use `.stack`, or `:has()`.

---

## 5. Typeface: by role, never by container

```css
:where(main, footer) :where(h1, h2, h3, h4) { font-family: var(--serif); }
```

| Role | Face | Used for |
| --- | --- | --- |
| Editorial | `--serif` | All headings; `.quote`; `.cap-class` |
| UI / body | `--sans` | Body copy, labels, buttons, navigation |
| Machine | `--mono` | Hashes, identifiers, scores, code |

Two faces on a page is a design decision. **Which face you get depending on
where you sit is a bug.** The original rules were `.card h2`, `.wrap > .card h2`
and similar — so on `/brand`, an `h2` inside a card rendered serif while an `h2`
at the top level of the same page rendered sans, and the landing page's `h1` was
the only `h1` on the site that was not serif.

*Enforced by* "every heading in the document body takes the editorial face" and
"no container re-assigns a typeface to a heading" — which walks every rule in
`globals.css` and fails on any selector that scopes a face to a heading by its
surroundings.

---

## 6. Colour

Two kinds of colour, and conflating them is a disclosure bug wearing a
stylesheet.

- **Chrome** — background, text, lines, accent. Free for a brand to change.
- **Semantic** — the five role colours and three coverage colours. These *carry
  the disclosure model*. A rebrand that collapses `enforcement` and `public` into
  two similar blues looks fine to whoever shipped it and is wrong.

Semantic colours are therefore validated: WCAG contrast **plus** a minimum
CIELAB separation (ΔE 22 for roles, against a just-noticeable difference of
~2.3). Every registered theme is checked, so a bad brand fails CI.

Keep the variables independent even when the values coincide. The original
`:root` had `--community`, `--accent` and `--warn` all literally `#d4a556`;
rebranding the accent would have silently dragged the source-community *role*
colour with it. Same colours today, separate variables, two tests locking the
independence.

*Enforced by* `packages/theme/src/theme.test.ts`.

---

## 7. Responsive

Breakpoints exist to serve the **viewport**, in both directions. Verified at
390 / 820 / 1280 / 1920 / 2560 / 3440 across three themes and eight routes.

- `--w` ramps between `FRAME_MIN` 1280 and `FRAME_MAX` 3440. Large-format
  displays (double-wide monitors, Surface Hubs) get more content, not more
  emptiness.
- Prose does **not** widen with the display. `--measure` is already 68–72ch,
  at the top of the readable 45–75ch range. Extra width goes to structure.
- Navigation collapses below `62rem` into a real disclosure panel. It was
  `overflow-x: auto`, which hid half the site on touch with no affordance.
- Nothing may overflow horizontally at any tested width.

---

## 8. How to add a page

1. Create `app/<route>/page.tsx`. Its root is a **fragment**, not a wrapper.
2. Open with `<header className="page-head">` containing an eyebrow `p.label`
   and one `h1`. Exactly one page head per route.
3. Write content as direct children. They land in the reading column
   automatically.
4. For something that needs width, use `.grid`, `.tbl-scroll`, or add `.wide`.
   Prefer letting `:has()` decide.
5. Add no margins, no widths, no colours, no fonts.
6. Add the route to `ROUTES` in `apps/web/layout.test.ts`.
7. Run `pnpm -r test`.

## 9. How to add a theme

1. Add `packages/theme/src/themes/<id>.ts`; inherit from `slate` and override
   only what differs.
2. Register it in the theme index.
3. Run `pnpm -r test`. Contrast and ΔE separation are checked for you; a brand
   that damages the disclosure model fails CI rather than shipping.
4. Check `/brand` — it renders the contrast report live.

## 10. How to verify a visual change

Source review does not catch layout defects; every defect in this document was
found by measuring rendered geometry and missed by reading code.

```
pnpm build:web            # then serve apps/web/out
```

Drive Chromium over the routes and **assert on measurements**: left edges,
container width versus the width of the widest text inside it, computed
`font-family`, `scrollWidth` versus `innerWidth`. Check at 390 and at 3440, not
just at your own screen size. Then re-check against the deployed site — the
Pages build has a `/DPA` basePath and has caught bugs localhost did not.

---

## 11. Tests that enforce this document

| File | Locks |
| --- | --- |
| `apps/web/layout.test.ts` | Frame on `main`; one page head per route; no inline spacing at or above the token scale; reading column tracks; `--reading` derived and registered; breakout by `:has()`; grid track caps; prose-card cap; typeface by role; no hardcoded widths |
| `packages/theme/src/theme.test.ts` | The emitted variable list; no colour literals; WCAG contrast; ΔE separation of role and coverage colours; independence of `--accent` from `--community` |

`layout.test.ts` covers **`components/*.tsx` as well as `app/**`**. Checking only
pages missed 31 of the 40 inline spacing literals, because components render most
of what is actually on screen.

---

## 12. Known preferences, not rules

These have no test and are open to argument:

- The landing hero opens taller than the seven content routes
  (`--head-top × 1.4`). It is a stated multiple with a test binding the two, so
  changing it to `1` makes every route open identically.
- Two typefaces rather than one. The serif carries editorial voice and the sans
  carries interface; a single-face system is defensible and would be a smaller
  thing to maintain.
- `--measure` at 68–72ch is at the wide end of comfortable. 60–66ch would be more
  conservative and would narrow every prose container in proportion.
