#!/bin/sh
# Runs every game test. Usage: ./tests/run.sh
cd "$(dirname "$0")" && node play.js && node outfits.js && node powers.js
