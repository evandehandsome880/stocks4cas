# stocks4cas

An IBDP CAS project (Creativity and Service) about how much a trading strategy can
actually tell you. We simulate a market, run six named strategies through it, and
publish everything the run produced: the numbers, every trade, the source code and
the logs.

## What it does

- Runs a seeded simulation of six named quantitative strategies from **1 March to 1 September 2026**.
- Publishes the equity curves, the risk metrics, the loss makers and the full trade log.
- Reads a dated snapshot of **real** finance headlines from public RSS feeds, quoted
  verbatim with the publisher's own timestamp and a link to the original article.
- Reads a market mood from that snapshot and shows how you can check the reading.
- Explains the ideas first, so the pages work without a finance background.
- Ends with a **documentary** on every page: what the project is, what we chose and why,
  the run logs, the checksums and the complete source code.

## Pages

| Page | Description |
|------|-------------|
| `index.html` | Banner, market mood, KPIs, equity curves, P&L bars |
| `prerequisites.html` | Three ideas, three price shapes, six strategies in plain words |
| `play.html` | Five rounds of guessing the next close, scored against a coin |
| `analysis.html` | Price and return charts with volatility statistics |
| `simulation.html` | Strategy cards, risk table and a searchable trade log |
| `news.html` | Dated RSS snapshot plus our own commentary, kept separate |
| `about.html` | Why the site exists, the CAS project, the glossary and the methodology |
| *every page* | `#documentary` at the bottom: logs, sources and hashes |

## Design

- Flat and minimal on purpose: square corners, 1px rules, no shadows, gradients,
  blur or animation. Numbers are set with tabular figures so columns compare easily.
- Two themes: **dark** (default) and a **beige light** theme. `theme.js` applies the
  saved choice, falling back to your system preference, before the page paints, and
  the nav has the toggle. The choice is remembered in `localStorage`.
- Montserrat is vendored in `fonts/` under the SIL Open Font License 1.1, so the
  typeface needs no network. Code, file paths and hashes keep a monospaced face.
- Text and background pairs in both themes are checked against WCAG contrast targets.

## Data pipeline

```bash
python -m venv .venv                  # once
.venv\Scripts\activate                # Windows; source .venv/bin/activate elsewhere
uv pip install -r requirements.txt    # numpy + pandas

python build.py                       # simulate, then news, then docs
```

The steps can also be run on their own:

| Script | Writes | Notes |
|--------|--------|-------|
| `simulate.py` | `data/*.json`, `data/trades.csv`, `data/run.log`, `data.js` | Seeded (42), so results repeat; prints a SHA-256 for every file it writes. Also generates the teaching shapes and the game rounds, under a seed of their own. |
| `fetch_news.py` | `data/news.json`, `data/news.log`, `news-data.js` | Pulls public RSS feeds, checks every link and keeps the publisher's own timestamps. |
| `build_docs.py` | `docs.js`, `data/docs.json`, `data/docs.log` | The documentary: full sources, run logs and hashes. |

Pages load those bundles as ordinary script globals, with no fetch call and no browser
build step, so the site also works when opened straight from a folder. Only Chart.js
(CDN) and the article links need an internet connection. The guessing game draws its own
line as SVG, so it needs nothing.

## Project layout

| Path | Role |
|------|------|
| `*.html` | Seven pages, each loading the bundles, `common.js`, `documentary.js` and one page script |
| `fonts/` | Vendored Montserrat woff2 files and the OFL licence |
| `theme.js` | Applies the colour theme before first paint |
| `common.js` | Formatting, theming, chart defaults and data access (`S4C`) |
| `documentary.js` | The written documentary and its renderer |
| `news.js`, `news-page.js` | News renderers: publisher quotes plus our commentary |
| `simulate.py`, `fetch_news.py`, `build_docs.py`, `build.py` | Generators |
| `data/`, `data.js`, `news-data.js`, `docs.js` | Generated. `data/run.log` records the last build |

## Notes

- Every price, trade and performance figure is **simulated** for education. None of it
  is real market data, and none of it is investment advice.
- The market mood on the home page is our reading of one dated snapshot, not a forecast.
- News headlines and summaries belong to their publishers. Each card links to the
  original article, and the snapshot date is shown on the page.
