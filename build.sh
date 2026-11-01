#!/bin/sh
# Wraps the artifact-style pages in full HTML documents for GitHub Pages (served from /docs).
#   index.html    -> docs/index.html     (version 1, keep as is)
#   v2/index.html -> docs/v2/index.html  (version 2)
cd "$(dirname "$0")"
wrap() {
  {
    printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    printf '<style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}img{max-width:100%%}</style>\n</head>\n<body>\n'
    cat "$1"
    printf '\n</body>\n</html>\n'
  } > "$2"
}
wrap index.html docs/index.html
wrap v2/index.html docs/v2/index.html
