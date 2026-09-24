#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-/opt/saximi-shop}"
SITE_NAME="${SITE_NAME:-saximi-shop}"
DOMAIN="${1:-}"
WWW_DOMAIN="${2:-}"
EMAIL="${3:-}"

if [ -z "$DOMAIN" ]; then
  echo "Usage: sudo APP_DIR=/opt/saximi-shop deploy/scripts/connect-domain.sh example.com [www.example.com] [admin@example.com]"
  exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root: sudo APP_DIR=$APP_DIR deploy/scripts/connect-domain.sh $DOMAIN ${WWW_DOMAIN:-www.$DOMAIN}"
  exit 1
fi

if [ -z "$WWW_DOMAIN" ]; then
  WWW_DOMAIN="www.$DOMAIN"
fi

if [ ! -d "$APP_DIR" ]; then
  echo "App directory not found: $APP_DIR"
  exit 1
fi

PUBLIC_IP="$(curl -fsS https://api.ipify.org 2>/dev/null || true)"
DOMAIN_IPS="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' ' || true)"
WWW_IPS="$(getent ahostsv4 "$WWW_DOMAIN" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' ' || true)"

echo "Domain: $DOMAIN"
echo "WWW: $WWW_DOMAIN"
echo "Server IP: ${PUBLIC_IP:-unknown}"
echo "Domain DNS: ${DOMAIN_IPS:-not found}"
echo "WWW DNS: ${WWW_IPS:-not found}"

if [ -n "$PUBLIC_IP" ]; then
  case " $DOMAIN_IPS " in
    *" $PUBLIC_IP "*) ;;
    *) echo "Warning: $DOMAIN does not appear to point to this server yet." ;;
  esac
  case " $WWW_IPS " in
    *" $PUBLIC_IP "*) ;;
    *) echo "Warning: $WWW_DOMAIN does not appear to point to this server yet." ;;
  esac
fi

cd "$APP_DIR"

if [ ! -f ".env" ]; then
  cp deploy/env.example .env
fi

TS="$(date +%Y%m%d-%H%M%S)"
cp .env ".env.backup-domain-$TS"

if grep -q '^SAXIMI_DOMAIN=' .env; then
  sed -i "s|^SAXIMI_DOMAIN=.*|SAXIMI_DOMAIN=$DOMAIN|" .env
else
  printf '\nSAXIMI_DOMAIN=%s\n' "$DOMAIN" >> .env
fi

if grep -q '^PUBLIC_SITE_URL=' .env; then
  sed -i "s|^PUBLIC_SITE_URL=.*|PUBLIC_SITE_URL=https://$DOMAIN|" .env
else
  printf 'PUBLIC_SITE_URL=https://%s\n' "$DOMAIN" >> .env
fi

cat > "/etc/nginx/sites-available/$SITE_NAME" <<NGINX
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

ln -sfn "/etc/nginx/sites-available/$SITE_NAME" "/etc/nginx/sites-enabled/$SITE_NAME"
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

docker compose -f docker-compose.prod.yml --env-file .env up -d web

if command -v certbot >/dev/null 2>&1; then
  if [ -n "$EMAIL" ]; then
    certbot --nginx --non-interactive --agree-tos --email "$EMAIL" -d "$DOMAIN" -d "$WWW_DOMAIN"
  else
    certbot --nginx --non-interactive --agree-tos --register-unsafely-without-email -d "$DOMAIN" -d "$WWW_DOMAIN"
  fi
  systemctl reload nginx
else
  echo "certbot is not installed. Install python3-certbot-nginx, then run SSL manually."
fi

echo "Domain connected:"
echo "  https://$DOMAIN"
echo "  https://$WWW_DOMAIN"
echo "Environment backup:"
echo "  $APP_DIR/.env.backup-domain-$TS"
