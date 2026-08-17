import type { Metadata } from "next";
import {
  readIndex,
  readRoles,
  readRedactionProof,
  ROLES,
  type Role,
} from "../../lib/fixtures";

export const metadata: Metadata = {
  title: "Disclosure — DPA v0.4",
  description:
    "The confidentiality envelope: which fields each role receives, and the machine-checkable proof that the rest are absent.",
};

/**
 * Field → tier, derived from the union of what each role actually received.
 *
 * This is computed from the generated redaction proof rather than restated by
 * hand, so the table cannot drift away from what the redactor really did. If
 * someone changes a tier in the schema, this page changes with it.
 */
function buildMatrix(
  proof: ReturnType<typeof readRedactionProof>,
): { field: string; visibleTo: Set<Role> }[] {
  const fields = new Set<string>();
  for (const entry of proof) {
    for (const r of entry.roles) {
      for (const f of r.withheldFields) fields.add(f);
    }
  }

  const rows: { field: string; visibleTo: Set<Role> }[] = [];
  for (const field of [...fields].sort()) {
    const visibleTo = new Set<Role>();
    for (const role of ROLES) {
      // A field is visible to a role if no case withheld it from that role.
      const withheldSomewhere = proof.some((entry) =>
        entry.roles.some(
          (r) => r.role === role && r.withheldFields.includes(field),
        ),
      );
      if (!withheldSomewhere) visibleTo.add(role);
    }
    rows.push({ field, visibleTo });
  }
  return rows;
}

export default function DisclosurePage() {
  const index = readIndex();
  const roles = readRoles();
  const proof = readRedactionProof();
  const matrix = buildMatrix(proof);

  const first = proof[0];
  if (!first) throw new Error("redaction proof is empty");

  return (
    <div className="wrap">
      <header className="page-head">
        <p className="label">Confidentiality envelope</p>
        <h1>Disclosure is a property of the record, not of the interface</h1>
        <p className="lede">
          Five roles. Four of them are rungs on a ladder — public, museum,
          enforcement, holder — and each sees everything the rung below it sees.
          The fifth is not on the ladder at all.
        </p>
      </header>

      <div className="grid grid-2">
        {roles.map((r) => (
          <div key={r.role} className="card">
            <p className={`label role-${r.role}`}>{r.label}</p>
            <p className="dim">{r.description}</p>
            <p className="faint" style={{ marginTop: 10 }}>
              Tiers:{" "}
              {r.visibleTiers.map((t) => (
                <span key={t} className={`tier-tag role-${t}`}>
                  {t}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <p className="label">The role that breaks the ladder</p>
        <h2>Source communities are not a lower tier of museum</h2>
        <p className="dim">
          A source community has a strong interest in claim status, custodianship
          terms and whether a statement of theirs has been recorded. It has no
          interest in the holder&rsquo;s insurance valuation, the condition
          report, or the escrowed contact route — and the holder has a real
          safety interest in those staying closed.
        </p>
        <p className="dim">
          Modelling this as a rung would force a choice between telling
          communities nothing and telling them everything. So{" "}
          <code>source-community</code> sits orthogonal to the ladder: it sees
          the public tier plus its own tier, and never museum or enforcement
          internals no matter how the ladder is ordered.
        </p>
        <p className="faint" style={{ marginTop: 10 }}>
          This is the weakest claim on the site. It was decided by an
          implementer reading a research framework, and it has never been
          reviewed by a source community. It should not survive contact with one
          unchanged.
        </p>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <p className="label">Field → role matrix</p>
        <p className="dim">
          Derived from the generated redaction proof, not written by hand. A
          filled cell means that role received the field; an empty cell means it
          was absent from the payload.
        </p>
        <div className="tbl-scroll">
          <table className="tbl matrix">
            <thead>
              <tr>
                <th>Field</th>
                {ROLES.map((r) => (
                  <th key={r} className={`role-${r}`}>
                    {r === "source-community" ? "community" : r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.field}>
                  <td className="mono-sm">{row.field}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="cell">
                      {row.visibleTo.has(r) ? (
                        <span className={`dot role-${r}`}>●</span>
                      ) : (
                        <span className="faint">·</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="faint" style={{ marginTop: 12 }}>
          Fields never withheld from anyone — title, culture, score, coverage
          class, notarisation proof — are omitted from this table. They are the
          public tier.
        </p>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <p className="label">Machine-checkable proof</p>
        <h2>Do not take our word for it</h2>
        <p className="dim">
          For every object and role, the build publishes the list of fields the
          redactor withheld and the exact set of top-level keys that survived
          into the file. Fetch the payload yourself and compare.
        </p>
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Object</th>
                <th>Role</th>
                <th>Withheld</th>
                <th>Top-level keys present</th>
              </tr>
            </thead>
            <tbody>
              {proof.flatMap((entry) =>
                entry.roles.map((r) => (
                  <tr key={`${entry.id}-${r.role}`}>
                    <td className="faint">{entry.id}</td>
                    <td className={`role-${r.role}`}>{r.role}</td>
                    <td className="mono-sm">{r.withheldFields.length}</td>
                    <td className="mono-sm">{r.presentKeys.length}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
        <p className="faint" style={{ marginTop: 12 }}>
          Full detail:{" "}
          <code>/api/redaction-proof.json</code>. Per-role payloads:{" "}
          <code>/api/passports/{first.id}/public.json</code> and siblings.
        </p>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <p className="label">Where redaction happens</p>
        <p className="dim">
          Not in the pipeline. The pipeline produces one signed passport and
          stops. Redaction happens at the delivery boundary, in{" "}
          <code>deliver(passport, role)</code>, which applies the envelope and
          then asserts that no withheld field leaked before the payload is
          allowed out.
        </p>
        <p className="dim">
          Making redaction a pipeline stage would imply that a passport is ever
          &ldquo;the redacted one&rdquo;. It is not. One signed record has as
          many lawful views as there are roles, and the signature covers the
          record — so a recipient can verify the tier they were given without
          ever seeing the tiers they were not.
        </p>
        <p className="faint" style={{ marginTop: 10 }}>
          {index.passports.length} objects × {roles.length} roles ={" "}
          {index.passports.length * roles.length} payloads, each generated by
          running the real redactor at build time.
        </p>
      </div>
    </div>
  );
}
