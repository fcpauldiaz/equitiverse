#!/bin/sh
set -e

if [ "${SKIP_DB_PUSH:-}" != "true" ]; then
  echo "Applying database schema..."
  ./node_modules/.bin/drizzle-kit push
fi

echo "Starting server..."
exec ./node_modules/.bin/srvx serve --prod \
  --host="${HOST:-0.0.0.0}" \
  --port="${PORT:-3000}" \
  --static=dist/client \
  --entry=dist/server/server.js
