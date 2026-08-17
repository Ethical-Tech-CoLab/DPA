/**
 * @dpa/fixtures-build — the committed demo cases and the code that turns them
 * into signed passports.
 *
 * The cases here are INPUTS only. No score, no coverage class, no routing
 * decision and no hash is written by hand anywhere in this package: every
 * derived value is computed by running the real pipeline. That is what makes
 * the demo evidence rather than illustration.
 */
export { CASES } from "./cases/index.js";
export type { CaseInput } from "./cases/types.js";
export { buildPassport, ISSUED_AT, STATUS_LIST } from "./build.js";
export * from "./fixtures/index.js";
