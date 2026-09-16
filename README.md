# stocks4cas

A student project that raises awareness of stock prediction. We simulate a market,
run six named strategies through it, and then publish everything — the numbers, every
trade, the source code and the logs the run produced.

## What it does

- Runs a seeded simulation of six named quantitative strategies from **1 Mar → 1 Sep 2026**.
- Visualises equity curves, profit/loss bars, risk metrics and the complete trade log.
- Analyses a simulated ten-ticker universe.
- Shows a dated snapshot of **real** finance headlines from public RSS feeds — quoted
  verbatim, with the publisher's own timestamp and a link to the original article.
- Ends with a **documentary** on every page: what the project is, what we chose and why,
  the run logs, the checksums and the complete source code.

## Pages

| Page | Description |
|------|-------------|
| `index.html` | Dashboard — hero, ticker strip, KPIs, equity curves, P&L bars |
| `analysis.html` | Stock analysis — price/return charts and volatility stats |
| `simulation.html` | The backtest — strategy cards, risk table, searchable trade log |
| `news.html` | Dated RSS snapshot + our own commentary, clearly separated |
| `about.html` | Project mission, strategy glossary and methodology |
| *every page* | `#documentary` at the bottom — logs, sources and hashes |

## Design

- Flat and minimal on purpose: square corners, 1px rules, no shadows, gradients,
  blur or animation. Numbers are set in monospace so they are easy to compare.
- Two themes: **dark** (default) and a **beige light** theme. `theme.js` applies the
  saved choice (falling back to your operating-system preference) before the page
  paints, and the nav has the toggle. The choice is remembered in `localStorage`.
- Text/background pairs in both themes are checked against WCAG contrast targets.

## Data pipeline

```bash
python -m venv .venv                  # once
.venv\Scripts\activate                # Windows; source .venv/bin/activate elsewhere
uv pip install -r requirements.txt    # numpy + pandas

python build.py                       # simulate -> news -> docs
```

The steps can also be run on their own:

| Script | Writes | Notes |
|--------|--------|-------|
| `simulate.py` | `data/*.json`, `data/trades.csv`, `data/run.log`, `data.js` | Seeded (42), so results are reproducible; prints a SHA-256 for every file it writes |
| `fetch_news.py` | `data/news.json`, `data/news.log`, `news-data.js` | Pulls public RSS feeds, checks every link, keeps the publisher's own timestamps |
| `build_docs.py` | `docs.js`, `data/docs.json`, `data/docs.log` | The documentary: full sources, run logs, hashes |

Pages load those bundles as ordinary script globals — no fetch calls, no browser build
step — so the site also works when opened straight from a folder. Only Chart.js (CDN)
and the article links need an internet connection.

## Project layout

| Path | Role |
|------|------|
| `*.html` | Five pages, each loading the bundles + `common.js` + `documentary.js` + one page script |
| `theme.js` | Applies the colour theme before first paint |
| `common.js` | Formatting, theming, chart defaults and data access (`S4C`) |
| `documentary.js` | The written documentary and its renderer |
| `news.js`, `news-page.js` | News renderers (publisher quotes + our commentary) |
| `simulate.py`, `fetch_news.py`, `build_docs.py`, `build.py` | Generators |
| `data/`, `data.js`, `news-data.js`, `docs.js` | Generated — see `data/run.log` for the last build |

## Notes

- All prices, trades and performance figures are **simulated** for education — not real
  market data, and not investment advice.
- News headlines and summaries belong to their publishers; each card links to the
  original article and the snapshot date is shown on the page.
