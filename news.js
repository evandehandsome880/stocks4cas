/* ============================================================
   stocks4cas — news renderers

   The article list is a snapshot pulled from public RSS feeds by
   fetch_news.py and loaded from the generated news-data.js bundle.
   Headlines, summaries and dates are quoted verbatim from the
   publishers, and every card links to the original article.

   The insights at the bottom are our own commentary — clearly not news
   reporting, and not advice.
   ============================================================ */

const S4C_NEWS = (() => {
    /* ---------------- our commentary (editorial, not reporting) ---------------- */

    const INSIGHTS = [
        {
            title: "The rate story dominates everything",
            body: "When long-dated government yields move, they re-price every other asset at once. Note how a single macro variable can swamp six very different trading strategies — that is a lesson about exposure, not about prediction.",
        },
        {
            title: "Concentration cuts both ways",
            body: "A handful of very large companies now drive a large share of index moves. That helps trend-following strategies in a strong market and punishes them in a reversal, because the same few names drive both directions.",
        },
        {
            title: "Headlines are not signals",
            body: "Every article on this page is real reporting about real events. None of it tells you what happens next. Trading on the news usually means trading on what other people have already read, priced in, and acted on.",
        },
        {
            title: "Diversification is a timing-free decision",
            body: "The simulation's dollar-cost averaging strategy made no attempt to time the market and still finished ahead. That is not proof it works forever — it is evidence that a boring rule beats a confident guess more often than people expect.",
        },
        {
            title: "Costs and slippage are missing",
            body: "Our backtest ignores commissions, spreads and the market impact of real orders. A strategy with 81 small trades (like dollar-cost averaging here) would pay those costs more often. Add them and the ranking can change.",
        },
    ];

    /* ---------------- helpers ---------------- */

    const hostOf = (url) => {
        try {
            return new URL(url).hostname.replace(/^www\./, "");
        } catch (e) {
            return "";
        }
    };

    const articleCard = (a) => `
        <article class="news-card">
            <div class="news-body">
                <h4>
                    <a href="${S4C.esc(a.url)}" target="_blank" rel="noopener noreferrer">${S4C.esc(a.title)}</a>
                </h4>
                ${a.summary ? `<p>${S4C.esc(a.summary)}</p>` : ""}
                <div class="news-meta">
                    <span class="source">${S4C.esc(a.source)}</span>
                    <span class="when">${S4C.fmtDateTime(a.published)}</span>
                    <span>${S4C.esc(hostOf(a.url))}</span>
                </div>
            </div>
        </article>`;

    /* ---------------- renderers ---------------- */

    const renderArticles = (container, articles) => {
        if (!container) return;
        if (!articles || !articles.length) {
            container.innerHTML = `<div class="note">No articles to show.</div>`;
            return;
        }
        container.innerHTML = articles.map(articleCard).join("");
    };

    // The snapshot's own provenance: when it was pulled, and from where.
    const renderNote = (container, snapshot) => {
        if (!container || !snapshot) return;
        const feeds = (snapshot.feeds || []).map((f) => S4C.esc(f.source)).join(", ");
        container.innerHTML = `
            <strong>Snapshot, not a live feed.</strong>
            Headlines, summaries and dates are quoted verbatim from the publishers
            (${feeds}) and every card links to the original article. The list was
            pulled on ${S4C.fmtDateTime(snapshot.generated)} and is only as fresh as
            that moment — re-run <span class="mono">python fetch_news.py</span> to refresh it.
            Nothing here is our own reporting, and none of it is investment advice.`;
    };

    const renderInsights = (container) => {
        if (!container) return;
        container.innerHTML = INSIGHTS.map((ins) => `
            <div class="insight-card">
                <h4>${S4C.esc(ins.title)}</h4>
                <p>${S4C.esc(ins.body)}</p>
            </div>`).join("");
    };

    return { INSIGHTS, renderArticles, renderNote, renderInsights };
})();
