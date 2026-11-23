#!/usr/bin/env python3
"""Verify every JS/CSS asset referenced by the last 3 deploys is live (200)."""
import re
import urllib.request

BASE = 'https://shoaibarshad80.github.io'


def check(path, label):
    html = open(path).read()
    urls = sorted(set(re.findall(r'(?:src|href)="(/Ludo-browser/[^"]+\.(?:js|css))"', html)))
    dead = 0
    for u in urls:
        try:
            r = urllib.request.urlopen(BASE + u, timeout=15)
            if r.status != 200:
                dead += 1
                print('  DEAD', r.status, u)
        except Exception:
            dead += 1
            print('  DEAD 404', u)
    print(f'{label}: {len(urls)} assets, {dead} dead')


check('/tmp/live.html', 'current build   ')
check('/tmp/prev_index.html', 'previous build  ')
check('/tmp/prev2.html', 'two builds ago  ')
