/**
 * Theme selection for the web app.
 *
 * The build default comes from `NEXT_PUBLIC_THEME`, so a deployment for a
 * particular institution is an environment variable rather than a fork:
 *
 *   NEXT_PUBLIC_THEME=atrium pnpm build:web
 *
 * A visitor's own choice, made with the switcher, overrides that for their
 * browser. Institutions get a default; individuals get control.
 */
import { DEFAULT_THEME_ID, getTheme } from "@dpa/theme";

export const STORAGE_KEY = "dpa-theme";

export const DEFAULT_THEME: string =
  process.env["NEXT_PUBLIC_THEME"] ?? DEFAULT_THEME_ID;

export const activeTheme = getTheme(DEFAULT_THEME);

/**
 * Runs before first paint, inlined in <head>.
 *
 * Written as a string because it must execute ahead of React hydration; a
 * component effect runs after the browser has already painted the default
 * theme, producing exactly the flash of wrong branding this avoids. Wrapped in
 * try/catch because localStorage throws outright in some privacy modes, and a
 * theme preference is not worth a blank page.
 */
export const themeBootScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)});document.documentElement.dataset.theme=t||${JSON.stringify(
  DEFAULT_THEME,
)};}catch(e){document.documentElement.dataset.theme=${JSON.stringify(
  DEFAULT_THEME,
)};}})();`;
