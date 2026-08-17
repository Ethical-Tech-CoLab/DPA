# Inventory — all work to date

An assessment of the five working systems in the DPA programme as of the v0.4
consolidation review. Each entry records what the project *is*, what it uniquely
contributes, where it conflicts with the others, and what v0.4 does with it.

Assessments are of **fit for consolidation**, not of quality. Every project here
works, and several are more polished than the framework prototype they derive
from.

---

## 1. `yorkerhodes3/dpa-prototype` — the framework reference implementation

**What it is.** A vertical slice of Annex A: a pseudonymous owner registers one
artwork, the system hashes it, writes an attestation to Base Sepolia via the
Ethereum Attestation Service, and renders the passport through role-gated views.
Ships with a 3D exhibit module.

| | |
|---|---|
| Stack | Next.js 14 App Router · TypeScript strict · three.js · Solidity 0.8.24 + Foundry · pnpm |
| Chain | Base Sepolia (chainId 84532) · EAS `0x4200…0021` · SchemaRegistry `0x4200…0020` |
| Visibility | Private |
| State | 12/12 milestones complete · build + typecheck clean · 8/8 routes 200 · 4/4 contract tests pass |

**Unique contributions — present in no other repo.**

1. **The confidentiality envelope.** `schemas/confidentiality-envelope.json` plus
   `lib/dpa.ts` (`canSee()`, `redactForRole()`) — a declarative field→role
   visibility map. This is the framework's central governance mechanism and it
   exists only here.
2. **The role model.** `public < museum < enforcement < owner` is linear, but
   **`source-community` is orthogonal**: it sees public and source-community
   fields only, never museum or enforcement internals. `claimStatus` and
   `custodianship` are promoted into the source-community tier so a community
   can see claims made on its own objects. *This was an implementation decision
   made under time pressure and has never been validated with an actual source
   community — see [BACKLOG](../BACKLOG.md).*
3. **On-chain notarisation.** A real EAS integration with a verified schema
   (`bytes32 contentHash, string passportId, uint8 confidentialityLevel`) —
   deliberately minimal, no PII on-chain — plus a `DPARegistry.sol` contract with
   `register` / `flagClaim` / `attestCustodianship`.
4. **The 3D exhibit.** An `IRenderer` abstraction with a HopeOS adapter, being
   the only realisation anywhere in the programme of the "shadow to light" thesis
   at the public-visibility end.

**Weaknesses.**

- **No real evidence.** Provenance research is a mocked INTERPOL/ALR lookup
  returning `no match | possible match | claimed`. Every derivative repo is
  dramatically stronger here.
- The 3D artifact is a placeholder — Khronos `DamagedHelmet.glb`, a sci-fi
  helmet, not a cultural object.
- HopeOS turned out to be a single HTML file (MediaPipe Hands + a Three.js
  particle globe), **not** the haptic/voice SDK the plan assumed. The adapter
  isolates this, but the exhibit's haptic and voice ambitions are unbacked.
- Private, so the students building on it could not see it.

**v0.4 disposition — PROMOTE.** The confidentiality envelope and the
notarisation spine become the governance layer of the whole system
([ADR-005](DECISIONS.md#adr-005), [ADR-006](DECISIONS.md#adr-006)). The mocked
lookup is deleted and replaced by the real evidence service
([ADR-008](DECISIONS.md#adr-008)). The exhibit becomes an optional presentation
client.

---

## 2. `Ethical-Tech-CoLab/arts-provenance-agent` — the most mature work

**What it is.** An "x402-native" research agent: it takes an object, grounds
claims against a permitted source list via Tavily, runs tiered stolen-art
register checks, optionally pays for premium checks with USDC micropayments over
Coinbase x402 on Base Sepolia, and emits a signed JSON-LD Verifiable Credential.

| | |
|---|---|
| Stack | TypeScript (~28 modules) · Zod schemas · Tavily · Wikidata SPARQL · Coinbase x402 |
| Identity | `did:pkh` · secp256k1 · EIP-191 `personal_sign` over a keccak256 content hash |
| Visibility | Public |
| Artefacts | `DPP-Paper.md` · **`PEER-REVIEW.md`** · `BACKLOG.md` · `SECURITY.md` · `fixtures/` · `schema/` |

**This is the strongest work in the programme**, and the only part of it that
has been through independent academic review (verdict: *minor revisions*). That
peer review is a credibility asset AABC will care about and should be surfaced
in the meeting, including the findings it has not yet closed.

**Unique contributions.**

1. **The coverage model** (`src/lib/coverage.ts`). Records, per register, what
   kinds of loss it can hold, for which regions, and whether it can identify an
   individual object at all — then reports how many registers *could* have named
   this object. It **never adjusts the score**, deliberately: folding coverage in
   would recreate the one-number-two-meanings defect it exists to fix. The score
   is declared comparable only within a coverage class. See
   [ADR-003](DECISIONS.md#adr-003).
2. **"No register check can return *clear*."** The strongest available negative
   is `no-evidence-found`. Encoded in the schema's `verdict` enum, not merely in
   prose. See [ADR-009](DECISIONS.md#adr-009).
3. **Tiered register access**, recorded in the signed credential. Only Wikidata
   is genuinely machine-queryable; INTERPOL, FBI NSAF, Carabinieri TPC, the
   German Lost Art Foundation and the Getty Provenance Index are
   domain-scoped search or human referral only. The schema carries `access`,
   `verdict`, `method`, `caveat` and `officialSearch` **together**, signed, so a
   verdict cannot be stripped from the caveat that qualifies it.
4. **Per-claim evidence provenance.** Every `TimelineEvent` requires a `source`
   URL, a `sourceType`, a `verifiedBy` authority and a `VerificationTier`
   (`verifiedByAuthority` / `reportedInPress` / `inferred`). No source, no claim.
5. **Payment rails.** x402 micropayments for gated commercial registers — the
   only answer anywhere in the programme to "who pays for a lookup."
6. **Intellectual honesty about its own bias.** `AUTHORITATIVE_DOMAINS` is five
   Western institutions plus one commercial register; the repo states plainly
   that this searches worst exactly where the motivating harm lives.

**Known-open weaknesses (self-declared, from its own `BACKLOG.md` and `PEER-REVIEW.md`).**

- **Two disagreeing scorers inside this one repo.** The CLI agent
  (`src/agent/assessRisk.ts`) accumulates from a base of 30; the web pipeline
  (`src/web/pipeline.ts`) deducts from 100. They disagree on the same object.
  The peer review designated the accumulation model canonical; the deduction
  model still ships.
- **Overclaim retracted mid-document.** §04/§01 claim "hallucinated history
  structurally impossible"; §13 concedes a false claim wearing a real source URL
  is not prevented. The correct claim is that *unsourced* history is
  structurally impossible.
- **Nothing validated against ground truth.** It is unclear whether showcased
  scores were computed or hand-authored.
- Case-count inconsistency across the paper (five vs. fifteen vs. a sixth object).
- Not integrated with any UI other than its own; no disclosure control at all.

**v0.4 disposition — PROMOTE TO CORE.** Its passport schema becomes the canonical
envelope ([ADR-001](DECISIONS.md#adr-001)), its accumulation scorer becomes the
single scorer ([ADR-002](DECISIONS.md#adr-002)), its coverage module becomes
mandatory ([ADR-003](DECISIONS.md#adr-003)), and its tool layer absorbs
`provenance-search`'s connectors ([ADR-008](DECISIONS.md#adr-008)). Its
open peer-review findings carry over into the v0.4 backlog rather than being
closed by the merge.

---

## 3. `Ethical-Tech-CoLab/provenance-search` — evidence breadth and field capture

**What it is.** "Arts & Artifacts — Provenance Intelligence." An Express app
offering three ways in — text form, image upload, and **live camera capture** —
that identifies an object with Gemini Vision and then verifies it across eight
sources.

| | |
|---|---|
| Stack | HTML/JS · Express (`server.js`) · Gemini · PWA manifest + service worker |
| Deployed | `https://provenance-search-production.up.railway.app` |
| Sources | Tavily · The Met · Art Institute of Chicago · MoMA · Wikipedia · Wikidata SPARQL · Europeana · Gemini |
| Visibility | Public |

**Unique contributions.**

1. **Field Mode.** Camera capture on a phone, in a museum, in front of the
   object. This is the only realistic acquisition path for the actual users the
   framework describes, and no other repo has it.
2. **Image → object identification** via Gemini Vision (`/api/identify` →
   `/api/verify`). The agent assumes you already know what the object is.
3. **Breadth of free sources**, including a bundled 3.7 MB gzipped MoMA static
   export used because the live API is Cloudflare-blocked — a pragmatic solution
   worth keeping.
4. **The "general knowledge fallback."** For famous works it will answer from
   model knowledge but labels the result `isGeneralKnowledge: true`, never marks
   it `verified`, and auto-attaches a medium-severity flag. This is a good
   pattern and should be generalised.
5. Its own research paper and backlog, with the same hostile-but-fair
   self-review discipline as the agent.

**Weaknesses.**

- **A third scoring algorithm.** `computeConfidenceScore` in `server.js` starts
  at 100 and deducts 30 per custody gap, 25 if fewer than three of seven sources
  verified, 10 per high-severity flag, 10 for anomalous valuation. It conflicts
  with *both* of the agent's models.
- Its own backlog concedes the arithmetic in the paper is wrong in the one place
  the reader is invited to check it (3 × 30 leaves 10, not 0).
- No signing, no passport artefact, no disclosure control, no persistence.
- Duplicates the agent's Tavily and Wikidata integration with a different
  allow-list.

**v0.4 disposition — ABSORB, then RETIRE the shell.** The connectors, the Gemini
Vision identification step, and the field-capture UX move into v0.4. The
`computeConfidenceScore` function is **deleted**, not ported
([ADR-002](DECISIONS.md#adr-002)). The Railway deployment stays live as a demo
until v0.4 has a working equivalent.

---

## 4. `Ethical-Tech-CoLab/digital-passport-artworks` — lifecycle and forensics

**What it is.** A single-file, fully client-side walk through the entire
passport lifecycle: upload → fingerprint → similarity search → forensic signal
fusion → risk scoring and routing → certificate chain → issuance → revocation →
verification. Originally by [@ChristineLumen](https://github.com/ChristineLumen).

| | |
|---|---|
| Stack | Vanilla HTML/CSS/JS, single file, no build · Web Crypto API · Canvas API · optional TensorFlow.js MobileNet |
| Live | `https://ethical-tech-colab.github.io/digital-passport-artworks/` |
| Visibility | Public |

**Unique contributions.**

1. **The only complete lifecycle.** Every other repo issues; this one issues,
   **revokes**, reinstates, and verifies. Revocation uses a StatusList2021-style
   signed bitstring. No other repo has any answer to "this passport was wrong."
2. **Institutional PKI.** A real three-tier ECDSA P-256 chain — governance root
   → federated root → issuing CA — generated in-browser. This models
   *accreditation*, which the wallet-based model in the agent does not. See
   [ADR-004](DECISIONS.md#adr-004).
3. **Image forensics and duplicate detection.** Three independent fingerprints
   (SHA-256, perceptual dHash, angle count) plus multi-scale keypoint matching
   (Harris corners, SIFT-style descriptors, RANSAC), optional MobileNet
   embeddings, block-relative ELA, noise-floor and spectral/edge energy checks.
   This directly serves a framework requirement — *"has this object already been
   registered under a different identity?"* — that nothing else addresses.
4. **A human review gate.** Inconclusive risk or unconfirmed similarity routes
   to a human instead of auto-issuing. The only repo that models the
   human-in-the-loop the framework requires.
5. **Tamper demonstration.** You can edit the passport JSON in the browser and
   watch verification fail — an unusually effective demo of why signing matters.

**Weaknesses.**

- **Session-only.** No persistence; refresh clears everything. Duplicate
  detection therefore proves the pipeline, not a registry — which the README is
  honest about.
- Its crypto is P-256 / Web Crypto, incompatible with the agent's secp256k1 /
  EIP-191 wallet signatures.
- Its risk score is a fourth scoring surface (forgery risk, not provenance
  confidence — the two are legitimately different, but this is not stated
  anywhere and readers will conflate them).
- No provenance research at all — it assesses the *image*, not the history.

**v0.4 disposition — ABSORB AS TWO MODULES.** (a) The issuance/revocation
lifecycle and the institutional CA chain become the second issuer class
([ADR-004](DECISIONS.md#adr-004)) and the revocation service. (b) The image
fingerprinting and forensic fusion become the identity/dedup stage of the
pipeline. Note explicitly that **forgery risk and provenance confidence are two
different numbers** and must never be merged.

---

## 5. `Ethical-Tech-CoLab/VANGO` — the visitor layer

**What it is.** A mobile-style art passport for collecting stamps at art
experiences. Scan a QR code or type a code, earn a stamp with a custom vintage
illustration, artist, venue and date. Bio page, settings, dark/light theme, and
full UI translation across English, French and Italian.

| | |
|---|---|
| Stack | React · Vite · lucide-react · localStorage |
| Live | `https://ethical-tech-colab.github.io/VANGO/` |
| Visibility | Public |
| Notable | A realistic 3D page-turn book UI; all authentication was deliberately removed |

**Unique contributions.**

1. **The only consumer-facing surface in the programme.** Everything else is
   built for researchers, museums or enforcement. VANGO is built for a visitor.
2. **Multilingual from the start** (EN/FR/IT) — the only repo that treats
   internationalisation as a requirement rather than a later concern, which
   matters for a programme whose stakeholders are Italian, French and
   Anglophone.
3. **A physical→digital bridge** via QR codes on installation signage.
4. Its catalogue already includes real programme context — `BURA01`
   ("Bura Ceramics", Niger, AABC) sits alongside the fictional entries, which is
   exactly the kind of object the framework is about.

**Weaknesses relative to the core.**

- It is a *stamp collection* app, not a provenance instrument. Its "passport" and
  the DPA "passport" are different objects that share a name — a genuine source
  of confusion in any joint demo.
- `localStorage` only; stamps are unverifiable and trivially forged. That is
  fine for its purpose and unacceptable for the core.
- Authentication was removed, so there is no notion of who a holder is.
- Its catalogue is a hardcoded `CATALOG` object in `src/App.jsx`.

**v0.4 disposition — KEEP AS A CLIENT, DO NOT FOLD IN.** See
[ADR-007](DECISIONS.md#adr-007) for the full argument. Summary: its concern
(visitor engagement) is orthogonal to provenance assurance, and merging it would
put an unauthenticated localStorage app inside the trust boundary. Instead it
becomes the **reference consumer of the public disclosure tier** — the
demonstration that a role-gated passport can safely drive a public-facing
product. This is a promotion, not a demotion: it makes VANGO the visible end of
"from shadow to light."

Two changes are asked of it: resolve the passport-name collision, and read its
catalogue from the v0.4 public API instead of a hardcoded object.

---

## Cross-cutting conflict summary

| Conflict | Repos involved | Severity | Resolution |
|---|---|---|---|
| **Three provenance confidence scores that disagree** | agent (×2), provenance-search | **Critical** — undermines the auditability thesis | [ADR-002](DECISIONS.md#adr-002) |
| **Two cryptographic trust models** | agent (secp256k1/`did:pkh`), digital-passport-artworks (P-256 CA chain) | **High** | [ADR-004](DECISIONS.md#adr-004) — keep both, as issuer classes |
| **Four passport data shapes** | all four | **High** | [ADR-001](DECISIONS.md#adr-001) |
| **Duplicate evidence retrieval** | agent, provenance-search | Medium | [ADR-008](DECISIONS.md#adr-008) |
| **Disclosure control exists in exactly one repo** | dpa-prototype only | **Critical** — it is the framework's core idea | [ADR-005](DECISIONS.md#adr-005) |
| **Coverage epistemics exist in exactly one repo** | agent only | **Critical** — without it scores mislead on the motivating population | [ADR-003](DECISIONS.md#adr-003) |
| **No revocation anywhere but one repo** | digital-passport-artworks only | Medium | absorbed |
| **"Passport" means two different things** | VANGO vs. everything else | Low but demo-breaking | [ADR-007](DECISIONS.md#adr-007) |
| **Forgery risk vs. provenance confidence conflated** | digital-passport-artworks | Medium | Two named scores, never merged |
| **Western source bias** | agent, provenance-search | **High, and self-declared** | Carried into [BACKLOG](../BACKLOG.md) as a first-class item |

---

## Maturity ranking, for planning purposes

1. **`arts-provenance-agent`** — peer-reviewed, typed, schema-driven, honest
   about its limits. The natural core.
2. **`provenance-search`** — deployed, broad, real users possible today.
3. **`digital-passport-artworks`** — complete lifecycle, real crypto, but
   session-scoped.
4. **`VANGO`** — polished and finished for what it is; smallest scope.
5. **`dpa-prototype`** — architecturally the most important and functionally the
   least complete. It defines the shape of the problem; the others solved parts
   of it better.

That last line is the honest summary of the programme's position, and it is a
good position: the framework was right about the structure, and the derivative
work has outrun it on substance. v0.4 is the merge that lets both count.
