# Consolidated backlog — v0.4

Every known gap across the five repositories, merged and prioritised for the
consolidation. Sources:

- `arts-provenance-agent/BACKLOG.md` + `PEER-REVIEW.md` (22 Jul 2026, *minor revisions*)
- `provenance-search/BACKLOG.md`
- `dpa-prototype/BACKLOG.md`
- Gaps identified during this consolidation review that no repo had recorded

Ordering follows the convention the student repos established: **in the order
they would mislead a reader.**

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

### 5. AABC feedback is not recorded anywhere

*Source: this review*

The consolidation is framed as responding to AABC feedback that exists in no
repository. Every decision was derived from Annex A and from the code.

- [ ] Capture the feedback verbatim in [MEETING-BRIEF §7](docs/MEETING-BRIEF.md#aabc-feedback--to-be-completed)
- [ ] Re-test all nine ADRs against it
- [ ] Reopen any decision it contradicts

---

## P1 — Consolidation work (the v0.4 build)

### Schema

- [ ] `packages/schema` — canonical envelope per [ADR-001](docs/DECISIONS.md#adr-001)
- [ ] Adapters from all four existing passport shapes
- [ ] Fixtures + round-trip tests for each adapter
- [ ] Generate the `fieldTiers` map from the schema rather than maintaining both

### Assessment

- [ ] `packages/assess/scorer.ts` — the accumulation model, sole implementation
- [ ] `packages/assess/coverage.ts` — promoted to a required passport field
- [ ] `packages/assess/forgery.ts` — separate number, explicitly never merged
- [ ] Lint rule or test that fails if a score renders without its coverage class

### Evidence

- [ ] `packages/evidence` — one connector interface
- [ ] Merge Tavily + Wikidata (agent) with Met / AIC / MoMA / Wikipedia / Europeana (provenance-search)
- [ ] Verify behavioural equivalence before switching either repo over
- [ ] Generalise the `isGeneralKnowledge: true` labelling to all unsourced assertions
- [ ] Record the MoMA static-export snapshot date in every passport that uses it

### Governance

- [ ] `packages/govern` — envelope + `canSee` + `redactForRole`
- [ ] `apps/api` — every response role-parameterised; redaction at the boundary only
- [ ] Test that no client-reachable endpoint can return an above-tier field
- [ ] Re-verify EAS notarisation against the canonical envelope's `contentHash`

### Issuance & lifecycle

- [ ] `packages/issue/wallet.ts` — secp256k1 / EIP-191 / `did:pkh`
- [ ] `packages/issue/institution.ts` — ECDSA P-256 CA chain
- [ ] `packages/issue/canonicalise.ts` — one canonicalisation both classes sign over
- [ ] `packages/lifecycle` — StatusList2021 revocation, reinstate, amendment
- [ ] Human review queue with persistence
- [ ] **Persistent duplicate detection** — session-only is insufficient for a registry

### Demo

- [ ] One real object end-to-end through all seven stages
- [ ] Shown in all four role views
- [ ] Same object visible as a VANGO stamp with zero above-public leakage

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
- [ ] Replace `DamagedHelmet.glb` with a real cultural-object scan
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
- [ ] End-to-end tests across the full pipeline
- [ ] Contract tests beyond the existing 4
- [ ] CI across the monorepo
- [ ] Golden-file tests for the redaction boundary
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
