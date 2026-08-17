import { describe, it, expect } from "vitest";
import { route } from "./review.js";

describe("review routing", () => {
  it("low score, no flags → auto-issue", () => {
    const result = route({ confidenceScore: 20, duplicateConfirmed: false, similarityNeedsReview: false });
    expect(result.routing).toBe("auto-issue");
  });

  it("borderline score → human-review", () => {
    const result = route({ confidenceScore: 50, duplicateConfirmed: false, similarityNeedsReview: false });
    expect(result.routing).toBe("human-review");
  });

  it("inconclusive score goes to human-review, not auto-issue", () => {
    // Critical: inconclusive must never auto-issue
    const result = route({ confidenceScore: 34, duplicateConfirmed: false, similarityNeedsReview: false });
    expect(result.routing).toBe("auto-issue"); // 34 < 35, still clears
    const borderResult = route({ confidenceScore: 35, duplicateConfirmed: false, similarityNeedsReview: false });
    expect(borderResult.routing).toBe("human-review"); // 35 is NOT < 35
  });

  it("similarity flag sends to human-review even with low score", () => {
    const result = route({ confidenceScore: 20, duplicateConfirmed: false, similarityNeedsReview: true });
    expect(result.routing).toBe("human-review");
  });

  it("high score → human-review (not auto-issue)", () => {
    // High risk score is inconclusive/concerning — must go to human
    const result = route({ confidenceScore: 80, duplicateConfirmed: false, similarityNeedsReview: false });
    expect(result.routing).toBe("human-review");
    expect(result.clearReject).toBe(true);
  });

  it("confirmed duplicate → blocked", () => {
    const result = route({ confidenceScore: 20, duplicateConfirmed: true, similarityNeedsReview: false });
    expect(result.routing).toBe("blocked");
  });
});
