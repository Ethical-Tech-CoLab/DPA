import { describe, it, expect } from "vitest";
import { advise } from "./guidance.js";
import { METRIC_SPECS } from "./rubric.js";
import type { CaptureMeasurements } from "./assess.js";

const GOOD_LIVE: CaptureMeasurements = {
  "angular-coverage": 0.95,
  "surface-completeness": 0.95,
  "image-overlap": 0.8,
  sharpness: 400,
  exposure: 0.002,
  "ground-sample-distance": 0.15,
  "scale-reference": 1,
  "colour-reference": 1,
  "lighting-consistency": 0.9,
};

describe("advise", () => {
  it("only reads dimensions that can be measured during capture", () => {
    const g = advise(GOOD_LIVE);
    const live = METRIC_SPECS.filter((s) => s.liveMeasurable).map((s) => s.id);
    expect(g.signals.map((s) => s.id).sort()).toEqual([...live].sort());
  });

  it("surfaces the deferred checks rather than implying all is well", () => {
    const g = advise(GOOD_LIVE);
    expect(g.deferred).toContain("device-metadata");
    expect(g.summary).toContain("after processing");
  });

  it("gives exactly one instruction at a time", () => {
    const g = advise({ ...GOOD_LIVE, sharpness: 25, "image-overlap": 0.42 });
    expect(g.primaryMetric).not.toBeNull();
    expect(typeof g.primaryAction).toBe("string");
  });

  it("prioritises a blocking dimension over one merely below target", () => {
    /* Overlap is blocking; colour reference is only below target. A
     * contributor told to fetch a colour chart while their frames are
     * unmatched has been given the wrong instruction. */
    const g = advise(
      { ...GOOD_LIVE, "image-overlap": 0.3, "colour-reference": 0 },
      { target: "reference" },
    );
    expect(g.primaryMetric).toBe("image-overlap");
  });

  it("stops instructing once the target is met", () => {
    const g = advise(GOOD_LIVE, { target: "study" });
    expect(g.meetsTarget).toBe(true);
    expect(g.primaryAction).toBeNull();
  });

  it("raises the bar when the target is raised", () => {
    const atStudy = advise(GOOD_LIVE, { target: "study" });
    const atReference = advise(
      { ...GOOD_LIVE, "colour-reference": 0 },
      { target: "reference" },
    );
    expect(atStudy.meetsTarget).toBe(true);
    expect(atReference.meetsTarget).toBe(false);
    expect(atReference.primaryMetric).toBe("colour-reference");
  });

  it("keeps the instruction stable when two dimensions are near-tied", () => {
    /* Without hysteresis this pair would swap the headline several times a
     * second, which reads as malfunction and cannot be obeyed. */
    const wobble = {
      ...GOOD_LIVE,
      "image-overlap": 0.58,
      "lighting-consistency": 0.6,
    };
    const first = advise(wobble, { target: "reference" });
    const held = advise(
      { ...wobble, "lighting-consistency": 0.595 },
      { target: "reference", previousMetric: first.primaryMetric },
    );
    expect(held.primaryMetric).toBe(first.primaryMetric);
  });

  it("still switches when something is clearly worse", () => {
    const first = advise(
      { ...GOOD_LIVE, "lighting-consistency": 0.6 },
      { target: "reference" },
    );
    const switched = advise(
      { ...GOOD_LIVE, "lighting-consistency": 0.6, sharpness: 21 },
      { target: "reference", previousMetric: first.primaryMetric },
    );
    expect(switched.primaryMetric).toBe("sharpness");
  });

  it("treats an unmeasured live dimension as needing attention", () => {
    const { "scale-reference": _omitted, ...partial } = GOOD_LIVE;
    const g = advise(partial, { target: "study" });
    const scale = g.signals.find((s) => s.id === "scale-reference")!;
    expect(scale.state).toBe("unknown");
    expect(g.meetsTarget).toBe(false);
  });

  it("says plainly when a session would not be accepted", () => {
    const g = advise({ ...GOOD_LIVE, sharpness: 21 });
    expect(g.provisionalClass).toBe("insufficient");
    expect(g.summary).toContain("would not currently be accepted");
  });

  it("reports a provisional class from an empty session", () => {
    const g = advise({});
    expect(g.provisionalClass).toBe("insufficient");
    expect(g.meetsTarget).toBe(false);
    expect(g.primaryMetric).not.toBeNull();
  });

  it("gives an actionable instruction for every live dimension", () => {
    /* Worst-case raw values must be stated per metric rather than assumed to
     * be zero: `exposure` measures the fraction of pixels clipped and
     * `ground-sample-distance` measures mm per pixel, so for both of those
     * zero is the BEST possible reading, not the worst. */
    const WORST: Record<string, number> = {
      "angular-coverage": 0,
      "surface-completeness": 0,
      "image-overlap": 0,
      sharpness: 1,
      exposure: 0.2,
      "ground-sample-distance": 10,
      "scale-reference": 0,
      "colour-reference": 0,
      "lighting-consistency": 0,
    };

    for (const spec of METRIC_SPECS.filter((s) => s.liveMeasurable)) {
      const worst = WORST[spec.id];
      expect(worst, `no worst-case defined for ${spec.id}`).toBeDefined();
      const g = advise(
        { ...GOOD_LIVE, [spec.id]: worst },
        { target: "reference" },
      );
      expect(g.primaryMetric, `wrong metric flagged for ${spec.id}`).toBe(spec.id);
      expect(g.primaryAction, `no guidance for ${spec.id}`).toBeTruthy();
    }
  });
});
