#!/usr/bin/env python3
"""Cut generated 3D menu assets off their black backdrop.

Flood-fills the near-black background from the four corners, turns it
transparent, tight-crops to the object bbox, and saves ~360px PNGs into
public/3d/ (dark UI keeps the soft glow edges invisible).
"""
from collections import deque
from pathlib import Path

from PIL import Image

RAW = Path('/home/z/my-project/assets_raw')
OUT = Path('/home/z/my-project/public/3d')
OUT.mkdir(parents=True, exist_ok=True)

BG_MAX = 42          # luminance below which a pixel counts as backdrop
TARGET = 360         # output box size
SEEDS = ((0, 0), (1023, 0), (0, 1023), (1023, 1023), (512, 0), (512, 1023))


def cut(name: str) -> None:
    src = RAW / f'{name}.png'
    im = Image.open(src).convert('RGB')
    w, h = im.size
    px = im.load()

    def is_bg(x, y):
        r, g, b = px[x, y]
        return max(r, g, b) < BG_MAX

    mask = [[False] * w for _ in range(h)]  # visited/backdrop
    q = deque()
    for sx, sy in SEEDS:
        sx = min(sx, w - 1)
        sy = min(sy, h - 1)
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
    src_px = im.load()
    dst_px = out.load()
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        row = mask[y]
        for x in range(w):
            r, g, b = src_px[x, y]
            if row[x]:
                dst_px[x, y] = (0, 0, 0, 0)
            else:
                # soften the rim: pixels close to black right at the cut edge
                lum = max(r, g, b)
                a = 255 if lum > BG_MAX + 26 else int(255 * (lum - BG_MAX) / 26)
                dst_px[x, y] = (r, g, b, max(60, min(255, a)))
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y

    if max_x <= min_x or max_y <= min_y:
        print(f'EMPTY {name}')
        return
    pad = 6
    box = (max(0, min_x - pad), max(0, min_y - pad), min(w, max_x + 1 + pad), min(h, max_y + 1 + pad))
    out = out.crop(box)
    side = max(out.size)
    scale = TARGET / side
    out = out.resize((max(1, int(out.width * scale)), max(1, int(out.height * scale))), Image.LANCZOS)
    out.save(OUT / f'{name}.png', optimize=True)
    print(f'{name}: {out.size} {(OUT / f"{name}.png").stat().st_size // 1024}KB')


for n in ('coin', 'gem', 'chest', 'trophy', 'dice', 'pawn2', 'pawn4', 'robot', 'crown', 'gift'):
    cut(n)
