#!/usr/bin/env bash
# Bootstrap glmps.fizx.uk on the fizx VPS.
#
# HISTORICAL — this ran once, as root, when root login was still on. It is
# kept as the record of how the site was set up. Root login is off now and
# sudo asks for a password, so it will not run as written: every step below
# needs root on the server and would have to be done there by hand with sudo.
#
# Run from the user's Mac — the sandbox can't reach the server.
# Idempotent: safe to re-run.
#
#   bash ~/code_gh/adjmx/glmps.fizx.uk/server-bootstrap-glmps.sh
#
# Validator choice: this script uses `certbot --nginx` (NOT `--webroot`).
# The existing pls.fizx.uk multi-SAN was originally issued via `--nginx`,
# so the existing vhosts don't serve /.well-known/acme-challenge/ from
# /var/www/html — webroot validation 404s. The `--nginx` plugin temporarily
# injects the ACME challenge location into matching vhosts at validation
# time, which works for every server_name nginx already knows about.
# That means we just need *some* :80 server block for glmps.fizx.uk to
# exist before certbot runs — even a 404 stub works.
#
# SAN list excludes nstr.fizx.uk (DNS is gone as of 2026-05-17 — was in the
# original SAN but never validates now; dropped to unblock renewals).

set -euo pipefail

HOST=fizx.uk   # an SSH host alias; the user, port and key live in ~/.ssh/config
SSH="ssh ${HOST}"
SCP="scp"

cd "$(dirname "$0")"

echo "==> 1/6: Ensure /var/www/glmps.fizx.uk webroot exists"
$SSH 'mkdir -p /var/www/glmps.fizx.uk && chown -R www-data:www-data /var/www/glmps.fizx.uk'

echo "==> 2/6: Ensure :80 stub vhost for glmps.fizx.uk exists (needed for --nginx to find a matching server block)"
$SSH 'cat > /etc/nginx/sites-available/glmps.fizx.uk.acme-bootstrap <<EOF
server {
  listen 80;
  server_name glmps.fizx.uk;
  location / { return 404; }
}
EOF
ln -sf /etc/nginx/sites-available/glmps.fizx.uk.acme-bootstrap /etc/nginx/sites-enabled/glmps.fizx.uk.acme-bootstrap
nginx -t && systemctl reload nginx'

echo "==> 3/6: Expand multi-SAN cert via certonly --nginx (drops nstr.fizx.uk — DNS retired 2026-05-17)"
# `certonly` = obtain cert only, don't rewrite vhost SSL config (cert path unchanged so vhosts don't need touching).
# `--nginx` = use the nginx authenticator (injects ACME challenge into matching server blocks at validation time).
# Let's Encrypt CAA lookup on .uk is occasionally flaky — retry if it fails.
$SSH 'certbot certonly --nginx \
  --cert-name pls.fizx.uk \
  -d pls.fizx.uk -d blst.fizx.uk -d fx.fizx.uk -d glmps.fizx.uk \
  -d smpl.fizx.uk -d trth.fizx.uk \
  --expand --non-interactive --agree-tos -m admin@fizx.uk'

echo "==> 4/6: Install real glmps.fizx.uk vhost (HTTPS + SPA fallback)"
$SCP nginx-glmps.fizx.uk.conf "${HOST}:/etc/nginx/sites-available/glmps.fizx.uk"
$SSH 'ln -sf /etc/nginx/sites-available/glmps.fizx.uk /etc/nginx/sites-enabled/glmps.fizx.uk'

echo "==> 5/6: Remove bootstrap stub vhost"
$SSH 'rm -f /etc/nginx/sites-enabled/glmps.fizx.uk.acme-bootstrap /etc/nginx/sites-available/glmps.fizx.uk.acme-bootstrap
nginx -t && systemctl reload nginx'

echo "==> 6/6: Verify"
$SSH 'curl -sI -o /dev/null -w "HTTPS %{http_code} via %{remote_ip}\n" https://glmps.fizx.uk; \
      curl -sI -o /dev/null -w "HTTP  %{http_code} (expect 301 to https)\n" http://glmps.fizx.uk' || true

echo ""
echo "==> Done. If glmps dist isn't already deployed:"
echo "    cd ~/code_gh/adjmx/glmps.fizx.uk && ./deploy.sh"
