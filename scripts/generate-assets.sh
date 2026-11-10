#!/usr/bin/env sh
# Renders the PNG icons and the social preview image from the SVG sources in design/.
# Requires rsvg-convert (librsvg).
set -e
cd "$(dirname "$0")/.."
rsvg-convert -w 192 -h 192 design/icon.svg -o public/icons/icon-192.png
rsvg-convert -w 512 -h 512 design/icon.svg -o public/icons/icon-512.png
rsvg-convert -w 180 -h 180 design/icon.svg -o public/icons/apple-touch-icon.png
rsvg-convert -w 1200 -h 630 design/og-image.svg -o public/og-image.png
echo "Assets written to public/"
