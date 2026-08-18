"use client";

/**
 * The role switcher.
 *
 * This component deliberately fetches `/api/passports/<id>/<role>.json` from the
 * browser instead of receiving the data as props from a server component.
 *
 * The point of the disclosure model is that a role does not receive a full
 * record with some fields greyed out — it receives a smaller record. If this
 * page were server-rendered with all five views inlined, every field would be
 * sitting in the HTML source and the claim would be false in exactly the way it
 * is usually false in provenance software. Fetching per role means a visitor
 * can open the network tab, switch to `public`, and read the actual bytes that
 * crossed the wire.
 *
 * The "withheld" list below is not computed by this component. It is read from
 * the `_redaction` block that the pipeline stamped onto the payload at build
 * time, so the UI is reporting what the redactor did rather than deciding it.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

const ROLES = [
  { role: "public", label: "Public" },
  { role: "source-community", label: "Source community" },
  { role: "museum", label: "Museum" },
  { role: "enforcement", label: "Enforcement" },
  { role: "owner", label: "Holder" },
] as const;

type Role = (typeof ROLES)[number]["role"];

interface Redaction {
  role: string;
  visibleTiers: string[];
  withheldFields: string[];
  envelopeVersion: string;
}

interface Passport {
  id: string;
  artwork: {
    title: string;
    artist: string | null;
    period: string | null;
    culture: string | null;
    material: string | null;
    dimensions?: string | null;
    currentLocation?: string | null;
    imageHash: string | null;
  };
  riskAssessment: {
    confidenceScore: number;
    coverage: { coverageClass: string; coverageRatio: number; note: string };
    flags?: { name: string; severity: string; detail: string }[];
  };
  provenanceTimeline?: { date: string | null; event: string; source?: string }[];
  registryChecks?: { register: string; verdict: string; note?: string }[];
  claimStatus?: string;
  custodianship?: unknown;
  sourceCommunityStatement?: unknown;
  condition?: unknown;
  loanEligibility?: unknown;
  holderPseudonym?: string;
  contactEscrow?: unknown;
  holderIdentity?: unknown;
  notarisation?: { chain?: string; txHash?: string; attestationUid?: string } | null;
  contentHash: string;
  signature: { algorithm?: string; value?: string; publicKey?: string } | null;
  _redaction: Redaction;
}

const TIER_OF: Record<string, string> = {
  "artwork.dimensions": "museum",
  "artwork.currentLocation": "enforcement",
  provenanceTimeline: "enforcement",
  registryChecks: "enforcement",
  premiumChecks: "enforcement",
  "riskAssessment.flags": "museum",
  claimStatus: "source-community",
  custodianship: "source-community",
  sourceCommunityStatement: "source-community",
  condition: "museum",
  loanEligibility: "museum",
  holderPseudonym: "enforcement",
  contactEscrow: "enforcement",
  holderIdentity: "owner",
};

function tierOf(field: string): string {
  if (TIER_OF[field]) return TIER_OF[field] as string;
  if (field.startsWith("objectIdentity.forgeryRisk")) return "museum";
  if (field.startsWith("objectIdentity.similarity")) return "enforcement";
  if (field.startsWith("objectIdentity.duplicate")) return "enforcement";
  if (field.startsWith("objectIdentity")) return "museum";
  return "museum";
}

function covClass(c: string): string {
  return c === "well-covered"
    ? "cov-well"
    : c === "partially-covered"
      ? "cov-partially"
      : "cov-structurally";
}

function short(h: string | null | undefined, n = 10): string {
  if (!h) return "—";
  return h.length <= n * 2 + 2 ? h : `${h.slice(0, n)}…${h.slice(-6)}`;
}

export default function RoleSwitcher({
  passports,
  basePath,
}: {
  passports: { id: string; title: string; teachingPoint: string }[];
  basePath: string;
}) {
  const first = passports[0]?.id ?? "";
  const [id, setId] = useState(first);
  const [role, setRole] = useState<Role>("public");
  const [data, setData] = useState<Passport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [raw, setRaw] = useState(false);

  const url = useMemo(
    () => `${basePath}/api/passports/${id}/${role}.json`,
    [basePath, id, role],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      setData((await r.json()) as Passport);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = passports.find((p) => p.id === id);

  return (
    <>
      <div className="card">
        <p className="label">Object</p>
        <div className="btn-row">
          {passports.map((p) => (
            <button
              key={p.id}
              className="btn"
              data-active={p.id === id}
              onClick={() => setId(p.id)}
            >
              {p.title}
            </button>
          ))}
        </div>

        <p className="label">
          Viewing as
        </p>
        <div className="btn-row">
          {ROLES.map((r) => (
            <button
              key={r.role}
              className={`btn role-${r.role}`}
              data-active={r.role === role}
              onClick={() => setRole(r.role)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <p className="faint mono-sm">
          GET <code>{url}</code>
        </p>
        <p className="faint" style={{ marginTop: 4 }}>
          Open your browser&rsquo;s network tab and switch roles. Each role fetches
          a different file. The withheld fields are not hidden by this page —
          they are not in the response.
        </p>
      </div>

      {active ? (
        <div className="warn-box">
          <strong>Why this case is here.</strong> {active.teachingPoint}
        </div>
      ) : null}

      {loading ? <p className="dim">Loading…</p> : null}
      {err ? (
        <div className="card">
          <p className="cov-structurally">Could not load {url}</p>
          <p className="faint">{err}</p>
        </div>
      ) : null}

      {data ? (
        <>
          <div className="score-row">
            <div className="score-box">
              <p className="label">Confidence</p>
              <p className="score-num">
                {data.riskAssessment.confidenceScore}
                <span className="score-den">/100</span>
              </p>
            </div>
            <div className="score-box">
              <p className="label">Coverage</p>
              <p
                className={covClass(data.riskAssessment.coverage.coverageClass)}
                style={{ fontWeight: 600, marginTop: 6 }}
              >
                {data.riskAssessment.coverage.coverageClass}
              </p>
              <p className="faint mono-sm">
                {Math.round(data.riskAssessment.coverage.coverageRatio * 100)}% of
                applicable registers can identify this object
              </p>
            </div>
            <div className="score-box grow">
              <p className="label">Read the coverage class first</p>
              <p className="dim" style={{ fontSize: ".88rem" }}>
                {data.riskAssessment.coverage.note}
              </p>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <p className="label">Artwork</p>
              <h3>{data.artwork.title}</h3>
              <dl className="kv">
                <dt>Artist</dt>
                <dd>{data.artwork.artist ?? "unattributed"}</dd>
                <dt>Period</dt>
                <dd>{data.artwork.period ?? "—"}</dd>
                <dt>Culture</dt>
                <dd>{data.artwork.culture ?? "—"}</dd>
                <dt>Material</dt>
                <dd>{data.artwork.material ?? "—"}</dd>
                <dt>Dimensions</dt>
                <dd>
                  {data.artwork.dimensions ?? (
                    <span className="withheld">withheld — museum tier</span>
                  )}
                </dd>
                <dt>Location</dt>
                <dd>
                  {data.artwork.currentLocation ?? (
                    <span className="withheld">withheld — enforcement tier</span>
                  )}
                </dd>
                <dt>Image hash</dt>
                <dd className="mono-sm">{short(data.artwork.imageHash)}</dd>
              </dl>
            </div>

            <div className="card">
              <p className="label">Seal</p>
              <dl className="kv">
                <dt>Content hash</dt>
                <dd className="mono-sm">{short(data.contentHash)}</dd>
                <dt>Signature</dt>
                <dd className="mono-sm">
                  {data.signature?.algorithm ?? "—"}{" "}
                  {short(data.signature?.value, 8)}
                </dd>
                <dt>Signing key</dt>
                <dd className="mono-sm">{short(data.signature?.publicKey, 8)}</dd>
                <dt>Notarisation</dt>
                <dd className="mono-sm">
                  {data.notarisation
                    ? `${data.notarisation.chain ?? "—"} ${short(
                        data.notarisation.attestationUid ??
                          data.notarisation.txHash,
                        8,
                      )}`
                    : "not anchored"}
                </dd>
                <dt>Envelope</dt>
                <dd className="mono-sm">v{data._redaction.envelopeVersion}</dd>
              </dl>
              <p className="faint">
                The signature covers the record but not the notarisation, so the
                same passport verifies identically before and after anchoring.
                The chain holds the hash only — never the record.
              </p>
            </div>
          </div>

          <div className="card">
            <p className="label">
              Withheld from this role — {data._redaction.withheldFields.length}{" "}
              field{data._redaction.withheldFields.length === 1 ? "" : "s"}
            </p>
            {data._redaction.withheldFields.length === 0 ? (
              <p className="dim">
                Nothing. The holder sees their own record in full.
              </p>
            ) : (
              <ul className="withheld-list">
                {data._redaction.withheldFields.map((f) => (
                  <li key={f}>
                    <code>{f}</code>
                    <span className={`tier-tag role-${tierOf(f)}`}>
                      {tierOf(f)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="faint">
              Visible tiers for this role:{" "}
              {data._redaction.visibleTiers.map((t) => (
                <span key={t} className={`tier-tag role-${t}`}>
                  {t}
                </span>
              ))}
            </p>
          </div>

          {data.provenanceTimeline ? (
            <div className="card">
              <p className="label">
                Provenance timeline — enforcement tier ({data.provenanceTimeline.length}{" "}
                events)
              </p>
              <ol className="timeline">
                {data.provenanceTimeline.map((e, i) => (
                  <li key={i}>
                    <span className="mono-sm t-date">{e.date ?? "undated"}</span>
                    <span>{e.event}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {data.registryChecks ? (
            <div className="card">
              <p className="label">Register checks — enforcement tier</p>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Register</th>
                    <th>Verdict</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {data.registryChecks.map((c, i) => (
                    <tr key={i}>
                      <td>{c.register}</td>
                      <td className="mono-sm">{c.verdict}</td>
                      <td className="faint">{c.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="faint">
                No verdict in this system is ever <code>clear</code>. A register
                that returns nothing has returned nothing; it has not cleared the
                object.
              </p>
            </div>
          ) : null}

          {data.riskAssessment.flags ? (
            <div className="card">
              <p className="label">
                Risk flags — museum tier ({data.riskAssessment.flags.length})
              </p>
              <ul className="flags">
                {data.riskAssessment.flags.map((f, i) => (
                  <li key={i}>
                    <span className={`sev sev-${f.severity}`}>{f.severity}</span>
                    <strong>{f.name}</strong>
                    <span className="dim"> — {f.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="card">
            <button className="btn" onClick={() => setRaw((v) => !v)}>
              {raw ? "Hide" : "Show"} the raw bytes for this role
            </button>
            {raw ? (
              <pre className="raw">{JSON.stringify(data, null, 2)}</pre>
            ) : null}
          </div>
        </>
      ) : null}
    </>
  );
}
