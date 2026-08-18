# Architecture decisions — v0.4

Each decision records the conflict, the choice, the alternative rejected, and the
cost. None of these are ratified. Any of them may be reopened, and the
[AABC feedback](MEETING-BRIEF.md#aabc-feedback--to-be-completed) — now recorded —
has been tested against every one.

**Two decisions are reopened by that feedback.** [ADR-004](#adr-004) has no class
for a crowd-sourced contributor who scans an object they do not own, and
[ADR-007](#adr-007) settled VANGO's status on the premise that mobile capture was
out of scope, which is no longer true. Both should be presented at the meeting as
open questions rather than defended.

Status legend: **Proposed** · **Ratified** · **Superseded** · **Reopened**

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

**Status:** **Reopened** by the AABC capture feedback — see
[MEETING-BRIEF §7.3](MEETING-BRIEF.md#aabc-feedback--to-be-completed). Both
classes assert something about ownership. Crowd-sourced capture introduces an
actor that asserts nothing about ownership and still needs to be represented:
a contributor who records an object they do not own. `@dpa/capture` works around
this for now with a separate `CaptureOperatorRole` enum, deliberately not
reusing `IssuerClass`, so that a capture cannot be read as a title claim. That is
a containment measure, not an answer.

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

**Status:** **Reopened** by the AABC capture feedback — see
[MEETING-BRIEF §7.3](MEETING-BRIEF.md#aabc-feedback--to-be-completed).

> This ADR concluded that VANGO belongs outside the core because it is a
> *consumer* of passports rather than a producer of them. That reasoning was
> sound on the premise that capture was out of scope. AABC have now made mobile
> capture a core requirement, and VANGO is a mobile front-end for scanning — it
> is the one codebase in the programme already solving the phone-camera problem.
> The question "does VANGO fold in?" has to be re-argued from the new premise,
> and the answer may now be different. The decision below is retained unchanged
> so the original reasoning can be examined rather than quietly rewritten.

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

---

<a name="adr-010"></a>
## ADR-010 — Capture is Stage 0, and capture quality is a third independent number

**Status:** Proposed · *the first ADR derived from AABC feedback rather than from
Annex A and the code*

### Conflict

The pipeline has seven stages and every one of them begins **after** an object
has already been recorded by somebody. `@dpa/evidence` searches archives,
`@dpa/assess` scores what was found, `@dpa/govern` notarises the result. Where no
record was ever created, all seven stages can do is measure the hole:
[ADR-003](#adr-003) exists precisely to stop that hole being misread as a clean
result.

AABC have asked for the step before all of this — how an object gets recorded in
the first place, by whom, and with what evidentiary value.

### Decision

**1. Capture becomes Stage 0**, implemented as `@dpa/capture`, positioned before
Identify. It is a new position in the pipeline rather than a modification of an
existing package, because nothing that exists takes a physical object as input.

**2. Capture quality is a third independent number.** `qualityScore` is reported
alongside `confidenceScore` and `coverage`, and is **never folded into either**.
Structurally enforced: `@dpa/capture` must not import `@dpa/assess` and
`@dpa/assess` must not import `@dpa/capture`. A test asserts this at the module
boundary.

**3. Quality is bounded by its weakest dimension, not averaged.** The class is
the minimum across ten metrics. Four hundred photographs that are all out of
focus produce an out-of-focus mesh; averaging perfect image count against poor
sharpness would report that capture as acceptable.

**4. A capture record must state what it does not prove.** `attests` and
`doesNotAttest` are mandatory schema fields, and the builder refuses to emit a
record whose `doesNotAttest` omits the legitimacy disclaimer.

**5. Capture assets never default to public**, and default to `source-community`
for funerary and sacred material.

### Why quality must not touch the confidence score

This is [ADR-003](#adr-003) applied to a new axis, and the failure it prevents is
sharper here.

If capture quality contributed to provenance confidence, **a museum could raise
an object's provenance confidence by buying a better camera.** An institution
with a well-funded imaging department and no provenance documentation would
outscore a community holding thorough written records and a phone. That inverts
the programme's purpose, and it would do so invisibly, because both inputs are
legitimate and the resulting number would look reasonable.

The two questions are genuinely different:

| | asks |
|---|---|
| `confidenceScore` | how much is known about where this object came from? |
| `coverage` | could the registers have known anything at all? |
| `qualityScore` | how good is the record we just made of the object itself? |

### Why a good scan is not good provenance

Direct corollary of [ADR-009](#adr-009). A flawless capture of a looted object is
a flawless capture of a looted object. The capture record looks exactly like
proof of legitimate ownership — signature, hash, timestamp, chain of custody —
and is not. That resemblance is the risk, so the disclaimer is a field the format
requires rather than a caption a UI might forget.

### What this genuinely adds, and to whom

For a `structurally-uncovered` object it is the **only** new information the
system can generate. The Bura askos scores 58 with 0 of 9 registers able to name
it, because Bura funerary sites were never inventoried and the registers hold
reports of thefts from documented collections. Its own timeline records the
trap: the 1970 UNESCO Convention *"requires a pre-existing inventory — which Bura
sites lack."*

Capture is the only mechanism in the programme that creates record rather than
querying it. It cannot help an object already looted from an unrecorded site.
It can start the record, from today, for everything still in museum, community
or private custody.

### The reconstruction gap — where this contributes something new

C2PA solves capture-time provenance for 2D media well: a hard binding over the
asset bytes, an X.509 signature, an RFC 3161 timestamp, and in Truepic's
implementation a signature applied inside the secure enclave before the image
leaves the sensor.

**None of it survives photogrammetry.** As of spec v2.1–v2.4 the normative format
list is JPEG, PNG, GIF, TIFF, BMFF video and PDF. glTF/GLB, USDZ, E57 and PLY are
absent. The photographs can be sealed to a very high standard and the mesh built
from them inherits none of it — the chain breaks at exactly the step that
produces the artefact anyone will actually look at.

Every crowd-sourced heritage capture effort we surveyed — Rekrei/Project Mosul,
Backup Ukraine, the Million Image Database — used general-purpose photogrammetry
apps and sealed the 3D output not at all. Rekrei accepts any photograph with no
submission quality protocol whatsoever.

`ReconstructionBinding` is our answer: one signed structure binding the source
image set, how many of those carried a verifiable seal, the pipeline and
parameters, the output mesh hash, and a perceptual hash as a soft binding so a
re-exported copy can be re-associated. It does **not** make reconstruction
reproducible — photogrammetry is not bit-deterministic — and `chainComplete` says
so rather than implying a guarantee the format cannot make.

### Alternative rejected: extend `@dpa/identity` instead of adding a stage

`@dpa/identity` already computes perceptual hashes and forensic signals, so
capture could have gone there. Rejected because identity answers *"is this the
same object as that one?"* against material already in hand, whereas capture
answers *"how do we get this object into the system at all?"*. Folding them would
have put the quality rubric behind the same module boundary as the forgery-risk
score, and those two numbers must not meet either.

### Cost

- A new package, a new schema type, and a new route.
- [ADR-004](#adr-004) and [ADR-007](#adr-007) are reopened.
- Decision #5 in [MEETING-BRIEF §5](MEETING-BRIEF.md) — the source-community
  disclosure tier, decided with no source-community input — escalates from weak
  to blocking. It was tolerable while the system only described objects. It is
  not tolerable while the system holds photorealistic models of grave goods.
- The band thresholds are ours and are not standards-backed. There is no ratified
  cross-body numerical rubric for heritage 3D capture; the London Charter, which
  is the most widely adopted framework, is a principles document. Every threshold
  sits in one file so the argument can be had against specific numbers.
