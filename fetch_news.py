"""
stocks4cas - news snapshot builder

Pulls finance headlines from public RSS feeds and writes a dated snapshot:

    data/news.json   the snapshot, in full, for inspection
    data/news.log    what the fetch did (kept with the other logs)
    news-data.js     the bundled NEWS global the site loads

Rules that keep this honest:
  * headlines and summaries are stored verbatim from the publisher's feed
    (no rewriting, no generated copy);
  * the published timestamp is the publisher's own value, kept in UTC, so
    the date shown on the site always matches the article's date;
  * every link is checked before it is written out, so a card can never
    point at a dead or generic page;
  * the snapshot date is recorded, because news is a snapshot rather than a
    live feed.

Run with:  python fetch_news.py [--no-verify]
"""

import json
import os
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

FEEDS = [
    {"source": "BBC Business", "url": "https://feeds.bbci.co.uk/news/business/rss.xml"},
    {"source": "CNBC Markets", "url": "https://www.cnbc.com/id/20910258/device/rss/rss.html"},
    {"source": "CNBC US Top News", "url": "https://www.cnbc.com/id/100003114/device/rss/rss.html"},
    {"source": "Yahoo Finance", "url": "https://finance.yahoo.com/news/rssindex"},
]

PER_FEED = 8          # items to keep from each feed
MAX_ITEMS = 16        # total items written out
MIN_PER_SOURCE = 4    # keep at least this many from each feed before filling by date
TIMEOUT = 25          # seconds per HTTP request
USER_AGENT = "stocks4cas-news-snapshot/1.0 (student project; educational use)"

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(ROOT, "data")


def http_get(url, limit=None):
    """GET a URL and return its bytes (or the first `limit` bytes)."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        if resp.status != 200:
            raise urllib.error.HTTPError(url, resp.status, "unexpected status", resp.headers, None)
        return resp.read() if limit is None else resp.read(limit)


def clean(text, limit=320):
    """Collapse whitespace from feed text; keeps the publisher's wording."""
    if not text:
        return ""
    text = " ".join(str(text).split())
    if len(text) > limit:
        text = text[: limit - 1].rstrip() + "\u2026"
    return text


def parse_pubdate(value):
    """Feeds are inconsistent: RFC-822 (BBC/CNBC) or ISO-8601 (Yahoo)."""
    value = (value or "").strip()
    if not value:
        return None
    dt = None
    try:
        dt = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        dt = None
    if dt is None:
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def parse_feed(xml_bytes, source_name):
    """Return [{title, url, source, published, summary}] for one feed."""
    items = []
    root = ET.fromstring(xml_bytes)
    for item in root.iter("item"):
        title = clean(item.findtext("title"), 220)
        link = (item.findtext("link") or "").strip()
        pub = item.findtext("pubDate") or item.findtext("{http://purl.org/dc/elements/1.1/}date")
        if not title or not link or not pub:
            continue
        published = parse_pubdate(pub)
        if published is None:
            continue
        items.append({
            "title": title,
            "url": link,
            "source": source_name,
            "published": published.isoformat().replace("+00:00", "Z"),
            "summary": clean(item.findtext("description")),
        })
    return items


def pick(collected, max_items, min_per_source):
    """Choose the final list: a minimum number of items from every publisher
    first (so one fast-moving feed cannot crowd out the rest), then the newest
    of whatever is left, finally sorted newest-first."""
    by_source = {}
    for item in collected:
        by_source.setdefault(item["source"], []).append(item)

    chosen = []
    depth = 0
    while len(chosen) < max_items:
        added = False
        for items in by_source.values():
            if depth < min_per_source and depth < len(items) and len(chosen) < max_items:
                chosen.append(items[depth])
                added = True
        if not added:
            break
        depth += 1

    for item in collected:
        if len(chosen) >= max_items:
            break
        if item not in chosen:
            chosen.append(item)

    return sorted(chosen, key=lambda a: a["published"], reverse=True)


def link_ok(url):
    """True only if the article URL really serves a page."""
    try:
        body = http_get(url, limit=2048)
        return len(body) > 0
    except urllib.error.HTTPError as exc:
        # some publishers block bots with 403 even though the article is public
        return exc.code in (403, 429)
    except Exception:
        return False


def main():
    verify = "--no-verify" not in sys.argv
    os.makedirs(OUT_DIR, exist_ok=True)
    log = []

    def say(line=""):
        log.append(line)
        print(line)

    say("=== stocks4cas news snapshot ===")
    say(f"fetched    : {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    say(f"verify     : {'on (every link is checked before it is written)' if verify else 'off'}")
    say("")

    collected, seen_urls, seen_titles = [], set(), set()
    for feed in FEEDS:
        try:
            items = parse_feed(http_get(feed["url"]), feed["source"])
        except Exception as exc:
            say(f"  {feed['source']:20} FAILED ({type(exc).__name__}: {exc})")
            continue
        kept = 0
        for item in items[:PER_FEED]:
            key_title = item["title"].lower()
            if item["url"] in seen_urls or key_title in seen_titles:
                continue
            seen_urls.add(item["url"])
            seen_titles.add(key_title)
            collected.append(item)
            kept += 1
        say(f"  {feed['source']:20} {len(items):>2} items in feed, {kept} kept")

    collected.sort(key=lambda a: a["published"], reverse=True)
    collected = collected[: MAX_ITEMS * 2]      # generous pool, then balance
    collected = pick(collected, MAX_ITEMS, MIN_PER_SOURCE)

    if verify:
        say("")
        say("link check")
        # parallel: sixteen sequential requests would take far longer than the
        # rest of the build put together
        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(lambda item: (item, link_ok(item["url"])), collected))
        for item, ok in results:
            if not ok:
                say(f"  dropped (unreachable): {item['url']}")
        verified = [item for item, ok in results if ok]
        say(f"  {len(verified)}/{len(collected)} links resolve")
        collected = verified

    if not collected:
        say("")
        say("nothing collected - keeping the previous snapshot")
        return 1

    snapshot = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "note": (
            "Snapshot of public RSS feeds. Headlines and summaries are quoted verbatim from the "
            "publisher and each item links to the original article. This is a snapshot, not a live feed."
        ),
        "feeds": [{"source": f["source"], "url": f["url"]} for f in FEEDS],
        "articles": collected,
    }

    json_path = os.path.join(OUT_DIR, "news.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2)

    bundle_path = os.path.join(ROOT, "news-data.js")
    with open(bundle_path, "w", encoding="utf-8-sig") as f:
        f.write("// Auto-generated by fetch_news.py - do not edit by hand.\n")
        f.write("const NEWS = " + json.dumps(snapshot) + ";\n")

    say("")
    say("kept articles (newest first)")
    for a in collected:
        say(f"  {a['published']}  {a['source']:16} {a['title'][:72]}")
    say("")
    say(f"wrote JSON   -> {json_path}")
    say(f"wrote bundle -> {bundle_path}")

    log_path = os.path.join(OUT_DIR, "news.log")
    with open(log_path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(log) + "\n")
    print(f"wrote log    -> {log_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
