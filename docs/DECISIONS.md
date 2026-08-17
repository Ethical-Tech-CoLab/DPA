# Architecture decisions — v0.4

Each decision records the conflict, the choice, the alternative rejected, and the
cost. None of these are ratified. Any of them may be reopened, and the
[AABC feedback](MEETING-BRIEF.md#aabc-feedback--to-be-completed) — which is not
yet recorded anywhere — should be tested against every one.

Status legend: **Proposed** · **Ratified** · **Superseded**

---

<a name="adr-001"></a>
## ADR-001 — One passport envelope, derived from `arts-provenance-agent`

**Status:** Proposed

### Conflict

Four incompatible representations of "a passport":

| Repo | Representation |
|---|---|
| `dpa-prototype` | JSON Schema (`schemas/dpa.schema.json`) + an EAS attestation |
| `arts-provenance-agent` | Zod-typed JSON-LD Verifiable Credential, `contentHash` + EIP-191 signature |
| `digital-passport-artworks` | In-browser record signed by an issuing CA, with a revocation bitstring |
| `VANGO` | A `localStorage` stamp — unrelated object, same word |

Nothing validates against anything else. There is no way to demonstrate the
programme as one system.

### Decision

Adopt `arts-provenance-agent`'s `schema/passport.ts` as the canonical envelope
and extend it. It wins because it is the only representation that is
simultaneously **typed** (Zod, so validation is executable rather than
documentary), **signed over a canonical content hash excluding the signature**,
**carrying evidence provenance per claim** (`source`, `sourceType`, `verifiedBy`,
`tier`), and **peer-reviewed**.

Extensions required for v0.4:

```ts
Passport = {
  // --- retained from arts-provenance-agent ---
  "@context", type, id, artwork, provenanceTimeline,
  riskAssessment: { confidenceScore, flags },
  premiumChecks, registryChecks,
  issuer, issuedAt, contentHash, signature,

  // --- NEW: from arts-provenance-agent/src/lib/coverage.ts, promoted (ADR-003) ---
  coverage: {
    class: "well-covered" | "partially-covered" | "structurally-uncovered",
    acquisitionMode: AcquisitionMode,
    registersApplicable: number,
    registersSearched: number,
    rationale: string,
  },

  // --- NEW: from dpa-prototype (ADR-005) ---
  disclosure: {
    envelopeVersion: string,
    fieldTiers: Record<JSONPointer, DisclosureTier>,
    defaultTier: DisclosureTier,
  },

  // --- NEW: from digital-passport-artworks (ADR-004, revocation) ---
  issuerClass: "pseudonymous-wallet" | "accredited-institution",
  credentialStatus: {
    type: "StatusList2021Entry",
    statusListIndex: number,
    statusListCredential: string,
  },

  // --- NEW: from digital-passport-artworks (image forensics) ---
  objectIdentity: {
    sha256: string,
    dHash: string,
    embeddingRef: string | null,
    duplicateOf: string | null,
    forgeryRisk: { score: number, signals: ForensicSignal[] } | null,
  },

  // --- NEW: from dpa-prototype (ADR-006) ---
  notarisation: {
    chain: "base-sepolia",
    easUid: string | null,
    txHash: string | null,
    attestedAt: string | null,
  } | null,
}
```

### Rejected alternative

A new neutral schema designed from scratch. Rejected: it would discard the one
artefact that has survived external review, and "design a new format" is how
consolidation efforts die.

### Cost

Three repos need adapters. `digital-passport-artworks` in particular currently
signs a differently-shaped record, so its signature covers different bytes —
this is not a rename, it is a re-issue.

---

<a name="adr-002"></a>
## ADR-002 — One canonical scorer: the accumulation model

**Status:** Proposed

### Conflict

Three algorithms produce a "confidence score" on a 0–100 scale, and they
disagree about the same object:

| Where | Model |
|---|---|
| `arts-provenance-agent/src/agent/assessRisk.ts` | **Accumulate** from a base of 30. +18 authoritative source, +8 press, −12 undated early history, −20 for a further gap class |
| `arts-provenance-agent/src/web/pipeline.ts` | **Deduct** from 100 |
| `provenance-search/server.js` `computeConfidenceScore` | **Deduct** from 100. −30 per custody gap, −25 if <3 of 7 sources verified, −10 per high-severity flag, −10 anomalous valuation |

The agent's own peer review (22 Jul 2026) called this out inside a single repo:
*"Two disagreeing scoring systems undermine the auditability thesis."* Across
repos it is worse — the same object can be presented to AABC with three
different numbers depending on which demo is open.

### Decision

**The accumulation model in `assessRisk.ts` is canonical.** The two deduction
models are deleted, not deprecated.

Rationale: the deduction models start from an implicit assertion that an object
is trustworthy until evidence removes trust. That is exactly backwards for this
domain and it is the same error the coverage model exists to correct — an object
with no published history is not a 100 waiting to be reduced, it is a low score
that evidence has not yet raised. The accumulation model's base of 30 encodes
"nothing is known," which is the honest starting position.

Secondary rationale: the peer review already designated it, and re-litigating a
decision an external referee endorsed is unforced.

### Rejected alternatives

- *Keep both and show both.* Rejected: two numbers is the defect, not the fix.
- *Average them.* Rejected: an average of two models with different semantics has
  no meaning at all.
- *Deduction model, because 100 is more intuitive to a lay reader.* Rejected on
  the substantive grounds above. Intuitive-but-wrong is the worse failure here.

### Cost

`provenance-search`'s displayed scores all change. Its research paper cites
specific scores and will need re-running and re-writing. The paper's known
arithmetic error becomes moot rather than fixed.

### Required follow-up

The peer review's finding that **nothing was validated against ground truth**
remains open. Before v0.4 shows a score to AABC, run the canonical scorer over
the hand-researched catalogue objects and publish machine scores beside the
hand-authored narratives, labelled as to which is which.

---

<a name="adr-003"></a>
## ADR-003 — Coverage is mandatory, and is never folded into the score

**Status:** Proposed

### Decision

`arts-provenance-agent/src/lib/coverage.ts` is promoted from one repo's internal
module to a **required, signed field of every passport** and a **required
element of every UI that displays a score**.

Two hard rules:

1. **Coverage never adjusts the confidence score.** Folding it in would produce
   one number meaning two things, which is the defect being fixed.
2. **A score is only comparable to other scores in the same coverage class.**
   Any UI that ranks, sorts, or compares scores across coverage classes is
   incorrect, and any score rendered without its coverage class is a bug.

### Why this is the most important decision in the plan

The confidence score is mechanically a count of how much published evidence was
found. Where the documentary record is dense, a hole in it is itself evidence.
Where no record was ever created — colonial acquisitions, unexcavated
archaeological material, objects taken from communities that no institution
inventoried — finding nothing tells you nothing.

Both produce the same low number, and **the low-coverage case is the motivating
population of this entire programme**. A DPA that scores naively would
systematically penalise exactly the objects it exists to bring into the light.
The worked example already in the codebase: the Rosetta Stone scores 34/100 as
*structurally uncovered*; the Getty Bronze scores 26/100 as *well covered*. The
lower number is the more informative one. Without the coverage class those two
results are indistinguishable and both readings are wrong.

### Cost

Every score-rendering surface in every repo changes. This is the largest UI
change in the consolidation, and it is non-negotiable.

---

<a name="adr-004"></a>
## ADR-004 — Two issuer classes, not one trust model

**Status:** Proposed

### Conflict

| Repo | Model |
|---|---|
| `arts-provenance-agent` | `did:pkh` · secp256k1 · EIP-191 over keccak256. **The wallet is the PKI.** Decentralised, pseudonymous, self-sovereign |
| `digital-passport-artworks` | ECDSA P-256 · Web Crypto · governance root → federated root → issuing CA. **Institutional accreditation.** Hierarchical, revocable, auditable |

These are genuinely different trust architectures. Curves and signature formats
differ; more importantly the *meaning* of a signature differs.

### Decision

**Support both, as two issuer classes over one envelope.**

| Class | Signs with | Means | Serves |
|---|---|---|---|
| `pseudonymous-wallet` | secp256k1 / EIP-191, `did:pkh` | *"An identified-but-unnamed party asserts this, and cannot later deny it"* | The holder registering an uncertain object without exposing identity |
| `accredited-institution` | ECDSA P-256, CA chain to a governance root | *"An accredited body vouches for this, and its accreditation can be revoked"* | Museums, registries, and the AABC governance layer |

`issuerClass` is a discriminator on the envelope. Verifiers select the
verification path from it. Both classes carry the same `credentialStatus`
revocation entry.

### Why not pick one

Picking one breaks the framework. Requiring institutional accreditation destroys
the pseudonymity the whole thesis depends on — a holder who must be named will
not register. Requiring a self-signed wallet destroys institutional trust — a
museum cannot rely on an anonymous assertion, and enforcement certainly cannot.

The framework needs *both parties in the same registry*, which means both
signature meanings must coexist. What was read as a conflict is actually the two
halves of the requirement, discovered independently by two teams.

### Cost

Two verification paths, two key-management stories, and a real governance
question — **who operates the governance root?** — that is a policy decision for
AABC, not an engineering one. Flagged in the [meeting brief](MEETING-BRIEF.md).

---

<a name="adr-005"></a>
## ADR-005 — The confidentiality envelope becomes cross-cutting

**Status:** Proposed

### Decision

Role-gated disclosure moves from a single repo's rendering concern to a property
of the passport itself. Every field carries a disclosure tier; redaction happens
at the API boundary, not in the view layer.

Roles:

```
public  <  museum  <  enforcement  <  owner        (linear)

source-community                                    (ORTHOGONAL)
   sees: public fields + source-community fields
   never sees: museum internals, enforcement internals
```

`claimStatus` and `custodianship` are promoted into the source-community tier, so
a community can see claims made on its own objects.

### Why it must be cross-cutting

The framework's participation model depends on it. A holder registers only if the
disclosure boundary is credible *before* they submit. If redaction is a view-layer
concern, then every new client is a new opportunity to leak, and the boundary is
only as strong as the least careful frontend. Signing the field→tier map into the
passport makes the boundary an auditable property of the record.

### The orthogonal source-community role is the weakest link in this plan

It was chosen under time pressure by a single implementer with no external input,
and it encodes a substantive claim — that source communities should see claim
status but not enforcement internals — that no source community has been
consulted about. It is defensible and it may well be wrong.

This is the item most in need of the Phase 2 stakeholder co-design work the
prototype deliberately skipped. It is carried as a first-class open question in
the [backlog](../BACKLOG.md) and should be raised explicitly with AABC.

### Cost

Every API response becomes role-parameterised. Caching gets harder. The
`fieldTiers` map must be maintained in lockstep with the schema, which argues for
generating one from the other.

---

<a name="adr-006"></a>
## ADR-006 — Notarise, never store, on-chain

**Status:** Proposed (carried unchanged from `dpa-prototype`)

### Decision

Keep the existing spine:

| | |
|---|---|
| Chain | Base Sepolia · chainId 84532 · `https://sepolia.base.org` |
| EAS | `0x4200000000000000000000000000000000000021` |
| SchemaRegistry | `0x4200000000000000000000000000000000000020` |
| Explorer | `https://base-sepolia.easscan.org` |
| Schema | `bytes32 contentHash, string passportId, uint8 confidentialityLevel` |

**Only the content hash is attested.** No metadata, no images, no PII, no
provenance text goes on-chain — ever.

Note for implementers: the Ethereum-Sepolia EAS address `0xC2679fBD…` is **empty
on Base Sepolia**. Do not reuse it. These addresses were verified by
`eth_getCode`.

### Why

On-chain immutability is a feature for *proof of registration time* and a
catastrophe for *content*. GDPR erasure, incorrect claims, and the disclosure
model are all incompatible with permanent public content. Attesting a hash gives
the immutability the thesis needs and keeps every mutable and confidential
concern off-chain where it can be corrected and gated.

x402 payment settlement (from `arts-provenance-agent`) is a separate on-chain
concern on the same network and is unaffected.

### Cost

Off-chain availability becomes the weak link — a lost record makes its
attestation unverifiable. Storage durability is an open backlog item.

---

<a name="adr-007"></a>
## ADR-007 — VANGO stays a client; it is not folded into the core

**Status:** Proposed · *this ADR answers the explicit open question*

### Decision

VANGO is **not** merged into the v0.4 core. It becomes the **reference consumer
of the public disclosure tier** and remains its own repository, its own release
cycle, and its own team.

### Why not fold it in

1. **Different concern.** VANGO answers *"how does a visitor engage with art
   across venues?"* The core answers *"can an object with uncertain provenance be
   safely surfaced?"* Merging them would subordinate a good consumer product to
   a research instrument and slow both.
2. **It would sit inside the trust boundary without being trustworthy.** VANGO
   deliberately removed authentication and stores stamps in `localStorage`. That
   is correct for a stamp collection and disqualifying for anything inside the
   passport trust core.
3. **The word "passport" collides.** A VANGO passport belongs to a *visitor* and
   collects venues. A DPA passport belongs to an *object* and collects evidence.
   Same word, opposite subject. Merging the codebases would make the collision
   permanent instead of fixable.
4. **Its value is highest as a demonstration.** VANGO consuming the public tier
   proves something no internal document can: that the confidentiality envelope
   is strong enough to drive a real public product with no leakage. It is a live
   test of [ADR-005](#adr-005).

### Why it is nonetheless strategically important

It is the only consumer-facing surface in the programme, the only multilingual
one (EN/FR/IT — matching the actual stakeholder languages), and the only
physical→digital bridge via QR signage. It is the visible end of "from shadow to
light": the point at which a passport-shielded object is encountered by an
ordinary visitor. Its catalogue already contains `BURA01` — Bura Ceramics,
Niger, AABC — which is exactly the class of object the framework is about.

### What is asked of VANGO

1. Resolve the naming collision (e.g. "visitor passport" vs. "object passport")
   before any joint demonstration.
2. Read its `CATALOG` from the v0.4 public read API rather than a hardcoded
   object in `src/App.jsx`.
3. Where a stamped artwork has a DPA passport, deep-link to its public view.

None of these require merging repositories.

### Revisit if

AABC's feedback prioritises visitor-facing deployment over research
infrastructure. In that case VANGO becomes the primary surface and this decision
should be reopened.

---

<a name="adr-008"></a>
## ADR-008 — One evidence service

**Status:** Proposed

### Conflict

`arts-provenance-agent` and `provenance-search` both integrate Tavily, Wikidata
SPARQL and museum APIs, with different allow-lists, different result shapes and
different caveats. Two teams maintain two answers to the same question.

### Decision

One evidence service, built on `arts-provenance-agent`'s tool layer
(`src/tools/`), absorbing `provenance-search`'s connectors:

| Retained from | What |
|---|---|
| agent | Tavily grounding · Wikidata SPARQL · tiered register checks with signed `access`/`verdict`/`caveat` · x402 paid checks |
| provenance-search | The Met · Art Institute of Chicago · MoMA (bundled static export — live API is Cloudflare-blocked) · Wikipedia · Europeana · Gemini Vision identification |

Two patterns from `provenance-search` are **generalised, not just ported**:

- **The general-knowledge fallback.** Answering from model knowledge is
  permitted, but the result must be labelled `isGeneralKnowledge: true`, must
  never be marked `verified`, and must auto-attach a medium-severity flag. This
  becomes the required treatment of any unsourced assertion system-wide.
- **The bundled static export.** Where a source blocks programmatic access,
  shipping a dated snapshot is preferred to dropping the source — provided the
  snapshot date is recorded in the passport.

### Carried over as an open problem, not solved by this merge

The **source bias** both repos declare. The permitted-source list is
predominantly Western institutions plus one commercial register, which searches
worst exactly where the motivating harm lives. Adding the Getty Provenance Index,
the German Lost Art Foundation, INTERPOL and source-country heritage authorities
is named in both repos' backlogs as the first substantive extension and is
carried into the [v0.4 backlog](../BACKLOG.md) as a P0.

The merge does not fix this. It is important that the meeting says so.

---

<a name="adr-009"></a>
## ADR-009 — "No register check returns *clear*" is normative programme-wide

**Status:** Proposed

### Decision

Adopt `arts-provenance-agent`'s register verdict enum across the programme.
The permitted verdicts are:

```
possible-match  |  no-evidence-found  |  not-queryable  |  not-run
```

There is no `clear`, no `clean`, and no `verified-not-stolen`. **The strongest
available negative result is `no-evidence-found`.**

Further, `access`, `verdict`, `method`, `caveat` and `officialSearch` are carried
**together and signed**, so a downstream consumer cannot strip a verdict from the
caveat that qualifies it.

### Why

Colonial and archaeological material was never inventoried and therefore cannot
appear in a stolen-property register. A "clear" result would be a false
assurance produced by the structural absence of a record — and it would be
issued most confidently for exactly the objects most likely to be problematic.

This also protects the programme. A DPA that could be read as certifying an
object as clean would become a laundering instrument, which is the precise
failure mode that would end it.

Only Wikidata is genuinely machine-queryable. INTERPOL, the FBI NSAF, the
Carabinieri TPC, the German Lost Art Foundation and the Getty Provenance Index
are domain-scoped search or human referral only, and every passport must say so
about itself.

### Cost

Users want a green tick and will not get one. Every UI must communicate a
three-way state — *lead found* / *nothing found* / *could not look* — where
users expect two.
