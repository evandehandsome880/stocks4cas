/* ============================================================
   stocks4cas — shared helpers
   Formatting, theming, chart defaults and data access.
   Every page loads: theme.js (head) → data.js → docs.js →
   common.js → documentary.js → <page>.js
   ============================================================ */

const S4C = (() => {
    /* ---------------- formatting ---------------- */

    const fmtUSD = (n, digits = 0) => {
        if (n === null || n === undefined || isNaN(n)) return "—";
        const sign = n < 0 ? "-" : "";
        const abs = Math.abs(n);
        if (abs >= 1e9) return sign + "$" + (abs / 1e9).toFixed(2) + "B";
        if (abs >= 1e6) return sign + "$" + (abs / 1e6).toFixed(2) + "M";
        if (abs >= 1e3) return sign + "$" + (abs / 1e3).toFixed(digits > 0 ? 1 : 0) + "K";
        return sign + "$" + abs.toFixed(digits);
    };

    const fmtPct = (n, digits = 2) => {
        if (n === null || n === undefined || isNaN(n)) return "—";
        return (n >= 0 ? "+" : "") + Number(n).toFixed(digits) + "%";
    };

    const fmtDate = (d) => {
        if (!d) return "";
        const date = new Date(d);
        if (isNaN(date)) return String(d);
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    };

    // Feed timestamps are absolute (UTC), so always render them in UTC — the
    // date shown then always matches the publisher's own timestamp.
    const fmtDateTime = (d) => {
        if (!d) return "";
        const date = new Date(d);
        if (isNaN(date)) return String(d);
        const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
        const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
        return day + " · " + time + " UTC";
    };

    // Minimal HTML escaping — feed text ends up inside innerHTML.
    const esc = (s) => String(s === null || s === undefined ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    /* ---------------- theme ---------------- */

    const THEME_KEY = "s4c-theme";
    const listeners = [];

    const getTheme = () => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

    const onThemeChange = (fn) => { if (typeof fn === "function") listeners.push(fn); };

    const syncButton = (theme) => {
        const btn = document.getElementById("theme-toggle");
        if (!btn) return;
        btn.textContent = theme === "light" ? "Dark" : "Light";
        btn.setAttribute("aria-label", "Switch to " + (theme === "light" ? "dark" : "light") + " theme");
    };

    const setTheme = (theme) => {
        const next = theme === "light" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try { window.localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage unavailable */ }
        syncButton(next);
        listeners.forEach((fn) => { try { fn(next); } catch (e) { console.error(e); } });
        return next;
    };

    const toggleTheme = () => setTheme(getTheme() === "light" ? "dark" : "light");

    const initTheme = () => {
        syncButton(getTheme());
        const btn = document.getElementById("theme-toggle");
        if (btn) btn.addEventListener("click", toggleTheme);
    };

    /* ---------------- chart defaults ---------------- */
    // Colours are read from the CSS custom properties so charts follow the
    // active theme; series colours are mid-tone so they read on both.

    const cssVar = (name, fallback) => {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback;
    };

    const palette = () => ({
        text: cssVar("--text", "#e9e7e2"),
        muted: cssVar("--muted", "#9ba1a8"),
        faint: cssVar("--faint", "#868d95"),
        line: cssVar("--line", "#2c3138"),
        panel: cssVar("--panel", "#1b1e22"),
    });

    const COLORS = ["#3f7fbf", "#2f8f6a", "#b07c2a", "#b04a4a", "#6f5fbf", "#2f7f8f", "#8a6a4a", "#7f7f7f"];

    const chartColor = (i) => COLORS[i % COLORS.length];

    const hexToRgba = (hex, alpha = 1) => {
        const m = String(hex).replace("#", "");
        if (m.length !== 6) return hex;
        const r = parseInt(m.slice(0, 2), 16);
        const g = parseInt(m.slice(2, 4), 16);
        const b = parseInt(m.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const chartBase = () => {
        const p = palette();
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: {
                    labels: { color: p.muted, boxWidth: 10, boxHeight: 10, padding: 12, usePointStyle: false },
                },
                tooltip: {
                    backgroundColor: p.panel,
                    borderColor: p.line,
                    borderWidth: 1,
                    cornerRadius: 0,
                    titleColor: p.text,
                    bodyColor: p.muted,
                    padding: 8,
                    displayColors: true,
                },
            },
            scales: {
                x: { ticks: { color: p.faint, maxTicksLimit: 8 }, grid: { color: p.line }, border: { color: p.line } },
                y: { ticks: { color: p.faint }, grid: { color: p.line }, border: { color: p.line } },
            },
        };
    };

    const moneyScale = (config) => {
        const base = chartBase();
        return {
            ...base,
            scales: {
                x: { ...base.scales.x },
                y: {
                    ticks: { color: base.scales.y.ticks.color, callback: (v) => fmtUSD(v, 0) },
                    grid: { color: base.scales.y.grid.color },
                    border: { color: base.scales.y.border.color },
                },
            },
            ...config,
        };
    };

    /* ---------------- data access ---------------- */
    // Loaded from the generated bundles (data.js, news-data.js, docs.js).

    const getStrategies = () => (typeof STRATEGIES !== "undefined" ? STRATEGIES.strategies : []);
    const getStrategyMeta = () => (typeof STRATEGIES !== "undefined" ? STRATEGIES : null);
    const getEquity = () => (typeof EQUITY !== "undefined" ? EQUITY : null);
    const getTrades = () => (typeof TRADES !== "undefined" ? TRADES : []);
    const getPrices = () => (typeof PRICES !== "undefined" ? PRICES : null);
    const getNews = () => (typeof NEWS !== "undefined" ? NEWS : null);
    const getDocs = () => (typeof DOCS !== "undefined" ? DOCS : null);

    /* ---------------- navbar ---------------- */

    const initNav = (activeKey) => {
        const toggle = document.querySelector(".menu-toggle");
        const links = document.querySelector(".nav-links");
        if (toggle && links) toggle.addEventListener("click", () => links.classList.toggle("open"));

        document.querySelectorAll(".nav-links a").forEach((a) => {
            if (a.dataset.key === activeKey) a.classList.add("active");
        });

        initTheme();
    };

    /* ---------------- footer ---------------- */

    const footerHTML = () => `
        <div>
            <strong>stocks4cas</strong> — a student project on stock-prediction awareness.
            <div class="mt-8">Every price, trade and headline here is simulated or quoted for education.</div>
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;">
            <a href="index.html">Home</a>
            <a href="analysis.html">Analysis</a>
            <a href="simulation.html">Simulation</a>
            <a href="news.html">News</a>
            <a href="about.html">About</a>
            <a href="#documentary">Documentary</a>
        </div>
        <div class="disclaimer" style="flex-basis:100%;">
            <strong>Disclaimer:</strong> All prices, trades and performance figures on this site are simulated or
            illustrative for educational purposes. News headlines and summaries belong to their publishers and link
            to the original articles. Nothing here constitutes financial advice — always do your own research.
        </div>`;

    const renderFooter = () => {
        const el = document.getElementById("footer");
        if (el) el.innerHTML = footerHTML();
    };

    return {
        fmtUSD, fmtPct, fmtDate, fmtDateTime, esc,
        getTheme, setTheme, toggleTheme, initTheme, onThemeChange,
        COLORS, chartColor, hexToRgba, palette, chartBase, moneyScale,
        getStrategies, getStrategyMeta, getEquity, getTrades, getPrices, getNews, getDocs,
        initNav, renderFooter,
    };
})();
