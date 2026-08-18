import { describe, it, expect } from "vitest";
import { assessCapture, type CaptureMeasurements } from "./assess.js";
import { METRIC_SPECS } from "./rubric.js";

/** A capture that is excellent on every dimension. */
const EXCELLENT: CaptureMeasurements = {
  "angular-coverage": 0.97,
  "surface-completeness": 0.97,
  "image-overlap": 0.8,
  sharpness: 420,
  exposure: 0.002,
  "ground-sample-distance": 0.15,
  "scale-reference": 1,
  "colour-reference": 1,
  "lighting-consistency": 0.93,
  "device-metadata": 1,
};

describe("assessCapture", () => {
  it("rates a complete, well-executed capture as reference", () => {
    const q = assessCapture(EXCELLENT, { method: "photogrammetry-dslr" });
    expect(q.qualityClass).toBe("reference");
    expect(q.limitingMetric).toBeNull();
  });

  it("is bounded by its WORST dimension, not the average", () => {
    /* Everything excellent except focus. An averaging model would call this
     * good; a mesh built from blurred frames is not good. */
    const blurred = { ...EXCELLENT, sharpness: 25 };
    const q = assessCapture(blurred, { method: "photogrammetry-mobile" });

    expect(q.qualityClass).toBe("insufficient");
    expect(q.limitingMetric).toBe("sharpness");
  });

  it("allows a high score to coexist with a low class, deliberately", () => {
    /* The two numbers answer different questions and are permitted to
     * disagree. If someone later "simplifies" this into one number, this test
     * is what should stop them. */
    const q = assessCapture(
      { ...EXCELLENT, "scale-reference": 0 },
      { method: "photogrammetry-mobile" },
    );

    expect(q.qualityScore).toBeGreaterThan(80);
    expect(q.qualityClass).toBe("indicative");
    expect(q.limitingMetric).toBe("scale-reference");
  });

  it("treats an unmeasured dimension as absent, never as passing", () => {
    const { "scale-reference": _omitted, ...withoutScale } = EXCELLENT;
    const q = assessCapture(withoutScale, { method: "photogrammetry-mobile" });

    expect(q.qualityClass).not.toBe("reference");
    const scale = q.metrics.find((m) => m.id === "scale-reference")!;
    expect(scale.measured).toBe("not measured");
    expect(scale.value).toBe(0);
    expect(q.note).toContain("never measured");
  });

  it("reports every metric, whether measured or not", () => {
    const q = assessCapture({}, { method: "photogrammetry-mobile" });
    expect(q.metrics).toHaveLength(METRIC_SPECS.length);
    expect(q.qualityClass).toBe("insufficient");
  });

  it("names the dimension furthest from clearing its next threshold", () => {
    /* Both sit in `indicative`; overlap is 0.14 below the `study` threshold
     * and lighting only 0.03 below it, so overlap is the thing worth fixing. */
    const q = assessCapture(
      { ...EXCELLENT, "image-overlap": 0.58, "lighting-consistency": 0.62 },
      { method: "photogrammetry-mobile" },
    );
    expect(q.qualityClass).toBe("indicative");
    expect(q.limitingMetric).toBe("image-overlap");
  });

  it("scores 0-100 and never outside it", () => {
    for (const m of [{}, EXCELLENT, { sharpness: 1e6 }]) {
      const q = assessCapture(m, { method: "lidar" });
      expect(q.qualityScore).toBeGreaterThanOrEqual(0);
      expect(q.qualityScore).toBeLessThanOrEqual(100);
    }
  });

  it("declares scores comparable only within a capture method", () => {
    const q = assessCapture(EXCELLENT, { method: "lidar" });
    expect(q.comparability).toContain("lidar");
    expect(q.comparability.toLowerCase()).toContain("not equivalent");
  });

  it("explains why every dimension matters, in terms a museum can read", () => {
    const q = assessCapture(EXCELLENT, { method: "photogrammetry-mobile" });
    for (const m of q.metrics) {
      expect(m.why.length).toBeGreaterThan(80);
    }
  });
});
