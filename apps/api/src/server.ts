/**
 * @dpa/api — request-time role-gated delivery.
 *
 * The published site is static, so it redacts at build time and ships one file
 * per (passport, role). That is a genuinely stronger demonstration for a
 * public demo — the guarantee is inspectable — but it is not how a deployment
 * would work. A real registry decides at request time, on the basis of who is
 * asking, and it must be able to refuse.
 *
 * This server is that shape, in about a hundred lines and with no framework.
 * The same `deliver()` that the generator calls at build time is called here
 * per request, so there is exactly one redaction code path in the system.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * There is no authentication. The role arrives in an `X-DPA-Role` header and is
 * believed. Writing a fake auth layer would be worse than writing none: it
 * would look like the hard problem had been solved when the hard problem —
 * proving that a caller really is the Carabinieri, or really is a source
 * community — is a governance question this repository has no standing to
 * answer. The header is a placeholder with a loud name, and the response says
 * so on every request.
 *
 *   pnpm --filter @dpa/api start
 *   curl -H 'X-DPA-Role: museum' localhost:8787/passports/bura-askos
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { ALL_ROLES, type Role, type Passport } from "@dpa/schema";
import { verifyPassport } from "@dpa/issue";
import { deliver } from "@dpa/pipeline";
import { CASES, buildPassport } from "@dpa/fixtures-build";

const PORT = Number(process.env.PORT ?? 8787);

const AUTH_WARNING =
  "UNAUTHENTICATED DEMO. The role was taken from the X-DPA-Role header and believed. A deployment must prove the caller's role before this endpoint means anything.";

/** Built once at boot. The cases are static, so re-running the pipeline per
 *  request would only add latency and a chance of drift. */
const passports = new Map<string, Passport>();

async function boot(): Promise<void> {
  for (const [i, c] of CASES.entries()) {
    const { passport } = await buildPassport(c, i);
    const v = verifyPassport(passport);
    if (!v.valid) {
      throw new Error(`Refusing to serve ${c.id}: signature does not verify.`);
    }
    passports.set(c.id, passport);
  }
}

function json(res: ServerResponse, code: number, body: unknown): void {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(code, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    "x-dpa-mode": "fixtures",
  });
  res.end(payload);
}

function roleOf(req: IncomingMessage): Role | null {
  const raw = req.headers["x-dpa-role"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "public";
  return (ALL_ROLES as readonly string[]).includes(value)
    ? (value as Role)
    : null;
}

function handle(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (req.method !== "GET") {
    json(res, 405, { error: "Only GET is supported." });
    return;
  }

  if (path === "/") {
    json(res, 200, {
      service: "@dpa/api",
      mode: "fixtures",
      warning: AUTH_WARNING,
      roles: ALL_ROLES,
      endpoints: {
        "/passports": "list",
        "/passports/:id": "role-gated passport; set X-DPA-Role",
        "/passports/:id/verify": "signature and hash verification",
      },
    });
    return;
  }

  if (path === "/passports") {
    json(res, 200, {
      warning: AUTH_WARNING,
      passports: [...passports.values()].map((p) => ({
        id: p.id,
        title: p.artwork.title,
        confidenceScore: p.riskAssessment.confidenceScore,
        coverageClass: p.riskAssessment.coverage.coverageClass,
      })),
    });
    return;
  }

  const match = /^\/passports\/([a-z0-9-]+)(\/verify)?$/.exec(path);
  if (!match) {
    json(res, 404, { error: `No route for ${path}` });
    return;
  }

  const id = match[1] as string;
  const passport = passports.get(id);
  if (!passport) {
    json(res, 404, { error: `Unknown passport "${id}"` });
    return;
  }

  if (match[2]) {
    // Verification is public on purpose. Anyone should be able to check that a
    // record is intact without being entitled to read it.
    json(res, 200, { id, ...verifyPassport(passport) });
    return;
  }

  const role = roleOf(req);
  if (role === null) {
    json(res, 400, {
      error: "Unknown role in X-DPA-Role.",
      roles: ALL_ROLES,
    });
    return;
  }

  const view = deliver(passport, role);
  res.setHeader("x-dpa-role", role);
  res.setHeader("x-dpa-warning", AUTH_WARNING);
  json(res, 200, view);
}

boot().then(
  () => {
    createServer((req, res) => {
      try {
        handle(req, res);
      } catch (err) {
        json(res, 500, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }).listen(PORT, () => {
      process.stdout.write(
        `@dpa/api listening on http://localhost:${PORT}\n${AUTH_WARNING}\n`,
      );
    });
  },
  (err: unknown) => {
    process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
    process.exit(1);
  },
);
