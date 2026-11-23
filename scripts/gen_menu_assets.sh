#!/usr/bin/env bash
# Generate premium 3D menu assets on pure black, for background removal.
set -e
cd /home/z/my-project
mkdir -p assets_raw public/3d

gen() {  # gen <file> <prompt>
  if [ -s "assets_raw/$1.png" ]; then echo "skip $1"; return; fi
  z-ai image -p "$2, isolated on pure solid black background, single object, centered, glossy, studio lighting, high quality, no text, no watermark" -o "assets_raw/$1.png" -s 1024x1024 && echo "OK $1" || echo "FAIL $1"
}

gen coin   "Single shiny 3D gold coin with a star emblem embossed, standing upright at a slight angle, vivid gold"
gen gem    "Single 3D diamond gemstone, vivid blue teal, faceted crystal, standing upright"
gen chest  "Small 3D wooden treasure chest with gold metal trim, lid slightly open, warm golden light glowing from inside"
gen trophy "Single 3D golden trophy cup with two handles on a dark marble base"
gen dice   "Pair of glossy white 3D game dice with dark pips, floating at a playful tilt"
gen pawn2  "Two glossy 3D board game pawns side by side, one royal red one royal blue, classic ludo pawn shape"
gen pawn4  "Four glossy 3D board game pawns standing in a row, red green blue and yellow, classic ludo pawn shape"
gen robot  "Cute friendly 3D robot mascot character with rounded body and small antenna, purple and silver, waving hello"
gen crown  "Single 3D golden royal crown with small gems, glossy, standing upright"
gen gift   "Single 3D purple gift box with golden ribbon bow, glossy"

ls -la assets_raw/
