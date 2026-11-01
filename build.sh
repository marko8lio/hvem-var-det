#!/bin/sh
# Wraps the artifact-style pages in full HTML documents for GitHub Pages (served from /docs).
#   v2/index.html -> docs/index.html     (newest version, on the main link)
#   v1/index.html -> docs/v1/index.html  (version 1, keep as is)
#   docs/v2/      -> redirect to the main link, for old /v2/ links
cd "$(dirname "$0")"
wrap() {
  {
    printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    printf '<style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}img{max-width:100%%}</style>\n</head>\n<body>\n'
    cat "$1"
    printf '\n</body>\n</html>\n'
  } > "$2"
}
mkdir -p docs/v1 docs/v2
wrap v2/index.html docs/index.html
wrap v1/index.html docs/v1/index.html
cat > docs/v2/index.html <<'HTML'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Hvem Var Det?</title>
<meta http-equiv="refresh" content="0; url=../">
<link rel="canonical" href="../">
</head>
<body><a href="../">Hvem Var Det?</a></body>
</html>
HTML
