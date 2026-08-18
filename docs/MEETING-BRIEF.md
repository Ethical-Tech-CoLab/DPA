# Status meeting brief — DPA v0.4

Material for the AABC status and next-steps meeting.

**Read time: 5 minutes.** Detail is in [INVENTORY](INVENTORY.md),
[DECISIONS](DECISIONS.md) and [ARCHITECTURE-v0.4](ARCHITECTURE-v0.4.md).

---

## 1. Where the programme actually stands

**Five working systems exist.** All five run today. Four are public and two are
publicly deployed.

| | Demoable today |
|---|---|
| Provenance research across 8 sources, from a photo taken on a phone | [provenance-search](https://provenance-search-production.up.railway.app) |
| Signed provenance passport with per-claim sourcing and paid register checks | [arts-provenance-agent](https://github.com/Ethical-Tech-CoLab/arts-provenance-agent) |
| Full passport lifecycle — issue, revoke, verify, detect duplicates, catch tampering | [digital-passport-artworks](https://ethical-tech-colab.github.io/digital-passport-artworks/) |
| Visitor-facing multilingual passport with QR stamps | [VANGO](https://ethical-tech-colab.github.io/VANGO/) |
| Role-gated disclosure + on-chain notarisation + 3D exhibit | `yorkerhodes3/dpa-prototype` *(private)* |

**The programme has moved faster than the framework anticipated.** The derivative
student work has outrun the reference implementation on substance — evidence
gathering, forensics, lifecycle and UX are all more mature in the derivatives
than in the original prototype. That is the intended outcome of the framework and
it is a good position to be in.

**One of these has been through independent academic peer review**
(`arts-provenance-agent`, verdict *minor revisions*). That is unusual for work at
this stage and is worth stating plainly.

---

## 2. The problem, stated honestly

Five working systems is a good problem, but it is a problem.

- **The same object can be shown to AABC with three different confidence
  scores**, depending on which demo is open. The three scoring algorithms
  disagree and one of them contradicts another *inside the same repository* — a
  finding the project's own peer reviewer raised.
- **Four incompatible passport formats.** None validate against each other.
  There is no way to demonstrate the programme as one system.
- **Two different cryptographic trust models.**
- **The framework's central idea — role-gated disclosure — exists in one repo
  only** (the private one), and has not propagated to any of the work built on
  top of it.
- **The programme's best idea — evidence coverage — exists in one other repo
  only**, and the systems that most need it do not have it.

None of this reflects badly on any individual project. It is the normal result of
productive parallel exploration. It does mean the next step cannot be "build
more."

---

## 3. What v0.4 is

**An opinionated consolidation.** One pipeline, one passport, one score, one
disclosure model — assembled from the best part of each existing system rather
than rewritten.

The core insight: the five projects are not competing implementations. They are
**consecutive stages of one pipeline** that nobody had drawn.

```
IDENTIFY → INVESTIGATE → ASSESS → ISSUE → GOVERN → MAINTAIN → PRESENT
   │            │           │        │        │         │          │
 image ID    8 sources   ONE      ONE      role-    revoke/    web · 3D
 forensics   registers   scorer   envelope gating   amend      · VANGO
 dedup       coverage    +coverage 2 issuer EAS     review
                                  classes  notary   queue
```

**Nine decisions** are proposed, each recorded with its rejected alternative and
its cost, in [DECISIONS.md](DECISIONS.md). The three that matter most:

| Decision | Why it matters to AABC |
|---|---|
| **One scorer** — accumulation, from a base of 30 | Ends the three-number problem. Encodes "nothing is known" as the honest starting point, rather than treating an object as trustworthy until evidence removes trust |
| **Coverage is mandatory and never scored** | Prevents the DPA from systematically penalising the exact objects it exists to help |
| **No register check ever returns "clear"** | Prevents the DPA from becoming a laundering instrument. The strongest negative is *no evidence found* |

---

## 4. The two things worth AABC's attention

### a. The DPA must never be able to certify an object as clean

Colonial and archaeological material was never inventoried, so it cannot appear
in a stolen-property register. A "clear" result would therefore be issued most
confidently for exactly the objects most likely to be problematic.

v0.4 makes this structural, not editorial: the permitted verdicts are
`possible-match`, `no-evidence-found`, `not-queryable`, `not-run`. There is no
`clear`. The caveat is signed alongside the verdict so it cannot be stripped
downstream.

*This is a positioning decision as much as a technical one, and AABC should
confirm it is the right posture.*

### b. A low score means two opposite things, and only coverage can tell them apart

| Object | Score | Coverage | What it means |
|---|---|---|---|
| Rosetta Stone | 34/100 | structurally uncovered | *The registers could never have named this. The score measures our blindness.* |
| Getty Bronze | 26/100 | well covered | *Records ought to exist and are thin. The score measures the object.* |

The lower number is the more informative one. Any interface showing a score
without its coverage class is actively misleading — and would mislead most about
source-country and colonial material, which is the motivating population of the
entire programme.

---

## 5. Decisions we need from AABC

| # | Question | Why it cannot be decided by the team |
|---|---|---|
| 1 | **Who operates the governance root?** v0.4 proposes two issuer classes — pseudonymous holders sign for themselves; accredited institutions sign under a CA chain. Somebody must anchor that chain and be able to revoke accreditation. | This is an institutional and legal question, not an engineering one |
| 2 | **Is "never clear, only no-evidence-found" the right public posture?** | It is a reputational and legal position |
| 3 | **Should the framework repo move into the CoLab org?** It is currently private under an individual account, which is why its disclosure model did not propagate to the student work built on it | Ownership and IP |
| 4 | **What is the priority order: research infrastructure or visitor-facing deployment?** This directly determines whether VANGO stays a client ([ADR-007](DECISIONS.md#adr-007)) or becomes the primary surface | Strategic |
| 5 | **Can we get access to a source community for the disclosure-model review?** The current model asserts what source communities should and should not see, decided by an implementer with no consultation. It is the weakest claim in the plan | Requires AABC's relationships |
| 6 | **Is there budget for the register-coverage extension?** Getty Provenance Index, German Lost Art Foundation, INTERPOL and source-country authorities. Some are paid; all need validation against known cases | Budget |

---

## 6. What we would do next, if the plan is ratified

Deliberately no v0.4 code has been written. Ratify first.

| Phase | Work | Rough size |
|---|---|---|
| **P0** | Repo owners review this plan; ratify or amend the nine ADRs | 1 meeting |
| **P1** | `packages/schema` — the canonical envelope + fixtures + adapters from all four existing shapes | Small; unblocks everything |
| **P2** | `packages/assess` — one scorer + mandatory coverage. Delete the two deduction models. Re-run and republish all quoted scores | Small code, real writing |
| **P3** | `packages/evidence` — merge the two retrieval stacks behind one connector interface | Medium |
| **P4** | `packages/govern` + `apps/api` — role-parameterised responses, redaction at the boundary | Medium; highest-value |
| **P5** | `packages/issue` + `packages/lifecycle` — two issuer classes, revocation | Medium |
| **P6** | One end-to-end demo object through all seven stages, shown in all four role views | The deliverable |

The **v0.4 demonstration target**: *one real object, registered pseudonymously,
researched across real sources, scored with its coverage class, signed,
notarised on-chain, and shown four different ways to four different roles — plus
the same object appearing as a stamp in VANGO with no leakage of anything above
the public tier.*

That single demo would prove the entire framework thesis end to end, which none
of the five current systems can do alone.

---

<a name="aabc-feedback--to-be-completed"></a>
## 7. AABC feedback

> **Status: recorded.** This section was empty through v0.4's consolidation
> build, and was flagged as the most important gap in the document. It is now
> filled. Everything above §7 was derived from the Annex A framework document
> and from reading the code — **not** from AABC's response to the work. What
> follows is the first recorded feedback from AABC, and §7.3 re-tests all nine
> ADRs against it.

### 7.1 Feedback received

Relayed from the AABC meeting. Paraphrased close to the original wording:

> Prioritise a **protocol for crowd-sourced ingestion of 3D scans** of
> artefacts, which **also creates the beginning of a provenance trail**.
>
> The approach is similar to the work described to capture provenance in the
> **Manhattan Bridge pedestrian capture protocol**. The key difference is that
> for cultural artefacts we also need **photogrammetry via mobile**.
>
> We need to help contributors **clearly understand how their inputs are rated
> for scan quality**, and **in real time** show them the adjustments they need
> to make.
>
> Look at the Bura artefacts — there will be **many** like that which we would
> want to scan. Imagine giving this protocol to a museum, having them scan
> their artefact following the **quality guidance and rubric**; that scan is
> then **provenance-verified**, and ultimately becomes an artefact shown in the
> **3D exhibit space**.

#### ⚠️ One citation in this feedback could not be verified

We searched for the **"Manhattan Bridge pedestrian capture protocol"** across
HAER/Library of Congress records, Starling Lab, Numbers Protocol, the C2PA and
Content Authenticity Initiative corpus, and NYC DOT bridge-inspection material.
**No protocol of that name exists in any public source we could reach.**

What does exist, and may be what was meant:

| Candidate | What it actually is | Fit |
|---|---|---|
| **Starling Lab / Numbers Protocol `Starlingcapture`** | Anchors a cryptographic "birth certificate" in device hardware — hashes and signs media *at capture*, before manipulation is possible. Prototyped on the HTC Exodus 1. | **Closest.** It is capture-time provenance sealing performed while walking with a handheld device. If any lead is the referent, it is this one. |
| **HAER NY-127** (Library of Congress) | Large-format static photography of the Manhattan Bridge, compiled post-1968, by Jack Boucher. | Right bridge, wrong idea. No photogrammetry, no protocol, no provenance sealing. |
| **NYC DOT bridge LiDAR** | Real drone/LiDAR inspection practice; pedestrian-platform LiDAR is discussed in industry generally. | No protocol of this name in any procurement or engineering record. |

**We are not treating this as prior art until the original speaker identifies the
source.** The design below is grounded in what we could verify — Apple's
`ObjectCaptureSession`, the C2PA specification, and the London Charter — and the
open question is carried in [BACKLOG P0 §6](../BACKLOG.md). This is a question
to ask at the meeting, not a gap to paper over.

### 7.2 What this feedback actually changes

It does **not** contradict the consolidation thesis. Nothing in §1–§4 is
withdrawn. But it re-prioritises, and it opens a hole that no ADR covers.

**The pipeline has seven stages and the feedback is about a stage that does not
exist.** Stages 1–7 (Identify → Investigate → Assess → Issue → Govern →
Maintain → Present) all begin *after* an object has already been recorded by
somebody. AABC are asking for the step before that: **how the object gets
recorded in the first place, by whom, and with what evidentiary value.** That is
a new **Stage 0 — Capture**, not a modification of an existing package.

**It is aimed precisely at the failure the Bura askos was built to expose.**
The programme's own fixture states the problem in the object's timeline:

> *"Niger ratified the 1970 UNESCO Convention… However, the Convention requires
> a pre-existing inventory — which Bura sites lack."*

and

> *"because Bura funerary sites were not inventoried before looting began,
> objects from this complex cannot appear in INTERPOL SWOA, the FBI National
> Stolen Art File, or the Carabinieri TPC archive."*

This is why the Bura askos scores **58 and `structurally-uncovered`** — 0 of 9
registers can see it. The coverage model can *measure* that gap but can do
nothing about it, because every register it queries is retrospective: they hold
reports of thefts from documented collections. **A capture protocol is the only
mechanism in the programme that can close the gap rather than report it**, by
creating the inventory record that the 1970 Convention presupposes and that
these sites never had. It cannot do so retroactively for objects already looted.
It can do so from today forward for everything still in museum, community, or
private custody — which is the population AABC are pointing at with *"there will
be many like that."*

That reframes the programme's value proposition. Stages 1–7 assess objects
against a record. Stage 0 **creates record where none exists.** For
`structurally-uncovered` objects, that is the only new information the system
can generate at all.

### 7.3 Implications for the ADRs

Re-tested individually. Two are genuinely reopened.

| ADR | Verdict | Reasoning |
|---|---|---|
| [001](DECISIONS.md#adr-001) one envelope | **Extend** | Not contradicted. A capture bundle is a new object the envelope must carry, and it must be expressible in `@dpa/schema` like everything else. Adding a field is not reopening the decision. |
| [002](DECISIONS.md#adr-002) one canonical scorer | **Upheld, with a boundary** | Scan quality is a *new number*, and the risk is that it quietly becomes a second scorer of provenance confidence. It must not. One scorer of provenance confidence remains one scorer. |
| [003](DECISIONS.md#adr-003) coverage never folded into the score | **Upheld and reused** | This is the governing precedent. Scan quality gets exactly the treatment coverage gets: mandatory, reported alongside, **never folded in**. See ADR-010. |
| [004](DECISIONS.md#adr-004) two issuer classes | **⚠️ REOPENED** | The two classes are `pseudonymous-wallet` (the holder) and `accredited-institution`. *Crowd-sourced* ingestion introduces a third actor the model has no slot for: **a contributor who scans an object they do not own and cannot make ownership assertions about.** A volunteer photographing a museum vitrine is neither class. Treating them as a pseudonymous holder would let a capture masquerade as an ownership claim. This needs a decision before `@dpa/capture` issues anything. |
| [005](DECISIONS.md#adr-005) confidentiality envelope is cross-cutting | **Extend — and this one is sharp** | A high-resolution mesh is not a metadata field. It carries two disclosure risks the envelope was never designed for: it is a **replication asset** (a scan good enough for study is good enough to forge or 3D-print), and for sacred or funerary objects **public visibility may itself be the harm**. The Bura askos is a *funerary* vessel. Publishing a rotatable model of grave goods is a source-community consent question, not a checkbox. The envelope extends to capture assets, and the default for a `structurally-uncovered` funerary object must not be `public`. |
| [006](DECISIONS.md#adr-006) notarise the hash, never store on-chain | **Upheld, reinforced** | Meshes are tens of megabytes. Notarise the capture bundle hash; store nothing. The feedback makes this more obviously right, not less. |
| [007](DECISIONS.md#adr-007) VANGO stays a client | **⚠️ REOPENED** | This ADR concluded VANGO is a consumer of the public tier and should stay outside the core. But VANGO is *a mobile front-end for scanning*, and AABC have just made **mobile capture a core requirement**. The question "does VANGO fold in?" was answered when capture was out of scope. That premise no longer holds and the decision has to be re-argued. |
| [008](DECISIONS.md#adr-008) one evidence service | **Extend** | Not contradicted. A capture becomes a new *kind* of evidence with its own tier, sourced from a device rather than an archive. |
| [009](DECISIONS.md#adr-009) no register check returns *clear* | **Upheld — and it is the most important carry-over** | The direct analogue: **a good scan must never read as good provenance.** A flawless 8K photogrammetry capture of a looted object is a flawless capture of a looted object. Quality of record and legitimacy of holding are orthogonal, and the interface must never let the first be mistaken for the second. |

### 7.4 Consequences for this document

- **§6's phase ordering is now wrong.** It was written without a capture stage
  and sequences work that AABC have implicitly de-prioritised relative to
  Stage 0. It needs rescoping, not defending.
- **Decision #5 in §5** (source-community disclosure tier, decided with no
  source-community input) escalates from *weak* to *blocking*. It was tolerable
  while the system only described objects. Capture means the programme will hold
  photorealistic models of funerary material, and the consent question can no
  longer be deferred to a later phase.
- **ADR-004 and ADR-007 should be presented as open, not settled.** Bringing
  reopened decisions to the meeting is the point of having recorded the
  feedback at all.

---

## 8. Known weaknesses in our own work — say these before they are found

Stating these first is cheaper than being asked.

| Weakness | Where | Status |
|---|---|---|
| Three disagreeing confidence scores | across repos | v0.4 resolves ([ADR-002](DECISIONS.md#adr-002)) |
| Nothing validated against ground truth — unclear whether showcased scores were computed or hand-authored | arts-provenance-agent, raised by its own peer reviewer | **Open.** Must be closed before any score is shown to AABC |
| Source list biased toward Western institutions; searches worst where the motivating harm lives | arts-provenance-agent, provenance-search — self-declared in both | **Open.** P0 in [BACKLOG](../BACKLOG.md), needs budget |
| Headline claim "hallucinated history structurally impossible" is retracted later in the same paper. Correct claim: *unsourced* history is impossible | arts-provenance-agent | **Open.** Wording fix |
| Arithmetic error in the one place the reader is invited to check the score by hand | provenance-search, self-declared | Moot once [ADR-002](DECISIONS.md#adr-002) lands, but the paper needs rewriting |
| Source-community disclosure tier decided with no source-community input | dpa-prototype | **Open.** Decision #5 above |
| Duplicate detection is session-only; there is no registry | digital-passport-artworks — README is explicit | Needs persistence in v0.4 |
| HopeOS is a single HTML file (MediaPipe + particle globe), not the haptic/voice SDK the exhibit plan assumed | dpa-prototype | Isolated behind `IRenderer`; exhibit haptics are unbacked |
| The 3D exhibit artifact is a placeholder sci-fi helmet, not a cultural object | dpa-prototype | Needs a real scan |
| The framework repo is private, which is why its disclosure model never propagated | dpa-prototype | Decision #3 above |
