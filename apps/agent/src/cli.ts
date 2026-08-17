/**
 * @dpa/agent — run the pipeline over a case and print what it decided.
 *
 * This is the terminal counterpart to the web demo, and it exists because the
 * most common question about a provenance score is "why". The web demo shows
 * the answer to a visitor; this shows it to a reviewer, in a form they can pipe
 * into a file and attach to a case note.
 *
 * It runs the same seven stages over the same committed fixtures, so a number
 * printed here and a number rendered on the site cannot disagree.
 *
 *   pnpm --filter @dpa/agent start                    list the cases
 *   pnpm --filter @dpa/agent start bura-askos         full report
 *   pnpm --filter @dpa/agent start bura-askos museum  as a specific role
 *   pnpm --filter @dpa/agent start bura-askos --json  machine-readable
 */

import { ALL_ROLES, type Role } from "@dpa/schema";
import { explainScore } from "@dpa/assess";
import { verifyPassport } from "@dpa/issue";
import { deliver } from "@dpa/pipeline";
import { CASES, buildPassport } from "@dpa/fixtures-build";

function usage(): void {
  process.stdout.write(
    [
      "",
      "  dpa agent — run the pipeline over a committed case.",
      "",
      "  Usage: start <case-id> [role] [--json]",
      "",
      "  Cases:",
      ...CASES.map((c) => `    ${c.id.padEnd(16)} ${c.artwork.title}`),
      "",
      `  Roles: ${ALL_ROLES.join(", ")}`,
      "",
    ].join("\n") + "\n",
  );
}

function isRole(v: string | undefined): v is Role {
  return v !== undefined && (ALL_ROLES as readonly string[]).includes(v);
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const positional = args.filter((a) => !a.startsWith("--"));
  const id = positional[0];

  if (!id) {
    usage();
    return 0;
  }

  const found = CASES.find((c) => c.id === id);
  if (!found) {
    process.stderr.write(`Unknown case "${id}".\n`);
    usage();
    return 1;
  }

  const role: Role = isRole(positional[1]) ? positional[1] : "owner";
  const { passport, routing, breakdown } = await buildPassport(found);

  // Refuse to report on a passport that does not verify. A tool that prints a
  // confident summary of a broken record is worse than one that prints nothing.
  const verification = verifyPassport(passport);
  if (!verification.valid) {
    process.stderr.write(
      `Passport ${passport.id} failed verification: ${JSON.stringify(verification.checks, null, 2)}\n`,
    );
    return 2;
  }

  const view = deliver(passport, role);

  if (json) {
    process.stdout.write(
      JSON.stringify({ role, view, routing, breakdown }, null, 2) + "\n",
    );
    return 0;
  }

  const explanation = explainScore({
    confidenceScore: passport.riskAssessment.confidenceScore,
    coverage: passport.riskAssessment.coverage,
    flags: passport.riskAssessment.flags,
    scorer: "accumulation-v0.4",
    breakdown,
  });

  const withheld = view._redaction.withheldFields;
  const out = [
    "",
    `  ${passport.artwork.title}`,
    `  ${"─".repeat(Math.min(72, passport.artwork.title.length + 2))}`,
    "",
    `  case          ${passport.id}`,
    `  signature     ${verification.valid ? "verified" : "INVALID"}`,
    `  content hash  ${passport.contentHash}`,
    `  routing       ${routing.routing}`,
    "",
    `  ${routing.reason}`,
    "",
    explanation,
    "",
    `  DELIVERED AS: ${role}`,
    `  Withheld: ${withheld.length === 0 ? "nothing — this role sees the whole record" : `${withheld.length} field(s)`}`,
    ...withheld.map((f) => `    - ${f}`),
    "",
    `  Teaching point: ${found.teachingPoint}`,
    "",
  ].join("\n");

  process.stdout.write(out + "\n");
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
    process.exit(1);
  },
);
