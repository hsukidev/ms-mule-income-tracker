#!/usr/bin/env bash
# Refreshes the Cloudflare IP ranges on the DO firewall's port 80/443 rules.
# Leaves SSH (port 22) and any other rules untouched.
set -euo pipefail

: "${DO_TOKEN:?DO_TOKEN env var required}"
: "${DO_FIREWALL_ID:?DO_FIREWALL_ID env var required}"

# Use Cloudflare's API endpoint (purpose-built for programmatic access).
# The public docs URLs (https://www.cloudflare.com/ips-v4/) sit behind
# Cloudflare's bot management and can return 403 to CI runners.
CF_RESPONSE=$(curl -fsSL https://api.cloudflare.com/client/v4/ips)

if [[ "$(echo "$CF_RESPONSE" | jq -r '.success')" != "true" ]]; then
  echo "Cloudflare IP API returned non-success response — aborting" >&2
  echo "$CF_RESPONSE" >&2
  exit 1
fi

CF_ALL=$(echo "$CF_RESPONSE" | jq '.result.ipv4_cidrs + .result.ipv6_cidrs')

# Sanity check: refuse to push if the combined list is empty.
if [[ "$(echo "$CF_ALL" | jq 'length')" -eq 0 ]]; then
  echo "Cloudflare IP list is empty — aborting" >&2
  exit 1
fi

CURRENT=$(curl -fsSL \
  -H "Authorization: Bearer $DO_TOKEN" \
  "https://api.digitalocean.com/v2/firewalls/$DO_FIREWALL_ID")

NEW=$(echo "$CURRENT" | jq --argjson cf "$CF_ALL" '
  .firewall
  | .inbound_rules |= map(
      if (.protocol == "tcp" and (.ports == "80" or .ports == "443"))
      then .sources.addresses = $cf
      else .
      end
    )
  | { name, inbound_rules, outbound_rules, droplet_ids, tags }
')

curl -fsSL -X PUT \
  -H "Authorization: Bearer $DO_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$NEW" \
  "https://api.digitalocean.com/v2/firewalls/$DO_FIREWALL_ID" \
  > /dev/null

echo "Firewall $DO_FIREWALL_ID updated with $(echo "$CF_ALL" | jq length) Cloudflare ranges"
