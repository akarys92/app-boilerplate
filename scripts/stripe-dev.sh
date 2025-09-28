#!/usr/bin/env bash
set -euo pipefail

MODE="test"
FORWARD_URL="http://localhost:3000/api/webhooks/stripe"
TRIGGERS=()

usage() {
  cat <<USAGE
Usage: $(basename "$0") [options]

Options:
  --forward-to <url>   Override the webhook forward URL (default: $FORWARD_URL)
  --live               Listen for live mode events instead of test data
  --trigger <event>    Trigger a specific Stripe event after the listener starts
  -h, --help           Show this help message

Examples:
  $0 --trigger checkout.session.completed
  $0 --live --forward-to https://example.com/api/webhooks/stripe
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --forward-to)
      shift
      FORWARD_URL="${1:-$FORWARD_URL}"
      ;;
    --live)
      MODE="live"
      ;;
    --trigger)
      shift
      TRIGGERS+=("$1")
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift || true
done

if ! command -v stripe >/dev/null 2>&1; then
  echo "❌ stripe CLI is required. Install it via https://stripe.com/docs/stripe-cli#install" >&2
  exit 1
fi

echo "➡️  Starting Stripe listener in $MODE mode..."
LISTEN_FLAGS=("listen")
[[ "$MODE" == "live" ]] && LISTEN_FLAGS+=("--live")
LISTEN_FLAGS+=("--forward-to" "$FORWARD_URL")

stripe "${LISTEN_FLAGS[@]}" &
LISTENER_PID=$!
trap 'kill $LISTENER_PID 2>/dev/null || true' EXIT

sleep 2

echo "➡️  Forwarding events to $FORWARD_URL"
if [[ ${#TRIGGERS[@]} -gt 0 ]]; then
  for EVENT in "${TRIGGERS[@]}"; do
    echo "   • Triggering $EVENT"
    stripe trigger "$EVENT"
  done
else
  echo "ℹ️  No triggers specified. Use --trigger to send sample events."
fi

wait $LISTENER_PID
