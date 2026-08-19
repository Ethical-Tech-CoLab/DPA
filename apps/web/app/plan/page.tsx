import fs from "node:fs";
import path from "node:path";
import { renderMarkdown, headings } from "../../lib/markdown";

export const dynamic = "force-static";

const bp = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * The planning documents are the source of truth and live as markdown in the
 * repository. They are read at build time rather than duplicated into JSX, so
 * the site and the repo cannot drift apart.
 */
const DOCS = [
  { file: "README.md", title: "Overview", blurb: "What DPA is and why the monorepo exists" },
  { file: "docs/MEETING-BRIEF.md", title: "Meeting brief", blurb: "Five-minute status read for AABC, including the recorded feedback" },
  { file: "docs/DECISIONS.md", title: "Decisions", blurb: "Ten ADRs, each with rejected alternative and cost. Two reopened" },
  { file: "docs/CAPTURE-PROTOCOL.md", title: "Capture protocol", blurb: "Stage 0: the rubric, the guidance loop, and what a scan does not prove" },
  { file: "docs/ARCHITECTURE-v0.4.md", title: "Architecture", blurb: "The pipeline, the packages, the three numbers" },
  { file: "docs/INVENTORY.md", title: "Inventory", blurb: "Assessment of all five upstream systems" },
  { file: "docs/MIGRATION.md", title: "Migration", blurb: "What each repo owner is asked to do" },
  { file: "docs/DESIGN-SYSTEM.md", title: "Design system", blurb: "The template, the tokens, and the tests that stop them drifting" },
  { file: "BACKLOG.md", title: "Backlog", blurb: "Every known gap, merged and prioritised" },
  { file: "ATTRIBUTION.md", title: "Attribution", blurb: "Who wrote what" },
];

function read(file: string): string {
  const root = path.resolve(process.cwd(), "..", "..");
  try {
    return fs.readFileSync(path.join(root, file), "utf8");
  } catch {
    return `# Not found\n\nCould not read \`${file}\` at build time.`;
  }
}

function slugFile(f: string): string {
  return f.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
}

export default function PlanPage() {
  const docs = DOCS.map((d) => ({ ...d, md: read(d.file) }));

  return (
    <>
      <header className="page-head">
        <p className="label">The consolidation plan</p>
        <h1>Plan and decisions</h1>
        <p className="lede">
          Rendered directly from the markdown in the repository at build time, so
          this page cannot drift from the source.
        </p>
      </header>

      <div className="grid grid-3" style={{ margin: "0 0 44px" }}>
        {docs.map((d) => (
          <a
            key={d.file}
            className="card"
            href={`#${slugFile(d.file)}`}
            style={{ textDecoration: "none" }}
          >
            <div style={{ fontWeight: 600, color: "var(--text)" }}>{d.title}</div>
            <div className="faint" style={{ fontSize: ".85rem", marginTop: 4 }}>
              {d.blurb}
            </div>
            <div className="mono faint" style={{ fontSize: ".72rem", marginTop: 8 }}>
              {d.file}
            </div>
          </a>
        ))}
      </div>

      {docs.map((d) => (
        <section key={d.file} id={slugFile(d.file)} className="doc-section">
          <div className="doc-head">
            <h2>{d.title}</h2>
            <a
              className="mono faint"
              style={{ fontSize: ".76rem" }}
              href={`https://github.com/Ethical-Tech-CoLab/DPA/blob/main/${d.file}`}
              target="_blank"
              rel="noreferrer"
            >
              {d.file} ↗
            </a>
          </div>

          <details className="doc-toc">
            <summary className="faint" style={{ cursor: "pointer", fontSize: ".85rem" }}>
              Contents
            </summary>
            <ul className="faint" style={{ fontSize: ".85rem", marginTop: 8 }}>
              {headings(d.md)
                .filter((h) => h.level === 2)
                .map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`}>{h.text}</a>
                  </li>
                ))}
            </ul>
          </details>

          <article
            className="prose"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(d.md) }}
          />
        </section>
      ))}

      <p className="faint">
        <a href={`${bp}/`}>← Back to the overview</a>
      </p>
    </>
  );
}