/* ============================================================
   stocks4cas — the documentary

   Rendered at the bottom of every page (see <section id="documentary">).
   The prose below is written by hand; the logs, sources and hashes come
   from docs.js, which build_docs.py generates from this repository.

   If docs.js is missing, the section still renders the prose and shows a
   note explaining how to regenerate the generated content.
   ============================================================ */

const S4C_DOC = (() => {
    const CHAPTERS = [
        {
            id: "doc-what",
            title: "1. What this site is",
            html: `
                <p>
                    This is a student project about <strong>stock prediction</strong>: the industry, the
                    vocabulary, and the confidence that surrounds it. We built a small market simulation,
                    ran six named trading strategies through it, and then published everything the run
                    produced — the numbers, all 170 trades, the source code and the log file itself.
                </p>
                <p>
                    The point is not to sell you a system. The point is to show how much a
                    plausible-looking result depends on luck, on the choices made before the first line
                    of code, and on the costs that are easy to leave out. If you finish reading this and
                    feel more sceptical about anyone promising to predict prices, the project worked.
                </p>`,
        },
        {
            id: "doc-special",
            title: "2. What is different here",
            html: `
                <p>Most "trading strategy" pages show one curve going up. We tried to do the opposite.</p>
                <ul>
                    <li><strong>One market, six strategies.</strong> Every strategy is handed the identical
                        simulated price series, so any difference in the results comes from the rules, not
                        from different data.</li>
                    <li><strong>Every number is defined.</strong> Net P&amp;L is final equity minus the
                        starting $1,000,000. Return is that difference as a percentage. Sharpe is the mean
                        daily return divided by its standard deviation, annualised by &radic;252 (we assume a
                        zero risk-free rate). Max drawdown is the worst peak-to-trough fall along the way.</li>
                    <li><strong>Everything is inspectable.</strong> The equity curve, the risk table and the
                        full trade log — date, ticker, side, shares, price, value — are on the simulation
                        page, and the raw files are listed below with their checksums.</li>
                    <li><strong>It is reproducible.</strong> Prices come from a seeded generator (seed 42),
                        so re-running the simulation produces the same numbers. The log prints a SHA-256
                        hash for every file it writes, so you can check that the data on this site is the
                        data the run produced.</li>
                    <li><strong>Nothing to sign up for.</strong> No accounts, no analytics, no tracking, no
                        API keys. The whole site is static files plus two Python scripts.</li>
                    <li><strong>Honest framing throughout.</strong> Headlines on the news page are real and
                        dated; the prices and the performance are not. Neither is investment advice.</li>
                </ul>`,
        },
        {
            id: "doc-considered",
            title: "3. What we considered",
            html: `
                <p>Every row below was a fork in the road. Here is what we picked, and what it cost us.</p>
                <div class="table-scroll">
                    <table class="doc-table">
                        <thead>
                            <tr><th>Decision</th><th>Alternative</th><th>Why — and what it costs</th></tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Simulated prices (geometric Brownian motion)</td>
                                <td>Real historical prices from a market API</td>
                                <td>No keys, no rate limits, and the site works offline. The cost is that real
                                    markets have fat tails, volatility clustering and jumps that our generator
                                    does not reproduce.</td>
                            </tr>
                            <tr>
                                <td>A fixed seed (42)</td>
                                <td>Fresh randomness on every run</td>
                                <td>A result you cannot repeat is not evidence. The seed is printed in the
                                    log; the only field that differs between runs on different days is the
                                    "generated" date stamp.</td>
                            </tr>
                            <tr>
                                <td>Six named, simple rules</td>
                                <td>One clever model nobody can read</td>
                                <td>Rules you can state in a sentence — "buy the five strongest 20-day movers",
                                    "buy when RSI drops below 30" — are rules you can argue with. A black box
                                    only invites trust.</td>
                            </tr>
                            <tr>
                                <td>Publish every trade and the raw log</td>
                                <td>Publish only the summary table</td>
                                <td>If only the summary is visible, you cannot audit us. All 170 trades are in
                                    the log, including the two strategies that lost money.</td>
                            </tr>
                            <tr>
                                <td>No parameter tuning</td>
                                <td>Adjust thresholds until the returns look good</td>
                                <td>That is exactly how backtests fool people: the curve gets fitted to the
                                    sample. We fixed the rules first and reported whatever came out.</td>
                            </tr>
                            <tr>
                                <td>Ignore commissions and slippage</td>
                                <td>Model trading costs</td>
                                <td>Stated as a limitation rather than hidden. It matters most for the strategy
                                    that trades 81 times, and it is the first thing we would add next.</td>
                            </tr>
                            <tr>
                                <td>Real, dated headlines from public RSS feeds</td>
                                <td>Write plausible example headlines</td>
                                <td>A headline with an invented date cannot be checked. The news page is now a
                                    verbatim snapshot: the publisher's title, the publisher's timestamp, and a
                                    link straight to the article.</td>
                            </tr>
                            <tr>
                                <td>No sentiment scoring of news</td>
                                <td>Tag stories "positive" or "negative"</td>
                                <td>Keyword sentiment looks like a signal without being one. Instead we explain
                                    why news that is already public is not a trading edge.</td>
                            </tr>
                            <tr>
                                <td>Flat, minimal interface, beige light theme</td>
                                <td>A glowing dark "trading terminal"</td>
                                <td>Design signals authority. Square corners, plain borders and no glow make it
                                    harder to mistake this for a professional product. The theme follows your
                                    system and remembers your choice.</td>
                            </tr>
                            <tr>
                                <td>Static HTML, CSS and JavaScript</td>
                                <td>A framework plus a live backend</td>
                                <td>Anyone can read the source of the page they are looking at, and the site
                                    runs from a folder on a laptop. The only server-side pieces are the Python
                                    scripts that generate the data.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>`,
        },
        {
            id: "doc-pipeline",
            title: "4. How it is built",
            html: `
                <p>Three scripts produce everything the site displays. Nothing is typed in by hand.</p>
                <ul>
                    <li><span class="mono">simulate.py</span> — generates the market, runs the six
                        strategies, and writes <span class="mono">data/*.json</span>,
                        <span class="mono">data/trades.csv</span>, <span class="mono">data/run.log</span>
                        and <span class="mono">data.js</span>.</li>
                    <li><span class="mono">fetch_news.py</span> — pulls a snapshot of real, dated headlines
                        from public RSS feeds, checks every link, and writes
                        <span class="mono">data/news.json</span>, <span class="mono">news-data.js</span> and
                        <span class="mono">data/news.log</span>.</li>
                    <li><span class="mono">build_docs.py</span> — reads this repository (sources, logs,
                        checksums) and writes <span class="mono">docs.js</span>, which is what you are
                        reading right now.</li>
                </ul>
                <p>
                    The pages then load those bundles as ordinary script globals — no fetch calls, no
                    build step in the browser — so the site also works when opened straight from a folder.
                    The only thing that needs an internet connection is Chart.js, which draws the two
                    charts, and the article links on the news page, which go to the publishers.
                </p>`,
        },
        {
            id: "doc-limits",
            title: "7. Limits, and what we would do next",
            html: `
                <p>A backtest is a claim about one possible past. Here is where ours is weakest.</p>
                <ul>
                    <li><strong>No trading costs.</strong> No commissions, spreads, borrow fees on the short
                        leg, or market impact. Small, frequent orders suffer most.</li>
                    <li><strong>One seed, one market.</strong> A serious study would run hundreds of
                        simulations and report the distribution of outcomes instead of a single path.</li>
                    <li><strong>The price model is too well behaved.</strong> Geometric Brownian motion has
                        no fat tails, no volatility clustering, no gaps and no regime changes.</li>
                    <li><strong>Hand-picked universe.</strong> Ten large tickers chosen by us — a form of
                        survivorship bias, since all ten still exist and none went to zero.</li>
                    <li><strong>Six months, daily bars.</strong> Short by any standard, and daily data hides
                        everything that happens inside a day.</li>
                    <li><strong>No taxes or withdrawals</strong>, and no liquidity limits on position size.</li>
                    <li><strong>The news is a snapshot.</strong> It ages from the moment it is pulled, and we
                        deliberately do not feed it into the simulation — mixing real headlines with
                        simulated prices would make the results unreadable.</li>
                </ul>
                <p>
                    Next, in order: add costs and slippage, then run the simulation across many seeds and
                    report the spread, then replace the generator with real historical data, and finally
                    let the news snapshot drive a simple event study rather than a strategy.
                </p>`,
        },
        {
            id: "doc-reproduce",
            title: "8. Reproduce it",
            html: `
                <p>Everything on this site can be regenerated from the repository in a few commands.</p>
                <pre>python -m venv .venv                 # once
.venv\\Scripts\\activate               # Windows (source .venv/bin/activate elsewhere)
uv pip install -r requirements.txt   # numpy + pandas

python simulate.py                   # market, strategies, logs, data.js
python fetch_news.py                 # dated RSS snapshot + checked links
python build_docs.py                 # regenerate this documentary
python -m http.server 8000           # then open http://localhost:8000/</pre>
                <p class="doc-meta">
                    The simulation is seeded, so re-running it reproduces the same numbers; the news
                    snapshot will change as publishers publish.
                </p>`,
        },
    ];

    /* ---------------- generated content (from docs.js) ---------------- */

    const bytes = (n) => (n >= 1024 ? (n / 1024).toFixed(1) + " KB" : n + " B");

    const missingBlock = () => `
        <section class="doc-chapter" id="doc-logs">
            <h2>5. The logs · 6. The code</h2>
            <div class="note doc-note">
                <strong>Generated content is not loaded.</strong>
                <span class="mono">docs.js</span> is missing, so the run logs and the source code cannot
                be shown here. Regenerate it with <span class="mono">python build_docs.py</span>.
            </div>
        </section>`;

    const tradeTable = () => {
        const trades = S4C.getTrades();
        if (!trades.length) return `<div class="note">Trade data is not loaded either (data.js missing).</div>`;
        return `
            <div class="table-scroll">
                <table class="doc-table">
                    <thead>
                        <tr><th>Date</th><th>Strategy</th><th>Ticker</th><th>Side</th><th>Shares</th><th>Price</th><th>Value</th></tr>
                    </thead>
                    <tbody>
                        ${trades.slice(0, 40).map((t) => `
                            <tr>
                                <td class="mono">${S4C.fmtDate(t.date)}</td>
                                <td>${S4C.esc(t.strategy)}</td>
                                <td class="mono">${S4C.esc(t.ticker)}</td>
                                <td>${S4C.esc(t.side)}</td>
                                <td class="mono">${Number(t.shares).toLocaleString()}</td>
                                <td class="mono">${S4C.fmtUSD(t.price, 2)}</td>
                                <td class="mono">${S4C.fmtUSD(t.value)}</td>
                            </tr>`).join("")}
                    </tbody>
                </table>
            </div>`;
    };

    const logsChapter = (docs) => `
        <section class="doc-chapter" id="doc-logs">
            <h2>5. The logs</h2>
            <p>
                Below are the run logs exactly as the scripts wrote them — not tidied up, not summarised.
                They carry the seed, the per-strategy results, the trade counts and a SHA-256 hash of
                every file the run produced, so you can check that what this site displays is what the
                run actually generated.
            </p>
            ${docs.logs.map((log) => `
                <h3>${S4C.esc(log.path)}</h3>
                <p class="doc-meta">${bytes(log.bytes)} · sha256 ${S4C.esc(log.sha256)}</p>
                <pre>${S4C.esc(log.text)}</pre>`).join("")}
            <h3>Every trade</h3>
            <p class="doc-meta">
                First 40 of ${docs.tradeCount} trades. The full set is in
                <span class="mono">data/trades.csv</span> and on the simulation page.
            </p>
            ${tradeTable()}
            <h3>Generated files</h3>
            <div class="table-scroll">
                <table class="doc-table">
                    <thead><tr><th>File</th><th>Size</th><th>SHA-256</th></tr></thead>
                    <tbody>
                        ${docs.outputs.map((o) => `
                            <tr>
                                <td class="mono">${S4C.esc(o.path)}</td>
                                <td class="mono">${bytes(o.bytes)}</td>
                                <td class="mono" style="word-break:break-all;">${S4C.esc(o.sha256)}</td>
                            </tr>`).join("")}
                    </tbody>
                </table>
            </div>
        </section>`;

    const codeChapter = (docs) => `
        <section class="doc-chapter" id="doc-code">
            <h2>6. The code</h2>
            <p>
                Every hand-written file in the project, in full: ${docs.files.length} files,
                ${docs.totalLines.toLocaleString()} lines. Generated bundles — such as
                <span class="mono">data.js</span> and <span class="mono">news-data.js</span> — appear in
                the logs chapter as checksums instead of being quoted back into themselves, and this
                bundle's own checksum is recorded in <span class="mono">data/docs.log</span>.
            </p>
            <div class="doc-tabs" id="doc-tabs"></div>
            <div id="doc-source"></div>
            <p class="doc-meta" id="doc-filemeta"></p>
        </section>`;

    const showFile = (docs, path) => {
        const file = docs.files.find((f) => f.path === path) || docs.files[0];
        const src = document.getElementById("doc-source");
        const meta = document.getElementById("doc-filemeta");
        if (!src || !file) return;
        src.innerHTML = `<pre>${S4C.esc(file.source)}</pre>`;
        if (meta) {
            meta.textContent = `${file.path} · ${file.lines} lines · ${bytes(file.bytes)} · sha256 ${file.sha256}`;
        }
    };

    const wireTabs = (docs) => {
        const tabs = document.getElementById("doc-tabs");
        if (!tabs || !docs.files.length) return;
        tabs.innerHTML = docs.files.map((f, i) =>
            `<button class="doc-tab${i === 0 ? " active" : ""}" type="button" data-path="${S4C.esc(f.path)}">${S4C.esc(f.path)}</button>`
        ).join("");
        tabs.addEventListener("click", (e) => {
            const btn = e.target.closest("button");
            if (!btn) return;
            tabs.querySelectorAll(".doc-tab").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            showFile(docs, btn.dataset.path);
        });
        showFile(docs, docs.files[0].path);
    };

    /* ---------------- render ---------------- */

    const chapterHTML = (c) => `
        <section class="doc-chapter" id="${c.id}">
            <h2>${S4C.esc(c.title)}</h2>
            ${c.html}
        </section>`;

    const tocHTML = (withGenerated) => {
        const items = CHAPTERS.map((c) => `<a href="#${c.id}">${S4C.esc(c.title)}</a>`);
        if (withGenerated) {
            items.splice(4, 0,
                `<a href="#doc-logs">5. The logs</a>`,
                `<a href="#doc-code">6. The code</a>`);
        }
        return `<nav class="doc-toc">${items.join("")}</nav>`;
    };

    const render = () => {
        const host = document.getElementById("documentary");
        if (!host) return;

        const docs = S4C.getDocs();
        const first = CHAPTERS.slice(0, 4).map(chapterHTML).join("");
        const generated = docs && docs.files && docs.files.length
            ? logsChapter(docs) + codeChapter(docs)
            : missingBlock();
        const last = CHAPTERS.slice(4).map(chapterHTML).join("");

        host.innerHTML = `
            <div class="eyebrow">Documentary</div>
            <h2 style="font-size:20px;">How this project was built, and what we had to decide</h2>
            <p class="doc-intro">
                Everything here — the market, the six strategies, the news snapshot and this documentary
                itself — can be rebuilt from the repository. This section explains what we made, what is
                unusual about it, and which trade-offs we chose. Then it shows the raw run logs and the
                complete source code, so that nothing on this site has to be taken on trust.
            </p>
            ${tocHTML(!!docs)}
            ${docs ? `<p class="doc-meta">docs.js generated ${S4C.esc(docs.generated)} · ${docs.files.length} source files · ${docs.totalLines.toLocaleString()} lines · ${docs.logs.length} run logs</p>` : ""}
            ${first}
            ${generated}
            ${last}`;

        if (docs && docs.files && docs.files.length) wireTabs(docs);
    };

    return { render };
})();

document.addEventListener("DOMContentLoaded", () => S4C_DOC.render());
