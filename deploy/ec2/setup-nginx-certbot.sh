#!/usr/bin/env bash
set -euo pipefail

APP_DOMAIN="${APP_DOMAIN:-postmanchat.live}"
APP_WWW_DOMAIN="${APP_WWW_DOMAIN:-www.postmanchat.live}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
TEMPLATE_PATH="/etc/postman-chat/nginx.conf.template"
NGINX_SITE_PATH="/etc/nginx/sites-available/postmanchat.live"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/postmanchat.live"
CERTBOT_WEBROOT="/var/www/certbot"
CERT_DIR="/etc/letsencrypt/live/${APP_DOMAIN}"
FULLCHAIN_PATH="${CERT_DIR}/fullchain.pem"
PRIVKEY_PATH="${CERT_DIR}/privkey.pem"

if [[ ! -f "$TEMPLATE_PATH" ]]; then
  echo "Missing Nginx template at $TEMPLATE_PATH" >&2
  exit 1
fi

write_https_config() {
  sudo tee "$NGINX_SITE_PATH" >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${APP_DOMAIN} ${APP_WWW_DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://${APP_DOMAIN}\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${APP_DOMAIN} ${APP_WWW_DOMAIN};

    ssl_certificate ${FULLCHAIN_PATH};
    ssl_certificate_key ${PRIVKEY_PATH};
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    if (\$host = ${APP_WWW_DOMAIN}) {
        return 301 https://${APP_DOMAIN}\$request_uri;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600;
    }
}
EOF
}

sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

sudo mkdir -p "$CERTBOT_WEBROOT"

if [[ -f "$FULLCHAIN_PATH" && -f "$PRIVKEY_PATH" ]]; then
  write_https_config
else
  sudo cp "$TEMPLATE_PATH" "$NGINX_SITE_PATH"
fi

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

  if [[ -f "$FULLCHAIN_PATH" && -f "$PRIVKEY_PATH" ]]; then
    write_https_config
    sudo nginx -t
    sudo systemctl restart nginx
  fi
else
  echo "LETSENCRYPT_EMAIL is not set. Skipping certificate issuance."
  echo "HTTP Nginx is active. Re-run with LETSENCRYPT_EMAIL after DNS points to this EC2 instance."
fi
