/**
 * Build-time fixture generation.
 *
 * Runs the real pipeline over the committed cases and writes one JSON file per
 * (passport, role) into the web app's public directory.
 *
 * ---------------------------------------------------------------------------
 * WHY PER-ROLE FILES RATHER THAN CLIENT-SIDE FILTERING
 *
 * GitHub Pages serves static files: there is no server, so there is no
 * request-time redaction. The obvious workaround — ship the whole passport and
 * hide fields in the browser — would make the demo a liar. Every visitor would
 * hold the enforcement view of every object while the interface pretended
 * otherwise, and the one property the framework exists to demonstrate would be
 * the one property it had quietly abandoned.
 *
 * So redaction happens here, at build time, once per role. The public file
 * physically does not contain `holderIdentity`. Anyone can open DevTools, read
 * the network tab, and check. The constraint turned out to produce a stronger
 * demonstration than a server would have: the guarantee is inspectable rather
 * than asserted.
 * ---------------------------------------------------------------------------
 */

import { mkdir, writeFile, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, visibleTiers } from "@dpa/schema";
import type { Role, Passport } from "@dpa/schema";
import { runPipeline, deliver } from "@dpa/pipeline";
import { verifyPassport } from "@dpa/issue";
import { explainScore, areComparable } from "@dpa/assess";
import { explainDisclosure } from "@dpa/govern";
import { CASES } from "./cases/index.js";
import type { CaseInput } from "./cases/types.js";
import { buildPassport, ISSUED_AT } from "./build.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = join(__dirname, "../../../apps/web/public/api");

interface Summary {
  id: string;
  title: string;
  culture: string | null;
  teachingPoint: string;
  confidenceScore: number;
  coverageClass: string;
  coverageRatio: number;
  forgeryRisk: number | null;
  acquisitionMode: string;
  claimStatus: string;
  routing: string;
  routingReason: string;
  issuerClass: string;
  flagCount: number;
  timelineLength: number;
  registerCount: number;
  identifyingRegisterCount: number;
}

async function buildCase(caseInput: CaseInput, index: number) {
  const result = await buildPassport(caseInput, index);

  const { passport, routing, breakdown } = result;

  // The signature must verify before anything is written. A demo that ships an
  // unverifiable passport teaches the opposite of its own thesis.
  const verification = verifyPassport(passport);
  if (!verification.valid) {
    throw new Error(
      `Passport ${passport.id} failed verification: ${JSON.stringify(verification.checks)}`,
    );
  }

  const caseDir = join(OUT_ROOT, "passports", caseInput.id);
  await mkdir(caseDir, { recursive: true });

  // One file per role. Each contains only what that role may see.
  for (const role of ALL_ROLES) {
    const view = deliver(passport, role);
    await writeFile(
      join(caseDir, `${role}.json`),
      JSON.stringify(view, null, 2) + "\n",
      "utf8",
    );
  }

  // The explanation is public: it describes how the number was reached, and
  // reveals nothing the public tier does not already carry.
  const explanation = explainScore({
    confidenceScore: passport.riskAssessment.confidenceScore,
    coverage: passport.riskAssessment.coverage,
    flags: passport.riskAssessment.flags,
    scorer: "accumulation-v0.4",
    breakdown,
  });

  await writeFile(
    join(caseDir, "explain.json"),
    JSON.stringify(
      {
        id: passport.id,
        teachingPoint: caseInput.teachingPoint,
        explanation,
        breakdown,
        disclosure: Object.fromEntries(
          ALL_ROLES.map((role) => [role, explainDisclosure(role)]),
        ),
        routing: { routing: routing.routing, reason: routing.reason },
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  const summary: Summary = {
    id: passport.id,
    title: passport.artwork.title,
    culture: passport.artwork.culture,
    teachingPoint: caseInput.teachingPoint,
    confidenceScore: passport.riskAssessment.confidenceScore,
    coverageClass: passport.riskAssessment.coverage.coverageClass,
    coverageRatio: passport.riskAssessment.coverage.coverageRatio,
    forgeryRisk: passport.objectIdentity.forgeryRisk?.score ?? null,
    acquisitionMode: passport.riskAssessment.coverage.acquisitionMode,
    claimStatus: passport.claimStatus,
    routing: routing.routing,
    routingReason: routing.reason,
    issuerClass: passport.issuer.issuerClass,
    flagCount: passport.riskAssessment.flags.length,
    timelineLength: passport.provenanceTimeline.length,
    registerCount: passport.registryChecks.length,
    identifyingRegisterCount:
      passport.riskAssessment.coverage.identifyingRegisters.length,
  };

  return { passport, summary };
}

async function main() {
  console.log("Generating fixtures — running the real pipeline, no keys, no network.\n");

  await rm(OUT_ROOT, { recursive: true, force: true });
  await mkdir(OUT_ROOT, { recursive: true });

  const built: { passport: Passport; summary: Summary }[] = [];
  for (const [i, c] of CASES.entries()) {
    const out = await buildCase(c, i);
    built.push(out);
    console.log(
      `  ${out.summary.id.padEnd(16)} score ${String(out.summary.confidenceScore).padStart(3)}  ${out.summary.coverageClass.padEnd(24)} ${out.summary.routing}`,
    );
  }

  // ── Comparability matrix ────────────────────────────────────────────────
  // Rendered on the site so the "do not rank across coverage classes" rule is
  // visible as data rather than as a warning nobody reads.
  const comparability = built.map((a) => ({
    id: a.summary.id,
    comparableWith: built
      .filter(
        (b) =>
          b.summary.id !== a.summary.id &&
          areComparable(a.passport.riskAssessment.coverage, b.passport.riskAssessment.coverage),
      )
      .map((b) => b.summary.id),
  }));

  await writeFile(
    join(OUT_ROOT, "index.json"),
    JSON.stringify(
      {
        generatedAt: ISSUED_AT,
        mode: "fixtures",
        note: "Every file under /api was produced by running the real pipeline over committed fixtures at build time. No API keys, no network calls, no hand-written scores.",
        passports: built.map((b) => b.summary),
        comparability,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  // ── Role catalogue ──────────────────────────────────────────────────────
  await writeFile(
    join(OUT_ROOT, "roles.json"),
    JSON.stringify(
      ALL_ROLES.map((role: Role) => ({
        role,
        label: ROLE_LABELS[role],
        description: ROLE_DESCRIPTIONS[role],
        visibleTiers: visibleTiers(role),
      })),
      null,
      2,
    ) + "\n",
    "utf8",
  );

  // ── Redaction proof ─────────────────────────────────────────────────────
  // For each passport and role, the fields actually withheld from the file on
  // disk. This is what makes the claim checkable without trusting the UI.
  const proof = built.map(({ passport }) => ({
    id: passport.id,
    roles: ALL_ROLES.map((role) => {
      const view = deliver(passport, role);
      return {
        role,
        visibleTiers: view._redaction.visibleTiers,
        withheldFields: view._redaction.withheldFields,
        presentKeys: Object.keys(view).sort(),
      };
    }),
  }));

  await writeFile(
    join(OUT_ROOT, "redaction-proof.json"),
    JSON.stringify(proof, null, 2) + "\n",
    "utf8",
  );

  console.log(`\nWrote ${built.length} passports × ${ALL_ROLES.length} roles to apps/web/public/api`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
