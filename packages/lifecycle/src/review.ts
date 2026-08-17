/**
 * Human review queue — routing decisions for passport applications.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/digital-passport-artworks
 *   (index.html, risk routing logic lines 1248–1329) by @ChristineLumen.
 *
 * Routing thresholds (verbatim from upstream):
 *   clearIssue  = confidenceScore < 35
 *   clearReject = confidenceScore > 75
 *
 * The PRINCIPLE encoded here: an inconclusive result MUST go to a human.
 * Auto-issue is only possible when the score is unambiguously low AND there
 * is no unresolved similarity flag. Everything else — whether the score is
 * middling, high-but-not-verified, or a duplicate is suspected — goes to
 * a human reviewer. There is no path from an inconclusive result to a
 * signed passport without a human in the loop.
 */

export type ReviewReason =
  | "duplicate-suspected"
  | "inconclusive-risk"
  | "coverage-dispute"
  | "claim-filed";

export type ReviewRouting = "auto-issue" | "human-review" | "blocked";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewItem {
  id: string;
  passportId: string;
  reason: ReviewReason;
  status: ReviewStatus;
  routing: ReviewRouting;
  details: string;
  createdAt: string;
}

export interface Assessment {
  /** 0–100 risk / confidence score from the accumulation model. */
  confidenceScore: number;
  /**
   * A confirmed existing passport was found for this object.
   * When true, the application is blocked — the operation is retrieve, not issue.
   */
  duplicateConfirmed: boolean;
  /**
   * A similarity match was found that needs human review (could be the same
   * object from a different angle, or a near-duplicate requiring merge decision).
   */
  similarityNeedsReview: boolean;
}

export interface RoutingDecision {
  routing: ReviewRouting;
  reason: string;
  /** True when score > 75 (the "clear reject" threshold). */
  clearReject: boolean;
}

/**
 * Route an assessment to auto-issue, human-review, or blocked.
 *
 * Logic (verbatim from digital-passport-artworks, lines 1248–1260):
 *   clearIssue  = confidenceScore < 35
 *   clearReject = confidenceScore > 75
 *   blocked     = duplicateConfirmed (existing record must be retrieved)
 *   auto-issue  = clearIssue && !similarityNeedsReview
 *   human-review = everything else (including clearReject)
 *
 * Crucially: a clearReject does NOT produce an automatic "blocked" —
 * it goes to human review. The human can reject. Only a CONFIRMED duplicate
 * is blocked without human discretion, because minting a second passport for
 * the same object is simply the wrong operation, not a judgment call.
 */
export function route(assessment: Assessment): RoutingDecision {
  const clearIssue = assessment.confidenceScore < 35;
  const clearReject = assessment.confidenceScore > 75;

  if (assessment.duplicateConfirmed) {
    return {
      routing: "blocked",
      reason:
        "Confirmed duplicate — an existing passport must be retrieved; a new one must not be minted.",
      clearReject,
    };
  }

  if (clearIssue && !assessment.similarityNeedsReview) {
    return {
      routing: "auto-issue",
      reason: `Confidence score ${assessment.confidenceScore} is well below threshold (35) and no similarity flags — cleared automatically.`,
      clearReject,
    };
  }

  // Everything else goes to a human.
  const reasons: string[] = [];
  if (assessment.similarityNeedsReview) {
    reasons.push(
      "similarity search flagged a possible match — needs human decision to merge or mint",
    );
  }
  if (!clearIssue) {
    reasons.push(
      `risk score ${assessment.confidenceScore} is ${clearReject ? "above the automatic-reject threshold (75)" : "inconclusive (35–75)"}`,
    );
  }
  return {
    routing: "human-review",
    reason: `Flagged for human review: ${reasons.join("; ")}. An issuer must not sign this passport until a reviewer approves.`,
    clearReject,
  };
}

/** Create a new ReviewItem for a flagged application. */
export function createReviewItem(
  passportId: string,
  reason: ReviewReason,
  assessment: Assessment,
): ReviewItem {
  const { routing, reason: details } = route(assessment);
  return {
    id: `review-${passportId}-${Date.now()}`,
    passportId,
    reason,
    status: "pending",
    routing,
    details,
    createdAt: new Date().toISOString(),
  };
}
