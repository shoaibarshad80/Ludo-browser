// Generates favicon + touch icons from the in-app LudoBadge vector design.
// Outputs:
//   /tmp/icon-16.png /tmp/icon-32.png /tmp/icon-48.png  (transparent, for favicon.ico)
//   src/app/apple-icon.png                              (180x180, opaque gradient bg)
// Then scripts/make_favicon_ico.py packs the 3 PNGs into src/app/favicon.ico.
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'

// LudoBadge replica (src/components/ludo/icons.tsx), camelCase attrs converted.
const defs = `
  <linearGradient id="lb-rim" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5a6178"/><stop offset="0.5" stop-color="#333950"/><stop offset="1" stop-color="#181c2c"/>
  </linearGradient>
  <radialGradient id="lb-red" cx="0.32" cy="0.28" r="1">
    <stop offset="0" stop-color="#ff7d6e"/><stop offset="0.55" stop-color="#e5453c"/><stop offset="1" stop-color="#a82820"/>
  </radialGradient>
  <radialGradient id="lb-green" cx="0.32" cy="0.28" r="1">
    <stop offset="0" stop-color="#8fd691"/><stop offset="0.55" stop-color="#46a848"/><stop offset="1" stop-color="#2f7c33"/>
  </radialGradient>
  <radialGradient id="lb-yellow" cx="0.32" cy="0.28" r="1">
    <stop offset="0" stop-color="#ffe08a"/><stop offset="0.55" stop-color="#f7c331"/><stop offset="1" stop-color="#c48f16"/>
  </radialGradient>
  <radialGradient id="lb-blue" cx="0.32" cy="0.28" r="1">
    <stop offset="0" stop-color="#8ec7f5"/><stop offset="0.55" stop-color="#2a8ee0"/><stop offset="1" stop-color="#1d5c9e"/>
  </radialGradient>
  <radialGradient id="lb-plate" cx="0.5" cy="0.4" r="0.8">
    <stop offset="0" stop-color="#fbf8f2"/><stop offset="0.75" stop-color="#f4f1ea"/><stop offset="1" stop-color="#e4dfd0"/>
  </radialGradient>
  <radialGradient id="lb-vign" cx="0.5" cy="0.42" r="0.78">
    <stop offset="0.55" stop-color="rgba(31,41,66,0)"/><stop offset="1" stop-color="rgba(31,41,66,0.14)"/>
  </radialGradient>
  <linearGradient id="lb-gloss" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="rgba(255,255,255,0.20)"/><stop offset="1" stop-color="rgba(255,255,255,0.02)"/>
  </linearGradient>
  <radialGradient id="lb-home" cx="0.5" cy="0.36" r="0.9">
    <stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#f6f3ea"/><stop offset="1" stop-color="#e2dccb"/>
  </radialGradient>
  <radialGradient id="lb-star" cx="0.35" cy="0.3" r="1">
    <stop offset="0" stop-color="#ff9d8e"/><stop offset="0.5" stop-color="#e5453c"/><stop offset="1" stop-color="#a82820"/>
  </radialGradient>
`

const homeCircles = (fill, stroke, opacity) => {
  const pts = []
  for (const [qx, qy] of [[18, 18], [70.4, 18], [18, 70.4], [70.4, 70.4]])
    for (const [dx, dy] of [[10.2, 0], [21.4, 0], [0, 10.2], [0, 21.4]])
      pts.push(`<circle cx="${qx + dx}" cy="${qy + dy}" r="4.6"${fill ? ` fill="${fill}"` : ' fill="none"'}${stroke ? ` stroke="${stroke}"` : ''}/>`)
  return `<g${opacity ? ` opacity="${opacity}"` : ''}>${pts.join('')}</g>`
}

const body = `
  <rect x="4" y="4" width="112" height="112" rx="28" fill="url(#lb-rim)"/>
  <rect x="5" y="5" width="110" height="110" rx="27" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.8"/>
  <rect x="12" y="12" width="96" height="96" rx="21" fill="url(#lb-plate)"/>
  <rect x="12" y="12" width="96" height="96" rx="21" fill="url(#lb-vign)"/>
  <rect x="12.6" y="12.6" width="94.8" height="94.8" rx="20.4" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="1.4"/>
  <path d="M18 33a15 15 0 0 1 15-15h15v44H18z" fill="url(#lb-red)"/>
  <path d="M57 18h15a15 15 0 0 1 15 15v29H57z" fill="url(#lb-green)"/>
  <path d="M18 57h30v44H33a15 15 0 0 1-15-15z" fill="url(#lb-yellow)"/>
  <path d="M57 57h30v29a15 15 0 0 1-15 15H57z" fill="url(#lb-blue)"/>
  ${homeCircles('#ffffff', null, 0.9)}
  <g fill="none" stroke-width="1.1" opacity="0.75">
    <g stroke="#c23b33">${[[28.2,28.2],[39.4,28.2],[28.2,39.4],[39.4,39.4]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4.6"/>`).join('')}</g>
    <g stroke="#3d9440">${[[80.6,28.2],[91.8,28.2],[80.6,39.4],[91.8,39.4]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4.6"/>`).join('')}</g>
    <g stroke="#c9a016">${[[28.2,80.6],[39.4,80.6],[28.2,91.8],[39.4,91.8]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4.6"/>`).join('')}</g>
    <g stroke="#2774b8">${[[80.6,80.6],[91.8,80.6],[80.6,91.8],[91.8,91.8]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4.6"/>`).join('')}</g>
  </g>
  <path d="M18 58h30v6H18zM72 58h30v6H72zM57 19h6v30h-6zM57 73h6v30h-6z" fill="rgba(31,41,66,0.16)"/>
  <path d="M18 57h30v6H18zM72 57h30v6H72zM57 18h6v30h-6zM57 72h6v30h-6z" fill="#f7f4ed"/>
  <g fill="rgba(31,41,66,0.14)">
    <rect x="29" y="57.8" width="5.4" height="5.4" rx="1.5"/><rect x="41.5" y="57.8" width="5.4" height="5.4" rx="1.5"/>
    <rect x="84.5" y="57.8" width="5.4" height="5.4" rx="1.5"/><rect x="97" y="57.8" width="5" height="5.4" rx="1.5"/>
    <rect x="56.8" y="29" width="5.4" height="5.4" rx="1.5"/><rect x="56.8" y="41.5" width="5.4" height="5.4" rx="1.5"/>
    <rect x="56.8" y="84.5" width="5.4" height="5.4" rx="1.5"/><rect x="56.8" y="97" width="5.4" height="5" rx="1.5"/>
  </g>
  <circle cx="60" cy="60" r="14.5" fill="url(#lb-home)" stroke="rgba(0,0,0,0.16)" stroke-width="1.2"/>
  <circle cx="60" cy="60" r="10.4" fill="none" stroke="#ddd6c4" stroke-width="1.4"/>
  <path d="M60 49.6l3.2 6.4 7 .9-5.1 4.9 1.3 6.9-6.4-3.4-6.4 3.4 1.3-6.9-5.1-4.9 7-.9z" fill="url(#lb-star)" stroke="#9c231c" stroke-width="1.1" stroke-linejoin="round"/>
  <ellipse cx="57.4" cy="54.4" rx="1.9" ry="1.3" fill="rgba(255,255,255,0.85)" transform="rotate(-24 57.4 54.4)"/>
  <rect x="12" y="12" width="96" height="34" rx="17" fill="url(#lb-gloss)"/>
  <path d="M93.4 23.2l1.5 3.2 3.2 1.5-3.2 1.5-1.5 3.2-1.5-3.2-3.2-1.5 3.2-1.5z" fill="rgba(255,255,255,0.7)"/>
`

// badge-only svg (transparent bg, 8% padding around the 120x120 artwork)
const badgeSvg = (size) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-9.6 -9.6 139.2 139.2" width="${size}" height="${size}"><defs>${defs}</defs>${body}</svg>`

for (const s of [16, 32, 48]) {
  await sharp(Buffer.from(badgeSvg(s * 8))).resize(s, s).png().toFile(`/tmp/icon-${s}.png`)
  console.log(`icon-${s}.png written`)
}

// apple-touch-icon: opaque rich-purple gradient bg + centered badge (iOS dislikes alpha)
const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="#a2399f"/><stop offset="0.55" stop-color="#7c2fd4"/><stop offset="1" stop-color="#4b1280"/>
  </linearGradient></defs>
  <rect width="180" height="180" fill="url(#bg)"/>
  <circle cx="90" cy="92" r="86" fill="rgba(255,255,255,0.06)"/>
</svg>`
const badge180 = await sharp(Buffer.from(badgeSvg(148))).png().toBuffer()
await sharp(Buffer.from(bgSvg))
  .composite([{ input: badge180, top: 16, left: 16 }])
  .png()
  .toFile('src/app/apple-icon.png')
console.log('apple-icon.png written')

// also expose a full-size brand png in public/ for og/pwa fallbacks
await sharp(Buffer.from(badgeSvg(512))).png().toFile('public/icon-512.png')
console.log('public/icon-512.png written')
console.log('DONE')
