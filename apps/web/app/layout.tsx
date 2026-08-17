import type { Metadata } from "next";
import "./globals.css";

const bp = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "DPA — Digital Passport for Artworks",
  description:
    "v0.4 consolidation of the AABC × SDA Bocconi Digital Passport for Artworks programme. One pipeline, one passport, one score, one disclosure model.",
};

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/demo", label: "Demo" },
  { href: "/coverage", label: "Coverage" },
  { href: "/disclosure", label: "Disclosure" },
  { href: "/exhibit", label: "Exhibit" },
  { href: "/plan", label: "Plan" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <a className="nav-brand" href={`${bp}/`}>
              DPA<span>.</span>
            </a>
            {NAV.map((n) => (
              <a key={n.href} className="nav-link" href={`${bp}${n.href}`}>
                {n.label}
              </a>
            ))}
            <span className="nav-spacer" />
            <a
              className="nav-link"
              href="https://github.com/Ethical-Tech-CoLab/DPA"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </nav>

        <main>{children}</main>

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
              Vendored work is credited in{" "}
              <a href="https://github.com/Ethical-Tech-CoLab/DPA/blob/main/ATTRIBUTION.md">
                ATTRIBUTION.md
              </a>
              . MIT / CC BY 4.0.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
