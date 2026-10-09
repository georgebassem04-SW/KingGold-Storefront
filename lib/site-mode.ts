/**
 * DARK MODE — the small shared bits (used on the server by app/[locale]/layout.tsx and in the browser by
 * components/layout/ModeToggle.tsx).
 */

/** Where the visitor's choice is kept on their device (localStorage) */
export const MODE_KEY = "site-mode";
/** Sent on the page when the mode changes, so the button redraws */
export const MODE_EVENT = "site-mode-change";

/** Tiny script for <head>: applies the saved choice (or the dashboard's default) before anything is painted */
export const modeScript = (fallback: "light" | "dark") =>
  `(function(){var m="${fallback}";try{var s=localStorage.getItem("${MODE_KEY}");if(s==="dark"||s==="light")m=s}catch(e){}document.documentElement.setAttribute("data-mode",m)})()`;
