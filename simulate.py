"""
stocks4cas — Backtest / simulation engine
Simulates a quant-fund style portfolio running several named strategies
from 2026-03-01 to 2026-09-01. Generates the JSON data that powers the site
(`data/*.json`) plus `data.js`, the bundled globals every page loads directly.
Deterministic (seeded) so results are stable and reproducible.
"""

import csv
import hashlib
import json
import math
import os
from datetime import date, timedelta

import numpy as np
import pandas as pd

# ---------------------------------------------------------------- config ----
SEED = 42
START = date(2026, 3, 1)
END = date(2026, 9, 1)
INITIAL_CAPITAL = 1_000_000.0

# The tradable universe. Vol = annualised, drift = annualised expected return.
UNIVERSE = [
    {"ticker": "MSFT", "name": "Microsoft",  "sector": "Technology",       "price0": 420.00, "drift": 0.22, "vol": 0.24},
    {"ticker": "NVDA", "name": "NVIDIA",     "sector": "Semiconductors",   "price0": 142.00, "drift": 0.34, "vol": 0.48},
    {"ticker": "AAPL", "name": "Apple",      "sector": "Technology",       "price0": 228.00, "drift": 0.14, "vol": 0.22},
    {"ticker": "AMZN", "name": "Amazon",     "sector": "Consumer Cyclical","price0": 198.00, "drift": 0.18, "vol": 0.28},
    {"ticker": "JPM",  "name": "JPMorgan",   "sector": "Financials",       "price0": 244.00, "drift": 0.10, "vol": 0.20},
    {"ticker": "XOM",  "name": "Exxon Mobil","sector": "Energy",           "price0": 108.00, "drift": 0.05, "vol": 0.25},
    {"ticker": "JNJ",  "name": "Johnson & Johnson", "sector": "Healthcare","price0": 156.00, "drift": 0.06, "vol": 0.15},
    {"ticker": "KO",   "name": "Coca-Cola",  "sector": "Consumer Defensive","price0": 64.00, "drift": 0.07, "vol": 0.14},
    {"ticker": "TSLA", "name": "Tesla",      "sector": "Consumer Cyclical","price0": 248.00, "drift": 0.25, "vol": 0.55},
    {"ticker": "SPY",  "name": "S&P 500 ETF","sector": "Index",            "price0": 590.00, "drift": 0.09, "vol": 0.13},
]

# ------------------------------------------------------------- price sim ----
def build_trading_days():
    days = []
    d = START
    while d <= END:
        if d.weekday() < 5:  # Mon-Fri
            days.append(d)
        d += timedelta(days=1)
    return days


def simulate_prices(tickers, rng):
    days = build_trading_days()
    n = len(days)
    dt = 1 / 252.0
    frames = {}
    for spec in UNIVERSE:
        s0 = spec["price0"]
        drift = spec["drift"]
        vol = spec["vol"]
        # correlated-ish random walk: systematic factor + idiosyncratic
        sys = rng.normal(0, 1, n)
        idio = rng.normal(0, 1, n)
        shocks = 0.7 * sys + 0.3 * idio
        rets = (drift - 0.5 * vol * vol) * dt + vol * math.sqrt(dt) * shocks
        prices = s0 * np.exp(np.cumsum(rets))
        frames[spec["ticker"]] = prices
    df = pd.DataFrame(frames, index=pd.DatetimeIndex([d.isoformat() for d in days]))
    return df


# -------------------------------------------------------------- indicators --
def sma(series, window):
    return series.rolling(window).mean()


def rsi(series, window=14):
    delta = series.diff()
    gain = delta.clip(lower=0).rolling(window).mean()
    loss = (-delta.clip(upper=0)).rolling(window).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


# -------------------------------------------------------------- strategies --
class Strategy:
    """Base class; each strategy receives price data and returns an equity
    curve + a list of trades."""

    def __init__(self, name, tagline):
        self.name = name
        self.tagline = tagline

    def run(self, prices, capital):
        raise NotImplementedError


class BuyAndHold(Strategy):
    def __init__(self):
        super().__init__("Buy & Hold", "Benchmark — hold SPY for the full period")

    def run(self, prices, capital):
        px = prices["SPY"]
        shares = capital / px.iloc[0]
        equity = shares * px
        trades = [{
            "date": px.index[0], "ticker": "SPY", "side": "BUY",
            "shares": round(shares, 2), "price": round(float(px.iloc[0]), 2),
            "value": round(float(shares * px.iloc[0]), 2),
        }]
        return equity, trades


class Momentum(Strategy):
    def __init__(self):
        super().__init__("Momentum", "Buy the 5 stocks with the strongest 20-day returns")

    def run(self, prices, capital):
        cash = capital
        holdings = {}   # ticker -> shares
        equity_curve = []
        trades = []
        lookback = 20
        for i, (idx, row) in enumerate(prices.iterrows()):
            date_str = idx
            if i % 21 == 0 and i >= lookback:
                mom = prices.iloc[i] / prices.iloc[i - lookback] - 1
                top = mom.nlargest(5).index.tolist()
                # liquidate old positions
                for t in list(holdings):
                    px_now = float(row[t])
                    val = holdings[t] * px_now
                    cash += val
                    trades.append({"date": date_str, "ticker": t, "side": "SELL",
                                   "shares": round(holdings[t], 2), "price": round(px_now, 2),
                                   "value": round(val, 2)})
                    del holdings[t]
                # buy new
                alloc = cash / len(top)
                for t in top:
                    px_now = float(row[t])
                    shares = alloc / px_now
                    holdings[t] = shares
                    trades.append({"date": date_str, "ticker": t, "side": "BUY",
                                   "shares": round(shares, 2), "price": round(px_now, 2),
                                   "value": round(alloc, 2)})
                cash = 0.0
            mkt_val = sum(holdings[t] * float(row[t]) for t in holdings)
            equity_curve.append(cash + mkt_val)
        return pd.Series(equity_curve, index=prices.index), trades


class MeanReversion(Strategy):
    def __init__(self):
        super().__init__("Mean Reversion", "Buy RSI<30 oversold names, sell at RSI>70")

    def run(self, prices, capital):
        cash = capital
        holdings = {}
        equity_curve = []
        trades = []
        for i, (idx, row) in enumerate(prices.iterrows()):
            if i < 14:
                equity_curve.append(cash)
                continue
            date_str = idx
            for t in UNIVERSE:
                tkr = t["ticker"]
                px_now = float(row[tkr])
                r = rsi(prices[tkr]).iloc[i]
                if math.isnan(r):
                    continue
                if r < 30 and tkr not in holdings and cash > 5000:
                    shares = min(50000 / px_now, cash / px_now / 2)
                    cost = shares * px_now
                    if cost > 1000:
                        cash -= cost
                        holdings[tkr] = holdings.get(tkr, 0) + shares
                        trades.append({"date": date_str, "ticker": tkr, "side": "BUY",
                                       "shares": round(shares, 2), "price": round(px_now, 2),
                                       "value": round(cost, 2)})
                elif r > 70 and tkr in holdings:
                    shares = holdings[tkr]
                    val = shares * px_now
                    cash += val
                    trades.append({"date": date_str, "ticker": tkr, "side": "SELL",
                                   "shares": round(shares, 2), "price": round(px_now, 2),
                                   "value": round(val, 2)})
                    del holdings[tkr]
            mkt_val = sum(holdings[t] * float(row[t]) for t in holdings)
            equity_curve.append(cash + mkt_val)
        return pd.Series(equity_curve, index=prices.index), trades


class MovingAverageCrossover(Strategy):
    def __init__(self):
        super().__init__("MA Crossover", "50/200-day golden cross on the S&P 500")

    def run(self, prices, capital):
        px = prices["SPY"]
        fast = sma(px, 10)
        slow = sma(px, 50)
        cash = capital
        shares = 0.0
        equity_curve = []
        trades = []
        for i, (idx, row) in enumerate(prices.iterrows()):
            date_str = idx
            if i >= 50:
                if fast.iloc[i] > slow.iloc[i] and shares == 0:
                    shares = cash / float(row["SPY"])
                    cost = cash
                    cash = 0.0
                    trades.append({"date": date_str, "ticker": "SPY", "side": "BUY",
                                   "shares": round(shares, 2), "price": round(float(row["SPY"]), 2),
                                   "value": round(cost, 2)})
                elif fast.iloc[i] < slow.iloc[i] and shares > 0:
                    val = shares * float(row["SPY"])
                    cash += val
                    trades.append({"date": date_str, "ticker": "SPY", "side": "SELL",
                                   "shares": round(shares, 2), "price": round(float(row["SPY"]), 2),
                                   "value": round(val, 2)})
                    shares = 0.0
            equity_curve.append(cash + shares * float(row["SPY"]))
        return pd.Series(equity_curve, index=prices.index), trades


class DollarCostAveraging(Strategy):
    def __init__(self):
        super().__init__("Dollar-Cost Averaging", "Invest a fixed amount every week into a tech basket")

    def run(self, prices, capital):
        basket = ["MSFT", "NVDA", "AAPL"]
        weekly = capital / 26  # ~26 weeks
        cash = capital
        holdings = {}
        equity_curve = []
        trades = []
        last_week = -1
        for i, (idx, row) in enumerate(prices.iterrows()):
            date_str = idx
            week = i // 5
            if week != last_week:
                per = weekly / len(basket)
                for t in basket:
                    px_now = float(row[t])
                    shares = per / px_now
                    holdings[t] = holdings.get(t, 0) + shares
                    cash -= per
                    trades.append({"date": date_str, "ticker": t, "side": "BUY",
                                   "shares": round(shares, 3), "price": round(px_now, 2),
                                   "value": round(per, 2)})
                last_week = week
            mkt_val = sum(holdings[t] * float(row[t]) for t in holdings)
            equity_curve.append(cash + mkt_val)
        return pd.Series(equity_curve, index=prices.index), trades


class PairsTrading(Strategy):
    def __init__(self):
        super().__init__("Pairs Trading", "Market-neutral spread: long MSFT vs short AAPL")

    def run(self, prices, capital):
        a = prices["MSFT"]
        b = prices["AAPL"]
        ratio = a / b
        mean = ratio.rolling(20).mean()
        std = ratio.rolling(20).std()
        cash = capital
        pos_a = 0.0
        pos_b = 0.0
        equity_curve = []
        trades = []
        for i, (idx, row) in enumerate(prices.iterrows()):
            date_str = idx
            if i >= 20:
                z = (ratio.iloc[i] - mean.iloc[i]) / (std.iloc[i] + 1e-9)
                if z < -1.5 and pos_a == 0:
                    # ratio low -> long MSFT, short AAPL
                    alloc = capital * 0.5
                    pos_a = alloc / float(row["MSFT"])
                    pos_b = -alloc / float(row["AAPL"])
                    trades.append({"date": date_str, "ticker": "MSFT", "side": "BUY",
                                   "shares": round(pos_a, 2), "price": round(float(row["MSFT"]), 2),
                                   "value": round(alloc, 2)})
                    trades.append({"date": date_str, "ticker": "AAPL", "side": "SHORT",
                                   "shares": round(pos_b, 2), "price": round(float(row["AAPL"]), 2),
                                   "value": round(alloc, 2)})
                elif z > 1.5 and pos_a != 0:
                    trades.append({"date": date_str, "ticker": "MSFT", "side": "SELL",
                                   "shares": round(pos_a, 2), "price": round(float(row["MSFT"]), 2),
                                   "value": round(pos_a * float(row["MSFT"]), 2)})
                    trades.append({"date": date_str, "ticker": "AAPL", "side": "COVER",
                                   "shares": round(-pos_b, 2), "price": round(float(row["AAPL"]), 2),
                                   "value": round(-pos_b * float(row["AAPL"]), 2)})
                    pos_a = 0.0
                    pos_b = 0.0
            pnl = pos_a * float(row["MSFT"]) + pos_b * float(row["AAPL"])
            equity_curve.append(cash + pnl)
        return pd.Series(equity_curve, index=prices.index), trades


# ---------------------------------------------------------------- metrics ---
def metrics(equity):
    ret = equity / equity.iloc[0] - 1
    daily = equity.pct_change().dropna()
    sharpe = 0.0
    if daily.std() > 1e-12:
        sharpe = float(daily.mean() / daily.std() * math.sqrt(252))
    running_max = equity.cummax()
    drawdown = equity / running_max - 1
    max_dd = float(drawdown.min())
    return {
        "return_pct": round(float(ret.iloc[-1]) * 100, 2),
        "pnl": round(float(equity.iloc[-1] - equity.iloc[0]), 2),
        "sharpe": round(sharpe, 2),
        "max_drawdown_pct": round(max_dd * 100, 2),
        "final_equity": round(float(equity.iloc[-1]), 2),
    }


# ------------------------------------------------------------- site bundle ---
def sha256(path):
    """SHA-256 of a file, so the documentary can show that the logs it
    displays really do correspond to the committed data."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def write_site_bundle(root_dir, summary, equity_payload, all_trades, prices_payload):
    """Write `data.js` — the bundled JS data source every page loads with
    <script src="data.js">. Bundling keeps the site working straight from the
    file system (no fetch/JSON round-trip, no CORS surprises).

    Globals exposed: STRATEGIES, EQUITY, TRADES, PRICES (see common.js).
    """
    path = os.path.join(root_dir, "data.js")
    with open(path, "w", encoding="utf-8-sig") as f:
        f.write("// Auto-generated from simulate.py output. Do not edit by hand.\n")
        f.write("const STRATEGIES = " + json.dumps(summary, indent=2) + ";\n")
        f.write("const EQUITY = " + json.dumps(equity_payload) + ";\n")
        f.write("const TRADES = " + json.dumps(all_trades) + ";\n")
        f.write("const PRICES = " + json.dumps(prices_payload) + ";\n\n")
    return path


# ------------------------------------------------------------------- main ---
def main():
    rng = np.random.default_rng(SEED)
    prices = simulate_prices([s["ticker"] for s in UNIVERSE], rng)
    root_dir = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(root_dir, "data")
    os.makedirs(out_dir, exist_ok=True)

    strategies = [
        BuyAndHold(),
        Momentum(),
        MeanReversion(),
        MovingAverageCrossover(),
        DollarCostAveraging(),
        PairsTrading(),
    ]

    results = []
    equity_frames = {}
    all_trades = []

    for strat in strategies:
        eq, trades = strat.run(prices, INITIAL_CAPITAL)
        m = metrics(eq)
        results.append({
            "name": strat.name,
            "tagline": strat.tagline,
            **m,
            "num_trades": len(trades),
        })
        equity_frames[strat.name] = [round(float(x), 2) for x in eq]
        for tr in trades:
            all_trades.append({"strategy": strat.name, **tr})

    # Build daily stock price dump (downsampled to ~every 2 days for size)
    price_rows = []
    for i, (idx, row) in enumerate(prices.iterrows()):
        if i % 2 == 0:
            d = idx.isoformat() if hasattr(idx, "isoformat") else str(idx)
            price_rows.append({"date": d, **{t: round(float(row[t]), 2) for t in prices.columns}})

    prices_payload = {"universe": UNIVERSE, "prices": price_rows}

    dates = [d.isoformat() if hasattr(d, "isoformat") else str(d) for d in prices.index]
    equity_payload = {
        "dates": dates,
        "strategies": equity_frames,
    }
    # Convert pandas Timestamps in trades to plain ISO strings
    for tr in all_trades:
        tr["date"] = tr["date"].isoformat() if hasattr(tr["date"], "isoformat") else str(tr["date"])

    # Aggregate P&L attribution per strategy from trades (realized + unrealized)
    summary = {
        "period": {"start": START.isoformat(), "end": END.isoformat()},
        "initial_capital": INITIAL_CAPITAL,
        "generated": date.today().isoformat(),
        "strategies": sorted(results, key=lambda r: -r["pnl"]),
    }

    with open(os.path.join(out_dir, "strategies.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    with open(os.path.join(out_dir, "equity.json"), "w", encoding="utf-8") as f:
        json.dump(equity_payload, f)
    with open(os.path.join(out_dir, "trades.json"), "w", encoding="utf-8") as f:
        json.dump(all_trades, f)
    with open(os.path.join(out_dir, "prices.json"), "w", encoding="utf-8") as f:
        json.dump(prices_payload, f)

    # The trade log as CSV: easy to open in a spreadsheet and quoted in the
    # documentary's "logs" chapter.
    csv_path = os.path.join(out_dir, "trades.csv")
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["strategy", "date", "ticker", "side", "shares", "price", "value"])
        for tr in all_trades:
            writer.writerow([tr["strategy"], tr["date"], tr["ticker"], tr["side"],
                             tr["shares"], tr["price"], tr["value"]])

    bundle_path = write_site_bundle(root_dir, summary, equity_payload, all_trades, prices_payload)

    # ------------------------------------------------------------- run log ----
    # The report printed below is also written to data/run.log, so the site can
    # show the simulation's own log rather than a screenshot of it.
    report = []

    def say(line=""):
        report.append(line)
        print(line)

    outputs = [
        ("data/strategies.json", os.path.join(out_dir, "strategies.json")),
        ("data/equity.json", os.path.join(out_dir, "equity.json")),
        ("data/trades.json", os.path.join(out_dir, "trades.json")),
        ("data/prices.json", os.path.join(out_dir, "prices.json")),
        ("data/trades.csv", csv_path),
        ("data.js", bundle_path),
    ]

    say("=== stocks4cas simulation complete ===")
    say(f"period     : {START} -> {END}  ({len(dates)} trading days)")
    say(f"seed       : {SEED} (numpy default_rng) — re-running reproduces these numbers")
    say(f"capital    : {INITIAL_CAPITAL:,.0f} per strategy")
    say(f"universe   : {len(UNIVERSE)} tickers — {', '.join(s['ticker'] for s in UNIVERSE)}")
    say(f"generated  : {summary['generated']}")
    say("")
    say("strategy summary (sorted by net P&L)")
    say(f"{'strategy':24} {'pnl':>12} {'ret%':>8} {'sharpe':>7} {'maxDD%':>8} {'trades':>6}")
    for r in sorted(results, key=lambda r: -r["pnl"]):
        say(f"{r['name']:24} {r['pnl']:>12,.2f} {r['return_pct']:>8.2f} "
            f"{r['sharpe']:>7.2f} {r['max_drawdown_pct']:>8.2f} {r['num_trades']:>6}")
    say("")
    say("trade log per strategy")
    for r in sorted(results, key=lambda r: -r["pnl"]):
        rows = [t for t in all_trades if t["strategy"] == r["name"]]
        if not rows:
            say(f"  {r['name']:24}    0 trades")
            continue
        sides = {}
        for t in rows:
            sides[t["side"]] = sides.get(t["side"], 0) + 1
        side_txt = ", ".join(f"{k} {v}" for k, v in sorted(sides.items()))
        say(f"  {r['name']:24} {len(rows):>4} trades  {rows[0]['date'][:10]} -> "
            f"{rows[-1]['date'][:10]}  [{side_txt}]")
    say("")
    say(f"total trades: {len(all_trades)}")
    say("")
    say("outputs (sha256)")
    for label, path in outputs:
        say(f"  {sha256(path)}  {label:22} {os.path.getsize(path):>9,} bytes")
    say("")
    say(f"wrote JSON   -> {out_dir}")
    say(f"wrote bundle -> {bundle_path}")
    log_path = os.path.join(out_dir, "run.log")
    say(f"wrote log    -> {log_path}")

    with open(log_path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(report) + "\n")


if __name__ == "__main__":
    main()
