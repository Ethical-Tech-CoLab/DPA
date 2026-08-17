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
## 7. AABC feedback — **to be completed before the meeting**

> ⚠️ **This section is empty and it is the most important section in the
> document.**
>
> This plan is described as responding to *"feedback from AABC,"* but that
> feedback is not recorded in any of the five repositories. Every decision in
> [DECISIONS.md](DECISIONS.md) was derived from the Annex A framework document
> and from reading the code — **not** from AABC's response to the work.
>
> Before the meeting:
>
> 1. Record the actual AABC feedback below, verbatim where possible.
> 2. Re-test each of the nine ADRs against it.
> 3. Any decision the feedback contradicts should be **reopened**, not defended.
>
> If the feedback turns out to point somewhere other than consolidation — for
> example toward a pilot deployment, or toward the legal/standards work in
> Phase 1 that the prototype deliberately skipped — then v0.4 as scoped here is
> the wrong next step and should be rescoped rather than executed.

### Feedback received

*(to be filled in)*

### Implications for the ADRs

*(to be filled in)*

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
