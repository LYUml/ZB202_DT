#!/bin/bash

# macOS double-click launcher for the ZB202 digital twin.
# Keep this terminal window open while the site is in use.

set -u

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEV_URL="http://127.0.0.1:5173/twin.html"
CAMPUS_URL="http://127.0.0.1:8080/twin.html"
NPM_CACHE_DIR="${TMPDIR:-/tmp}/zb202-npm-cache"

cd "$PROJECT_DIR" || exit 1

pause_on_error() {
  printf '\nPress Return to close this window...'
  read -r _
  exit 1
}

port_is_open() {
  nc -z 127.0.0.1 "$1" >/dev/null 2>&1
}

wait_for_port() {
  local port="$1"
  local label="$2"
  local attempt=0
  while [ "$attempt" -lt 30 ]; do
    if port_is_open "$port"; then
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 1
  done
  printf '\n%s did not become ready within 30 seconds.\n' "$label"
  return 1
}

start_influx_bridge() {
  printf 'Starting the InfluxDB bridge...\n'
  nohup env ZB202_INFLUX_BRIDGE_HOST="${ZB202_INFLUX_BRIDGE_HOST:-127.0.0.1}" \
    npm run influx:bridge </dev/null >"$PROJECT_DIR/.zb202-bridge.log" 2>&1 &
}

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  printf '\nNode.js and npm were not found.\n'
  printf 'Install Node.js 20.19 or newer, then double-click this file again.\n'
  pause_on_error
fi

if [ ! -d "$PROJECT_DIR/node_modules" ]; then
  printf 'Installing project dependencies for the first run...\n'
  if ! npm_config_cache="$NPM_CACHE_DIR" npm install; then
    printf '\nnpm install failed. Review the message above and try again.\n'
    pause_on_error
  fi
fi

printf '\n1. Local development mode (Vite :5173)\n'
printf '2. Campus network mode (HTTP :8080)\n\n'
read -r -p 'Choose a mode [1]: ' MODE
MODE="${MODE:-1}"

if [ "$MODE" = "2" ]; then
  if ! command -v python3 >/dev/null 2>&1; then
    printf '\nPython 3 was not found. Install Python, then try again.\n'
    pause_on_error
  fi

  printf '\nBuilding production files...\n'
  if ! npm run build; then
    printf '\nProduction build failed. Review the message above and try again.\n'
    pause_on_error
  fi

  if ! port_is_open 8787; then
    ZB202_INFLUX_BRIDGE_HOST=0.0.0.0 start_influx_bridge
  fi

  if port_is_open 8080; then
    printf 'Campus server is already running.\n'
    open "$CAMPUS_URL"
    exit 0
  fi

  printf 'Starting campus server...\n'
  python3 -m http.server 8080 --directory dist --bind 0.0.0.0 >"$PROJECT_DIR/.zb202-server.log" 2>&1 &
  SERVER_PID=$!
  if ! wait_for_port 8080 "Campus server"; then
    pause_on_error
  fi

  printf '\nZB202 is ready: %s\n' "$CAMPUS_URL"
  printf 'Other devices can use: http://YOUR-MAC-IP:8080/twin.html\n'
  open "$CAMPUS_URL"
  wait "$SERVER_PID"
  exit $?
fi

if ! port_is_open 8787; then
  printf '\n'
  start_influx_bridge
fi

if port_is_open 5173; then
  printf 'Development server is already running.\n'
  open "$DEV_URL"
  exit 0
fi

printf 'Starting the ZB202 development server...\n'
npm run dev -- --host 127.0.0.1 --strictPort >"$PROJECT_DIR/.zb202-server.log" 2>&1 &
SERVER_PID=$!

if ! wait_for_port 5173 "Development server"; then
  printf 'See %s for details.\n' "$PROJECT_DIR/.zb202-server.log"
  pause_on_error
fi

printf '\nZB202 is ready: %s\n' "$DEV_URL"
printf 'Keep this window open while using the site.\n'
open "$DEV_URL"
wait "$SERVER_PID"
