# v0.4 target architecture

The design that results from applying the [decisions](DECISIONS.md) to the
[inventory](INVENTORY.md).

**Nothing here is built.** This is the target.

---

## Principle

The five projects are not five answers to one question. They are the consecutive
stages of one pipeline, built in parallel by teams who could not see each other's
stage. v0.4 does not invent a new architecture — it draws the one that already
exists.

---

## The pipeline

```
                        ┌────────────────────────────┐
   photo / code /       │  1. IDENTIFY               │
   text description ───▶│  Gemini Vision  ·  SHA-256 │
                        │  dHash · keypoints · dedup │
                        └─────────────┬──────────────┘
                                      │ candidate object + fingerprints
                        ┌─────────────▼──────────────┐
                        │  2. INVESTIGATE            │
                        │  ONE evidence service      │
                        │  Tavily · Wikidata · Met · │
                        │  AIC · MoMA · Europeana    │
                        │  + tiered register checks  │
                        └─────────────┬──────────────┘
                                      │ sourced claims, each with tier
                        ┌─────────────▼──────────────┐
                        │  3. ASSESS                 │
                        │  accumulation scorer       │
                        │  ────────────────────────  │
                        │  confidenceScore  0–100    │
                        │  coverageClass    ◀── never folded in
                        │  forgeryRisk      ◀── separate number
                        └─────────────┬──────────────┘
                                      │
                        ┌─────────────▼──────────────┐
                        │  4. ISSUE                  │
                        │  one signed envelope       │
                        │  ┌──────────┬───────────┐  │
                        │  │ wallet   │ instit'l  │  │
                        │  │ did:pkh  │ P-256 CA  │  │
                        │  └──────────┴───────────┘  │
                        └─────────────┬──────────────┘
                                      │
                        ┌─────────────▼──────────────┐
                        │  5. GOVERN                 │
                        │  confidentiality envelope  │
                        │  + EAS notarisation        │
                        │    (contentHash only)      │
                        └─────────────┬──────────────┘
                                      │
                        ┌─────────────▼──────────────┐
                        │  6. MAINTAIN               │
                        │  StatusList2021 revocation │
                        │  amendment · claim filing  │
                        └─────────────┬──────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
    ┌─────────▼────────┐   ┌──────────▼────────┐   ┌──────────▼────────┐
    │ 7a. ROLE VIEWS   │   │ 7b. 3D EXHIBIT    │   │ 7c. VANGO         │
    │ public / museum  │   │ artifact + POIs + │   │ visitor stamps    │
    │ enforcement /    │   │ provenance ribbon │   │ QR · EN/FR/IT     │
    │ source-community │   │                   │   │ (public tier only)│
    └──────────────────┘   └───────────────────┘   └───────────────────┘
```

---

## Package layout

A monorepo. Each package has exactly one owner and one reason to change.

```
dpa/
├── packages/
│   ├── schema/          ← canonical passport envelope (ADR-001)
│   │                      Zod types + JSON Schema + fixtures
│   │                      Nothing else defines a passport shape.
│   │
│   ├── identity/        ← stage 1
│   │                      image fingerprinting (SHA-256, dHash, keypoints,
│   │                      ELA, optional MobileNet), duplicate detection,
│   │                      Gemini Vision identification
│   │                      FROM digital-passport-artworks + provenance-search
│   │
│   ├── evidence/        ← stage 2 (ADR-008)
│   │                      one connector interface, all sources behind it
│   │                      registers/  — tiered, with signed caveats (ADR-009)
│   │                      FROM arts-provenance-agent/src/tools + provenance-search
│   │
│   ├── assess/          ← stage 3 (ADR-002, ADR-003)
│   │                      scorer.ts    — accumulation, THE only scorer
│   │                      coverage.ts  — mandatory, never folded into score
│   │                      forgery.ts   — separate number, never merged
│   │                      FROM arts-provenance-agent/src/agent/assessRisk.ts
│   │                           + arts-provenance-agent/src/lib/coverage.ts
│   │
│   ├── issue/           ← stage 4 (ADR-004)
│   │                      wallet.ts       — secp256k1 / EIP-191 / did:pkh
│   │                      institution.ts  — ECDSA P-256 CA chain
│   │                      canonicalise.ts — the hash both sign over
│   │                      FROM arts-provenance-agent + digital-passport-artworks
│   │
│   ├── govern/          ← stage 5 (ADR-005, ADR-006)
│   │                      envelope.ts   — field→tier map, canSee, redactForRole
│   │                      notarise.ts   — EAS on Base Sepolia
│   │                      FROM dpa-prototype  ← the framework's core contribution
│   │
│   ├── lifecycle/       ← stage 6
│   │                      StatusList2021 revocation, amendment, claim filing,
│   │                      human review queue
│   │                      FROM digital-passport-artworks
│   │
│   └── payments/        ← cross-cutting
│                          x402 / USDC on Base Sepolia for gated registers
│                          FROM arts-provenance-agent
│
├── apps/
│   ├── api/             ← the only thing that touches packages/govern.
│   │                      EVERY response is role-parameterised. Redaction
│   │                      happens here, never in a client. (ADR-005)
│   │
│   ├── web/             ← role-gated views + field capture (camera)
│   │                      FROM dpa-prototype + provenance-search
│   │
│   ├── agent/           ← the CLI research agent, retained
│   │                      FROM arts-provenance-agent
│   │
│   └── exhibit/         ← 3D artifact viewer, IRenderer abstraction
│                          FROM dpa-prototype
│
└── contracts/           ← DPARegistry.sol + EAS schema registration
                           FROM dpa-prototype

  ── separate repo ──
  VANGO                 ← consumes apps/api public tier only (ADR-007)
```

---

## The three numbers, and why they are three

A recurring failure across the existing repos is one number carrying several
meanings. v0.4 names three numbers and forbids combining them.

| Number | Question it answers | Range | Never |
|---|---|---|---|
| `confidenceScore` | *How much sourced provenance evidence exists?* | 0–100, accumulated from 30 | …adjusted by coverage |
| `coverageClass` | *Could that evidence have existed?* | `well-covered` / `partially-covered` / `structurally-uncovered` | …reduced to a number |
| `forgeryRisk` | *Is this image what it claims to be?* | 0–100 | …merged with `confidenceScore` |

**The rendering rule:** a `confidenceScore` may never be displayed without its
`coverageClass` adjacent to it. Sorting or ranking objects by score across
coverage classes is incorrect and should fail review.

Worked example, already in the codebase:

| Object | Score | Coverage | Reading |
|---|---|---|---|
| Rosetta Stone | 34/100 | structurally uncovered | *The registers could never have named this. The score reflects our blindness, not the object.* |
| Getty Bronze | 26/100 | well covered | *Records ought to exist here and they are thin. The score is about the object.* |

The lower number is the more informative one. Without coverage they are
indistinguishable and both readings are wrong.

---

## Disclosure model

Redaction is enforced in `apps/api`, driven by the signed `fieldTiers` map in the
passport. No client is trusted to redact.

```
              public   source-community   museum   enforcement   owner
title            ●            ●             ●           ●          ●
period           ●            ●             ●           ●          ●
image            ●            ●             ●           ●          ●
confidenceScore  ●            ●             ●           ●          ●
coverageClass    ●            ●             ●           ●          ●
notarisation     ●            ●             ●           ●          ●
─────────────────────────────────────────────────────────────────────
claimStatus      ○            ●             ●           ●          ●
custodianship    ○            ●             ●           ●          ●
sourceCommunity
  statement      ○            ●             ●           ●          ●
─────────────────────────────────────────────────────────────────────
dimensions       ○            ○             ●           ●          ●
condition        ○            ○             ●           ●          ●
loanEligibility  ○            ○             ●           ●          ●
─────────────────────────────────────────────────────────────────────
fullProvenance   ○            ○             ○           ●          ●
registerHits     ○            ○             ○           ●          ●
holderPseudonym  ○            ○             ○           ●          ●
contactEscrow    ○            ○             ○           ●          ●
─────────────────────────────────────────────────────────────────────
holderIdentity   ○            ○             ○           ○          ●
```

`source-community` is **orthogonal**, not a rung on the ladder: it sees the
public tier plus the source-community tier, and never sees museum or enforcement
internals.

> This table encodes a substantive claim about what source communities should and
> should not see, and **no source community has been consulted about it**. It is
> the single most important thing in this plan to validate with real
> stakeholders. See [ADR-005](DECISIONS.md#adr-005).

---

## Data flow for one registration

```
1.  Holder submits image + metadata (web or field capture)
2.  identity/  → sha256, dHash, keypoints; dedup against registry
                 ├── exact/near duplicate → block, return existing passport id
                 └── inconclusive        → human review queue (lifecycle/)
3.  identity/  → Gemini Vision proposes candidate object; holder confirms
4.  evidence/  → grounded search across permitted sources
                 → tiered register checks, each recording access/verdict/caveat
                 → x402 payment if a gated register is selected (payments/)
5.  assess/    → confidenceScore (accumulation)
                 coverageClass  (computed independently, never folded in)
                 forgeryRisk    (from identity/ signals)
6.  issue/     → canonicalise → contentHash → sign
                 issuerClass = wallet | institution
7.  govern/    → attach signed fieldTiers map
                 → EAS attest contentHash on Base Sepolia
8.  lifecycle/ → allocate StatusList2021 index (revocable from birth)
9.  api/       → serves the passport, redacted per requesting role
```

---

## What is deliberately still out of scope in v0.4

Carried forward unchanged from the framework prototype's non-goals:

- Real PII handling and a GDPR audit
- Real KYC, real custody, real money (x402 remains testnet USDC)
- Physical tagging — RFID / NFC / microdot (stub only)
- Fractional ownership, lending, insurance integration
- Mainnet, or any chain other than Base Sepolia
- The full restitution workflow

Added to the out-of-scope list for v0.4 specifically:

- **Merging VANGO** ([ADR-007](DECISIONS.md#adr-007))
- **Any new evidence source** beyond consolidating the existing ones — the
  source-bias fix is P0 in the backlog but it is a v0.5 body of work, because it
  requires validation against known cases, not just new connectors
- **Real haptics or voice** in the exhibit — HopeOS does not provide them, and
  the `IRenderer` abstraction is where that would land later
