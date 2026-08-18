"use client";

/**
 * Live brand switching.
 *
 * Every theme's variables are already in the stylesheet (see `themesCss`), so
 * switching is one attribute write on `<html>` — no reload, no flash, no second
 * network request. That is deliberate: an institution evaluating this should be
 * able to see its own palette applied to the disclosure matrix in the meeting,
 * not be told that it would be possible.
 *
 * The choice persists in localStorage and is re-applied by the inline script in
 * `layout.tsx` before first paint. Doing it here alone would paint the default
 * theme first and then swap, which is the flash this pattern exists to avoid.
 */

import { useEffect, useState } from "react";
import { THEMES } from "@dpa/theme";
import { STORAGE_KEY, DEFAULT_THEME } from "../lib/theme";

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState<string>(DEFAULT_THEME);

  // Read from the DOM rather than from storage: the inline script has already
  // resolved precedence between storage and the build default, and this should
  // agree with what is actually on screen.
  useEffect(() => {
    const applied = document.documentElement.dataset["theme"];
    if (applied) setCurrent(applied);
  }, []);

  const choose = (id: string) => {
    document.documentElement.dataset["theme"] = id;
    setCurrent(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Private browsing. The theme still applies for this page view.
    }
  };

  return (
    <div className="theme-switch" role="group" aria-label="Brand theme">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          className="theme-chip"
          data-active={current === t.id}
          aria-pressed={current === t.id}
          title={t.description}
          onClick={() => choose(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
