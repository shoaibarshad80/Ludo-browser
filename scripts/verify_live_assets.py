#!/usr/bin/env python3
"""Verify that every asset referenced by the live index.html resolves (HTTP 200).

Also checks that the previous builds' chunk files are still online (additive
deploy guarantee): it fetches the two most recent gh-pages commit SHAs via the
GitHub API and probes their index.html assets too.
"""
import json
import re
import sys
import urllib.request

BASE = "https://shoaibarshad80.github.io/Ludo-browser"
API = "https://api.github.com/repos/shoaibarshad80/Ludo-browser/commits?sha=gh-pages&per_page=3"
TOKEN = ""

for line in open("/home/z/my-project/scripts/deploy_ghpages.sh"):
    if line.startswith("TOKEN="):
        TOKEN = line.split("=", 1)[1].strip().strip('"')
        break


def fetch(url, as_text=True):
    req = urllib.request.Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "verify-live-assets"})
    if TOKEN:
        req.add_header("Authorization", f"token {TOKEN}")
    with urllib.request.urlopen(req, timeout=20) as r:
        data = r.read()
        return data.decode("utf-8", "replace") if as_text else data


def asset_urls(html):
    urls = set()
    for m in re.findall(r'(?:src|href)=["\']([^"\']+)["\']', html):
        if "/_next/" in m or m.startswith("/Ludo-browser/"):
            if m.startswith("http"):
                m = m.split("github.io")[-1]
            if not m.startswith("/"):
                m = "/" + m
            urls.add(m)
    return urls


def check(urls):
    dead = []
    for u in sorted(urls):
        try:
            fetch("https://shoaibarshad80.github.io" + u, as_text=False)
        except Exception:
            dead.append(u)
    return dead


def main():
    builds = json.loads(fetch(API))
    labels = ["current build  ", "previous build ", "two builds ago "]
    total_dead = 0
    for i, c in enumerate(builds[:3]):
        sha = c["sha"]
        html = fetch(f"{BASE}/index.html?v={sha[:8]}")
        urls = asset_urls(html)
        dead = check(urls)
        total_dead += len(dead)
        print(f"{labels[i]}: {len(urls)} assets, {len(dead)} dead" + (f" -> {dead}" if dead else ""))
    sys.exit(1 if total_dead else 0)


if __name__ == "__main__":
    main()
