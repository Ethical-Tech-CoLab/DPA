# The capture protocol — Stage 0

*A protocol a museum, community archive or field team can follow to record a
cultural object in 3D, such that the record is worth something afterwards.*

Implemented in [`packages/capture`](../packages/capture). Demonstrated at
[`/capture`](https://ethical-tech-colab.github.io/DPA/capture/). Decision record:
[ADR-010](DECISIONS.md#adr-010). Origin: [AABC feedback](MEETING-BRIEF.md#aabc-feedback--to-be-completed).

---

## 1. Why this exists

Every other stage in the DPA pipeline begins **after** an object has already
been recorded by somebody. `@dpa/evidence` searches archives. `@dpa/assess`
scores what was found. `@dpa/govern` notarises the result. Where no record was
ever created, all of them can do is measure the hole.

That hole is not an edge case. It is the motivating population of the entire
programme.

The Bura askos in this repository scores **58** with **0 of 9 registers** able
to name it. Not because the search was poor — because Bura funerary sites were
never inventoried, and INTERPOL SWOA, the FBI National Stolen Art File and the
Carabinieri TPC archive hold reports of thefts *from documented collections*.
An object from an unrecorded site cannot appear in them. Ever. However much is
later learned about it.

Its own timeline records the trap exactly:

> Niger ratified the 1970 UNESCO Convention on 6 December 1997. Any Bura object
> removed after that date is in breach of Niger law and the Convention.
> **However, the Convention requires a pre-existing inventory — which Bura sites
> lack.**

Capture is the only mechanism in this programme that **creates** record rather
than querying it. It cannot help an object already looted from an unrecorded
site. It can start the record, from today, for everything still in museum,
community or private custody.

---

## 2. What a capture proves, and what it does not

A capture record carries a signature, a content hash, a timestamp and a chain
of custody. That is exactly what proof of lawful ownership looks like. **It is
not that**, and the resemblance is the single biggest risk in this stage.

| | |
|---|---|
| **Attests** | An object with these measurable characteristics was observed in this condition, at this place, at this time, by this party — and this is a tamper-evident record of that observation. |
| **Does not attest** | That the object was lawfully excavated, exported, acquired, or is lawfully held. |

A flawless capture of a looted object is a flawless capture of a looted object.

This is [ADR-009](DECISIONS.md#adr-009) — *no register check returns "clear"* —
applied to a new surface. It is enforced structurally rather than editorially:
`attests` and `doesNotAttest` are **mandatory fields of the schema**, and
`buildCaptureRecord` throws if the legitimacy disclaimer is missing. A record
without it cannot be constructed.

---

## 3. The three numbers

| Number | Asks | Package |
|---|---|---|
| `confidenceScore` | How much is known about where this object came from? | `@dpa/assess` |
| `coverage` | Could the registers have known anything at all? | `@dpa/assess` |
| `qualityScore` | How good is the record we just made of the object itself? | `@dpa/capture` |

**These never mix.** `@dpa/capture` may not import `@dpa/assess`, and
`@dpa/assess` may not import `@dpa/capture`; a test asserts it at the module
boundary.

If capture quality contributed to provenance confidence, **a museum could raise
an object's provenance confidence by buying a better camera.** An institution
with a well-funded imaging department and no provenance documentation would
outscore a community holding thorough written records and a phone. That inverts
the purpose of the programme, and it would do so invisibly, because both inputs
are legitimate and the resulting number would look perfectly reasonable.

---

## 4. Fitness classes

Quality is expressed as **fitness for a purpose**, not as a grade, because
"7.2 out of 10" tells a registrar nothing about whether they may rely on it.

| Class | Fit for |
|---|---|
| **Reference** | Serving as the identifying record of the object. Measurable, colour-accurate, complete enough that a future capture can be compared against it to detect change or substitution. |
| **Study** | Scholarly comparison and condition assessment. **Not** fit to be the sole identifying record — a determined substitution could survive comparison against it. |
| **Indicative** | Display. Shows what the object looks like; proves nothing about it. Not fit to measure, compare or identify against. |
| **Insufficient** | Nothing. Recording it as an object record would misrepresent what is known. |

### The class is the worst dimension, not the average

Four hundred photographs that are all out of focus produce an out-of-focus
mesh. A capture with flawless angular coverage, flawless overlap, flawless
lighting and **no scale bar** is a capture of an object whose size is unknown,
and no amount of the other dimensions buys that back.

So the class is the **minimum** across the ten dimensions. This is the opposite
of the provenance scorer ([ADR-002](DECISIONS.md#adr-002)), which accumulates —
because evidence genuinely does add up and surface detail genuinely does not.

There is therefore always exactly **one** thing worth fixing next. Averaging
would hide it, which is the specific failure of every five-star rating anyone
has ever been shown.

### Why there is also a score

`qualityScore` (0–100) is the mean of the normalised dimensions. It is a
**progress meter, not a fitness rating**: it exists so a contributor re-shooting
a session can see movement before the class flips over.

The two are allowed to disagree, deliberately. A capture can score **86/100 and
still be *Indicative*** if the scale bar is missing. A test locks that case in,
so that nobody later "simplifies" the pair into a single misleading number.

---

## 5. The ten dimensions

Nine can be measured **while capturing**. The tenth cannot be known until the
photographs are processed.

| # | Dimension | Measures | Live? |
|---|---|---|---|
| 1 | Angular coverage | Fraction of the viewing sphere the camera visited | ✅ |
| 2 | Surface completeness | Fraction of the surface actually observed | ✅ |
| 3 | Image overlap | Mean overlap between adjacent frames | ✅ |
| 4 | Sharpness | Variance of the Laplacian | ✅ |
| 5 | Exposure | Fraction of pixels clipped at black or white | ✅ |
| 6 | Ground sample distance | Millimetres of object per pixel | ✅ |
| 7 | Scale reference | Calibrated scale bar / AR-derived / absent | ✅ |
| 8 | Colour reference | Colour target present | ✅ |
| 9 | Lighting consistency | Stability of lighting across frames | ✅ |
| 10 | Device metadata | Fraction of frames retaining focal length, sensor and pose | ❌ |

### Two that matter more than they look

**Scale reference (7).** Without a calibrated scale in shot, the model has shape
but no size, and an object with no size cannot be measured, compared against a
written description, or matched to an excavation record. Phone AR tracking gives
approximate metric scale; for a reference record a physical scale bar remains the
standard. This is why a capture can be excellent on nine dimensions and still not
be a reference record.

**Colour reference (8).** Condition assessment depends on colour being comparable
across captures years apart. Without a colour target, the record carries whatever
cast the room lighting had, and a later capture cannot distinguish genuine
deterioration from a different set of light bulbs.

### Where the thresholds come from, honestly

The individual **measures** are standard practice: variance of the Laplacian and
Tenengrad as focus measures, histogram clipping fractions for exposure, 60–80%
image overlap for close-range heritage photogrammetry (CIPA), ground sample
distance in mm/pixel, and angular sector coverage — which is what Apple's capture
dial discretises.

The **bands** — where *reference* ends and *study* begins — are ours.

There is no ratified cross-body numerical rubric for heritage 3D capture. The
London Charter (2009) is the most widely adopted normative framework and is a
*principles* document with no numeric tiers. Historic England, the Smithsonian
DPO and Europeana have each proposed their own; none is a cross-body standard,
and several were not publicly retrievable when we checked.

Our bands are calibrated to be achievable on a mid-range phone by a museum
registrar with no photogrammetry training, because that is the population this
protocol is for. **Every threshold sits in one file**
([`rubric.ts`](../packages/capture/src/rubric.ts)) so the argument can be had
against specific numbers rather than against a vibe.

---

## 6. Real-time guidance

> *"In real time we should [have] ways to help them understand adjustments they
> need to make."* — AABC

**One instruction at a time.** Somebody walking backwards around a plinth
holding a phone can act on one instruction. Presenting ten dimensions and
inviting them to optimise produces a contributor who ignores all ten. Apple's
`ObjectCaptureSession` — the only mobile capture API with publicly documented
real-time quality signals — shows a single corrective message at a time against
a segmented dial, and that is not a UI preference.

**Only live dimensions can drive it.** Reprojection error, mesh watertightness
and point-cloud density are outputs of reconstruction. Guidance built on them is
a post-mortem, and a contributor who has packed up and gone home cannot act on
it. Dimension 10 is reported as *deferred*, explicitly, so nobody is told "all
good" by a system that has not finished looking.

**Stability matters more than precision.** Two dimensions hovering near the same
threshold would otherwise swap the headline instruction several times a second,
which reads as malfunction and cannot be obeyed. The guidance function takes the
previous instruction and keeps it unless something is clearly worse.

**Nothing unmeasured counts as passing.** A dimension the app never checked is
treated as absent, not as satisfied — the same discipline as
[ADR-009](DECISIONS.md#adr-009). Silence is not a clear result.

---

## 7. Where the provenance chain breaks — and what we do about it

C2PA solves capture-time provenance for photographs well: a hard binding over
the asset bytes, an X.509 signature, an RFC 3161 timestamp, and in Truepic's
implementation a signature applied inside the secure enclave before the image
leaves the sensor.

**None of it survives photogrammetry.**

As of spec v2.1–v2.4 the normative format list is JPEG, PNG, GIF, TIFF, BMFF
video and PDF. glTF/GLB, USDZ, E57 and PLY are absent. The photographs can be
sealed to a very high standard and **the mesh built from them inherits none of
it**. The chain breaks at exactly the step that produces the artefact anyone
will actually look at.

Every crowd-sourced heritage capture effort we surveyed — Rekrei / Project
Mosul, Backup Ukraine, the Million Image Database — used general-purpose
photogrammetry apps and sealed the 3D output not at all. Rekrei accepts any
photograph with no submission quality protocol whatsoever.

### `ReconstructionBinding`

One signed structure binding:

- the **source image set**, by a hash over the sorted per-image hashes;
- **how many** of those carried a verifiable capture-time seal;
- the **pipeline** and its parameters;
- the **output mesh hash** (hard binding);
- a **perceptual hash** of the mesh (soft binding), so a re-exported or
  metadata-stripped copy can still be re-associated with this record.

`chainComplete` is true **only** when every source image was sealed and the
pipeline is recorded. A chain that is 90% sealed is not 90% of a proof: the
unsealed 10% is precisely where a substituted photograph would be inserted, and
an attacker chooses where to attack.

It does **not** make the reconstruction reproducible. Photogrammetry pipelines
are not bit-deterministic, and `chainNote` says so rather than implying a
guarantee the format cannot make.

---

## 8. Consent and disclosure

**Capture assets never default to public.**

A mesh is not a metadata field. It carries two risks no text field carries:

1. It is a **replication asset**. A scan good enough to study is good enough to
   3D-print or to forge from.
2. For funerary or sacred material, **public visibility may itself be the harm**.

The Bura askos — the case this whole protocol is aimed at — is a grave good, and
communities in the Tillabéri region regard the burial sites as ancestral ground.
Publishing a rotatable model of grave goods is a consent question, not a
configuration setting.

| Material | Default tier |
|---|---|
| Ordinary | `museum` |
| Funerary | `source-community` |
| Sacred | `source-community` |

That default may be wrong. It is wrong in the direction that can be corrected,
whereas publishing first cannot be undone.

**This is a stopgap, not an answer.** The source-community disclosure tier was
designed with no source-community input, which was tolerable while the system
only described objects and is not tolerable now that it will hold photorealistic
models of funerary material. It is tracked as blocking in
[BACKLOG P0 §6](../BACKLOG.md).

---

## 9. Who captures

Capture operators are a **separate enum** from issuer classes, deliberately.

| Role | Meaning |
|---|---|
| `custodian-institution` | The institution holding the object, capturing its own holdings |
| `community-steward` | A source community recording material it claims cultural authority over |
| `accredited-surveyor` | A professional engaged for the purpose |
| `contributor` | Crowd-sourced. Unverified relationship to the object |

Verification is tracked separately from the claimed role, because a claimed role
is not a verified one, and the point of crowd-sourced ingestion is that most
contributions arrive `self-asserted` and must still be worth accepting:
`self-asserted` · `email-domain-verified` · `institution-attested` ·
`on-site-witnessed`.

**Why not reuse `IssuerClass`?** [ADR-004](DECISIONS.md#adr-004) defines two
issuer classes — `pseudonymous-wallet` and `accredited-institution` — and both
make assertions about ownership. A volunteer photographing a museum vitrine has
asserted nothing about title, and there must be no type by which their capture
could be read as an ownership claim.

**This is containment, not a solution.** ADR-004 has no class for a contributor
who records an object they do not own, and is
[reopened](DECISIONS.md#adr-004) because of it.

---

## 10. What is not built

- **No metric extractors.** The rubric is defined; nothing computes it from
  actual photographs yet.
- **No mobile client.** `/capture` demonstrates the rubric and the guidance loop
  against fixtures; it does not touch a camera. Whether to build new, extend
  VANGO, or wrap Apple's Object Capture is open — and it
  [reopens ADR-007](DECISIONS.md#adr-007), which placed VANGO outside the core on
  the premise that capture was out of scope.
- **No mesh perceptual hashing.** `outputPerceptualHash` is specified as dHash
  over rendered orthographic views. Not implemented.
- **Not wired to a passport.** A capture record is not yet attached to a
  `Passport`, notarised, or surfaced in `/demo`, `/coverage` or `/disclosure`.
  The end-to-end story — museum scans, scan is provenance-verified, artefact
  appears in the 3D exhibit — is not connected. `/exhibit` still renders
  procedural geometry.
- **One citation unverified.** The feedback cited a *"Manhattan Bridge
  pedestrian capture protocol."* No protocol of that name exists in any public
  source we could reach — not the Library of Congress HAER record for the bridge,
  not Starling Lab, not C2PA, not NYC DOT. The closest real thing is Starling Lab
  and Numbers Protocol's `Starlingcapture`, which anchors a cryptographic birth
  certificate in device hardware at capture time. **It is not cited as prior art
  until the original source is identified.**

Full list: [BACKLOG P0 §6](../BACKLOG.md).
