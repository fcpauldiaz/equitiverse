#!/bin/sh
set -e

if [ "${SKIP_DB_PUSH:-}" != "true" ]; then
  echo "Applying database schema..."
  ./node_modules/.bin/drizzle-kit push
fi

echo "Starting server..."
exec node .output/server/index.mjs
