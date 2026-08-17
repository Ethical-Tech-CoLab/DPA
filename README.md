# DPA — Digital Passport for Artworks

**This repository is a consolidation plan, not a new prototype.**

It does not contain a running application. It contains the assessment, the
architecture, and the decisions required to merge five separate working
prototypes into one coherent system — **v0.4** — and the material needed to
present that plan to AABC.

If you are looking for code that runs today, go to the five repositories listed
in [Where the work actually lives](#where-the-work-actually-lives). Every one of
them still works and none of them are being switched off by this plan.

---

## What "DPA" means

**DPA** is the *Digital Passport for Artworks*: the research programme run by
**AABC** (Ars Pro Mundo / Association for Art, Business and Culture) with
**SDA Bocconi**, defined in *Annex A — Preliminary Research Framework
(February 2026)*.

The programme's thesis, in one sentence:

> An artwork whose provenance is uncertain is currently invisible — it cannot be
> lent, studied, insured, or claimed, because surfacing it exposes its holder to
> legal and reputational risk. If a holder could register that object
> pseudonymously, prove the registration was immutable and time-stamped, and
> then disclose *different amounts of it to different parties* — public, museum,
> law enforcement, source community — the object could re-enter scholarship and
> public visibility without anyone first having to lose a lawsuit.

The framework calls this movement **"From Shadow to Light."**

A *passport*, in this programme, is therefore not a certificate of authenticity
and not a title deed. It is a **structured, signed, selectively-disclosable
dossier** about one object, spanning four layers defined in the framework:

| Layer | Holds |
|---|---|
| **Descriptive** | Standardised metadata — Object ID, CIDOC-CRM, images, fingerprints |
| **Legal** | Ownership assertions, claims, custodianship terms, confidentiality level |
| **Blockchain** | Notarisation, time-stamping, immutable audit trail |
| **Physical** | Optional tagging — RFID / NFC / microdot / digital fingerprint |

…plus a **role-gated disclosure model** across pseudonymous owner, museum,
enforcement (Carabinieri TPC / INTERPOL), source community, and scholar/insurer.

---

## Why this repository exists

Between the original framework prototype and the student derivative works, the
programme now has **five independently working systems**. That is a good
problem, but it is a problem:

- **Three different confidence scores** that disagree about the same object.
- **Two incompatible cryptographic trust models.**
- **Four different passport data structures**, none of which validate against
  each other.
- **Two duplicate evidence-retrieval stacks** hitting the same sources with
  different allow-lists.
- The single most important governance idea (**role-gated disclosure**) exists
  in only one repo, and the single most important epistemic idea
  (**evidence coverage**) exists in only one *other* repo. Neither has spread.

None of this is a criticism of the individual projects — each is coherent on its
own terms, and the divergence is the normal result of parallel exploration. But
they cannot be demonstrated as one system, and AABC cannot be asked to evaluate
five overlapping answers to the same question.

**v0.4 is the opinionated merge.** This repository states what is kept, what is
replaced, what is retired, and why — so that the decisions are auditable rather
than implicit.

---

## Where the work actually lives

| Repository | What it is | What v0.4 takes from it | Status |
|---|---|---|---|
| [`yorkerhodes3/dpa-prototype`](https://github.com/yorkerhodes3/dpa-prototype) | Framework reference implementation — Next.js, EAS on Base Sepolia, role-gated views, 3D exhibit | **Confidentiality envelope**, on-chain notarisation spine, exhibit layer | Private · working |
| [`arts-provenance-agent`](https://github.com/Ethical-Tech-CoLab/arts-provenance-agent) | x402-native research agent — Tavily grounding, register checks, signed JSON-LD passport | **Passport envelope**, **coverage model**, **canonical scorer**, register access tiers | Public · **most mature, peer-reviewed** |
| [`provenance-search`](https://github.com/Ethical-Tech-CoLab/provenance-search) | Multi-source provenance lookup — 8 sources, Gemini Vision ID, camera/field mode | **Evidence connectors**, **image identification**, field-capture UX | Public · deployed |
| [`digital-passport-artworks`](https://github.com/Ethical-Tech-CoLab/digital-passport-artworks) | Client-side issuance / verification / revocation with real ECDSA and image forensics | **Lifecycle + revocation**, **image fingerprinting / dedup**, institutional issuer chain | Public · working |
| [`VANGO`](https://github.com/Ethical-Tech-CoLab/VANGO) | Visitor-facing art passport — stamps, QR codes, EN/FR/IT | **Stays a client**, not folded into the core — see [ADR-007](docs/DECISIONS.md#adr-007) | Public · working |

---

## What v0.4 is, in one diagram

v0.4 asserts that the five projects are **not competing implementations** — they
are, almost exactly, the consecutive stages of one pipeline that nobody had yet
drawn:

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │ 1. IDENTIFY      image → object                                     │
  │    provenance-search (Gemini Vision) · digital-passport-artworks    │
  │    (SHA-256 + dHash + keypoints, duplicate detection)               │
  ├─────────────────────────────────────────────────────────────────────┤
  │ 2. INVESTIGATE   object → sourced claims                            │
  │    ONE evidence service (Tavily · Wikidata · museum APIs ·          │
  │    Europeana) + tiered register checks                              │
  ├─────────────────────────────────────────────────────────────────────┤
  │ 3. ASSESS        claims → confidence score  +  COVERAGE CLASS       │
  │    ONE canonical scorer (accumulation). Coverage reported beside    │
  │    the score and NEVER folded into it.                              │
  ├─────────────────────────────────────────────────────────────────────┤
  │ 4. ISSUE         → ONE signed passport envelope                     │
  │    Two issuer classes: pseudonymous wallet (did:pkh) OR             │
  │    accredited institution (ECDSA P-256 CA chain)                    │
  ├─────────────────────────────────────────────────────────────────────┤
  │ 5. GOVERN        → confidentiality envelope + EAS notarisation      │
  │    Every field carries a disclosure tier. Only contentHash goes     │
  │    on-chain. THIS IS THE FRAMEWORK'S CORE CONTRIBUTION.             │
  ├─────────────────────────────────────────────────────────────────────┤
  │ 6. MAINTAIN      → revocation (StatusList2021), amendment, claims   │
  ├─────────────────────────────────────────────────────────────────────┤
  │ 7. PRESENT       → role-gated web views · 3D exhibit · VANGO        │
  └─────────────────────────────────────────────────────────────────────┘
```

Read the full target design in **[docs/ARCHITECTURE-v0.4.md](docs/ARCHITECTURE-v0.4.md)**.

---

## The opinionated calls

v0.4 is "opinionated" because a merge that kept every option would not be a
merge. Each decision below is recorded with its alternative and its cost in
**[docs/DECISIONS.md](docs/DECISIONS.md)**.

| # | Decision | Consequence |
|---|---|---|
| [001](docs/DECISIONS.md#adr-001) | One passport envelope, based on `arts-provenance-agent`'s signed JSON-LD schema | Three other passport shapes become adapters |
| [002](docs/DECISIONS.md#adr-002) | One canonical scorer — the **accumulation** model | Two deduction-based scorers are retired |
| [003](docs/DECISIONS.md#adr-003) | **Coverage is mandatory and never scored** | Any score shown without a coverage class is a bug |
| [004](docs/DECISIONS.md#adr-004) | **Two issuer classes**, not one trust model | Pseudonymous owners *and* accredited institutions both work |
| [005](docs/DECISIONS.md#adr-005) | Confidentiality envelope becomes cross-cutting | Every passport field needs a disclosure tier |
| [006](docs/DECISIONS.md#adr-006) | Notarise, never store, on-chain | No PII, no metadata, no images on Base Sepolia |
| [007](docs/DECISIONS.md#adr-007) | **VANGO stays a client, not a core module** | Answers the open question directly |
| [008](docs/DECISIONS.md#adr-008) | One evidence service; retire the duplicate stack | `provenance-search` connectors merge into the agent's tool layer |
| [009](docs/DECISIONS.md#adr-009) | "No register returns *clear*" is normative programme-wide | Strongest negative result is `no-evidence-found` |

---

## The two ideas v0.4 must not lose

If everything else in this plan is rejected, these two should survive, because
they are the programme's genuine intellectual contributions and neither is
obvious.

### 1. Absence of evidence is not evidence of absence — and the score cannot tell the difference

From `arts-provenance-agent/src/lib/coverage.ts`:

> A Dutch painting sits inside a thick apparatus: auction catalogues, dealer
> stock books, the Getty Provenance Index, Nazi-era provenance research. When
> the tool finds a hole there, the hole is itself evidence, because records
> ought to exist. That is absence **within** coverage.
>
> A Cambodian temple sculpture was never accessioned, never catalogued and never
> reported stolen, because no institution was in a position to report it. It
> cannot appear in a stolen-property register at all. Finding nothing says
> nothing. That is absence **of** coverage.
>
> Both produce the same low number.

This matters because it is precisely the *motivating* population — colonial,
archaeological, and source-country material — that is structurally uncovered. A
naive provenance score punishes exactly the objects the programme exists to
help. v0.4 makes coverage a required, signed field of every passport.

### 2. Disclosure is the product

Registering an object is easy. The reason the DPA is hard, and the reason it is
worth doing, is that **different parties must see different amounts of the same
record** — and the holder must be able to trust that boundary before they will
register anything at all. Without the confidentiality envelope there is no
voluntary participation, and without voluntary participation there is no
registry.

---

## Reading order

| If you are… | Read |
|---|---|
| Preparing for the AABC status meeting | **[docs/MEETING-BRIEF.md](docs/MEETING-BRIEF.md)** |
| Deciding whether the plan is right | [docs/DECISIONS.md](docs/DECISIONS.md) |
| Assessing the existing work | [docs/INVENTORY.md](docs/INVENTORY.md) |
| Going to build v0.4 | [docs/ARCHITECTURE-v0.4.md](docs/ARCHITECTURE-v0.4.md) then [BACKLOG.md](BACKLOG.md) |
| Owning one of the five repos | [docs/MIGRATION.md](docs/MIGRATION.md) |

---

## Status of this plan

| Item | State |
|---|---|
| Inventory of all five repos | Complete |
| Conflict analysis | Complete |
| v0.4 target architecture | Drafted — **not reviewed by repo owners** |
| Architecture decisions | Drafted — **not ratified** |
| Consolidated backlog | Drafted |
| Meeting brief | Drafted — **AABC feedback not yet incorporated** |
| Any v0.4 code | **Not started** — deliberately. Ratify the plan first. |

> ### ⚠️ Open input required
>
> This plan is written as a response to *"feedback from AABC,"* but **the content
> of that feedback has not been recorded anywhere in these repositories.** Every
> decision here was derived from the Annex A framework and from reading the
> code, not from AABC's response to it.
>
> Before the status meeting, capture the AABC feedback in
> [docs/MEETING-BRIEF.md](docs/MEETING-BRIEF.md#aabc-feedback--to-be-completed)
> and re-test each ADR against it. Decisions that AABC's feedback contradicts
> should be reopened, not defended.

---

## Licence

Planning documents: CC BY 4.0. Referenced code remains under its own repository's
licence (MIT for the derivative works).
