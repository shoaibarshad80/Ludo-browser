#!/usr/bin/env python3
"""Cut the generated ludo logo off its dark backdrop -> public/3d/logo.webp.

Same flood-fill approach as cut_menu_assets.py but tuned for the logo's
charcoal (not pure black) backdrop and saved straight to webp at hero size.
"""
from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path('/home/z/my-project/assets_raw/ludologo.png')
OUT = Path('/home/z/my-project/public/3d/logo.webp')
TARGET = 440  # hero pic, shown ~120px -> 440px is crisp on 3x screens

im = Image.open(SRC).convert('RGB')
w, h = im.size
px = im.load()

# sample corners to pick a safe backdrop threshold
corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1], px[w // 2, 0], px[w // 2, h - 1]]
print('corner samples:', corners)
BG_MAX = min(max(c) for c in corners) + 6
print('BG_MAX =', BG_MAX)


def is_bg(x, y):
    r, g, b = px[x, y]
    return max(r, g, b) < BG_MAX


mask = [[False] * w for _ in range(h)]
q = deque()
for sx, sy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1)):
    if is_bg(sx, sy) and not mask[sy][sx]:
        mask[sy][sx] = True
        q.append((sx, sy))
while q:
    x, y = q.popleft()
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        if 0 <= nx < w and 0 <= ny < h and not mask[ny][nx] and is_bg(nx, ny):
            mask[ny][nx] = True
            q.append((nx, ny))

out = Image.new('RGBA', (w, h))
dst = out.load()
min_x, min_y, max_x, max_y = w, h, 0, 0
SPAN = 30
for y in range(h):
    row = mask[y]
    for x in range(w):
        r, g, b = px[x, y]
        if row[x]:
            dst[x, y] = (0, 0, 0, 0)
        else:
            lum = max(r, g, b)
            a = 255 if lum > BG_MAX + SPAN else int(255 * (lum - BG_MAX) / SPAN)
            dst[x, y] = (r, g, b, max(40, min(255, a)))
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y

assert max_x > min_x and max_y > min_y, 'cut came out empty'
pad = 4
box = (max(0, min_x - pad), max(0, min_y - pad), min(w, max_x + 1 + pad), min(h, max_y + 1 + pad))
out = out.crop(box)
side = max(out.size)
scale = TARGET / side
out = out.resize((int(out.width * scale), int(out.height * scale)), Image.LANCZOS)
out.save(OUT, 'WEBP', quality=88, method=6)
print(f'logo: {out.size} {OUT.stat().st_size // 1024}KB -> {OUT}')
