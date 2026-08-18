"use client";

/**
 * The capture guidance loop, driven by sliders instead of a camera.
 *
 * There is no mobile capture client yet, and this page does not pretend to be
 * one — it says so on the page. What it demonstrates is the part that would be
 * hard to get right regardless of where the numbers come from: how ten
 * measurements become one fitness class, one instruction, and a record that
 * states its own limits.
 *
 * Every value shown is computed live by `@dpa/capture`. Nothing here is
 * hard-coded prose about what the rubric would say.
 */

import { useMemo, useState } from "react";
import {
  METRIC_SPECS,
  advise,
  assessCapture,
  buildCaptureRecord,
  evaluateChain,
  type CaptureMeasurements,
} from "@dpa/capture";
import type { CaptureMetricId, CaptureQualityClass } from "@dpa/schema";

type Ranges = { min: number; max: number; step: number };

const RANGE: Record<string, Ranges> = {
  "angular-coverage": { min: 0, max: 1, step: 0.01 },
  "surface-completeness": { min: 0, max: 1, step: 0.01 },
  "image-overlap": { min: 0, max: 1, step: 0.01 },
  sharpness: { min: 1, max: 600, step: 1 },
  exposure: { min: 0, max: 0.2, step: 0.001 },
  "ground-sample-distance": { min: 0.05, max: 5, step: 0.05 },
  "scale-reference": { min: 0, max: 1, step: 0.5 },
  "colour-reference": { min: 0, max: 1, step: 1 },
  "lighting-consistency": { min: 0, max: 1, step: 0.01 },
  "device-metadata": { min: 0, max: 1, step: 0.01 },
};

/**
 * Three sessions of the same object, in the order a real contributor would
 * produce them. The point of the middle one is that following a single
 * instruction moves the class — the loop is worth obeying.
 */
const PRESETS: { id: string; label: string; note: string; m: CaptureMeasurements }[] = [
  {
    id: "tourist",
    label: "Phone snapshot",
    note: "Twenty photographs walked round a vitrine. What most crowd-sourced heritage archives actually receive.",
    m: {
      "angular-coverage": 0.42,
      "surface-completeness": 0.35,
      "image-overlap": 0.44,
      sharpness: 60,
      exposure: 0.06,
      "ground-sample-distance": 2.4,
      "scale-reference": 0,
      "colour-reference": 0,
      "lighting-consistency": 0.55,
      "device-metadata": 0.3,
    },
  },
  {
    id: "registrar",
    label: "Registrar, guided",
    note: "A museum registrar with no photogrammetry training, following the on-screen instruction one step at a time.",
    m: {
      "angular-coverage": 0.88,
      "surface-completeness": 0.88,
      "image-overlap": 0.72,
      sharpness: 260,
      exposure: 0.012,
      "ground-sample-distance": 0.55,
      "scale-reference": 0.5,
      "colour-reference": 0,
      "lighting-consistency": 0.78,
      "device-metadata": 0.92,
    },
  },
  {
    id: "reference",
    label: "Reference capture",
    note: "Copy stand, calibrated scale bar, colour target, diffuse lighting. The record a future capture is compared against.",
    m: {
      "angular-coverage": 0.97,
      "surface-completeness": 0.97,
      "image-overlap": 0.8,
      sharpness: 430,
      exposure: 0.002,
      "ground-sample-distance": 0.15,
      "scale-reference": 1,
      "colour-reference": 1,
      "lighting-consistency": 0.94,
      "device-metadata": 1,
    },
  },
];

const CLASS_TONE: Record<CaptureQualityClass, string> = {
  reference: "cap-ok",
  study: "cap-ok",
  indicative: "cap-warn",
  insufficient: "cap-bad",
};

export default function CaptureSimulator() {
  const [m, setM] = useState<CaptureMeasurements>(PRESETS[1]!.m);
  const [target, setTarget] = useState<CaptureQualityClass>("study");
  const [held, setHeld] = useState<CaptureMetricId | null>(null);

  const guidance = useMemo(
    () => advise(m, { target, previousMetric: held }),
    [m, target, held],
  );

  const quality = useMemo(
    () => assessCapture(m, { method: "photogrammetry-mobile" }),
    [m],
  );

  const record = useMemo(() => {
    const chain = evaluateChain({
      sourceImageCount: 240,
      sealedImageCount: 240,
      pipeline: "Metashape 2.1",
    });
    return buildCaptureRecord({
      captureId: "cap-demo",
      method: "photogrammetry-mobile",
      operatorRole: "custodian-institution",
      operatorVerification: "institution-attested",
      operatorPseudonym: "anon-registrar-01",
      observedAt: "2026-02-11",
      observedLocation: "Musée National Boubou Hama, Niamey",
      custodyStatement: "Held in the museum's permanent collection store.",
      device: "iPhone 15 Pro",
      assets: [
        {
          kind: "mesh",
          sha256: "0x" + "ab".repeat(32),
          byteLength: 41_288_192,
          mimeType: "model/gltf-binary",
        },
      ],
      reconstruction: {
        sourceImageCount: 240,
        sourceImageSetHash: "0x" + "cd".repeat(32),
        sealedImageCount: 240,
        pipeline: "Metashape 2.1",
        parameters: "high accuracy, generic preselection",
        outputHash: "0x" + "ef".repeat(32),
        outputPerceptualHash: "0x" + "12".repeat(8),
        ...chain,
      },
      quality,
      sensitivity: "funerary",
      signature: "0xdemo",
    });
  }, [quality]);

  function set(id: CaptureMetricId, v: number) {
    setHeld(guidance.primaryMetric);
    setM((prev) => ({ ...prev, [id]: v }));
  }

  return (
    <>
      <div className="card" style={{ marginTop: 24 }}>
        <p className="label">Start from</p>
        <div className="cap-presets">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="btn"
              onClick={() => {
                setHeld(null);
                setM(p.m);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="faint" style={{ marginTop: 10 }}>
          {PRESETS.find((p) => JSON.stringify(p.m) === JSON.stringify(m))?.note ??
            "Adjusted from a preset. Every number below is recomputed by @dpa/capture as you move a slider."}
        </p>

        <p className="label" style={{ marginTop: 18 }}>
          Aiming for
        </p>
        <div className="cap-presets">
          {(["indicative", "study", "reference"] as CaptureQualityClass[]).map((t) => (
            <button
              key={t}
              type="button"
              className="btn"
              aria-pressed={target === t}
              onClick={() => setTarget(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="cap-live">
        <div className={`card cap-headline ${CLASS_TONE[guidance.provisionalClass]}`}>
          <p className="label">If you stopped now</p>
          <p className="cap-class">{guidance.provisionalClass}</p>
          <p className="faint">{guidance.summary}</p>
        </div>

        <div className="card cap-headline">
          <p className="label">Do this next</p>
          {guidance.primaryAction === null ? (
            <p className="cap-action">
              Target met on every dimension measurable during capture.
            </p>
          ) : (
            <>
              <p className="cap-action">{guidance.primaryAction}</p>
              <p className="faint">
                Limiting dimension:{" "}
                {METRIC_SPECS.find((s) => s.id === guidance.primaryMetric)?.label}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <p className="label">
          Overall capture score — {quality.qualityScore} / 100
        </p>
        <p className="faint">
          A progress meter, not a fitness rating, and <strong>not</strong> a
          provenance score. The class above is what governs use; this number
          exists so a contributor re-shooting a session can see movement before
          the class flips. The two are allowed to disagree — set a reference
          capture and then remove the scale bar to see it happen.
        </p>
      </div>

      <h2 style={{ marginTop: 40 }}>The ten dimensions</h2>
      <p className="faint">
        Nine can be measured while capturing. The tenth cannot be known until the
        photographs are processed, and is shown separately for that reason —
        guidance that waits for it is a post-mortem, not advice.
      </p>

      <div className="cap-metrics">
        {METRIC_SPECS.map((spec) => {
          const signal = guidance.signals.find((s) => s.id === spec.id);
          const metric = quality.metrics.find((x) => x.id === spec.id)!;
          const r = RANGE[spec.id]!;
          const raw = m[spec.id];
          const isPrimary = guidance.primaryMetric === spec.id;
          return (
            <div
              key={spec.id}
              className={`card cap-metric ${isPrimary ? "cap-metric-primary" : ""}`}
            >
              <div className="cap-metric-head">
                <strong>{spec.label}</strong>
                <span className={`cap-pill cap-${signal?.state ?? "deferred"}`}>
                  {spec.liveMeasurable ? (signal?.state ?? "unknown") : "after processing"}
                </span>
              </div>

              <input
                type="range"
                min={r.min}
                max={r.max}
                step={r.step}
                value={raw ?? r.min}
                aria-label={spec.label}
                onChange={(e) => set(spec.id, Number(e.target.value))}
              />

              <p className="cap-measured">
                {metric.measured} <span className="dim">— permits {metric.permits}</span>
              </p>
              <p className="faint cap-why">{spec.why}</p>
            </div>
          );
        })}
      </div>

      <h2 style={{ marginTop: 40 }}>What the resulting record says about itself</h2>
      <p className="faint">
        Generated by <code>buildCaptureRecord</code> from the numbers above, for a
        capture of the Bura askos — a funerary vessel — held by the museum that
        holds the object.
      </p>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="label cap-ok">Attests</p>
        <p>{record.attests}</p>
      </div>

      <div className="card cap-bad" style={{ marginTop: 16 }}>
        <p className="label">Does not attest</p>
        <p>{record.doesNotAttest}</p>
        <p className="faint" style={{ marginTop: 12 }}>
          This field is mandatory in the schema and <code>buildCaptureRecord</code>{" "}
          throws if the legitimacy disclaimer is missing from it. A capture record
          carries a signature, a hash, a timestamp and a chain of custody, which is
          exactly what proof of lawful ownership looks like. It is not that.
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="label">Asset disclosure</p>
        <dl className="kv">
          {record.assets.map((a) => (
            <div key={a.sha256} style={{ display: "contents" }}>
              <dt>
                {a.kind} → {a.disclosureTier}
              </dt>
              <dd>{a.tierRationale}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
