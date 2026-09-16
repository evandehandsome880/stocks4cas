/* ============================================================
   stocks4cas — market news & insights
   Curated, illustrative finance content — NOT a live news feed.
   Written to support the project's "be sceptical of prediction"
   message; headlines are examples, not real-time reporting.
   ============================================================ */

const S4C_NEWS = (() => {
    // ---- Curated feed (illustrative, finance-related headlines) ----
    const CURATED = [
        {
            title: "Fed officials signal openness to rate cuts as inflation cools toward target",
            source: "Reuters",
            emoji: "🏛️",
            tag: "Macro",
            sentiment: "positive",
            summary: "Minutes from the latest FOMC meeting showed policymakers weighing the pace of easing, lifting risk appetite across equities while the dollar softened.",
            url: "https://www.reuters.com/markets/",
        },
        {
            title: "AI chip demand keeps semiconductor names in the spotlight as capex stays elevated",
            source: "CNBC",
            emoji: "💻",
            tag: "Technology",
            sentiment: "positive",
            summary: "Cloud providers continue to guide for record data-centre spending, keeping investor attention firmly on AI infrastructure and memory supply chains.",
            url: "https://www.cnbc.com/technology/",
        },
        {
            title: "Oil steadies as OPEC+ weighs output policy and demand outlook softens",
            source: "Bloomberg",
            emoji: "🛢️",
            tag: "Energy",
            sentiment: "neutral",
            summary: "Crude futures traded in a tight range as traders balanced supply discipline against softer refining margins and an uncertain demand picture in Asia.",
            url: "https://www.bloomberg.com/energy",
        },
        {
            title: "Retail earnings paint a mixed consumer picture as spending shifts to essentials",
            source: "Financial Times",
            emoji: "🛒",
            tag: "Consumer",
            sentiment: "negative",
            summary: "Discretionary retailers guided cautiously for the coming quarter, while discount and staple chains reported resilient foot traffic.",
            url: "https://www.ft.com/markets",
        },
        {
            title: "Treasury yields ease after weak labour-market data bolsters rate-cut bets",
            source: "Reuters",
            emoji: "📉",
            tag: "Bonds",
            sentiment: "positive",
            summary: "A softer-than-expected payrolls print sent the 10-year yield lower and boosted rate-sensitive sectors including tech and real estate.",
            url: "https://www.reuters.com/markets/rates-bonds/",
        },
        {
            title: "Gold edges to a record as investors hedge against policy uncertainty",
            source: "CNBC",
            emoji: "🥇",
            tag: "Commodities",
            sentiment: "positive",
            summary: "Bullion extended its gains as real yields declined and central-bank buying continued, reinforcing gold's role as a portfolio hedge.",
            url: "https://www.cnbc.com/commodities/",
        },
        {
            title: "Bank stocks rally as analysts upgrade the sector on improved net-interest outlook",
            source: "Bloomberg",
            emoji: "🏦",
            tag: "Financials",
            sentiment: "positive",
            summary: "Major lenders advanced after sell-side research pointed to stabilising deposit costs and resilient credit quality heading into year-end.",
            url: "https://www.bloomberg.com/markets",
        },
        {
            title: "EV makers face margin pressure as price competition intensifies globally",
            source: "Financial Times",
            emoji: "🔋",
            tag: "Autos",
            sentiment: "negative",
            summary: "Automakers are trimming prices to defend market share, squeezing unit economics even as battery costs decline.",
            url: "https://www.ft.com/companies",
        },
        {
            title: "Small-cap stocks outperform as breadth improves across the market",
            source: "Reuters",
            emoji: "📊",
            tag: "Equities",
            sentiment: "positive",
            summary: "The Russell 2000 outpaced large caps for a fourth straight session, a sign investors see broadening economic strength.",
            url: "https://www.reuters.com/markets/us/",
        },
        {
            title: "Healthcare M&A picks up as pharma seeks late-stage pipelines",
            source: "CNBC",
            emoji: "💊",
            tag: "Healthcare",
            sentiment: "neutral",
            summary: "Deal activity accelerated with several mid-size acquisitions announced, as large drugmakers look to refill pipelines ahead of patent cliffs.",
            url: "https://www.cnbc.com/healthcare/",
        },
        {
            title: "Bitcoin holds gains as spot-ETF inflows continue at a steady pace",
            source: "CoinDesk",
            emoji: "₿",
            tag: "Crypto",
            sentiment: "positive",
            summary: "Digital assets consolidated near multi-month highs, supported by persistent inflows into spot products and improving institutional adoption.",
            url: "https://www.coindesk.com/markets/",
        },
        {
            title: "Strong dollar fades as traders position for a more dovish Fed path",
            source: "Bloomberg",
            emoji: "💱",
            tag: "FX",
            sentiment: "neutral",
            summary: "The greenback slipped against major peers, boosting emerging-market assets and dollar-denominated commodities.",
            url: "https://www.bloomberg.com/markets/currencies",
        },
    ];

    // ---- Market insights (editorial analysis) ----
    const INSIGHTS = [
        {
            title: "The Fed pivot trade",
            sentiment: "positive",
            body: "With inflation trending toward target, bond markets are pricing a full easing cycle. Historically, the 6–12 months after the first cut favour duration (bonds) and quality growth equities. Momentum strategies tend to lag during sharp policy pivots, while dollar-cost averaging smooths entry risk.",
        },
        {
            title: "AI capex is still the market's engine",
            sentiment: "positive",
            body: "Hyper-scaler spending remains the single largest theme in equities. Semiconductor and networking names carry elevated volatility, so position sizing matters. Mean-reversion approaches on overbought AI names have historically captured short-term pullbacks.",
        },
        {
            title: "Watch the consumer",
            sentiment: "negative",
            body: "Retail guidance is bifurcating: essentials hold up while discretionary wobbles. Credit-card delinquency data bears watching as a leading indicator for a broader slowdown. Defensive sectors offer lower drawdown if the consumer cracks.",
        },
        {
            title: "Oil's supply floor",
            sentiment: "neutral",
            body: "OPEC+ has repeatedly defended prices with output cuts. Energy equities trade on capital discipline and buybacks more than the spot price, offering a buffer — but a demand shock remains the key downside risk.",
        },
        {
            title: "Breadth is broadening",
            sentiment: "positive",
            body: "Small caps and equal-weight indices outperforming cap-weighted benchmarks signals healthy participation. Rotations like this historically reduce concentration risk and support active strategies such as momentum and pairs trading.",
        },
        {
            title: "Gold as a hedge, not a trade",
            sentiment: "neutral",
            body: "Record gold prices reflect real-yield compression and central-bank demand. Allocations should be viewed as portfolio insurance rather than a momentum chase — sharp reversals are common after parabolic moves.",
        },
    ];

    const SENTIMENT_LABEL = { positive: "Positive", negative: "Negative", neutral: "Neutral" };
    const SENTIMENT_EMOJI = { positive: "▲", negative: "▼", neutral: "•" };
    const SENTIMENT_CLASS = { positive: "up", negative: "down", neutral: "muted" };

    const renderNewsList = (container, articles) => {
        container.innerHTML = "";
        articles.forEach((a) => {
            const card = document.createElement("div");
            card.className = "news-card fade-in";
            const cls = SENTIMENT_CLASS[a.sentiment] || "muted";
            card.innerHTML = `
                <div class="news-thumb">${a.emoji || "📰"}</div>
                <div class="news-body">
                    <h4>${a.title}</h4>
                    <p>${a.summary}</p>
                    <div class="news-meta">
                        <span class="source">${a.source}</span>
                        <span>${a.tag || "Markets"}</span>
                        <span class="${cls}">${SENTIMENT_EMOJI[a.sentiment] || ""} ${SENTIMENT_LABEL[a.sentiment] || "Neutral"}</span>
                    </div>
                </div>`;
            card.onclick = () => window.open(a.url || "#", "_blank");
            container.appendChild(card);
        });
    };

    const renderInsights = (container) => {
        container.innerHTML = "";
        INSIGHTS.forEach((ins) => {
            const div = document.createElement("div");
            div.className = "insight-card fade-in " + (ins.sentiment || "");
            div.innerHTML = `
                <h4>${SENTIMENT_EMOJI[ins.sentiment]} ${ins.title}</h4>
                <p>${ins.body}</p>`;
            container.appendChild(div);
        });
    };

    return { CURATED, INSIGHTS, renderNewsList, renderInsights, SENTIMENT_LABEL };
})();
