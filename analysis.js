/* ============================================================
   stocks4cas — Stock Analysis page
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    S4C.initNav("analysis");
    S4C.renderFooter();

    const prices = S4C.getPrices();
    if (!prices) {
        document.getElementById("universe-cards").innerHTML =
            '<div class="muted">No simulation data found. Run <code>simulate.py</code> first.</div>';
        return;
    }

    const universe = prices.universe || [];
    const rows = prices.prices || [];
    const tickers = universe.map((u) => u.ticker);

    let selected = null; // null = whole market (average of all)
    let mode = "price";
    let chart = null;

    renderUniverseCards(universe, rows);
    setupSelect(universe);

    const render = () => {
        const { labels, values } = seriesFor(selected, mode);
        const title = selected
            ? (universe.find((u) => u.ticker === selected)?.name || selected) + " (" + selected + ")"
            : "Market Overview (equal-weight average)";
        const sub = mode === "price"
            ? "Simulated closing price, Mar–Sep 2026"
            : "Cumulative return (%) since 1 March 2026";
        document.getElementById("detail-title").textContent = title;
        document.getElementById("detail-sub").textContent = sub;
        drawChart(labels, values, selected, mode);
        renderStats(selected);
    };

    function seriesFor(ticker, mode) {
        const labels = rows.map((r) => r.date);
        let values;
        if (ticker) {
            values = rows.map((r) => r[ticker]);
        } else {
            // equal-weight index
            values = rows.map((r) => {
                const sum = tickers.reduce((a, t) => a + (r[t] || 0), 0);
                return sum / tickers.length;
            });
        }
        if (mode === "return") {
            const base = values[0] || 1;
            values = values.map((v) => ((v - base) / base) * 100);
        }
        return { labels, values };
    }

    function drawChart(labels, values, ticker, mode) {
        const canvas = document.getElementById("analysisChart");
        const color = ticker
            ? S4C.chartColor(tickers.indexOf(ticker))
            : S4C.COLORS[0];
        const ctx = canvas.getContext("2d");
        if (chart) chart.destroy();
        const options = mode === "price"
            ? S4C.moneyScale()
            : {
                  ...S4C.chartBase,
                  scales: {
                      x: { ...S4C.chartBase.scales.x },
                      y: { ticks: { color: "#5b687d", callback: (v) => v + "%" }, grid: { color: "#1f2a3d" } },
                  },
              };
        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: ticker || "Market",
                    data: values,
                    borderColor: color,
                    backgroundColor: S4C.hexToRgba ? S4C.hexToRgba(color, 0.12) : "rgba(91,140,255,0.1)",
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2.2,
                    pointRadius: 0,
                }],
            },
            options,
        });
    }

    function renderUniverseCards(universe, rows) {
        const el = document.getElementById("universe-cards");
        const first = rows[0] || {};
        const last = rows[rows.length - 1] || {};
        el.innerHTML = universe.map((u, i) => {
            const p0 = first[u.ticker] || u.price0;
            const p1 = last[u.ticker] || u.price0;
            const ret = ((p1 - p0) / p0) * 100;
            const cls = ret >= 0 ? "up" : "down";
            const active = selected === u.ticker;
            return `
                <div class="kpi fade-in" data-ticker="${u.ticker}"
                     style="cursor:pointer; ${active ? "box-shadow:0 0 0 2px var(--accent);" : ""}">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div class="label" style="font-size:13px;">${u.ticker}</div>
                        <span class="pill ${cls}">${S4C.fmtPct(ret)}</span>
                    </div>
                    <div class="value" style="font-size:22px;">${S4C.fmtUSD(p1, 2)}</div>
                    <div class="delta muted" style="font-size:12px;">${u.name} · ${u.sector}</div>
                </div>`;
        }).join("");

        el.querySelectorAll("[data-ticker]").forEach((card) => {
            card.addEventListener("click", () => {
                selected = card.dataset.ticker;
                document.getElementById("ticker-select").value = selected;
                renderUniverseCards(universe, rows);
                render();
            });
        });
    }

    function setupSelect(universe) {
        const sel = document.getElementById("ticker-select");
        sel.innerHTML = `<option value="">— Full market —</option>` +
            universe.map((u) => `<option value="${u.ticker}">${u.ticker} · ${u.name}</option>`).join("");
        sel.addEventListener("change", () => {
            selected = sel.value || null;
            renderUniverseCards(universe, rows);
            render();
        });
    }

    function renderStats(ticker) {
        const el = document.getElementById("analysis-stats");
        const series = seriesFor(ticker, "price").values;
        const rets = [];
        for (let i = 1; i < series.length; i++) rets.push((series[i] - series[i - 1]) / series[i - 1]);
        const mean = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
        const vol = rets.length
            ? Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1)) * Math.sqrt(252) * 100
            : 0;
        const total = ((series[series.length - 1] - series[0]) / series[0]) * 100;
        const high = Math.max(...series);
        const low = Math.min(...series);

        const name = ticker || "Full market";
        el.innerHTML = `
            <div class="kpi"><div class="label">Total return</div><div class="value ${total >= 0 ? "up" : "down"}">${S4C.fmtPct(total)}</div><div class="delta muted">${name}</div></div>
            <div class="kpi"><div class="label">Annualised volatility</div><div class="value">${vol.toFixed(1)}%</div><div class="delta muted">σ of daily returns</div></div>
            <div class="kpi"><div class="label">Period range</div><div class="value" style="font-size:20px;">${S4C.fmtUSD(high, 0)} <span class="muted" style="font-size:13px;">/</span> ${S4C.fmtUSD(low, 0)}</div><div class="delta muted">high / low</div></div>`;
    }

    document.getElementById("analysis-mode").addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        document.querySelectorAll("#analysis-mode button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        mode = btn.dataset.mode;
        render();
    });

    // kick off
    render();
});
