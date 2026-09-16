/* ============================================================
   stocks4cas — About page
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    S4C.initNav("about");
    S4C.renderFooter();

    const tbody = document.getElementById("strategy-glossary");
    if (!tbody) return;

    const strategies = S4C.getStrategies();
    const cats = {
        "Buy & Hold": "Benchmark",
        "Momentum": "Trend-following",
        "Mean Reversion": "Contrarian",
        "MA Crossover": "Trend-following",
        "Dollar-Cost Averaging": "Systematic",
        "Pairs Trading": "Market-neutral",
    };

    if (!strategies.length) {
        tbody.innerHTML = `<tr><td colspan="3" class="muted center" style="padding:24px;">No simulation data found. Run <code>simulate.py</code> first.</td></tr>`;
        return;
    }

    tbody.innerHTML = strategies.map((s) => `
        <tr>
            <td style="font-weight:700;">${s.name}</td>
            <td>${s.tagline}</td>
            <td><span class="pill accent">${cats[s.name] || "Quantitative"}</span></td>
        </tr>`).join("");
});
