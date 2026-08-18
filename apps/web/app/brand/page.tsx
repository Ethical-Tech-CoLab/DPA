import type { Metadata } from "next";
import {
  THEMES,
  THRESHOLDS,
  contrast,
  distance,
  validateTheme,
} from "@dpa/theme";
import type { Theme } from "@dpa/theme";
import BrandPreview from "../../components/BrandPreview";

export const metadata: Metadata = {
  title: "Branding — DPA",
  description:
    "How an institution deploys the Digital Passport under its own identity, and what a rebrand is not permitted to change.",
};

/**
 * Role separations, computed at build time so the numbers below are measured
 * rather than asserted. If someone adds a brand that pushes two roles together,
 * this page says so without anyone editing it.
 */
function rolePairs(t: Theme): Array<{ pair: string; d: number }> {
  const roles: Array<[string, string]> = [
    ["public", t.semantic.rolePublic],
    ["source-community", t.semantic.roleSourceCommunity],
    ["museum", t.semantic.roleMuseum],
    ["enforcement", t.semantic.roleEnforcement],
    ["owner", t.semantic.roleOwner],
  ];
  const out: Array<{ pair: string; d: number }> = [];
  for (let i = 0; i < roles.length; i++) {
    for (let j = i + 1; j < roles.length; j++) {
      const a = roles[i]!;
      const b = roles[j]!;
      out.push({ pair: `${a[0]} / ${b[0]}`, d: distance(a[1], b[1]) });
    }
  }
  return out.sort((x, y) => x.d - y.d);
}

export default function BrandPage() {
  const reports = THEMES.map((t) => ({
    theme: t,
    result: validateTheme(t),
    closest: rolePairs(t)[0]!,
    textContrast: contrast(t.brand.text, t.brand.bg),
    faintContrast: contrast(t.brand.textFaint, t.brand.bg),
  }));

  return (
    <>
      <header className="page-head">
        <p className="label">Deployment</p>
        <h1>Branding without breaking the disclosure model</h1>
        <p className="lede">
          A museum, a university or a ministry running the Digital Passport will
          want it to look like theirs. Every visual decision on this site — colour,
          type scale, corner radius, content width, wordmark — is a token in{" "}
          <code>@dpa/theme</code>, so that is a configuration change rather than a
          fork. Use the switcher in the navigation to rebrand the page you are
          reading.
        </p>
      </header>

      <div className="card">
        <h2>Why some tokens are validated and others are not</h2>
        <p className="dim">
          Not every colour on the page is decoration. Background, surfaces, rules,
          body text and the accent are chrome: change them freely, because nothing
          about the meaning of a passport depends on whether the page is near-black
          or paper-white.
        </p>
        <p className="dim">
          The five <strong>role</strong> colours and the three{" "}
          <strong>coverage</strong> colours are not chrome. They tell a reader which
          disclosure tier they are looking at and whether a score can be trusted at
          all. A rebrand that quietly collapses{" "}
          <span className="role-enforcement">enforcement</span> and{" "}
          <span className="role-public">public</span> into two similar blues has not
          restyled the site — it has introduced a disclosure bug wearing a
          stylesheet, and it will look completely fine to whoever shipped it.
        </p>
        <p className="dim">
          So those eight tokens are themeable but checked. Distinctness is measured
          in CIELAB rather than by comparing hex values, because hex distance is a
          poor proxy for whether two colours look different to a person. Every theme
          in the repository is validated by a test, so a brand that hurts legibility
          fails CI instead of shipping.
        </p>

        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Threshold</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Body text on background</td>
                <td className="mono-sm">{THRESHOLDS.TEXT_CONTRAST}:1</td>
                <td className="dim">WCAG 2.2 AA for normal-size text.</td>
              </tr>
              <tr>
                <td>Faint text on background</td>
                <td className="mono-sm">{THRESHOLDS.FAINT_CONTRAST}:1</td>
                <td className="dim">
                  Labels and captions are still meant to be read.
                </td>
              </tr>
              <tr>
                <td>Semantic colour on background</td>
                <td className="mono-sm">{THRESHOLDS.SEMANTIC_CONTRAST}:1</td>
                <td className="dim">
                  WCAG 1.4.11 — these are used as non-text indicators.
                </td>
              </tr>
              <tr>
                <td>Separation between any two role colours</td>
                <td className="mono-sm">ΔE {THRESHOLDS.ROLE_SEPARATION}</td>
                <td className="dim">
                  A just-noticeable difference is around ΔE 2.3. This is set far
                  higher because role colours are read at small size, in a table,
                  possibly projected, by someone who is not deliberately comparing
                  them.
                </td>
              </tr>
              <tr>
                <td>Separation between coverage colours</td>
                <td className="mono-sm">ΔE {THRESHOLDS.COVERAGE_SEPARATION}</td>
                <td className="dim">
                  Confusing <span className="cov-well">well-covered</span> with{" "}
                  <span className="cov-structurally">structurally-uncovered</span>{" "}
                  inverts the meaning of the score printed next to it.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h2>The brands in this repository</h2>
      <div className="grid grid-2">
        {reports.map(({ theme, result, closest, textContrast, faintContrast }) => (
          <div className="card" key={theme.id}>
            <h3>{theme.label}</h3>
            <p className="dim">{theme.description}</p>
            <dl className="kv">
              <dt>id</dt>
              <dd className="mono-sm">{theme.id}</dd>
              <dt>scheme</dt>
              <dd>{theme.colorScheme}</dd>
              <dt>wordmark</dt>
              <dd>
                {theme.identity.wordmark}
                {theme.identity.wordmarkAccent ?? ""}
              </dd>
              <dt>base type</dt>
              <dd className="mono-sm">
                {theme.typography.sizeMin}–{theme.typography.sizeMax}px
              </dd>
              <dt>text contrast</dt>
              <dd className="mono-sm">
                {textContrast.toFixed(1)}:1 · faint {faintContrast.toFixed(1)}:1
              </dd>
              <dt>closest roles</dt>
              <dd className="mono-sm">
                {closest.pair} — ΔE {closest.d.toFixed(1)}
              </dd>
              <dt>validator</dt>
              <dd className={result.valid ? "finding-pass" : "finding-fail"}>
                {result.valid ? "passes" : `${result.findings.length} finding(s)`}
              </dd>
            </dl>

            <div className="swatches">
              {(
                [
                  ["public", theme.semantic.rolePublic],
                  ["community", theme.semantic.roleSourceCommunity],
                  ["museum", theme.semantic.roleMuseum],
                  ["enforcement", theme.semantic.roleEnforcement],
                  ["owner", theme.semantic.roleOwner],
                ] as Array<[string, string]>
              ).map(([name, hex]) => (
                <div className="swatch" key={name}>
                  <span className="swatch-chip" style={{ background: hex }} />
                  <span className="swatch-name">{name}</span>
                  <span className="swatch-val">{hex}</span>
                </div>
              ))}
            </div>

            {result.findings.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0, marginTop: "var(--gap)" }}>
                {result.findings.map((f, i) => (
                  <li
                    key={i}
                    className={
                      f.severity === "error"
                        ? "finding finding-fail"
                        : "finding"
                    }
                  >
                    <span className="mono-sm">{f.rule}</span> — {f.detail}{" "}
                    <span className="faint">
                      (measured {f.measured.toFixed(1)}, needs{" "}
                      {f.required.toFixed(1)})
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>

      <h2>Live preview</h2>
      <p className="dim">
        This panel carries its own <code>data-theme</code>, so you can hold a
        candidate brand next to the one the rest of the page is using instead of
        flipping back and forth.
      </p>
      <BrandPreview />

      <div className="card">
        <h3>Adding your own</h3>
        <pre>
          <code>{`// packages/theme/src/themes/pinacoteca.ts
import { defineTheme } from "../define.js";

export const pinacoteca = defineTheme({
  id: "pinacoteca",
  label: "Pinacoteca",
  description: "House brand for a civic picture gallery.",
  colorScheme: "light",
  identity: {
    wordmark: "Brera",
    wordmarkAccent: "\u00b7",
    organisation: "Pinacoteca di Brera",
  },
  brand: { bg: "#fbfaf7", text: "#1b1a17", accent: "#8c2f39" },
});`}</code>
        </pre>
        <p className="dim">
          Register it in <code>THEMES</code>, run{" "}
          <code>pnpm --filter @dpa/theme test</code>, then deploy with{" "}
          <code>NEXT_PUBLIC_THEME=pinacoteca pnpm build:web</code>. Anything not
          overridden falls back to the default, so a brand is usually three or four
          colours rather than a stylesheet.
        </p>
        <p className="faint">
          The validator runs over every registered theme in the test suite. Had the
          palette above pushed two roles together, this page would say so and CI
          would be red.
        </p>
      </div>
    </>
  );
}