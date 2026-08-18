"use client";

/**
 * A themed panel that does not follow the page.
 *
 * Because `themesCss` emits each brand as a `[data-theme="…"]` block rather
 * than only on `:root`, and custom properties inherit, putting the attribute on
 * this one element rebrands everything inside it and nothing outside. That is
 * what makes a side-by-side comparison possible: an institution deciding
 * between two palettes needs to see them together, not remember the previous
 * one.
 *
 * The content is deliberately the parts of the site where colour carries
 * meaning — role tags, a coverage verdict, a withheld field — rather than a
 * strip of swatches. Swatches always look fine.
 */

import { useState } from "react";
import { THEMES } from "@dpa/theme";
import { DEFAULT_THEME } from "../lib/theme";

const OTHER =
  THEMES.find((t) => t.id !== DEFAULT_THEME)?.id ?? DEFAULT_THEME;

export default function BrandPreview() {
  const [id, setId] = useState<string>(OTHER);
  const theme = THEMES.find((t) => t.id === id) ?? THEMES[0]!;

  return (
    <div>
      <div className="btn-row" role="group" aria-label="Preview brand">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            className="btn"
            data-active={id === t.id}
            aria-pressed={id === t.id}
            onClick={() => setId(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        data-theme={theme.id}
        className="card"
        style={{
          background: "var(--bg)",
          color: "var(--text)",
          marginTop: "var(--gap)",
          fontFamily: "var(--sans)",
        }}
      >
        <p className="label">
          {theme.identity.organisation ?? theme.label} — preview
        </p>
        <h3 style={{ fontFamily: "var(--serif)" }}>
          {theme.identity.wordmark}
          <span style={{ color: "var(--accent)" }}>
            {theme.identity.wordmarkAccent ?? ""}
          </span>{" "}
          Bura askos, terracotta
        </h3>

        <div className="score-row">
          <div className="score-box">
            <p className="label">Confidence</p>
            <p className="score-num">
              58<span className="score-den">/100</span>
            </p>
          </div>
          <div className="score-box grow">
            <p className="label">Register coverage</p>
            <p className="cov-structurally" style={{ fontWeight: 600, margin: 0 }}>
              structurally-uncovered
            </p>
            <p className="faint" style={{ margin: "4px 0 0" }}>
              0 of 9 registers could identify this object. The score is not about
              the object; it is about the paperwork around it.
            </p>
          </div>
        </div>

        <p className="label" style={{ marginTop: 16 }}>
          Disclosure tiers
        </p>
        <div className="btn-row">
          <span className="pill role-public">public</span>
          <span className="pill role-source-community">source community</span>
          <span className="pill role-museum">museum</span>
          <span className="pill role-enforcement">enforcement</span>
          <span className="pill role-owner">owner</span>
        </div>

        <div className="warn-box">
          <strong>Human review required.</strong> A high score over uncovered
          registers cannot auto-issue at any threshold.
        </div>

        <div className="withheld">
          <code>legal.holderIdentity</code> withheld at this tier
        </div>

        <p className="faint" style={{ marginTop: 14 }}>
          Every colour, radius and type size in this panel came from{" "}
          <code>{theme.id}</code>. No component was modified to produce it.
        </p>
      </div>
    </div>
  );
}
