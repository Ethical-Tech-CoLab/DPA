import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { readIndex, readCoverage } from "../../lib/fixtures";
import { VOICE_INTENTS } from "../../lib/exhibit";

export const metadata: Metadata = {
  title: "Exhibit — DPA v0.4",
  description:
    "From shadow to light: showing a contested object publicly without moving it, insuring it, or exposing its holder.",
};

const ExhibitViewer = dynamic(() => import("../../components/ExhibitViewer"), {
  ssr: false,
  loading: () => <div className="viewer viewer-loading">Loading exhibit…</div>,
});

export default function ExhibitPage() {
  const index = readIndex();
  const entry = index.passports.find((p) => p.id === "bura-askos");
  if (!entry) throw new Error("bura-askos missing from index");
  const cov = readCoverage(entry.id);
  const total =
    cov.identifyingRegisters.length +
    cov.weakRegisters.length +
    cov.blindRegisters.length;

  return (
    <div className="wrap">
      <header className="page-head">
        <p className="label">From shadow to light</p>
        <h1>The other half of the argument</h1>
        <p className="lede">
          The passport lets an object with contested provenance be registered
          without exposing the person holding it. That solves half the problem.
          The other half is that such an object still cannot be{" "}
          <em>seen</em> — no institution will exhibit what might be seized, and
          no holder will ship what might not come back. So it stays in a
          warehouse, unstudied, unclaimed and unreturned.
        </p>
        <p className="lede">
          A digital exhibit breaks that deadlock. The object goes nowhere. The
          insurance exposure is zero. The source community, the scholar and the
          public all get access on the same day — and the disclosure envelope
          that governs the record governs the room.
        </p>
      </header>

      <ExhibitViewer
        score={entry.confidenceScore}
        coverageClass={entry.coverageClass}
        identifying={cov.identifyingRegisters.length}
        totalRegisters={total}
      />

      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <p className="label">What is real here</p>
          <ul>
            <li>
              The point-of-interest model, the tier gating and the haptic
              profiles are the real contract, in{" "}
              <code>apps/web/lib/exhibit.ts</code>.
            </li>
            <li>
              The role filter is the same envelope the passport uses. Withheld
              points of interest are not rendered, not dimmed.
            </li>
            <li>
              The coverage narration is generated from the passport, so the room
              and the record cannot say different things.
            </li>
          </ul>
        </div>
        <div className="card">
          <p className="label">What is a stand-in</p>
          <ul>
            <li>
              The geometry is procedural. A real exhibit loads a photogrammetry
              mesh through <code>modelUrl</code>; committing a scan of a
              contested object to a public repository is not a neutral act.
            </li>
            <li>
              Haptics degrade to the browser Vibration API, which is a crude
              proxy for what HopeOS can do on real hardware.
            </li>
            <li>
              Voice is button-driven with speech synthesis for output. Intent
              recognition is not wired.
            </li>
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <p className="label">The HopeOS boundary</p>
        <h2>Why the adapter is written before the integration</h2>
        <p className="dim">
          HopeOS — Hannah Zhao&rsquo;s immersive runtime — supplies 3D
          presentation with haptic feedback and a voice interface. This page does
          not depend on it. It defines an <code>ExhibitRuntime</code> contract the
          exhibit needs and ships a three.js implementation of that contract, so
          the scene model, the intent grammar and the tier gating can be built,
          demonstrated and argued about before any hardware is in the room.
        </p>
        <p className="dim">
          If HopeOS exposes a different API surface, the adapter is the only
          thing that changes. That is the entire reason for writing it this way
          round: the interesting decisions here are about disclosure and
          narration, and none of them should be waiting on a device.
        </p>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <p className="label">Voice intent grammar</p>
        <table className="tbl">
          <thead>
            <tr>
              <th>Intent</th>
              <th>Tier</th>
              <th>Example utterance</th>
              <th>What it surfaces</th>
            </tr>
          </thead>
          <tbody>
            {VOICE_INTENTS.map((i) => (
              <tr key={i.intent}>
                <td className="mono-sm">{i.intent}</td>
                <td>
                  <span className={`tier-tag role-${i.tier}`}>{i.tier}</span>
                </td>
                <td className="faint">&ldquo;{i.utterances[0]}&rdquo;</td>
                <td className="dim">{i.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="faint" style={{ marginTop: 12 }}>
          Note that <code>locate</code> is public but never returns the current
          location — that is enforcement tier. An exhibit that answers
          &ldquo;where is it now?&rdquo; in a public gallery has told a thief
          where to go.
        </p>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <p className="label">Why this object</p>
        <p className="dim">{entry.teachingPoint}</p>
        <p className="dim">
          The Benin bronze would make an easier exhibit. It is already in
          collections, already photographed, already argued over in public. The
          Bura askos is the object nobody can see: no register can name it, no
          institution will show it, and the instrument written to protect it —
          the 1970 UNESCO Convention — presumes an inventory that was never made.
          If the exhibit works for this object it works for the hard case.
        </p>
      </div>
    </div>
  );
}
