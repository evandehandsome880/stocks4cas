/* ============================================================
   stocks4cas — shared helpers
   ============================================================ */

const S4C = (() => {
    // ---------- formatting ----------
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
        if (isNaN(date)) return d;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    // ---------- Chart.js defaults ----------
    const chartBase = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: {
                labels: { color: "#8b98ad", usePointStyle: true, pointStyle: "circle", boxWidth: 8, padding: 14 },
            },
            tooltip: {
                backgroundColor: "#182033",
                borderColor: "#2b3a52",
                borderWidth: 1,
                titleColor: "#e8eef8",
                bodyColor: "#8b98ad",
                padding: 10,
                displayColors: true,
            },
        },
        scales: {
            x: { ticks: { color: "#5b687d", maxTicksLimit: 8 }, grid: { color: "#1f2a3d" } },
            y: { ticks: { color: "#5b687d" }, grid: { color: "#1f2a3d" } },
        },
    };

    const moneyScale = (config) => ({
        ...chartBase,
        scales: {
            x: { ...chartBase.scales.x },
            y: {
                ticks: { color: "#5b687d", callback: (v) => fmtUSD(v, 0) },
                grid: { color: "#1f2a3d" },
            },
        },
        ...config,
    });

    const COLORS = ["#5b8cff", "#3dd6c3", "#f5b544", "#ff5d6c", "#a78bfa", "#2dd4a0", "#f97316", "#e879f9"];

    const chartColor = (i) => COLORS[i % COLORS.length];

    const hexToRgba = (hex, alpha = 1) => {
        const m = hex.replace("#", "");
        if (m.length !== 6) return hex;
        const r = parseInt(m.slice(0, 2), 16);
        const g = parseInt(m.slice(2, 4), 16);
        const b = parseInt(m.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // ---------- data access ----------
    // Loads from the embedded global data.js; used by all pages.
    const getStrategies = () => (typeof STRATEGIES !== "undefined" ? STRATEGIES.strategies : []);
    const getEquity = () => (typeof EQUITY !== "undefined" ? EQUITY : null);
    const getTrades = () => (typeof TRADES !== "undefined" ? TRADES : []);
    const getPrices = () => (typeof PRICES !== "undefined" ? PRICES : null);

    // ---------- navbar ----------
    const initNav = (activeKey) => {
        const toggle = document.querySelector(".menu-toggle");
        const links = document.querySelector(".nav-links");
        if (toggle && links) {
            toggle.addEventListener("click", () => links.classList.toggle("open"));
        }
        // highlight active link
        document.querySelectorAll(".nav-links a").forEach((a) => {
            if (a.dataset.key === activeKey) a.classList.add("active");
        });
    };

    // ---------- render footer ----------
    const footerHTML = () => `
        <div>
            <strong style="color:#8b98ad;">stocks4cas</strong> — raising awareness of stock prediction.
            <div class="mt-8">A student project exploring quantitative finance. Not investment advice.</div>
        </div>
        <div style="display:flex;gap:18px;">
            <a href="index.html">Home</a>
            <a href="analysis.html">Analysis</a>
            <a href="simulation.html">Simulation</a>
            <a href="news.html">News</a>
            <a href="about.html">About</a>
        </div>
        <div class="disclaimer" style="flex-basis:100%;">
            <strong>Disclaimer:</strong> All prices, trades and performance figures on this site are simulated or
            illustrative for educational purposes. They do not represent real market data or actual investment
            results. Nothing here constitutes financial advice — always do your own research before investing.
        </div>`;

    const renderFooter = () => {
        const el = document.getElementById("footer");
        if (el) el.innerHTML = footerHTML();
    };

    return {
        fmtUSD, fmtPct, fmtDate,
        chartBase, moneyScale, COLORS, chartColor, hexToRgba,
        getStrategies, getEquity, getTrades, getPrices,
        initNav, renderFooter,
    };
})();
