import type { Metadata } from "next";
import {
  readIndex,
  readCoverage,
  readExplain,
  coverageClassName,
  type CoverageBlock,
  type IndexEntry,
} from "../../lib/fixtures";

export const metadata: Metadata = {
  title: "Coverage — DPA v0.4",
  description:
    "Why a low score on an unrecorded object and a low score on a well-documented one are not the same number.",
};

function RegisterList({
  title,
  registers,
  tone,
}: {
  title: string;
  registers: { id: string; name: string; why: string }[];
  tone: "ok" | "warn" | "bad";
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <p className={`label reg-${tone}`}>
        {title} — {registers.length}
      </p>
      {registers.length === 0 ? (
        <p className="faint">None.</p>
      ) : (
        <ul className="reg-list">
          {registers.map((r) => (
            <li key={r.id}>
              <strong>{r.name}</strong>
              <span className="dim"> — {r.why}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CoveragePanel({
  entry,
  coverage,
}: {
  entry: IndexEntry;
  coverage: CoverageBlock;
}) {
  return (
    <div className="card">
      <p className="label">{entry.acquisitionMode}</p>
      <h3>{entry.title}</h3>

      <div className="score-row" style={{ margin: "14px 0" }}>
        <div className="score-box">
          <p className="label">Score</p>
          <p className="score-num">
            {entry.confidenceScore}
            <span className="score-den">/100</span>
          </p>
        </div>
        <div className="score-box grow">
          <p className="label">Coverage class</p>
          <p
            className={coverageClassName(entry.coverageClass)}
            style={{ fontWeight: 600, fontSize: "1.05rem", marginTop: 4 }}
          >
            {entry.coverageClass}
          </p>
          <p className="faint mono-sm">
            {coverage.identifyingRegisters.length} of {coverage.identifyingRegisters.length +
              coverage.weakRegisters.length +
              coverage.blindRegisters.length}{" "}
            registers can name this object
          </p>
        </div>
      </div>

      <div className="warn-box">
        <strong>What the number means here.</strong> {coverage.note}
      </div>

      <RegisterList
        title="Can identify this object"
        registers={coverage.identifyingRegisters}
        tone="ok"
      />
      <RegisterList
        title="In scope but not identifying"
        registers={coverage.weakRegisters}
        tone="warn"
      />
      <RegisterList
        title="Structurally blind to it"
        registers={coverage.blindRegisters}
        tone="bad"
      />
    </div>
  );
}

export default function CoveragePage() {
  const index = readIndex();
  const byId = new Map(index.passports.map((p) => [p.id, p]));

  const bura = byId.get("bura-askos");
  const getty = byId.get("getty-bronze");
  if (!bura || !getty) throw new Error("expected demo cases missing from index");

  const buraCov = readCoverage(bura.id);
  const gettyCov = readCoverage(getty.id);
  const buraExplain = readExplain(bura.id);

  return (
    <div className="wrap">
      <header className="page-head">
        <p className="label">The idea the rest of the system is built on</p>
        <h1>58 is worse than 28</h1>
        <p className="lede">
          The Bura askos scores {bura.confidenceScore}. The Getty Bronze scores{" "}
          {getty.confidenceScore}. Any tool that ranks them by score has just
          told a buyer that the looted terracotta is the safer purchase. It is
          not. The scores are not on the same scale, because the registers behind
          them were not looking at the same world.
        </p>
      </header>

      <div className="grid grid-2">
        <CoveragePanel entry={bura} coverage={buraCov} />
        <CoveragePanel entry={getty} coverage={gettyCov} />
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <p className="label">The rule</p>
        <h2>Coverage is never folded into the score</h2>
        <p className="dim">
          The obvious move is to penalise low coverage — subtract points when the
          registers cannot see the object. Every version of this project that
          tried it produced the same failure: a single number that quietly
          conflated <em>&ldquo;we looked and found a problem&rdquo;</em> with{" "}
          <em>&ldquo;we could never have looked&rdquo;</em>. Those are different
          findings and a buyer needs to act differently on each, so they are
          reported as two values that must be read together.
        </p>
        <p className="dim">
          A score is only comparable within its coverage class. The system says
          so explicitly on every passport:
        </p>
        <blockquote className="quote">{buraCov.comparability}</blockquote>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <p className="label">Why the Bura askos has zero identifying registers</p>
        <p className="dim">
          INTERPOL&rsquo;s Stolen Works of Art database holds archaeological
          material — but only material somebody reported stolen. A report has to
          name an object, and naming it requires that somebody recorded it before
          it left the ground. Bura sites were known to local communities and
          never systematically excavated or inventoried by any authority. There
          is no inventory from which this vessel could be reported missing.
        </p>
        <p className="dim">
          So INTERPOL&rsquo;s silence about this object is not evidence. It is a
          structural property of the register. Counting it as coverage would
          manufacture reassurance for exactly the material that has none — which
          is why the model tracks{" "}
          <code>requiresPriorRecord</code> per register and marks those registers
          blind rather than quiet.
        </p>
        <p className="faint" style={{ marginTop: 10 }}>
          The same logic is why ICOM Red Lists appear as{" "}
          <em>in scope but not identifying</em>. A Red List names categories of
          object at risk. It is a reason to look harder, never a match.
        </p>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <p className="label">Score build-up — {bura.title}</p>
        <p className="dim">
          The scorer accumulates from a floor of 30, the honest position for
          &ldquo;nothing is known&rdquo;. An object with no published history
          scores near 30, not near 100. Absence of evidence never becomes
          evidence of clean provenance.
        </p>
        <div className="tbl-scroll">
          <table className="tbl" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ width: 70 }}>Δ</th>
              <th style={{ width: 70 }}>Total</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {buraExplain.breakdown.map((s, i) => (
              <tr key={i}>
                <td className={`mono-sm ${s.delta >= 0 ? "cov-well" : "cov-structurally"}`}>
                  {s.delta >= 0 ? "+" : ""}
                  {s.delta}
                </td>
                <td className="mono-sm">{s.runningTotal}</td>
                <td className="faint">{s.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <p className="label">All four cases</p>
        <div className="tbl-scroll">
          <table className="tbl">
          <thead>
            <tr>
              <th>Object</th>
              <th>Mode</th>
              <th>Score</th>
              <th>Coverage</th>
              <th>Identifying</th>
              <th>Routing</th>
            </tr>
          </thead>
          <tbody>
            {index.passports.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td className="faint">{p.acquisitionMode}</td>
                <td className="mono-sm">{p.confidenceScore}</td>
                <td className={coverageClassName(p.coverageClass)}>
                  {p.coverageClass}
                </td>
                <td className="mono-sm">
                  {p.identifyingRegisterCount}/{p.registerCount}
                </td>
                <td className="mono-sm">{p.routing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        <p className="faint" style={{ marginTop: 12 }}>
          Every case routes to human review, and that is the correct result.
          Auto-issue requires a score of 75 or above <em>and</em> a well-covered
          class <em>and</em> no similarity flag. A structurally uncovered object
          can never auto-issue at any score, because the score is not measuring
          the object.
        </p>
      </div>
    </div>
  );
}
