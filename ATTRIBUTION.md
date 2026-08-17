# Attribution

The v0.4 monorepo is a **consolidation**. Most of the code in `packages/` was
written elsewhere, by other people, and vendored here. This file records who
wrote what.

Every vendored source file also carries a `PROVENANCE:` header naming the
repository and module it came from. If you find code here without one, that is a
bug — please open an issue.

---

## Upstream repositories

### [`Ethical-Tech-CoLab/arts-provenance-agent`](https://github.com/Ethical-Tech-CoLab/arts-provenance-agent) — MIT

The largest single contributor to v0.4, and the only part of the programme that
has been through independent academic peer review (22 Jul 2026, verdict *minor
revisions*).

| Vendored into | Original |
|---|---|
| `packages/schema` | `schema/passport.ts` — adopted as the canonical envelope ([ADR-001](docs/DECISIONS.md#adr-001)) |
| `packages/assess/src/scorer.ts` | `src/agent/assessRisk.ts` — the canonical accumulation scorer ([ADR-002](docs/DECISIONS.md#adr-002)) |
| `packages/assess/src/coverage.ts` | `src/lib/coverage.ts` — the coverage model ([ADR-003](docs/DECISIONS.md#adr-003)) |
| `packages/evidence/src/connectors/`, `registers.ts` | `src/tools/` — Tavily, Wikidata, tiered register checks |
| `packages/issue/src/wallet.ts` | `src/lib/signing.ts`, `src/wallet/` — secp256k1 / EIP-191 / `did:pkh` |
| `packages/payments` | `src/agent/payForCheck.ts`, `src/lib/spend.ts`, `src/vendor/server.ts` — x402 |
| `apps/agent` | `src/agent/orchestrator.ts`, `parseIntent.ts`, `timeline.ts` |

**Ideas adopted wholesale, which matter more than the code:**

- **The coverage model.** That absence of evidence and absence of coverage
  produce the same low number, and that only one of them is about the object.
  This is the best idea in the programme.
- **"No register check returns *clear*."** The strongest available negative is
  `no-evidence-found` ([ADR-009](docs/DECISIONS.md#adr-009)).
- **Per-claim evidence provenance.** No source, no claim.
- **Signing the caveat alongside the verdict**, so a result cannot be stripped
  from the qualification that makes it readable.
- **Honesty about its own source bias** — that the permitted-source list
  searches worst exactly where the motivating harm lives. Carried into
  `packages/evidence/src/sourceBias.ts` rather than quietly dropped.

### [`Ethical-Tech-CoLab/provenance-search`](https://github.com/Ethical-Tech-CoLab/provenance-search) — MIT

| Vendored into | Original |
|---|---|
| `packages/evidence/src/connectors/` | The Met, Art Institute of Chicago, MoMA, Wikipedia, Europeana connectors |
| `packages/identity/src/identify.ts` | Gemini Vision identification (`/api/identify`) |
| `apps/web` field capture | Camera / Field Mode UX |
| `packages/evidence` general-knowledge policy | The `isGeneralKnowledge: true` labelling pattern, generalised ([ADR-008](docs/DECISIONS.md#adr-008)) |

Its `computeConfidenceScore` was **deliberately not ported** — see
[ADR-002](docs/DECISIONS.md#adr-002). That is a decision about consolidation, not
a judgement about the work.

### [`Ethical-Tech-CoLab/digital-passport-artworks`](https://github.com/Ethical-Tech-CoLab/digital-passport-artworks) — MIT
Originally by **[@ChristineLumen](https://github.com/ChristineLumen)**.

| Vendored into | Original |
|---|---|
| `packages/identity/src/fingerprint.ts`, `similarity.ts`, `forensics.ts` | SHA-256 + perceptual dHash + angle count; Harris corners, SIFT-style descriptors, RANSAC; ELA, noise floor, spectral/edge energy |
| `packages/issue/src/institution.ts` | The ECDSA P-256 governance root → federated root → issuing CA chain ([ADR-004](docs/DECISIONS.md#adr-004)) |
| `packages/lifecycle/src/statusList.ts` | StatusList2021-style signed revocation bitstring |
| `packages/lifecycle/src/review.ts` | The human review gate and its routing thresholds |

It is the only upstream project with a **complete lifecycle** — issue, revoke,
reinstate, verify — and the only one that modelled **accreditation** rather than
self-assertion. Both are load-bearing in v0.4.

### [`Ethical-Tech-CoLab/VANGO`](https://github.com/Ethical-Tech-CoLab/VANGO) — MIT

**No code vendored.** VANGO remains its own repository and its own product, by
design ([ADR-007](docs/DECISIONS.md#adr-007)). It is the reference consumer of
the public disclosure tier rather than a module of the core.

Its contribution to v0.4 is conceptual: it is the only consumer-facing surface in
the programme, the only multilingual one (EN/FR/IT), and the only physical→digital
bridge. Its catalogue entry `BURA01` — Bura Ceramics, Niger, AABC — pointed at the
object now used as the hero case throughout this repo.

### [`yorkerhodes3/dpa-prototype`](https://github.com/yorkerhodes3/dpa-prototype) — the framework reference implementation

| Vendored into | Original |
|---|---|
| `packages/govern/src/redact.ts`, `envelope.ts` | `lib/dpa.ts`, `schemas/confidentiality-envelope.json` — the confidentiality envelope |
| `packages/schema/src/roles.ts` | The role model, including the orthogonal `source-community` role |
| `packages/govern/src/notarise.ts` | `lib/eas.ts` — EAS on Base Sepolia ([ADR-006](docs/DECISIONS.md#adr-006)) |
| `contracts/` | `DPARegistry.sol` and its Foundry tests |
| `apps/web/app/exhibit` | `exhibit/src/renderer.ts`, `hopeos-adapter.ts` |

Its mocked INTERPOL/ALR lookup was deleted and replaced by the real evidence
service ([ADR-008](docs/DECISIONS.md#adr-008)).

---

## Third-party

- **[HopeOS](https://github.com/kennyAIrepo/hopeOS)** by **Hannah Zhao / @kennyAIrepo** — the gesture-driven particle-globe renderer the exhibit's `IRenderer` adapter targets. HopeOS is a single-file MediaPipe Hands + Three.js visualisation; the exhibit's haptic and voice ambitions are **not** backed by it, and the abstraction exists so real hardware can be substituted later.
- **[Khronos glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models)** — CC0. `DamagedHelmet.glb` is a placeholder standing in for a real cultural-object scan.
- **[@noble/curves](https://github.com/paulmillr/noble-curves)** and **[@noble/hashes](https://github.com/paulmillr/noble-hashes)** by Paul Miller — MIT. Chosen over `node:crypto` so the crypto runs unchanged in the browser.
- **[Zod](https://github.com/colinhacks/zod)**, **[Next.js](https://nextjs.org)**, **[three.js](https://threejs.org)**, **[Foundry](https://github.com/foundry-rs/foundry)**, **[EAS](https://attest.sh)**.

---

## Research and framework

The programme is defined by **Annex A — Preliminary Research Framework
(February 2026)**, produced for **AABC / Ars Pro Mundo** with **SDA Bocconi**.
The four-layer passport model (descriptive / legal / blockchain / physical), the
role-gated disclosure requirement, and the "From Shadow to Light" framing are
from that document.

Three research reports remain with their original repositories and are cited
rather than absorbed:

- `DPP-Paper.md` and `PEER-REVIEW.md` — `arts-provenance-agent`
- `Provenance-Search-Paper.md` — `provenance-search`
- `VANGO-Paper.md` — `VANGO`

---

## Licence

Vendored code retains its original MIT licence. New code in this repository is
MIT. Planning and research documents in `docs/` are CC BY 4.0.

If you contributed to any upstream repository and want your attribution changed,
corrected, or removed, please open an issue — it will be actioned.
