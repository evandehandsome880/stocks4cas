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
            title: "Rates set the price of everything else",
            body: "When long-dated government yields move, they re-price every asset at once. One macro variable can swamp six very different trading strategies, which says more about shared exposure than about prediction.",
        },
        {
            title: "Concentration cuts both ways",
            body: "A handful of very large companies drive much of the index. That helps trend-following rules while the market rises and hurts them when it turns, because the same few names lead in both directions.",
        },
        {
            title: "A headline is not a signal",
            body: "Every article on this page is real reporting about a real event. None of it says what happens next, and by the time you read it, other people have read it and priced it in.",
        },
        {
            title: "Doing nothing is still a decision",
            body: "The dollar-cost averaging strategy made no attempt to time the market and still finished near the top of the table. That is one run of one simulated market, not proof that patience always wins.",
        },
        {
            title: "Our costs are missing",
            body: "The backtest ignores commissions, spreads and the market impact of real orders. The rule with 81 small trades would pay those costs most often, and adding them could reorder the table.",
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
            that moment. Re-run <span class="mono">python fetch_news.py</span> to refresh it.
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
