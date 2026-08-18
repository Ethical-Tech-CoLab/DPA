import type { Metadata } from "next";
import RoleSwitcher from "../../components/RoleSwitcher";
import { readIndex, BASE_PATH } from "../../lib/fixtures";

export const metadata: Metadata = {
  title: "Demo — DPA v0.4",
  description:
    "Four contested objects, five roles, one signed record. Switch roles and watch the payload get smaller.",
};

export default function DemoPage() {
  const index = readIndex();

  return (
    <>
      <header className="page-head">
        <p className="label">Flagship demo</p>
        <h1>One record, five lawful views</h1>
        <p className="lede">
          A passport is not a document with sections you are allowed to read. It
          is one signed record from which each role receives a different, smaller
          object. Switching role below issues a different HTTP request and
          returns different bytes.
        </p>
      </header>

      <RoleSwitcher
        basePath={BASE_PATH}
        passports={index.passports.map((p) => ({
          id: p.id,
          title: p.title,
          teachingPoint: p.teachingPoint,
        }))}
      />

      <div className="card">
        <p className="label">How this was produced</p>
        <p className="dim">
          Every value on this page was computed at build time by running the real
          pipeline over committed evidence fixtures — identity, evidence, assess,
          review, issue, notarise, maintain — and then delivering the result once
          per role. {index.passports.length} objects × 5 roles = {" "}
          {index.passports.length * 5} files. No API key exists in this
          repository and no register was contacted. Generated{" "}
          <span className="mono-sm">{index.generatedAt}</span>.
        </p>
        <p className="faint">
          {index.note}
        </p>
      </div>
    </>
  );
}