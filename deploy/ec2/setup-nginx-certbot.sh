#!/usr/bin/env bash
set -euo pipefail

APP_DOMAIN="${APP_DOMAIN:-postmanchat.live}"
APP_WWW_DOMAIN="${APP_WWW_DOMAIN:-www.postmanchat.live}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
TEMPLATE_PATH="/etc/postman-chat/nginx.conf.template"
NGINX_SITE_PATH="/etc/nginx/sites-available/postmanchat.live"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/postmanchat.live"
CERTBOT_WEBROOT="/var/www/certbot"

if [[ ! -f "$TEMPLATE_PATH" ]]; then
  echo "Missing Nginx template at $TEMPLATE_PATH" >&2
  exit 1
fi

sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

sudo mkdir -p "$CERTBOT_WEBROOT"

sudo cp "$TEMPLATE_PATH" "$NGINX_SITE_PATH"
sudo ln -sf "$NGINX_SITE_PATH" "$NGINX_ENABLED_PATH"
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

if [[ -n "$LETSENCRYPT_EMAIL" ]]; then
  sudo certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email "$LETSENCRYPT_EMAIL" \
    -d "$APP_DOMAIN" \
    -d "$APP_WWW_DOMAIN" \
    --redirect
else
  echo "LETSENCRYPT_EMAIL is not set. Skipping certificate issuance."
  echo "HTTP Nginx is active. Re-run with LETSENCRYPT_EMAIL after DNS points to this EC2 instance."
fi
