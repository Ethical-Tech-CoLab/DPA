# DPA — Digital Passport for Artworks

**This repository is a working monorepo, not a plan.** It consolidates five
separate prototypes from the AABC × SDA Bocconi research programme into one
pipeline, one passport, one score, and one disclosure model. The code runs, the
tests pass, CI is green, and the site is live.

- **Live site:** https://ethical-tech-colab.github.io/DPA/
- **Repository:** [`Ethical-Tech-CoLab/DPA`](https://github.com/Ethical-Tech-CoLab/DPA) — public
- **Tests:** 297 passing across the nine tested packages
- **Everything on the site runs on committed fixtures.** The scores are real — computed
  by the real scorer over real cited sources — but no live register was queried and no
  attestation was written to any chain. See [What is real and what is not](#what-is-real-and-what-is-not).

---

## 58 is worse than 28

This is the intellectual core of the whole system, so it comes first.

Two objects in the demo score low. The Bura askos scores **58 and is
structurally uncovered**. The Getty Bronze scores **28 and is well covered**.
The lower number is the safer object.

- **28, well covered** means the registers that ought to hold this object were
  able to look, and looked, and found six identifying hits. The number is about
  the object: records exist and they are consistent.
- **58, structurally uncovered** means no register could ever have named this
  object. The Bura askos came out of an unrecorded archaeological site; there is
  no accession, no theft report, nothing a stolen-property register could match.
  The number measures our blindness, not the object.

A score shown without its coverage class is not just incomplete — it inverts.
It would rank the uncoverable object as *more* trustworthy than the one the
registers actually cleared, and it would do this most confidently for exactly
the colonial and archaeological material the programme exists to serve. The
`assess` package therefore reports three numbers that are never combined
(confidence, coverage, forgery risk), and refuses to let coverage fold into the
score. The `/coverage` route on the live site walks this argument in full.

---

## What DPA is

**DPA** is the *Digital Passport for Artworks*: a research programme run by
**AABC** (Ars Pro Mundo) with **SDA Bocconi**, defined in *Annex A — Preliminary
Research Framework (February 2026)*. Its thesis:

> An artwork whose provenance is uncertain is currently invisible — it cannot be
> lent, studied, insured, or claimed, because surfacing it exposes its holder to
> legal and reputational risk. If a holder could register that object
> pseudonymously, prove the registration was immutable and time-stamped, and then
> disclose *different amounts of it to different parties* — public, museum,
> enforcement, source community — the object could re-enter scholarship without
> anyone first having to lose a lawsuit.

A passport here is not a certificate of authenticity and not a title deed. It is
a single signed record with as many lawful views as there are roles. The whole
system is built so that one record can be shown five ways without the holder
having to trust anyone downstream to redact it correctly.

---

## The live site

Seven routes, all statically exported and served from GitHub Pages:

| Route | What it shows |
|---|---|
| `/` | Overview: the pipeline, the three numbers, what is real |
| `/demo` | The four demo cases, each rendered in a chosen role |
| `/coverage` | The "58 is worse than 28" argument, worked over Bura and Getty |
| `/disclosure` | One signed record shown to five roles, with a leakage proof |
| `/exhibit` | A procedural 3D object with role-gated points of interest |
| `/brand` | Live rebranding, the token contract, and the validator report per theme |
| `/plan` | These documents, rendered from the repo markdown at build time |

The four demo cases and their real generated results:

```
bura-askos     score 58   structurally-uncovered   human-review   0/9 identifying
benin-bronze   score 48   structurally-uncovered   human-review   0/9 identifying
getty-bronze   score 28   well-covered             human-review   6/9 identifying
schiele-wally  score 28   well-covered             human-review   3/9 identifying
```

All four route to human review; nothing in the demo auto-issues. That is
correct behaviour, not a limitation — see [ADR-002](docs/DECISIONS.md#adr-002)
and defect #1 in the [meeting brief](docs/MEETING-BRIEF.md).

---

## Running it locally

Requires Node 20+ and pnpm. From the repository root:

```
pnpm install
pnpm fixtures                              # run the pipeline over the 4 cases
pnpm build:web                             # static export to apps/web/out
pnpm --filter @dpa/api start               # request-time API on :8787
pnpm --filter @dpa/agent start bura-askos museum
```

`pnpm fixtures` runs the seven-stage pipeline over the four demo cases and writes
one JSON file per (passport, role) under `apps/web/public/api`. It prints the
four results above; the output is deterministic, so a clean checkout reproduces
the published scores exactly.

The API serves the same records at request time. Role arrives in a header, and
there is no authentication (this is deliberate — see the package note below):

```
curl -H 'X-DPA-Role: museum' localhost:8787/passports/bura-askos
```

To check the whole workspace:

```
pnpm -r typecheck        # clean
pnpm -r test             # 297 tests
```

---

## The packages

Eleven packages under `packages/`, three apps under `apps/`. There is no
`contracts/` directory — the on-chain work was scoped but not built (see
[BACKLOG.md](BACKLOG.md)).

| Package | One honest sentence |
|---|---|
| `schema` | The one passport envelope, the role model, the disclosure tiers, and the single canonical hashing/signing contract (`contentHash` + `signableString`) that every other package depends on |
| `identity` | Image fingerprinting (SHA-256 + dHash), similarity and duplicate detection, forensic signals, and Gemini-based object identification |
| `evidence` | One connector interface over eight sources plus tiered register checks — the single evidence service, so nothing else talks to a source directly |
| `assess` | The three numbers that are never combined: the accumulation scorer, the coverage model, and forgery risk |
| `issue` | Two issuer classes that sign the *same bytes* — pseudonymous wallet (secp256k1) and accredited institution (ECDSA P-256 cert chain) — plus one verifier |
| `govern` | The confidentiality envelope: role-based redaction with a checked boundary, and EAS notarisation of the content hash only |
| `lifecycle` | Review routing (human-review vs auto-issue), StatusList2021 revocation, amendment, and claims |
| `payments` | The x402 micropayment mechanism for paid register lookups — testnet only, mechanism not economics |
| `pipeline` | The composition root: runs the seven stages in order and exposes `deliver(passport, role)` |
| `fixtures-build` | The four demo cases and the harness that runs the pipeline and writes the site's data |
| `theme` | Every visual token in the solution, defined once. Institutions rebrand by configuration; the validator refuses a brand that makes the five roles or three coverage classes hard to tell apart |

| App | One honest sentence |
|---|---|
| `apps/web` | Next.js static export (the live site). Redacts at **build** time, one JSON per (passport, role), so the disclosure guarantee is physically inspectable on a static host |
| `apps/api` | `node:http` server. Redacts at **request** time via the `X-DPA-Role` header. No auth by design — every response says so |
| `apps/agent` | A CLI that runs the pipeline for one case in one role: `start <case-id> [role] [--json]` |

Both `apps/web` and `apps/api` call the same single `deliver()` code path. The
architecture doc explains why both exist: [docs/ARCHITECTURE-v0.4.md](docs/ARCHITECTURE-v0.4.md).

---

## Deploying it under an institution's brand

A museum, a university or a ministry running this will want it to look like
theirs, and that must not require a fork. Every visual decision — colour, type
scale, corner radius, content width, wordmark, nav height — is a token in
[`packages/theme`](packages/theme). `apps/web` contains no colour literals at
all outside its print stylesheet; the CSS custom properties are generated from
the theme definitions at build time.

```
NEXT_PUBLIC_THEME=atrium pnpm build:web
```

Three brands ship with the repository — `slate` (default, dark),
`atrium` (light, museum) and `campus` (high-contrast, larger type for teaching
and projection). Adding a fourth is one file:

```ts
export const pinacoteca = defineTheme({
  id: "pinacoteca",
  label: "Pinacoteca",
  description: "House brand for a civic picture gallery.",
  colorScheme: "light",
  identity: { wordmark: "Brera", wordmarkAccent: "·", organisation: "Pinacoteca di Brera" },
  brand: { bg: "#fbfaf7", text: "#1b1a17", accent: "#8c2f39" },
});
```

Anything not overridden falls back to the default, so a brand is usually three
or four colours rather than a stylesheet.

**Not every token is free, and that is the interesting part.** Chrome —
background, surfaces, rules, body text, accent — can be anything. The five role
colours and three coverage colours cannot, because they carry meaning: they tell
a reader which disclosure tier they are looking at and whether the score beside
them can be trusted at all. A rebrand that quietly collapses `enforcement` and
`public` into two similar blues has not restyled the site, it has introduced a
disclosure bug wearing a stylesheet — and it will look completely fine to
whoever shipped it.

So those eight tokens are themeable but validated. `validateTheme` checks WCAG
contrast and enforces a minimum perceptual separation between role colours,
measured in **CIELAB** rather than by comparing hex values, because hex distance
is a poor proxy for whether two colours look different to a person. Every
registered theme is checked by a test, so a brand that hurts legibility fails CI
instead of shipping. The `/brand` route renders that report live.

---

## What is real and what is not

This section is load-bearing. The site is a demonstration, and it is honest
about being one.

**Real.** The pipeline runs end to end. The scorer, the coverage model, the
redaction boundary, and both signature schemes are the real implementations,
exercised by 297 passing tests. The four demo scores are computed by the real
scorer over real, cited sources. The redaction is not cosmetic: `apps/web`
writes a physically separate file per role, and `assertNoLeakage` fails the
build if an above-tier field escapes.

**Not real.**

- **No API keys exist in this repository.** The live-evidence and live-identify
  paths are implemented but throw without keys, and none are committed.
- **No live register was ever contacted.** Register checks run over committed
  fixtures. No result on the site came from INTERPOL, the Art Loss Register, or
  any real authority.
- **No attestation was written to any chain.** Notarisation runs in mock mode.
  The Base Sepolia constants are real and verified, but nothing was submitted.
- **The demo signing keys are deterministic.** They are seeded from a case id so
  the build reproduces. They must never sign anything of consequence.
- **The 3D geometry is procedural.** The exhibit object is generated in code, not
  a photogrammetry scan of a real artefact.

---

## The seven stages, in one diagram

```
1 IDENTIFY    image → object            identity: fingerprint, dHash, similarity
2 INVESTIGATE object → sourced claims   evidence: 8 sources + tiered registers
3 ASSESS      claims → three numbers    assess: score, coverage, forgery risk
4 ROUTE       three numbers → decision  lifecycle: human-review vs auto-issue
5 ENVELOPE    → confidentiality tiers   schema/govern: a tier for every field
6 ISSUE       → one signed passport     issue: wallet or institution, same bytes
7 NOTARISE    → content hash on-chain   govern: EAS, hash only, mock by default
```

Redaction is deliberately **not** a stage. It happens at the delivery boundary
in `deliver(passport, role)`, because making it a stage would imply a passport
is ever "the redacted one" — when one signed record has as many lawful views as
there are roles. The full account is in
[docs/ARCHITECTURE-v0.4.md](docs/ARCHITECTURE-v0.4.md).

---

## The nine decisions

Every ADR is now implemented and enforced in code. Each row links to the record,
which names the file that enforces it.

| # | Decision | Enforced in |
|---|---|---|
| [001](docs/DECISIONS.md#adr-001) | One passport envelope | `packages/schema/src/passport.ts` |
| [002](docs/DECISIONS.md#adr-002) | One scorer, accumulation from a floor of 30 | `packages/assess/src/scorer.ts` |
| [003](docs/DECISIONS.md#adr-003) | Coverage is mandatory and never folded into the score | `packages/assess/src/coverage.ts` |
| [004](docs/DECISIONS.md#adr-004) | Two issuer classes, one canonicalisation | `packages/issue/src/{wallet,institution}.ts` |
| [005](docs/DECISIONS.md#adr-005) | Confidentiality envelope, redacted at the boundary | `packages/govern/src/redact.ts` |
| [006](docs/DECISIONS.md#adr-006) | Notarise the hash only | `packages/govern/src/notarise.ts` |
| [007](docs/DECISIONS.md#adr-007) | VANGO stays a separate client | *(no code vendored)* |
| [008](docs/DECISIONS.md#adr-008) | One evidence service | `packages/evidence/src/gather.ts` |
| [009](docs/DECISIONS.md#adr-009) | No register check ever returns "clear" | `packages/schema` verdict enum |

Consolidation sharpened two of these. ADR-002 and ADR-003 were both changed by
defects that only surfaced once the packages were wired together — the score's
*direction* and the coverage model's treatment of never-recorded objects. Those
stories are in [docs/DECISIONS.md](docs/DECISIONS.md) and the
[meeting brief](docs/MEETING-BRIEF.md).

---

## Reading order

| If you are… | Read |
|---|---|
| Preparing for the AABC status meeting | **[docs/MEETING-BRIEF.md](docs/MEETING-BRIEF.md)** |
| Reviewing the decisions | [docs/DECISIONS.md](docs/DECISIONS.md) |
| Understanding the code | [docs/ARCHITECTURE-v0.4.md](docs/ARCHITECTURE-v0.4.md) |
| Tracing what came from where | [docs/INVENTORY.md](docs/INVENTORY.md) |
| Owning one of the five upstream repos | [docs/MIGRATION.md](docs/MIGRATION.md) |
| Looking for what is left to do | [BACKLOG.md](BACKLOG.md) |

---

## Attribution and licence

Most of `packages/` was written elsewhere, by other people, and vendored here;
every vendored file carries a `PROVENANCE:` header, and the full mapping is in
[ATTRIBUTION.md](ATTRIBUTION.md). VANGO contributes no code by design
([ADR-007](docs/DECISIONS.md#adr-007)).

Vendored code retains its original MIT licence. New code in this repository is
MIT. Planning and research documents in `docs/` are CC BY 4.0.
