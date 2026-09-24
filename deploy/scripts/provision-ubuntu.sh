#!/usr/bin/env sh
set -eu

sudo apt update
sudo apt install -y ca-certificates curl git nginx ufw certbot python3-certbot-nginx awscli

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

sudo systemctl enable --now nginx
sudo systemctl enable --now docker

sudo ufw allow 24700/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "Provision complete. Re-login after: sudo usermod -aG docker \"$USER\""
sudo usermod -aG docker "$USER"
