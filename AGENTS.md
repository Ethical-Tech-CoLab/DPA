# Working in this repository

Read this before changing anything. It is short on purpose.

## Before you touch anything visual

**Read [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) first.** A day was lost to
layout and typography defects that were each a decision made per page instead of
once. The guide records the rules and names the test that enforces each one.

The rule that covers most cases: **a page or component contains no colour, font,
size, margin or width.** Those live in `packages/theme` (tokens) and
`apps/web/app/globals.css` (template). If you are typing a number into a `.tsx`
file, you have found a missing token or a missing rule — add it a layer down.

## Verifying a visual change

Source review does not catch layout defects. Every one found so far was found by
measuring rendered geometry and missed by reading code. Build, serve
`apps/web/out`, drive a browser, and assert on **measurements**: left edges,
container width versus the widest text inside it, computed `font-family`,
`scrollWidth` versus `innerWidth`. Check 390px and 3440px, not just your own
screen. Then re-check the deployed site — Pages builds with a `/DPA` basePath and
has caught bugs localhost did not.

## Commands

```
pnpm install
pnpm fixtures        # runs the real 7-stage pipeline over committed cases
pnpm -r typecheck
pnpm -r test         # 407 tests; CI runs the same
pnpm build:web       # static export to apps/web/out
```

There are no API keys and no network calls. Everything on the site is derived
from committed fixtures at build time, deliberately — see the README.

## Substance

- **Do not soften the recorded findings.** Several are uncomfortable and
  deliberately stated: C2PA covers no 3D format; the "Manhattan Bridge pedestrian
  capture protocol" could not be found in any public source; the capture band
  thresholds are ours and are not standards-backed; source-community consent is
  a blocking gap, not a weak one. If you disagree, argue with the specific number
  or claim in `docs/DECISIONS.md` — do not quietly reword it.
- **Two ADRs are reopened** (004, 007). They are questions, not positions.
- **Capture is Stage 0.** Scan quality is a third independent number and never
  folds into `confidenceScore`. A test asserts `@dpa/capture` does not import
  `@dpa/assess`; if that test is in your way, you are doing the wrong thing.
- **Coverage is never folded into the score.** A high score over uncovered
  registers is the most suspicious signal the model can produce, and must route
  to human review rather than auto-issue.

## Tests are the contract

Where a rule matters, it has a test, and the test names the defect it prevents.
When you fix something that a reviewer could plausibly undo six months from now,
add the assertion in the same change. That is the only part of this repository
that does not decay.
