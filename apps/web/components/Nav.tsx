"use client";

/**
 * The primary navigation.
 *
 * Two things this has to do that the previous markup did not.
 *
 * ACTIVE STATE. The old nav rendered six identical links, so the site never
 * told you where you were. It now marks the current route with
 * `aria-current="page"` — which is the part that matters, because it is what a
 * screen reader announces — and paints an accent rule under it for everyone
 * else. Both come from the same `isActive` call, so they cannot disagree.
 *
 * RESPONSIVENESS. The old nav set `overflow-x: auto` below 640px, which
 * technically fits but hides half the site behind a horizontal scroll that has
 * no scrollbar on touch devices. Below the breakpoint the links now collapse
 * into a disclosure panel: one button, a real `aria-expanded`, closes on Escape
 * and on navigation.
 *
 * `usePathname()` returns the path with `basePath` already stripped, so the
 * comparison here is against clean route paths while the hrefs carry the
 * prefix. Getting that backwards is why nav highlighting silently breaks on
 * project Pages sites.
 */

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import ThemeSwitcher from "./ThemeSwitcher";

interface NavItem {
  href: string;
  label: string;
}

const NAV: NavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/demo", label: "Demo" },
  { href: "/capture", label: "Capture" },
  { href: "/coverage", label: "Coverage" },
  { href: "/disclosure", label: "Disclosure" },
  { href: "/exhibit", label: "Exhibit" },
  { href: "/brand", label: "Brand" },
  { href: "/plan", label: "Plan" },
];

/**
 * The root is only active on an exact match; every other route is also active
 * for its descendants. Without the special case, "/" would light up on every
 * page of the site.
 */
function isActive(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  const target = href.replace(/\/+$/, "") || "/";
  if (target === "/") return path === "/";
  return path === target || path.startsWith(`${target}/`);
}

export default function Nav({
  basePath,
  wordmark,
  wordmarkAccent,
}: {
  basePath: string;
  wordmark: string;
  wordmarkAccent: string | null;
}) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // A menu that survives navigation would cover the page the visitor just
  // asked for.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      // Escape has to put focus somewhere. Leaving it on a link inside a panel
      // that has just been display:none'd drops the keyboard user at the top of
      // the document with no idea where they are.
      toggleRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const link = useCallback(
    (item: NavItem) => {
      const active = isActive(pathname, item.href);
      return (
        <a
          key={item.href}
          className="nav-link"
          href={`${basePath}${item.href === "/" ? "/" : `${item.href}/`}`}
          data-active={active}
          aria-current={active ? "page" : undefined}
        >
          {item.label}
        </a>
      );
    },
    [basePath, pathname],
  );

  return (
    <header className="nav">
      {/* The collapsed panel lives inside the landmark, not beside it: links
          that sit outside <nav> are not announced as navigation, which is a
          quiet way to make a mobile menu unusable for a screen-reader user. */}
      <nav aria-label="Primary">
        <div className="nav-inner">
          <a className="nav-brand" href={`${basePath}/`}>
            {wordmark}
            {wordmarkAccent ? <span>{wordmarkAccent}</span> : null}
          </a>

          <div className="nav-links">{NAV.map(link)}</div>

          <div className="nav-tools">
            <ThemeSwitcher />
          </div>

          <button
            ref={toggleRef}
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="nav-burger" data-open={open} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>

        <div className="nav-panel" id={panelId} data-open={open} hidden={!open}>
          <div className="nav-panel-inner">
            {NAV.map(link)}
            <div className="nav-panel-tools">
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
