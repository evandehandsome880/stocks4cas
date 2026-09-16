# stocks4cas

A student project that raises awareness of stock prediction through an interactive,
cohesive "quant terminal" website.

## What it does
- Runs a seeded simulation of six named quantitative strategies from **1 Mar → 1 Sep 2026**.
- Visualises strategy equity curves, profit/loss bars, risk metrics and a full trade log.
- Provides stock analysis over a simulated ten-ticker universe.
- Curates illustrative finance headlines and editorial insights (not a live feed).

## Pages
| Page | Description |
|------|-------------|
| `index.html` | Dashboard — hero, ticker strip, KPIs, equity curves, P&L bars |
| `analysis.html` | Stock analysis — price/return charts and volatility stats |
| `simulation.html` | The backtest — strategy cards, risk table, searchable trade log |
| `news.html` | Curated market headlines + editorial insights (illustrative, not live) |
| `about.html` | Project mission, glossary and methodology |

## Data pipeline — regenerate the site's data
```bash
python -m venv .venv                  # once
.venv\Scripts\activate                # Windows; source .venv/bin/activate elsewhere
uv pip install -r requirements.txt    # numpy + pandas
python simulate.py
```
This rewrites `data/*.json` **and** `data.js` — the bundled globals every page
loads via `<script src="data.js">`. The run is seeded (seed 42), so repeating it
produces byte-identical output.

## Preview the site

```bash
python -m http.server 8000
```
Then open <http://localhost:8000/>. The pages also open straight from disk — only
the Chart.js CDN charts need an internet connection.

## Project layout

| Path | Role |
|------|------|
| `*.html` | Five pages, each loading `data.js` + `common.js` + one page script |
| `common.js` | Shared formatters, Chart.js defaults and data accessors (`S4C`) |
| `news.js` | Curated headline / insight dataset for the news page |
| `simulate.py` | Backtest engine — writes `data/*.json` and `data.js` |
| `data/` | Generated JSON payloads (strategies, equity, trades, prices) |

## Notes
- All prices, trades and performance are **simulated** for education — not real data, not investment advice.
