#!/bin/sh
set -eu

# Some source importers omit binary assets. Recover only missing files from the
# same licensed, pinned upstream revision, then verify every byte before build.
upstream=https://raw.githubusercontent.com/wanteddev/wanted-sans/02c9b822349c188ada95f9e2d90c2ed18f853235

ensure_font() {
    destination=$1
    source_path=$2
    checksum=$3
    if [ ! -s "$destination" ]; then
        mkdir -p "$(dirname "$destination")"
        curl --fail --location --retry 3 --connect-timeout 20 --max-time 120 \
            "$upstream/$source_path" --output "$destination"
    fi
    printf '%s  %s\n' "$checksum" "$destination" | sha256sum --check --status
}

ensure_font src/main/resources/pdf-fonts/WantedSans-Regular.ttf \
    packages/wanted-sans/fonts/ttf/WantedSans-Regular.ttf \
    849b51938f5779e7526fcf09b3c737e9d401261d111f626280af16423bf19f40
ensure_font src/main/resources/pdf-fonts/WantedSans-Bold.ttf \
    packages/wanted-sans/fonts/ttf/WantedSans-Bold.ttf \
    7d97a38d0c35b2e43ff2ae47040133faf0324d1c78800a16aaaa5d276376037c
ensure_font src/main/resources/static/fonts/WantedSansVariable.woff2 \
    packages/wanted-sans/fonts/webfonts/variable/complete/woff2/WantedSansVariable.woff2 \
    4259e7e9a172e634c2cb419d793b84148990316341e910443e5d10965b2c8f16
