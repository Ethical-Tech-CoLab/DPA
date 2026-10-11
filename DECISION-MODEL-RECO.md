# Decision-model recommendation: DPA evidence and identity triage

Date: 2026-10-11. Status: proposal, not an implemented or measured integration.
Scope: this repository. Public sources only. No model API calls were made.

## Existing implementation and non-negotiable boundaries

Reviewed revision: `cc0091782bb7aacaf9db3fbb069d134c4fe25d02`.
The [README](https://github.com/Ethical-Tech-CoLab/DPA/blob/cc0091782bb7aacaf9db3fbb069d134c4fe25d02/README.md)
describes a working monorepo with fixture-backed review behavior.
[Identity similarity](https://github.com/Ethical-Tech-CoLab/DPA/blob/cc0091782bb7aacaf9db3fbb069d134c4fe25d02/packages/identity/src/similarity.ts)
uses deterministic perceptual-hash distance.
[Lifecycle review](https://github.com/Ethical-Tech-CoLab/DPA/blob/cc0091782bb7aacaf9db3fbb069d134c4fe25d02/packages/lifecycle/src/review.ts)
combines duplicate status, confidence and coverage without making them
interchangeable. These implementation files, not just the README, were read.

Preserve the [repository instructions](https://github.com/Ethical-Tech-CoLab/DPA/blob/cc0091782bb7aacaf9db3fbb069d134c4fe25d02/AGENTS.md):
coverage is not part of the confidence score; capture quality cannot alter
provenance confidence; uncertain identity and structural coverage gaps remain
review conditions. A high score must not clear unavailable evidence.

## Recommended bounded experiment

Keep exact hashes and dHash candidate generation. Add a **separate read-only
semantic pair assessment** for candidates already sent to review:

- Input: two object records, source references, known identifiers, dates,
  material/dimensions and explicit missing fields. Treat text as untrusted data.
- Output: same physical object / related object or reproduction / different /
  insufficient evidence, with source-linked field assessments.
- Consumer: the reviewer UI or an offline review queue, never the issuance
  decision or authoritative identity graph.

In a second experiment, rerank retrieved provenance sources for the particular
object before narrative synthesis. Preserve rejected candidates and coverage
metadata. A pointwise relevance rubric can be sorted by ordinary code.

Do not replace similarity thresholds, cryptographic verification, review
routing, recorded findings, or human merge approval. Do not redefine an
application confidence index as P(authentic).

## Models and alternatives

Compare existing rules first. Jev's
[entity-alignment recipe](https://docs.typesafe.ai/cookbooks/entity_alignment.md)
is a useful pair-assessment starting point, but its ordinal rounding is not an
acceptable automatic merge policy. Microsoft-Decision-1 is a candidate when an
approved Foundry endpoint is available. Sage is an alternative to evaluate for
native decision operations, not an assumed accuracy winner.

For local-only experiments use existing hashes/fuzzy matching, a licensed local
embedding or cross-encoder model, or a small locally hosted classifier. The
three named proprietary models do not provide their exact checkpoints for
local inference in the researched public documentation.

## Evaluation and release gate

Use curator-adjudicated distinct objects, duplicates, reproductions, missing
provenance, disputed attribution and low-coverage records. Split by physical
object and source family before tuning. Preserve all existing fixtures.

Measure blocking recall, false-merge proposals, pair precision/recall,
calibration, A/B symmetry, option-order flips, reviewer time and accepted-link
cost. For ranking measure candidate recall, NDCG and recall in the review
shortlist. Analyze coverage strata separately; do not rank thin evidence as
more trustworthy merely because its model score is higher.

Initial gate: no automatic issuance or merge; existing route and coverage
outputs must remain unchanged for every regression fixture. Any eventual
threshold needs held-out confidence bounds and explicit curator approval.
Missing evaluation is a blocked release, not a pass.

## Cost hypothesis and next step

There is no measured model saving here. Semantic triage adds cost unless it
removes a more expensive review or synthesis step. Measure retrieval, fan-out,
retries, fallback and human correction in cost per accepted review.

Prototype behind an off-by-default adapter using approved fixtures. Keep the
existing path as immediate rollback. This recommendation does not request
runtime changes in capture or sibling provenance projects.
