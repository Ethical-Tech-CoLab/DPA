/**
 * Typed access to the generated fixture set under `public/api`.
 *
 * Two different access paths exist here on purpose.
 *
 * Server components read the JSON off disk at build time (`readIndex`,
 * `readExplain`, `readRedactionProof`). That is fine for pages whose content is
 * the same for every visitor — the coverage comparison, the disclosure matrix.
 *
 * The demo page does NOT use these. It fetches the per-role file over the
 * network from the browser, because the whole claim being demonstrated is that
 * the withheld fields are physically absent from the response rather than
 * hidden by the UI. Inlining the JSON into the server-rendered HTML would
 * destroy the only evidence that matters.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const ROLES = [
  "public",
  "source-community",
  "museum",
  "enforcement",
  "owner",
] as const;

export type Role = (typeof ROLES)[number];

export type CoverageClass =
  | "well-covered"
  | "partially-covered"
  | "structurally-uncovered";

export interface IndexEntry {
  id: string;
  title: string;
  culture: string | null;
  teachingPoint: string;
  confidenceScore: number;
  coverageClass: CoverageClass;
  coverageRatio: number;
  forgeryRisk: number;
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

export interface FixtureIndex {
  generatedAt: string;
  mode: string;
  note: string;
  passports: IndexEntry[];
  comparability: { id: string; comparableWith: string[] }[];
}

export interface RoleDescriptor {
  role: Role;
  label: string;
  description: string;
  visibleTiers: string[];
}

export interface RegisterNote {
  id: string;
  name: string;
  why: string;
}

export interface CoverageBlock {
  acquisitionMode: string;
  region: string | null;
  identifyingRegisters: RegisterNote[];
  weakRegisters: RegisterNote[];
  blindRegisters: RegisterNote[];
  coverageClass: CoverageClass;
  coverageRatio: number;
  note: string;
  comparability: string;
}

export interface ScoreStep {
  reason: string;
  delta: number;
  runningTotal: number;
  source: string;
}

export interface Explain {
  id: string;
  teachingPoint: string;
  explanation: string;
  breakdown: ScoreStep[];
  disclosure: Record<Role, string>;
  routing: { routing: string; reason: string };
}

export interface RedactionProofEntry {
  id: string;
  roles: {
    role: Role;
    visibleTiers: string[];
    withheldFields: string[];
    presentKeys: string[];
  }[];
}

const API_DIR = join(process.cwd(), "public", "api");

function readJson<T>(...segments: string[]): T {
  return JSON.parse(readFileSync(join(API_DIR, ...segments), "utf8")) as T;
}

export function readIndex(): FixtureIndex {
  return readJson<FixtureIndex>("index.json");
}

export function readRoles(): RoleDescriptor[] {
  return readJson<RoleDescriptor[]>("roles.json");
}

export function readExplain(id: string): Explain {
  return readJson<Explain>("passports", id, "explain.json");
}

export function readRedactionProof(): RedactionProofEntry[] {
  return readJson<RedactionProofEntry[]>("redaction-proof.json");
}

/**
 * The owner view is the only one that has every field, so it is the correct
 * source for anything a build-time page wants to render in full. Pages that
 * render it must be honest that they are showing the holder's own view.
 */
export function readOwnerPassport(id: string): Record<string, unknown> {
  return readJson<Record<string, unknown>>("passports", id, "owner.json");
}

export function readCoverage(id: string): CoverageBlock {
  const p = readOwnerPassport(id) as {
    riskAssessment: { coverage: CoverageBlock };
  };
  return p.riskAssessment.coverage;
}

/** Class name for the coverage colour, matching globals.css. */
export function coverageClassName(c: CoverageClass): string {
  return c === "well-covered"
    ? "cov-well"
    : c === "partially-covered"
      ? "cov-partially"
      : "cov-structurally";
}

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
