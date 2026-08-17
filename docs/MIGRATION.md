# Migration plan — per repository

What each repo's owner is being asked to do, and what they are explicitly *not*
being asked to do.

**Nothing is switched off.** Every existing repo keeps working and keeps its
deployment for the whole of v0.4. Consolidation is additive until the end-to-end
demo works, then subtractive.

---

## Ground rules

1. **No repo is deleted.** Archived at most, and only after v0.4 demonstrably
   replaces it.
2. **No repo loses attribution.** Every package in the v0.4 monorepo records the
   repo and author it came from.
3. **Research papers stay with their repos.** `DPP-Paper.md`,
   `Provenance-Search-Paper.md` and `VANGO-Paper.md` are published outputs, not
   implementation detail.
4. **Deployments stay live** until v0.4 has a working equivalent.

---

## `yorkerhodes3/dpa-prototype`

**Role in v0.4:** the governance layer.

| Moves to | What |
|---|---|
| `packages/govern` | `schemas/confidentiality-envelope.json`, `lib/dpa.ts` (`canSee`, `redactForRole`), the role model |
| `packages/govern/notarise.ts` | `lib/eas.ts` — verified Base Sepolia addresses, attestation with mock fallback |
| `contracts/` | `DPARegistry.sol` + its 4 Foundry tests, unchanged |
| `apps/exhibit` | `exhibit/src/renderer.ts`, `hopeos-adapter.ts` |
| `packages/schema` | `schemas/dpa.schema.json` — as an **adapter**, not the canonical shape |

**Deleted:** the mocked INTERPOL/ALR lookup. Replaced entirely by
`packages/evidence` ([ADR-008](DECISIONS.md#adr-008)).

**Asks of the owner:**

- Decide whether the repo moves into the CoLab org. It is private, which is the
  direct cause of its disclosure model not propagating to the work built on it.
  This is [meeting decision #3](MEETING-BRIEF.md#5-decisions-we-need-from-aabc).
- Confirm the orthogonal `source-community` role was a provisional call, and
  support getting it reviewed by an actual source community
  ([ADR-005](DECISIONS.md#adr-005)).
- Source a real cultural-object scan to replace `DamagedHelmet.glb`.

---

## `arts-provenance-agent`

**Role in v0.4:** the core. More of this repo survives than any other.

| Moves to | What |
|---|---|
| `packages/schema` | `schema/passport.ts` — becomes **the canonical envelope** ([ADR-001](DECISIONS.md#adr-001)) |
| `packages/assess/scorer.ts` | `src/agent/assessRisk.ts` — becomes **the only scorer** ([ADR-002](DECISIONS.md#adr-002)) |
| `packages/assess/coverage.ts` | `src/lib/coverage.ts` — becomes **mandatory** ([ADR-003](DECISIONS.md#adr-003)) |
| `packages/evidence` | `src/tools/` — tavily, wikidata, registries |
| `packages/issue/wallet.ts` | `src/lib/signing.ts`, `src/wallet/` |
| `packages/payments` | `src/agent/payForCheck.ts`, `src/lib/spend.ts`, `src/vendor/server.ts` |
| `apps/agent` | `src/agent/orchestrator.ts`, `parseIntent.ts`, `timeline.ts` |

**Deleted:** `src/web/pipeline.ts`'s deduction scorer. It is not deprecated, not
feature-flagged — deleted. Its existence alongside `assessRisk.ts` is the defect
the peer reviewer identified.

**Asks of the owner:**

- **Close the ground-truth validation gap before the AABC meeting.** Run the
  canonical scorer over the hand-researched catalogue objects and publish machine
  scores beside the hand-authored narratives, labelled as to which is which. This
  is the highest-priority open peer-review finding and the one most likely to be
  asked about.
- Fix the "hallucinated history structurally impossible" overclaim → *unsourced*
  history.
- Reconcile the case count (five vs. fifteen vs. the uncounted Getty Bronze).
- Confirm the accumulation model is canonical, on the record.

**Not asked:** to change the epistemics. The coverage model, the register access
tiering, and the "no clear verdict" rule are being adopted programme-wide
verbatim. This repo won those arguments.

---

## `provenance-search`

**Role in v0.4:** evidence breadth and field capture. The shell retires; the
capabilities do not.

| Moves to | What |
|---|---|
| `packages/evidence` | Met, Art Institute of Chicago, MoMA static export, Wikipedia, Europeana connectors |
| `packages/identity` | Gemini Vision identification (`/api/identify`) |
| `apps/web` | Camera capture / Field Mode UX, PWA manifest + service worker |
| `packages/evidence` (as policy) | The `isGeneralKnowledge: true` labelling pattern, generalised to all unsourced assertions ([ADR-008](DECISIONS.md#adr-008)) |

**Deleted:** `computeConfidenceScore` in `server.js`. Not ported.

**Asks of the owner:**

- Accept that displayed scores will change when the canonical scorer replaces
  the deduction model, and rewrite the paper's score-bearing sections
  accordingly. The known arithmetic error becomes moot rather than fixed.
- Keep the Railway deployment live until `apps/web` has field capture working.
- Document the MoMA static export's snapshot date so it can be recorded in the
  passport.

**Not asked:** to give up Field Mode. Camera capture in front of the object is
the only realistic acquisition path for the users the framework describes, and
this repo is the only one that has it.

---

## `digital-passport-artworks`

**Role in v0.4:** lifecycle and forensics. Two distinct modules.

| Moves to | What |
|---|---|
| `packages/identity` | SHA-256 + dHash + angle count fingerprints; Harris corners, SIFT-style descriptors, RANSAC; optional MobileNet embeddings; ELA, noise-floor, spectral/edge energy |
| `packages/issue/institution.ts` | The ECDSA P-256 governance root → federated root → issuing CA chain ([ADR-004](DECISIONS.md#adr-004)) |
| `packages/lifecycle` | StatusList2021 revocation bitstring, reinstate, verification chain-of-trust |
| `packages/lifecycle/review.ts` | The human review gate — inconclusive risk or unconfirmed similarity routes to a human instead of auto-issuing |
| `packages/assess/forgery.ts` | The forgery-risk score — kept as a **separate number**, never merged with provenance confidence |

**Asks of the owner:**

- The record you sign changes shape ([ADR-001](DECISIONS.md#adr-001)), so
  signatures cover different bytes. This is a re-issue, not a rename.
- Duplicate detection needs to become persistent. Session-only is correct for
  the current demo and insufficient for a registry.
- Confirm the naming: **forgery risk** and **provenance confidence** are two
  different numbers on the same 0–100 scale, and readers will conflate them
  unless both are labelled everywhere.

**Not asked:** to abandon P-256 for secp256k1. The institutional CA chain is
being adopted as a first-class issuer class precisely because it models
*accreditation*, which the wallet model cannot. Both survive.

---

## `VANGO`

**Role in v0.4:** reference client of the public disclosure tier. **Stays its own
repository** ([ADR-007](DECISIONS.md#adr-007)).

**Nothing moves.** No code is extracted, no code is absorbed.

**Asks of the owner — three, all small:**

1. **Resolve the naming collision.** A VANGO passport belongs to a *visitor* and
   collects venues. A DPA passport belongs to an *object* and collects evidence.
   Same word, opposite subject. Any joint demonstration will confuse the
   audience unless one of them is renamed — "visitor passport" / "object
   passport" is sufficient.
2. **Read the catalogue from the API.** Replace the hardcoded `CATALOG` object in
   `src/App.jsx` with a fetch from the v0.4 public read endpoint. Codes then work
   without a redeploy, and VANGO becomes a live consumer rather than a mirror.
3. **Deep-link stamped artworks** that have a DPA passport to their public view.

**Why this is a promotion.** VANGO consuming the public tier and demonstrably
leaking nothing above it is a live test of the confidentiality envelope
([ADR-005](DECISIONS.md#adr-005)) that no internal document can substitute for.
It is also the visible end of "from shadow to light" — the point at which a
passport-shielded object is encountered by an ordinary visitor. Its catalogue
already contains `BURA01` (Bura Ceramics, Niger, AABC), which is exactly the
class of object the framework exists for.

**Revisit if** AABC prioritises visitor-facing deployment over research
infrastructure, in which case VANGO becomes the primary surface and
[ADR-007](DECISIONS.md#adr-007) should be reopened.

---

## Sequencing

Additive first, subtractive last.

| Step | Action | Nothing breaks because |
|---|---|---|
| 1 | Create the monorepo; publish `packages/schema` with adapters from all four existing shapes | Adapters mean existing repos keep their own formats |
| 2 | Extract `packages/assess`; re-run all quoted scores | Existing repos still run their own scorers |
| 3 | Extract `packages/evidence`; both retrieval stacks now import it | Behaviour is verified equivalent before switching |
| 4 | Build `packages/govern` + `apps/api` | New surface; nothing depends on it yet |
| 5 | Build `packages/issue` + `packages/lifecycle` | New surface |
| 6 | End-to-end demo through all seven stages, all four role views | The v0.4 deliverable |
| 7 | **Only now** — archive superseded shells, retire duplicated code, point deployments at `apps/api` | v0.4 has demonstrably replaced them |

Step 7 does not begin until step 6 works.
