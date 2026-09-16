/* ============================================================
   stocks4cas — Simulation page
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    S4C.initNav("simulation");
    S4C.renderFooter();

    const strategies = S4C.getStrategies();
    const trades = S4C.getTrades();
    const equity = S4C.getEquity();

    renderStrategyCards(strategies);
    renderBars(strategies);
    renderRiskTable(strategies);
    setupTradeTable(trades, strategies);

    // currency toggle
    document.getElementById("sim-currency").addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        document.querySelectorAll("#sim-currency button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const c = btn.dataset.c;
        renderStrategyCards(strategies, c);
        renderBars(strategies, c);
    });
});

/* ---------------- strategy cards ---------------- */
function renderStrategyCards(strategies, currency = "usd") {
    const el = document.getElementById("strategy-cards");
    if (!el) return;
    el.innerHTML = strategies.map((s, i) => {
        const isProfit = s.pnl >= 0;
        const cls = isProfit ? "up" : "down";
        const deltaText = currency === "usd"
            ? `${S4C.fmtUSD(s.pnl)} · ${S4C.fmtPct(s.return_pct)}`
            : `${S4C.fmtPct(s.return_pct)} · ${S4C.fmtUSD(s.pnl)}`;
        return `
            <div class="card fade-in">
                <div class="card-head">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:34px; height:34px; border-radius:9px; display:grid; place-items:center; font-weight:800; font-size:15px; color:#fff; background:${S4C.chartColor(i)};">${i + 1}</div>
                        <h2>${s.name}</h2>
                    </div>
                    <span class="pill ${cls}">${isProfit ? "▲ Profit" : "▼ Loss"}</span>
                </div>
                <p class="muted" style="font-size:13px; min-height:38px;">${s.tagline}</p>
                <div class="kpi mt-16" style="background:transparent; border:none; padding:0;">
                    <div class="value ${cls}" style="font-size:24px;">${currency === "usd" ? S4C.fmtUSD(s.pnl) : S4C.fmtPct(s.return_pct)}</div>
                    <div class="delta ${cls}">${deltaText}</div>
                </div>
                <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
                    <span class="pill">Sharpe ${s.sharpe}</span>
                    <span class="pill">MaxDD ${S4C.fmtPct(s.max_drawdown_pct)}</span>
                    <span class="pill">${s.num_trades} trades</span>
                </div>
            </div>`;
    }).join("");
}

/* ---------------- P&L bars ---------------- */
function renderBars(strategies, currency = "usd") {
    const el = document.getElementById("sim-bars");
    if (!el) return;
    const maxAbs = Math.max(...strategies.map((s) => Math.abs(s.pnl)), 1);
    const sorted = [...strategies].sort((a, b) => b.pnl - a.pnl);
    el.innerHTML = sorted.map((s) => {
        const isProfit = s.pnl >= 0;
        const pct = Math.min(100, (Math.abs(s.pnl) / maxAbs) * 100);
        const width = (pct / 2).toFixed(2);
        const cls = isProfit ? "profit" : "loss";
        const valText = currency === "usd" ? S4C.fmtUSD(s.pnl) : S4C.fmtPct(s.return_pct);
        return `
            <div class="bar-row fade-in">
                <div class="bar-name">${s.name}<span class="bar-tag">${S4C.fmtPct(s.return_pct)} return</span></div>
                <div class="bar-track">
                    <div class="zero-line"></div>
                    <div class="bar-fill ${cls}" style="${isProfit
                        ? `left:50%; width:${width}%;`
                        : `right:50%; width:${width}%; justify-content:flex-start; padding-left:8px;`}">${Math.abs(pct).toFixed(0)}%</div>
                </div>
                <div class="bar-val ${cls}">${valText}</div>
            </div>`;
    }).join("");
}

/* ---------------- risk table ---------------- */
function renderRiskTable(strategies) {
    const tbody = document.querySelector("#risk-table tbody");
    if (!tbody) return;
    const sorted = [...strategies].sort((a, b) => b.sharpe - a.sharpe);
    tbody.innerHTML = sorted.map((s) => `
        <tr>
            <td style="font-weight:600;">${s.name}</td>
            <td class="${s.sharpe >= 0 ? "up" : "down"}">${s.sharpe.toFixed(2)}</td>
            <td class="down">${S4C.fmtPct(s.max_drawdown_pct)}</td>
            <td class="${s.return_pct >= 0 ? "up" : "down"}">${S4C.fmtPct(s.return_pct)}</td>
        </tr>`).join("");
}

/* ---------------- trade table ---------------- */
function setupTradeTable(trades, strategies) {
    const filter = document.getElementById("trade-filter");
    const search = document.getElementById("trade-search");
    const tbody = document.querySelector("#trade-table tbody");
    if (!tbody) return;

    const names = [...new Set(trades.map((t) => t.strategy))];
    filter.innerHTML = `<option value="">All strategies</option>` +
        names.map((n) => `<option value="${n}">${n}</option>`).join("");

    const render = () => {
        const f = filter.value;
        const q = search.value.trim().toUpperCase();
        const rows = trades.filter((t) => {
            if (f && t.strategy !== f) return false;
            if (q && !String(t.ticker).toUpperCase().includes(q)) return false;
            return true;
        });
        const slice = rows.slice(0, 300);
        tbody.innerHTML = slice.map((t) => {
            const sideCls = { BUY: "side-buy", SELL: "side-sell", SHORT: "side-short", COVER: "side-cover" }[t.side] || "";
            return `
                <tr>
                    <td class="mono" style="font-size:12px;">${S4C.fmtDate(t.date)}</td>
                    <td>${t.strategy}</td>
                    <td style="font-weight:700;">${t.ticker}</td>
                    <td class="${sideCls}">${t.side}</td>
                    <td>${Number(t.shares).toLocaleString()}</td>
                    <td>${S4C.fmtUSD(t.price, 2)}</td>
                    <td>${S4C.fmtUSD(t.value)}</td>
                </tr>`;
        }).join("");
        if (slice.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="muted center" style="padding:24px;">No trades match.</td></tr>`;
        }
    };

    filter.addEventListener("change", render);
    search.addEventListener("input", render);
    render();
}
