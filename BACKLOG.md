# Consolidated backlog — v0.4

Every known gap across the five repositories, merged and prioritised for the
consolidation. Sources:

- `arts-provenance-agent/BACKLOG.md` + `PEER-REVIEW.md` (22 Jul 2026, *minor revisions*)
- `provenance-search/BACKLOG.md`
- `dpa-prototype/BACKLOG.md`
- Gaps identified during this consolidation review that no repo had recorded

Ordering follows the convention the student repos established: **in the order
they would mislead a reader.**

`[x]` means the work exists in *this* repository and is exercised by a test, by
CI, or by the fixture build. It does not mean the upstream student repositories
have adopted it. Where an item is only partly done it stays unchecked and says
what is missing, because a half-ticked box is how a backlog starts lying.

---

## P0 — Would mislead AABC at the status meeting

### 1. Nothing has been validated against ground truth

*Source: `arts-provenance-agent` peer review, major finding, open*

It is unclear whether the showcased confidence scores (e.g. Madame X "93/100")
were machine-computed or hand-authored. Until this is resolved, **no score
should be shown to AABC.**

- [ ] Run the canonical scorer over every catalogue object
- [ ] Publish machine scores beside hand-authored narratives, labelled as to which is which
- [ ] Record the divergence honestly where they differ

### 2. Three disagreeing confidence scores

*Source: peer review (within-repo) + this review (across-repo)*

- [ ] Delete the deduction scorer in `arts-provenance-agent/src/web/pipeline.ts`
- [ ] Delete `computeConfidenceScore` in `provenance-search/server.js`
- [ ] Designate the accumulation model canonical on the record ([ADR-002](docs/DECISIONS.md#adr-002))
- [ ] Re-run and republish every score either repo has quoted

### 3. Source list excludes the motivating population

*Source: declared in both `arts-provenance-agent` and `provenance-search`*

`AUTHORITATIVE_DOMAINS` is five Western institutions plus one commercial
register. The system searches worst exactly where the motivating harm lives.

- [ ] Add the Getty Provenance Index
- [ ] Add the German Lost Art Foundation
- [ ] Add INTERPOL (referral tier — not machine-queryable)
- [ ] Add source-country heritage authorities — needs AABC's relationships
- [ ] **Validate against known cases before shipping.** New connectors change what
      every run returns; unvalidated additions are worse than the current bias
- [ ] Update §08 of both papers to match

*Needs budget and time. This is a v0.5 body of work, but it must be **named** at
the meeting as the first substantive extension.*

### 4. The headline safeguard contradicts itself

*Source: peer review, major finding, open*

§04/§01 claim "hallucinated history structurally impossible"; §13 retracts
exactly that — a false claim wearing a real source URL is not prevented.

- [ ] Reword to "makes *unsourced* history structurally impossible"
- [ ] Cross-reference the §13 limitation at first claim
- [ ] Fix in both `DPP-Paper.md` and the mirrored website content

### 5. ~~AABC feedback is not recorded anywhere~~ — CLOSED

*Source: this review. Closed by the AABC meeting feedback of this cycle.*

The consolidation was framed as responding to AABC feedback that existed in no
repository. That feedback has now been received and recorded.

- [x] Capture the feedback verbatim in [MEETING-BRIEF §7](docs/MEETING-BRIEF.md#aabc-feedback--to-be-completed)
- [x] Re-test all nine ADRs against it
- [x] Reopen any decision it contradicts — **ADR-004** (crowd-sourced
      contributors are neither issuer class) and **ADR-007** (VANGO's status was
      settled on the premise that mobile capture was out of scope; that premise
      is gone) are now open

**The feedback creates a new P0 workstream** — see
[P0 §6](#6-there-is-no-capture-stage-and-aabc-asked-for-one-first) below.

---

<a name="6-there-is-no-capture-stage-and-aabc-asked-for-one-first"></a>
### 6. Crowd-sourced capture — the protocol AABC asked to be prioritised

*Source: AABC meeting feedback. See [MEETING-BRIEF §7](docs/MEETING-BRIEF.md#aabc-feedback--to-be-completed) and [ADR-010](docs/DECISIONS.md#adr-010).*

Stage 0 now exists as `@dpa/capture`. What shipped this cycle:

- [x] [ADR-010](docs/DECISIONS.md#adr-010) — capture is Stage 0; scan quality is a third
      independent number and never touches `confidenceScore`
- [x] `packages/schema/src/capture.ts` — the contract, including `ReconstructionBinding`
- [x] `packages/capture` — ten-metric rubric, limiting-factor assessment, real-time
      guidance loop with hysteresis, capture record. 38 tests
- [x] Class is the **minimum** across metrics, not the average — 400 blurred photos
      make a blurred mesh. Deliberately the opposite of the provenance scorer
- [x] `attests` / `doesNotAttest` are mandatory schema fields; `buildCaptureRecord`
      throws without the legitimacy disclaimer
- [x] Assets never default to public — funerary and sacred default to `source-community`
- [x] `/capture` — the rubric and guidance loop, interactive, verified in-browser
      across three themes and six viewports
- [x] [docs/CAPTURE-PROTOCOL.md](docs/CAPTURE-PROTOCOL.md) — the document to hand to a museum

What is **not** done:

**Verification and standards**
- [ ] **Track down the "Manhattan Bridge pedestrian capture protocol."** It does
      not exist in any public source we could reach: not HAER, not Starling Lab,
      not C2PA, not NYC DOT. The closest real thing is Starling Lab / Numbers
      Protocol `Starlingcapture`, which seals media in device hardware at capture
      time. **Ask whoever raised it at the meeting.** Until then it is not prior
      art and is not cited as such.
- [ ] Validate the band thresholds against a real standards body. Historic
      England's 2017 photogrammetry guidance, the Smithsonian DPO 3D tiers and
      the Europeana 3D task force criteria were all unreachable (403/404) when we
      checked. The numbers in `rubric.ts` are ours and are a starting position.
- [ ] Confirm whether C2PA v2.4+ has added glTF/GLB or USDZ support. Our finding
      that it has not is based on the spec versions we could read.

**Measurement — the rubric is defined but nothing computes it**
- [ ] Implement the metric extractors. Variance of Laplacian and histogram
      clipping are straightforward; angular coverage, surface completeness and
      overlap need pose estimates from ARKit/ARCore or from the reconstruction.
- [ ] Ground sample distance requires object distance and sensor geometry. On a
      phone this means reading camera intrinsics, which vary by device.
- [ ] Scale-bar and colour-target detection. ChArUco/ArUco detection is standard;
      no detector is wired up.

**The capture client itself**
- [ ] There is no mobile capture app. `/capture` demonstrates the rubric and the
      guidance loop against fixtures; it does not touch a camera.
- [ ] Decide the client strategy — and this is where **[ADR-007](docs/DECISIONS.md#adr-007) is reopened**:
      VANGO already solves the phone-camera problem for this programme. Build
      new, extend VANGO, or wrap Apple `ObjectCaptureSession` (the only mobile
      API with documented real-time quality signals — though it does not expose
      its own sharpness metric, so ours must be computed independently).
- [ ] **[ADR-004](docs/DECISIONS.md#adr-004) is reopened**: there is no issuer class for a
      contributor who scans an object they do not own. `CaptureOperatorRole` is a
      containment measure, not an answer.

**Consent — blocking, not deferred**
- [ ] The source-community disclosure tier was decided with no source-community
      input. Capture escalates this from weak to blocking: the Bura askos is a
      grave good, and the system will hold rotatable models of funerary material.
      Defaults are set closed (`source-community` for funerary and sacred), which
      buys time and is not a substitute for asking.
- [ ] Define who may raise a capture asset's tier, and on whose authority.

**Pipeline integration**
- [ ] A capture record is not yet attached to a `Passport`, notarised, or
      surfaced in `/demo`, `/coverage` or `/disclosure`.
- [ ] The end-to-end story AABC described — museum scans, scan is
      provenance-verified, artefact appears in the 3D exhibit — is not wired.
      `/exhibit` still renders procedural geometry.
- [ ] Perceptual hashing of a mesh (`outputPerceptualHash`) is specified as
      dHash over rendered orthographic views. Not implemented.

---

## P1 — Consolidation work (the v0.4 build)

**Mostly shipped.** This section was written before the consolidation was built
and listed the whole v0.4 plan as open. It is now marked against what is actually
in this repository: 12 packages, 3 apps, 342 passing tests. `[x]` means the code
exists here and is exercised by a test or by the fixture build; it does not mean
the upstream student repositories have adopted it.

### Schema

- [x] `packages/schema` — canonical envelope per [ADR-001](docs/DECISIONS.md#adr-001)
- [ ] Adapters from all four existing passport shapes — **not built.** The
      consolidation vendored and rewrote the code onto the canonical envelope
      rather than translating between four shapes at runtime. If the upstream
      repos are to keep running independently, they still need adapters
- [ ] Fixtures + round-trip tests for each adapter — blocked on the above
- [x] Generate the `fieldTiers` map from the schema rather than maintaining both —
      `DEFAULT_FIELD_TIERS` lives in `schema/src/envelope.ts`; `govern` imports it
      and warns on any path not present in it, so a second map cannot drift in

### Assessment

- [x] `packages/assess/scorer.ts` — the accumulation model, sole implementation
- [x] `packages/assess/coverage.ts` — promoted to a required passport field
- [x] `packages/assess/forgery.ts` — separate number, explicitly never merged
- [ ] Lint rule or test that fails if a score renders without its coverage class —
      **not done as specified.** `coverage.test.ts` proves the *type* carries no
      score field, which stops the two being merged in data. Nothing stops a
      future component rendering a bare number in the UI

### Evidence

- [x] `packages/evidence` — one connector interface
- [x] Merge Tavily + Wikidata (agent) with Met / AIC / MoMA / Wikipedia / Europeana (provenance-search) — eight connectors behind one interface
- [ ] Verify behavioural equivalence before switching either repo over — the
      upstream repos have not been switched over, so this has not been tested
- [x] Generalise the `isGeneralKnowledge: true` labelling to all unsourced assertions
- [ ] Record the MoMA static-export snapshot date in every passport that uses it —
      no snapshot date is recorded anywhere

### Governance

- [x] `packages/govern` — envelope + `canSee` + `redactForRole`
- [x] `apps/api` — every response role-parameterised; redaction at the boundary only
- [x] Test that no client-reachable endpoint can return an above-tier field —
      `verifyBoundary.test.ts`. It proves this of `deliver()`, which is the only
      way either app emits a passport
- [x] Re-verify EAS notarisation against the canonical envelope's `contentHash` — `notarise.test.ts`

### Issuance & lifecycle

- [x] `packages/issue/wallet.ts` — secp256k1 / EIP-191 / `did:pkh`
- [x] `packages/issue/institution.ts` — ECDSA P-256 CA chain
- [x] `packages/issue/canonicalise.ts` — one canonicalisation both classes sign over
- [x] `packages/lifecycle` — StatusList2021 revocation, reinstate, amendment
- [ ] Human review queue with persistence — the queue is in-memory only
- [ ] **Persistent duplicate detection** — session-only is insufficient for a registry

### Demo

- [x] One real object end-to-end through all seven stages — `pnpm fixtures` runs
      the real pipeline over four cases; every score on the site is generated, not written
- [x] Shown in all four role views — `/disclosure` shows one signed record to all
      five roles with a leakage proof
- [ ] Same object visible as a VANGO stamp with zero above-public leakage — VANGO
      is not vendored ([ADR-007](docs/DECISIONS.md#adr-007), now reopened)

---

## P2 — Correctness and honesty fixes carried from the student repos

- [ ] **Case count contradiction** — §07/§13 say five cases, §08 implies fifteen, §06 cites an uncounted sixth (Getty Bronze). Reconcile to one number *(arts-provenance-agent)*
- [ ] **"Risk 12/100" reads backwards** — fix in the interface, not as a caveat *(arts-provenance-agent, peer review minor m1)*
- [ ] **Lead the payment layer on merits, not hackathon origin** *(peer review minor m2)*
- [ ] **Arithmetic error in the recompute-by-hand section** — 3 × 30 leaves 10, not 0. Becomes moot under [ADR-002](docs/DECISIONS.md#adr-002) but the paper still needs rewriting *(provenance-search)*
- [ ] **"Free public source" describes a commercial service** — Tavily is keyed and commercial; reconcile the wording *(provenance-search)*
- [ ] **Forgery risk vs. provenance confidence** — two different numbers on the same scale, currently unlabelled. Readers will conflate them *(digital-passport-artworks)*
- [ ] **Passport name collision** — visitor passport vs. object passport *(VANGO)*

---

## P3 — Open research questions

These are not engineering tasks. Several are the Phase 1 and Phase 2 work the
prototype deliberately skipped, now returning as blockers.

1. **Is the orthogonal source-community role correct?** It asserts that source
   communities see claim status and custodianship but not enforcement internals.
   Decided by one implementer under time pressure with no consultation. **The
   weakest claim in the plan.** Needs a real source community to review it.
2. **Who operates the governance root** for the institutional issuer class, and
   what process revokes an accreditation?
3. **Is "never clear, only no-evidence-found" the right public posture?** It is a
   legal and reputational position, not only a technical one.
4. **What is the legal status of a pseudonymous registration** under Italian and
   EU law? Does registering constitute an admission?
5. **Does GDPR erasure conflict with on-chain notarisation** even when only a
   hash is attested?
6. **How is off-chain availability guaranteed?** A lost record makes its
   attestation unverifiable. Attesting a hash is only useful if the preimage
   survives.
7. **What happens when a claim is filed against a registered object?** No repo
   models the restitution workflow.
8. **Who pays for register lookups at scale?** x402 answers the mechanism; it
   does not answer the economics.
9. **Should scores be public at all,** or only visible above a certain role tier?
   A public score on a contested object is itself an act with consequences.

---

## P4 — Deferred from the framework prototype

Carried from `dpa-prototype/BACKLOG.md`, unchanged in priority.

**Auth & identity**
- [ ] Real SIWE authentication; role claims are currently mocked
- [ ] Organisation membership verification for museum / enforcement roles
- [ ] Key recovery for pseudonymous holders

**On-chain**
- [ ] Register the EAS schema on-chain rather than assuming a UID
- [ ] Revocation path for attestations
- [ ] Gas sponsorship so holders do not need testnet ETH
- [ ] Mainnet migration plan *(explicitly out of scope for v0.4)*

**Exhibit**
- [ ] Replace the procedural geometry with a real cultural-object scan. The
      `DamagedHelmet.glb` placeholder is gone — `/exhibit` now generates its
      geometry — but a real scanned artefact is still the point, and Stage 0 is
      how one gets here ([P0 §6](#6-crowd-sourced-capture--the-protocol-aabc-asked-to-be-prioritised))
- [ ] Point-of-interest schema — position, haptic profile, voice intents, DPA field refs
- [ ] Voice intent grammar mapped to confidentiality tiers *(some intents are museum-tier)*
- [ ] Provenance-trail timeline built from on-chain attestations
- [ ] Source-community audio statement, gated on a consent attestation
- [ ] **Real haptics and voice** — HopeOS provides neither. It is a single HTML
      file (MediaPipe Hands + a Three.js particle globe). The `IRenderer`
      abstraction is where real hardware would land

**Physical layer**
- [ ] RFID / NFC / microdot tagging — stub only, no implementation anywhere

**Testing & DevOps**
- [ ] End-to-end tests across the full pipeline — `pnpm fixtures` exercises all
      seven stages at build time and CI fails if it breaks, but there is no test
      that asserts on the result
- [ ] Contract tests beyond the existing 4
- [x] CI across the monorepo — typecheck, 342 tests, static export, and a Pages
      deploy on every push to `main`
- [ ] Golden-file tests for the redaction boundary — `verifyBoundary.test.ts`
      proves the property; no committed golden files
- [ ] Load characteristics of the evidence service — currently unknown

---

## Not in v0.4, deliberately

- Real PII handling and a GDPR audit
- Real KYC, real custody, real money — x402 stays on testnet USDC
- Fractional ownership, lending, insurance integration
- Mainnet or any chain other than Base Sepolia
- The full restitution workflow
- Merging VANGO ([ADR-007](docs/DECISIONS.md#adr-007))
- New evidence sources beyond consolidating existing ones — the coverage fix is
  P0 to *name*, but it is v0.5 work to *ship*, because it requires validation
  against known cases rather than just new connectors
