#!/bin/sh
set -eu
cd "$(dirname "$0")"
if [ ! -x .venv/bin/python ]; then
  echo "Maak eerst de omgeving: python3.14 -m venv .venv && .venv/bin/python -m pip install -r requirements.lock.txt"
  exit 1
fi
# Optional trusted configuration, kept outside version control.
if [ -f deployment.env ]; then
  set -a
  . ./deployment.env
  set +a
fi
: "${COOCK_ALLOWED_HOSTS:?Stel COOCK_ALLOWED_HOSTS in deployment.env in}"
: "${COOCK_ALLOWED_ORIGINS:?Stel COOCK_ALLOWED_ORIGINS in deployment.env in}"
exec .venv/bin/python -m uvicorn simulator.api:app --host "${COOCK_BIND_HOST:-0.0.0.0}" --port "${COOCK_PORT:-8766}"
