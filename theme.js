/* ============================================================
   stocks4cas — boot script for the colour theme.
   Loaded in <head> so the correct theme is applied before first
   paint (no flash of the wrong theme).

   Order of preference:
     1. the visitor's saved choice  (localStorage: "s4c-theme")
     2. the operating-system preference (prefers-color-scheme)
   ============================================================ */
(function () {
    var KEY = "s4c-theme";
    var stored = null;
    try {
        stored = window.localStorage.getItem(KEY);
    } catch (e) {
        stored = null; // private mode / file:// restrictions
    }
    var prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    var theme = stored === "light" || stored === "dark" ? stored : (prefersLight ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);
})();
