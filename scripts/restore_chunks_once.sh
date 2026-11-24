#!/usr/bin/env bash
# ONE-OFF: repair the white-screen regression for cached clients.
# The old deploy wiped _next on gh-pages, so phones that cached index.html
# request chunk hashes that 404 -> ChunkLoadError -> white screen.
# This restores _next/static from the last two gh-pages commits (union of
# old hashed chunks), overlays the CURRENT out/ build on top, and pushes.
set -e
cd /home/z/my-project
TOKEN=$(grep -oP '^TOKEN=\K\S+' scripts/deploy_ghpages.sh | head -1)
REPO="github.com/shoaibarshad80/Ludo-browser.git"

rm -rf /tmp/ghpages
git init -q /tmp/ghpages
cd /tmp/ghpages
git remote add origin "https://x-access-token:${TOKEN}@${REPO}"
git fetch -q origin gh-pages
git checkout -qf -b gh-pages FETCH_HEAD
echo "restoring old chunks from gh-pages~1 and gh-pages~2 ..."
git checkout gh-pages~1 -- _next
git checkout gh-pages~2 -- _next
cp -r /home/z/my-project/out/* .
touch .nojekyll
git add -A
git commit -qm "deploy: restore wiped chunks + additive policy — fix white screen for cached HTML"
git push -qf origin gh-pages
echo "gh-pages restored + pushed"
