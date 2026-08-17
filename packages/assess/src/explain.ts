/**
 * Human-readable explanation of a provenance assessment result.
 *
 * PROVENANCE: new for DPA v0.4. The narrative rules are derived from
 *   the coverage model in Ethical-Tech-CoLab/arts-provenance-agent
 *   (src/lib/coverage.ts) and from ADR-002 / ADR-003.
 *
 * An assessment result without an explanation is a number without context.
 * The three sentences that matter most are often the hardest to include:
 *   (a) how the number was built
 *   (b) what the coverage class means for reading it
 *   (c) what the number does NOT mean
 *
 * The comparability rule is not a caveat — it is a prerequisite for using
 * the score at all. Two objects in different coverage classes cannot be
 * compared regardless of the similarity of their numbers.
 */

import type { Coverage, RiskFlag } from "@dpa/schema";
import type { BreakdownEntry } from "./scorer.js";

export interface ExplainInput {
  confidenceScore: number;
  coverage: Coverage;
  flags: RiskFlag[];
  scorer: "accumulation-v0.4";
  breakdown?: BreakdownEntry[];
}

/**
 * Return a prose explanation of the assessment result.
 *
 * Covers:
 *   (a) How the score was built (accumulation steps if breakdown is present)
 *   (b) What the coverage class means for reading it
 *   (c) What the score does NOT mean
 *   (d) The comparability rule
 */
export function explainScore(result: ExplainInput): string {
  const { confidenceScore, coverage, flags, breakdown } = result;
  const parts: string[] = [];

  // ── (a) How the score was built ──────────────────────────────────────────
  parts.push(`PROVENANCE CONFIDENCE SCORE: ${confidenceScore}/100`);
  parts.push(
    "The score is built by accumulation, not by deduction. It starts at 30 " +
    "(the honest baseline for 'nothing is known') and gains credit for " +
    "authoritative records (+18 each) and press reports (+8 each). Gaps in " +
    "the early chain, and hits in stolen-art registers, subtract points. " +
    "An object with no published history scores near 30 — not near 100. " +
    "Absence of evidence is not evidence of clean provenance."
  );

  if (breakdown && breakdown.length > 0) {
    parts.push("\nScore build-up:");
    for (const step of breakdown) {
      const sign = step.delta >= 0 ? "+" : "";
      parts.push(`  ${sign}${step.delta} — ${step.reason} → running total: ${step.runningTotal}`);
    }
  }

  // ── (b) What the coverage class means ────────────────────────────────────
  parts.push(`\nEVIDENCE COVERAGE: ${coverage.coverageClass.toUpperCase()}`);
  parts.push(coverage.note);

  if (coverage.identifyingRegisters.length > 0) {
    const names = coverage.identifyingRegisters.map((r) => r.name).join(", ");
    parts.push(
      `Registers that could have systematically named this object: ${names}. ` +
      "A quiet result from these registers is meaningful — records would be expected to exist."
    );
  }

  if (coverage.weakRegisters.length > 0) {
    const names = coverage.weakRegisters.map((r) => r.name).join(", ");
    parts.push(
      `Registers applicable but not identifying (category-level or attention-driven): ${names}. ` +
      "Silence from these carries little evidential weight."
    );
  }

  if (coverage.blindRegisters.length > 0) {
    parts.push(
      `${coverage.blindRegisters.length} register(s) cannot structurally hold an object of this type or origin. ` +
      "Their silence says nothing."
    );
  }

  // ── (c) What the score does NOT mean ────────────────────────────────────
  parts.push("\nWHAT THIS SCORE DOES NOT MEAN:");
  parts.push(
    "A high score is not a declaration of clean provenance. It means sourced " +
    "evidence was found — not that the evidence is complete, not that no " +
    "problem exists outside what was checked, and not that the object is " +
    "legally safe to sell or exhibit."
  );
  parts.push(
    "A low score is not an accusation of looting. Under the accumulation " +
    "model, a low score means evidence was not found — which may mean the " +
    "documentary record is genuinely thin, or may mean the registers that " +
    "could have spoken simply do not cover material of this type."
  );
  if (coverage.coverageClass === "structurally-uncovered") {
    parts.push(
      "IMPORTANT — structurally uncovered: the registers used here could " +
      "never have named this object. The score measures the absence of a " +
      "documentary apparatus, not the object. Do not read it as evidence of " +
      "anything positive or negative about the object's history."
    );
  }
  parts.push(
    "This score does not assess forgery risk. Whether the image is what it " +
    "claims to be is a separate question on the same scale — see forgeryRisk."
  );

  // ── (d) Comparability rule ───────────────────────────────────────────────
  parts.push(`\nCOMPARABILITY:`);
  parts.push(coverage.comparability);
  parts.push(
    "The score is an ordinal measure within a coverage class, not a universal " +
    "percentage. Ranking objects from different coverage classes by score is " +
    "an analytical error equivalent to comparing temperatures in Celsius and " +
    "Fahrenheit without converting."
  );

  // ── Risk flags summary ────────────────────────────────────────────────────
  if (flags.length > 0) {
    parts.push(`\nRISK FLAGS (${flags.length}):`);
    for (const f of flags) {
      parts.push(`  [${f.severity.toUpperCase()}] ${f.type}: ${f.evidence}`);
    }
  } else {
    parts.push("\nNo risk flags were raised. This is not a clean-provenance finding — it means the tool did not encounter specific signals. Absence of a flag is not absence of risk.");
  }

  return parts.join("\n");
}
