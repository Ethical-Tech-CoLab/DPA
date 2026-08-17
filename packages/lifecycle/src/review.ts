/**
 * Human review queue — routing decisions for passport applications.
 *
 * PROVENANCE: routing PRINCIPLE ported from
 *   Ethical-Tech-CoLab/digital-passport-artworks (index.html, lines 1248–1329)
 *   by @ChristineLumen. The THRESHOLDS are inverted here, deliberately.
 *
 * ---------------------------------------------------------------------------
 * WHY THE UPSTREAM THRESHOLDS COULD NOT BE PORTED VERBATIM
 *
 * Upstream computed a RISK score: high meant "this looks stolen", so
 * `score < 35` meant "clean, auto-issue". v0.4 replaced that with the
 * accumulation scorer (ADR-002), which produces a CONFIDENCE score: high means
 * "a lot of sourced provenance evidence exists". The scale did not merely
 * change range, it changed DIRECTION.
 *
 * Porting `clearIssue = score < 35` unchanged would therefore auto-issue
 * exactly the objects with the least documented history. The Getty Bronze
 * scores 34 while being well-covered — "records ought to exist here and they
 * are thin", the single most suspicious signal the model can produce — and it
 * would have been signed with no human ever seeing it.
 * ---------------------------------------------------------------------------
 *
 * The PRINCIPLE is retained exactly: an inconclusive result MUST reach a human.
 * There is no path from an inconclusive result to a signed passport without a
 * human in the loop.
 *
 * Routing in v0.4:
 *   blocked      confirmed duplicate — retrieve the existing record, do not mint
 *   human-review anything uncovered, thin, or flagged
 *   auto-issue   well-covered AND well-documented AND unflagged
 *
 * Coverage gates the whole decision. In a structurally-uncovered class the
 * score is a measure of our blindness rather than of the object, so no score
 * however high may clear it automatically — auto-issuing there would launder
 * an absence of records into a clean passport, which is the precise failure
 * the coverage model exists to prevent (ADR-003).
 */

import type { CoverageClass } from "@dpa/schema";

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
  /**
   * 0–100 CONFIDENCE score from the accumulation model (ADR-002).
   * High means a lot of sourced provenance evidence exists.
   */
  confidenceScore: number;
  /**
   * Coverage class for the object (ADR-003). Mandatory: the same score means
   * opposite things across classes, so routing on score alone is unsound.
   */
  coverageClass: CoverageClass;
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
  /**
   * True when the evidence is thin enough that a reviewer should expect to
   * refuse: score below 35 in a class where records ought to exist.
   */
  clearReject: boolean;
}

/** Confidence at or above this, in a covered class, may be signed unattended. */
export const AUTO_ISSUE_THRESHOLD = 75;

/** Below this, in a covered class, a reviewer should expect to refuse. */
export const THIN_EVIDENCE_THRESHOLD = 35;

/**
 * Route an assessment to auto-issue, human-review, or blocked.
 *
 * Order matters. A confirmed duplicate is blocked before anything else is
 * considered, because minting a second passport for one object is the wrong
 * operation rather than a close judgment call.
 */
export function route(assessment: Assessment): RoutingDecision {
  const { confidenceScore, coverageClass } = assessment;

  // A low score only means "poorly documented" where documentation was
  // possible. In an uncovered class it means nothing about the object.
  const scoreIsInformative = coverageClass !== "structurally-uncovered";
  const clearReject = scoreIsInformative && confidenceScore < THIN_EVIDENCE_THRESHOLD;

  if (assessment.duplicateConfirmed) {
    return {
      routing: "blocked",
      reason:
        "Confirmed duplicate — an existing passport must be retrieved; a new one must not be minted.",
      clearReject,
    };
  }

  const reasons: string[] = [];

  if (assessment.similarityNeedsReview) {
    reasons.push(
      "similarity search flagged a possible match — needs a human decision to merge or mint",
    );
  }

  if (!scoreIsInformative) {
    reasons.push(
      `coverage is structurally-uncovered, so the score of ${confidenceScore} measures the reach of the registers rather than the object — it cannot clear anything automatically`,
    );
  } else if (coverageClass === "partially-covered") {
    reasons.push(
      `coverage is only partial, so a score of ${confidenceScore} rests on registers that can see some of this object's history but not all of it`,
    );
  } else if (confidenceScore < THIN_EVIDENCE_THRESHOLD) {
    reasons.push(
      `confidence ${confidenceScore} is below ${THIN_EVIDENCE_THRESHOLD} in a well-covered class — records ought to exist for this object and they are thin, which is a finding rather than a gap`,
    );
  } else if (confidenceScore < AUTO_ISSUE_THRESHOLD) {
    reasons.push(
      `confidence ${confidenceScore} is inconclusive (${THIN_EVIDENCE_THRESHOLD}–${AUTO_ISSUE_THRESHOLD})`,
    );
  }

  if (reasons.length === 0) {
    return {
      routing: "auto-issue",
      reason: `Confidence ${confidenceScore} is at or above ${AUTO_ISSUE_THRESHOLD} in a well-covered class, with no similarity flags — the documentation is dense and the registers could see it.`,
      clearReject,
    };
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
