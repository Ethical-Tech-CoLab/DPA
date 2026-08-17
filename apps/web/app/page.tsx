export const dynamic = "force-static";

const bp = process.env.NEXT_PUBLIC_BASE_PATH || "";

const REPOS = [
  {
    name: "arts-provenance-agent",
    org: "Ethical-Tech-CoLab",
    what: "Peer-reviewed research agent. Grounded evidence, tiered register checks, signed JSON-LD passport, x402 micropayments.",
    gives: "Passport envelope · coverage model · canonical scorer",
    status: "Most mature",
  },
  {
    name: "provenance-search",
    org: "Ethical-Tech-CoLab",
    what: "Eight-source provenance lookup with Gemini Vision identification and in-museum camera capture.",
    gives: "Evidence connectors · image identification · field capture",
    status: "Deployed",
  },
  {
    name: "digital-passport-artworks",
    org: "Ethical-Tech-CoLab",
    what: "The full lifecycle, client-side: issue, revoke, reinstate, verify, plus image forensics and duplicate detection.",
    gives: "Lifecycle + revocation · institutional CA chain · forensics",
    status: "Complete lifecycle",
  },
  {
    name: "VANGO",
    org: "Ethical-Tech-CoLab",
    what: "Visitor-facing art passport. QR stamps, three languages, a physical-to-digital bridge.",
    gives: "Stays a separate client of the public tier (ADR-007)",
    status: "Not folded in",
  },
  {
    name: "dpa-prototype",
    org: "yorkerhodes3",
    what: "The framework reference implementation: role-gated disclosure, EAS notarisation, 3D exhibit.",
    gives: "Confidentiality envelope · notarisation spine · exhibit",
    status: "The framework",
  },
];

const STAGES = [
  { n: 1, name: "Identify", pkg: "@dpa/identity", what: "image → object. Fingerprints, duplicate detection, forensics, Vision identification." },
  { n: 2, name: "Investigate", pkg: "@dpa/evidence", what: "object → sourced claims. One connector interface, tiered register checks." },
  { n: 3, name: "Assess", pkg: "@dpa/assess", what: "claims → confidence score AND coverage class, computed independently." },
  { n: 4, name: "Issue", pkg: "@dpa/issue", what: "one signed envelope, two issuer classes — pseudonymous wallet or accredited institution." },
  { n: 5, name: "Govern", pkg: "@dpa/govern", what: "confidentiality envelope + on-chain notarisation of the hash only." },
  { n: 6, name: "Maintain", pkg: "@dpa/lifecycle", what: "revocation, amendment, claims, human review." },
  { n: 7, name: "Present", pkg: "apps/web", what: "role-gated views, the 3D exhibit, and VANGO as an external consumer." },
];

export default function Home() {
  return (
    <>
      {/* ---------------- hero ---------------- */}
      <section className="wrap" style={{ paddingTop: 72, paddingBottom: 8 }}>
        <p className="label">AABC × SDA Bocconi · v0.4</p>
        <h1 style={{ fontSize: "2.7rem", maxWidth: 820 }}>
          Digital Passport for Artworks
        </h1>
        <p style={{ fontSize: "1.12rem", maxWidth: 720 }} className="dim">
          An artwork with uncertain provenance is invisible. Surfacing it exposes
          its holder to legal and reputational risk, so it stays in the dark —
          unlent, unstudied, unclaimable. The DPA lets a holder register an
          object pseudonymously, prove the registration is immutable and
          time-stamped, and then disclose <em>different amounts of it to
          different parties</em>.
        </p>
        <p style={{ maxWidth: 720 }} className="dim">
          This repository is the <strong>v0.4 consolidation</strong>: one
          pipeline assembled from five separate working prototypes.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
          <a className="btn" href={`${bp}/demo/`} data-active="true">
            See a passport through five roles →
          </a>
          <a className="btn" href={`${bp}/coverage/`}>
            Why a low score means two things
          </a>
          <a className="btn" href={`${bp}/plan/`}>
            Read the plan
          </a>
        </div>
      </section>

      {/* ---------------- the problem ---------------- */}
      <section className="wrap" style={{ paddingTop: 64 }}>
        <h2>Five working systems, and that was the problem</h2>
        <p className="dim narrow">
          The framework prototype defined the shape of the problem. Student teams
          then outran it on substance — building better evidence gathering,
          better forensics, a complete lifecycle, and a real consumer product.
          None of them could talk to each other.
        </p>

        <div className="grid grid-2" style={{ marginTop: 24 }}>
          <div className="card">
            <p className="label">Before v0.4</p>
            <ul className="dim" style={{ paddingLeft: "1.1em", marginBottom: 0 }}>
              <li><strong>Three</strong> confidence scores that disagreed about the same object</li>
              <li><strong>Four</strong> passport formats, none validating against each other</li>
              <li><strong>Two</strong> incompatible cryptographic trust models</li>
              <li>Two duplicate evidence stacks hitting the same sources</li>
              <li>Role-gated disclosure in exactly one repo — the private one</li>
              <li>Coverage epistemics in exactly one other repo</li>
            </ul>
          </div>
          <div className="card">
            <p className="label">v0.4</p>
            <ul className="dim" style={{ paddingLeft: "1.1em", marginBottom: 0 }}>
              <li><strong>One</strong> scorer — accumulation, from a base of 30</li>
              <li><strong>One</strong> passport envelope, signed over one canonicalisation</li>
              <li><strong>Two</strong> issuer classes, deliberately — pseudonymity <em>and</em> accreditation</li>
              <li>One evidence service behind one connector interface</li>
              <li>Disclosure enforced at the boundary, for every field</li>
              <li>Coverage mandatory on every passport, never folded into the score</li>
            </ul>
          </div>
        </div>

        <div className="warn-box" style={{ maxWidth: 780 }}>
          <strong>The core finding.</strong> The five projects were never
          competing implementations. They are the consecutive stages of one
          pipeline that nobody had drawn.
        </div>
      </section>

      {/* ---------------- pipeline ---------------- */}
      <section className="wrap" style={{ paddingTop: 40 }}>
        <h2>The pipeline</h2>
        <div className="grid" style={{ gap: 8, marginTop: 18 }}>
          {STAGES.map((s) => (
            <div
              key={s.n}
              className="card"
              style={{ display: "flex", gap: 16, alignItems: "baseline", padding: "13px 18px" }}
            >
              <span
                className="mono"
                style={{ color: "var(--accent)", fontWeight: 700, minWidth: 20 }}
              >
                {s.n}
              </span>
              <div style={{ minWidth: 108, fontWeight: 600 }}>{s.name}</div>
              <code style={{ minWidth: 148, fontSize: ".76rem" }}>{s.pkg}</code>
              <div className="dim" style={{ fontSize: ".9rem", flex: 1 }}>
                {s.what}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- three numbers ---------------- */}
      <section className="wrap" style={{ paddingTop: 56 }}>
        <h2>Three numbers, never combined</h2>
        <p className="dim narrow">
          A recurring failure across the upstream repos was one number carrying
          several meanings. v0.4 names three and forbids merging them.
        </p>
        <div className="grid grid-3" style={{ marginTop: 20 }}>
          <div className="card">
            <p className="label">confidenceScore</p>
            <p style={{ margin: ".4em 0" }}>How much sourced provenance evidence exists?</p>
            <p className="faint" style={{ fontSize: ".85rem", marginBottom: 0 }}>
              0–100, accumulated from 30. Never adjusted by coverage.
            </p>
          </div>
          <div className="card">
            <p className="label">coverageClass</p>
            <p style={{ margin: ".4em 0" }}>Could that evidence ever have existed?</p>
            <p className="faint" style={{ fontSize: ".85rem", marginBottom: 0 }}>
              Never reduced to a number. Never folded into the score.
            </p>
          </div>
          <div className="card">
            <p className="label">forgeryRisk</p>
            <p style={{ margin: ".4em 0" }}>Is this image what it claims to be?</p>
            <p className="faint" style={{ fontSize: ".85rem", marginBottom: 0 }}>
              A different question from “was this looted?”. Same scale, unrelated.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- what was consolidated ---------------- */}
      <section className="wrap" style={{ paddingTop: 56 }}>
        <h2>What was consolidated</h2>
        <table>
          <thead>
            <tr>
              <th>Repository</th>
              <th>What it is</th>
              <th>What v0.4 takes</th>
            </tr>
          </thead>
          <tbody>
            {REPOS.map((r) => (
              <tr key={r.name}>
                <td>
                  <a
                    href={`https://github.com/${r.org}/${r.name}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {r.name}
                  </a>
                  <div className="faint mono" style={{ fontSize: ".72rem" }}>
                    {r.status}
                  </div>
                </td>
                <td className="dim">{r.what}</td>
                <td className="dim">{r.gives}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="faint" style={{ fontSize: ".88rem" }}>
          Every vendored module carries a provenance header naming its origin.
          Full credit in{" "}
          <a href="https://github.com/Ethical-Tech-CoLab/DPA/blob/main/ATTRIBUTION.md">
            ATTRIBUTION.md
          </a>
          .
        </p>
      </section>

      {/* ---------------- honesty ---------------- */}
      <section className="wrap" style={{ paddingTop: 56, paddingBottom: 20 }}>
        <h2>What this is not</h2>
        <div className="grid grid-2">
          <div className="card">
            <p className="label" style={{ color: "var(--bad)" }}>Not a certificate</p>
            <p className="dim" style={{ marginBottom: 0 }}>
              No register check in this system can return <em>clear</em>. The
              strongest available negative is <code>no-evidence-found</code>.
              Colonial and archaeological material was never inventoried, so a
              “clean” verdict would be issued most confidently for exactly the
              objects most likely to be problematic.
            </p>
          </div>
          <div className="card">
            <p className="label" style={{ color: "var(--bad)" }}>Not validated</p>
            <p className="dim" style={{ marginBottom: 0 }}>
              Everything here runs on committed fixtures. The scorer is real and
              the sources are real and cited, but no live register was queried,
              no attestation was written to a chain, and the scoring has not been
              validated against ground truth. That is the first open item in the{" "}
              <a href={`${bp}/plan/#backlog-md`}>backlog</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
