import type { Metadata } from "next";
import { THEMES, themesCss } from "@dpa/theme";
import Nav from "../components/Nav";
import { DEFAULT_THEME, activeTheme, themeBootScript } from "../lib/theme";
import "./globals.css";

const bp = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * Generated once at build time from the theme definitions, then inlined.
 *
 * Inlined rather than emitted as a file because these are the variables every
 * other rule depends on: served as a separate stylesheet they would be a second
 * round trip standing between the visitor and a correctly coloured page. It is
 * a few kilobytes.
 */
const THEME_CSS = themesCss(THEMES, DEFAULT_THEME);

export const metadata: Metadata = {
  title: "DPA — Digital Passport for Artworks",
  description:
    "v0.4 consolidation of the AABC × SDA Bocconi Digital Passport for Artworks programme. One pipeline, one passport, one score, one disclosure model.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
     * `suppressHydrationWarning` because the boot script below deliberately
     * rewrites `data-theme` before React ever runs. That is the point of the
     * script — a visitor's saved brand has to be applied before first paint,
     * and an effect cannot do that. Without this, React would report the
     * intended difference as a hydration error.
     */
    <html lang="en" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <style id="dpa-theme" dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>

        <Nav
          basePath={bp}
          wordmark={activeTheme.identity.wordmark}
          wordmarkAccent={activeTheme.identity.wordmarkAccent}
        />

        <main id="main">{children}</main>

        <footer className="foot">
          <div className="wrap">
            <p>
              <strong>Digital Passport for Artworks — v0.4.</strong> A
              consolidation of five prototypes from the AABC × SDA Bocconi
              research programme.
            </p>
            <p>
              Everything on this site runs on <strong>committed fixtures</strong>,
              not live data. Scores are computed by the real scorer over real
              cited sources, but no live register was queried and no attestation
              was written to a chain. See{" "}
              <a href={`${bp}/plan/`}>the plan</a> for what is real and what is
              not.
            </p>
            <p className="faint">
              {activeTheme.identity.organisation
                ? `${activeTheme.identity.organisation} · `
                : null}
              Vendored work is credited in{" "}
              <a href="https://github.com/Ethical-Tech-CoLab/DPA/blob/main/ATTRIBUTION.md">
                ATTRIBUTION.md
              </a>
              . MIT / CC BY 4.0. Source on{" "}
              <a
                href="https://github.com/Ethical-Tech-CoLab/DPA"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              .
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
