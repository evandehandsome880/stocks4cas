"""
stocks4cas - one-command build

Runs the three generators in order:

    simulate.py    ->  market, six strategies and the simulation logs
                       (data/*.json, data/trades.csv, data/run.log, data.js)
    fetch_news.py  ->  dated RSS snapshot, news-data.js
    build_docs.py  ->  docs.js (the documentary's sources, logs and hashes)

The news step is treated as optional: if the network is unavailable the
previous snapshot is kept and the build continues.

Run with:  python build.py
"""

import os
import subprocess
import sys

STEPS = [
    ("simulate.py", False),
    ("fetch_news.py", True),
    ("build_docs.py", False),
]


def main():
    root = os.path.dirname(os.path.abspath(__file__))
    for script, optional in STEPS:
        print(f"\n=== {script} ===")
        code = subprocess.call([sys.executable, os.path.join(root, script)], cwd=root)
        if code != 0:
            if optional:
                print(f"({script} failed with code {code} - keeping the previous snapshot)")
            else:
                print(f"{script} failed with code {code} - stopping")
                return code
    print("\nbuild complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
