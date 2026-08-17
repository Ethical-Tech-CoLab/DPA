import { describe, it, expect } from "vitest";
import { route, AUTO_ISSUE_THRESHOLD, THIN_EVIDENCE_THRESHOLD } from "./review.js";
import type { Assessment } from "./review.js";

const base: Assessment = {
  confidenceScore: 90,
  coverageClass: "well-covered",
  duplicateConfirmed: false,
  similarityNeedsReview: false,
};

describe("review routing", () => {
  it("auto-issues only when the object is both well-covered and well-documented", () => {
    expect(route(base).routing).toBe("auto-issue");
  });

  it("sends thin evidence to a human even though the registers could see it", () => {
    const result = route({ ...base, confidenceScore: 34 });
    expect(result.routing).toBe("human-review");
    expect(result.clearReject).toBe(true);
  });

  it("sends an inconclusive middle score to a human", () => {
    expect(route({ ...base, confidenceScore: 50 }).routing).toBe("human-review");
  });

  it("treats the auto-issue threshold as inclusive", () => {
    expect(route({ ...base, confidenceScore: AUTO_ISSUE_THRESHOLD }).routing).toBe("auto-issue");
    expect(route({ ...base, confidenceScore: AUTO_ISSUE_THRESHOLD - 1 }).routing).toBe(
      "human-review",
    );
  });

  it("never auto-issues a structurally-uncovered object, however high the score", () => {
    const result = route({
      ...base,
      confidenceScore: 100,
      coverageClass: "structurally-uncovered",
    });
    expect(result.routing).toBe("human-review");
    expect(result.reason).toContain("structurally-uncovered");
  });

  it("never auto-issues a partially-covered object", () => {
    expect(route({ ...base, coverageClass: "partially-covered" }).routing).toBe("human-review");
  });

  it("does not call a low score a rejection when coverage cannot support the claim", () => {
    // Bura askos: score is low, but the registers were never able to look.
    // Calling that a "clear reject" would blame the object for our blindness.
    const result = route({
      ...base,
      confidenceScore: 10,
      coverageClass: "structurally-uncovered",
    });
    expect(result.clearReject).toBe(false);
  });

  it("calls a low score a rejection when records ought to have existed", () => {
    const result = route({
      ...base,
      confidenceScore: THIN_EVIDENCE_THRESHOLD - 1,
      coverageClass: "well-covered",
    });
    expect(result.clearReject).toBe(true);
  });

  it("sends a similarity flag to a human regardless of score", () => {
    expect(route({ ...base, similarityNeedsReview: true }).routing).toBe("human-review");
  });

  it("blocks a confirmed duplicate", () => {
    expect(route({ ...base, duplicateConfirmed: true }).routing).toBe("blocked");
  });

  it("blocks a duplicate ahead of every other consideration", () => {
    const result = route({
      ...base,
      confidenceScore: 100,
      duplicateConfirmed: true,
      similarityNeedsReview: true,
    });
    expect(result.routing).toBe("blocked");
  });
});

describe("regression: the score direction inverted in v0.4", () => {
  it("does not auto-issue the Getty Bronze case", () => {
    // 34 / well-covered means "records ought to exist here and they are thin".
    // Under the upstream risk-score thresholds this auto-issued, unseen.
    const result = route({
      confidenceScore: 34,
      coverageClass: "well-covered",
      duplicateConfirmed: false,
      similarityNeedsReview: false,
    });
    expect(result.routing).toBe("human-review");
  });

  it("does not auto-issue the Bura askos case", () => {
    const result = route({
      confidenceScore: 54,
      coverageClass: "structurally-uncovered",
      duplicateConfirmed: false,
      similarityNeedsReview: false,
    });
    expect(result.routing).toBe("human-review");
  });
});
