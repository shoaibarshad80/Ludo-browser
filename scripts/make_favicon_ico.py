#!/usr/bin/env python3
"""Pack /tmp/icon-{16,32,48}.png into src/app/favicon.ico (PNG-in-ICO container,
valid for all modern browsers, Vista+)."""
import struct, sys
from pathlib import Path

SIZES = [16, 32, 48]
OUT = Path("src/app/favicon.ico")

blobs = []
for s in SIZES:
    p = Path(f"/tmp/icon-{s}.png")
    data = p.read_bytes()
    blobs.append((s, data))

header = struct.pack("<HHH", 0, 1, len(blobs))
offset = 6 + 16 * len(blobs)
entries = b""
payload = b""
for s, data in blobs:
    entries += struct.pack("<BBBBHHII", s % 256, s % 256, 0, 0, 1, 32, len(data), offset)
    payload += data
    offset += len(data)

OUT.write_bytes(header + entries + payload)
print(f"wrote {OUT} ({OUT.stat().st_size} bytes, {len(blobs)} sizes)")
