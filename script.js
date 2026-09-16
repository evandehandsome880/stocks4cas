/* ============================================================
   stocks4cas — Home dashboard
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    S4C.initNav("home");
    S4C.renderFooter();

    const strategies = S4C.getStrategies();
    const equity = S4C.getEquity();
    const prices = S4C.getPrices();

    renderTicker(prices);
    renderKPIs(strategies);
    renderEquityChart(equity);
    renderPnlBars(strategies);
    renderTopPerformer(strategies);
    renderLessons(strategies);
});

/* ---------------- ticker strip ---------------- */
function renderTicker(prices) {
    const el = document.getElementById("ticker-strip");
    if (!el || !prices) return;
    const universe = prices.universe || [];
    const rows = prices.prices || [];
    const last = rows.length ? rows[rows.length - 1] : null;
    const first = rows.length ? rows[0] : null;

    el.innerHTML = universe.map((u) => {
        const cur = last ? last[u.ticker] : u.price0;
        const prev = first ? first[u.ticker] : u.price0;
        const chg = prev ? ((cur - prev) / prev) * 100 : 0;
        const cls = chg >= 0 ? "up" : "down";
        return `
            <div class="ticker-item">
                <span class="t">${u.ticker}</span>
                <span class="p">${S4C.fmtUSD(cur, 2)}</span>
                <span class="${cls}" style="font-size:12px;">${S4C.fmtPct(chg)}</span>
            </div>`;
    }).join("");
}

/* ---------------- KPI row ---------------- */
function renderKPIs(strategies) {
    const el = document.getElementById("kpi-row");
    if (!el) return;
    const wins = strategies.filter((s) => s.pnl >= 0);
    const losses = strategies.filter((s) => s.pnl < 0);
    const totalPnl = strategies.reduce((a, s) => a + s.pnl, 0);
    const best = [...strategies].sort((a, b) => b.pnl - a.pnl)[0];
    const worst = [...strategies].sort((a, b) => a.pnl - b.pnl)[0];

    el.innerHTML = `
        <div class="kpi fade-in">
            <div class="label">Total strategies</div>
            <div class="value">${strategies.length}</div>
            <div class="delta muted">${wins.length} profitable · ${losses.length} losing</div>
        </div>
        <div class="kpi fade-in">
            <div class="label">Net combined P&amp;L</div>
            <div class="value ${totalPnl >= 0 ? "up" : "down"}">${S4C.fmtUSD(totalPnl)}</div>
            <div class="delta muted">across all strategies</div>
        </div>
        <div class="kpi fade-in">
            <div class="label">Best strategy</div>
            <div class="value up">${best ? S4C.fmtUSD(best.pnl) : "—"}</div>
            <div class="delta up">${best ? best.name : ""}</div>
        </div>
        <div class="kpi fade-in">
            <div class="label">Worst strategy</div>
            <div class="value down">${worst ? S4C.fmtUSD(worst.pnl) : "—"}</div>
            <div class="delta down">${worst ? worst.name : ""}</div>
        </div>`;
}

/* ---------------- equity chart ---------------- */
let equityChart = null;

function renderEquityChart(equity) {
    const canvas = document.getElementById("equityChart");
    if (!canvas || !equity || typeof Chart === "undefined") return;

    const dates = equity.dates;
    const names = Object.keys(equity.strategies);

    const makeDatasets = (fromIdx) => {
        return names.map((name, i) => ({
            label: name,
            data: equity.strategies[name].slice(fromIdx),
            borderColor: S4C.chartColor(i),
            backgroundColor: "transparent",
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 0,
        }));
    };

    const ctx = canvas.getContext("2d");
    equityChart = new Chart(ctx, {
        type: "line",
        data: { labels: dates, datasets: makeDatasets(0) },
        options: S4C.moneyScale(),
    });

    document.getElementById("equity-range").addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        document.querySelectorAll("#equity-range button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const range = btn.dataset.range;
        const n = dates.length;
        let from = 0;
        if (range === "1m") from = Math.max(0, n - 21);
        if (range === "2w") from = Math.max(0, n - 10);
        equityChart.data.labels = dates.slice(from);
        equityChart.data.datasets = makeDatasets(from);
        equityChart.update();
    });
}

/* ---------------- P&L bars ---------------- */
function renderPnlBars(strategies) {
    const el = document.getElementById("pnl-bars");
    if (!el) return;
    const maxAbs = Math.max(...strategies.map((s) => Math.abs(s.pnl)), 1);
    const sorted = [...strategies].sort((a, b) => b.pnl - a.pnl);

    el.innerHTML = sorted.map((s) => {
        const isProfit = s.pnl >= 0;
        const pct = Math.min(100, (Math.abs(s.pnl) / maxAbs) * 100);
        // bars grow from centre (50%) outward
        const width = (pct / 2).toFixed(2);
        const cls = isProfit ? "profit" : "loss";
        return `
            <div class="bar-row fade-in">
                <div class="bar-name">${s.name}
                    <span class="bar-tag">${s.tagline}</span>
                </div>
                <div class="bar-track">
                    <div class="zero-line"></div>
                    <div class="bar-fill ${cls}" style="${isProfit
                        ? `left:50%; width:${width}%;`
                        : `right:50%; width:${width}%; justify-content:flex-start; padding-left:8px;`}">${Math.abs(pct).toFixed(0)}%</div>
                </div>
                <div class="bar-val ${cls}">${S4C.fmtUSD(s.pnl)}</div>
            </div>`;
    }).join("");
}

/* ---------------- top performer ---------------- */
function renderTopPerformer(strategies) {
    const el = document.getElementById("top-performer");
    const hint = document.getElementById("top-performer-hint");
    if (!el) return;
    const best = [...strategies].sort((a, b) => b.pnl - a.pnl)[0];
    if (!best) return;
    if (hint) hint.textContent = `Highest net P&L in the simulation window`;

    el.innerHTML = `
        <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
            <div style="font-size:44px;">🏆</div>
            <div>
                <div style="font-size:20px; font-weight:800;">${best.name}</div>
                <div class="muted" style="font-size:13px; margin-top:4px;">${best.tagline}</div>
            </div>
        </div>
        <div class="grid grid-3 mt-16">
            <div class="kpi"><div class="label">Net P&amp;L</div><div class="value up">${S4C.fmtUSD(best.pnl)}</div></div>
            <div class="kpi"><div class="label">Return</div><div class="value up">${S4C.fmtPct(best.return_pct)}</div></div>
            <div class="kpi"><div class="label">Sharpe</div><div class="value">${best.sharpe}</div></div>
        </div>`;
}

/* ---------------- lessons ---------------- */
function renderLessons(strategies) {
    const el = document.getElementById("lessons");
    if (!el) return;
    const sorted = [...strategies].sort((a, b) => b.pnl - a.pnl);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const lessons = [
        `📊 <strong>${best ? best.name : "—"}</strong> led the field at <strong class="up">${best ? S4C.fmtPct(best.return_pct) : ""}</strong>, while <strong>${worst ? worst.name : "—"}</strong> fell <strong class="down">${worst ? S4C.fmtPct(worst.return_pct) : ""}</strong> — the same market, very different outcomes.`,
        "⚖️ Strategies with steady, rule-based entries (like dollar-cost averaging) often smooth volatility, while aggressive timing can amplify drawdowns.",
        "🔮 No strategy predicted the future. These results come from a <em>simulated</em> market — real predictions carry far more uncertainty and risk.",
        "🧠 The goal of this project is awareness: understand what quant strategies claim to do before trusting any “prediction” you see online.",
    ];
    el.innerHTML = lessons.map((l) => `<div>${l}</div>`).join("");
}
