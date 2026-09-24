# Saximi Shop Production Deploy

## 1. VPS packages

Use Ubuntu 24.04 LTS or Debian 12. Install Docker, Node.js and Nginx on the VPS:

```sh
sudo apt update
sudo apt install -y ca-certificates curl git nginx ufw certbot python3-certbot-nginx awscli
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Log out and back in after adding the user to the Docker group.

## 2. App deploy

```sh
sudo mkdir -p /opt/saximi-shop
sudo chown -R "$USER":"$USER" /opt/saximi-shop
cd /opt/saximi-shop
git clone <repo-url> .
cp deploy/env.example .env
nano .env
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

The app container listens on `127.0.0.1:8080`. The backend is private inside Docker.

## 3. Domain and SSL

Point these DNS records to the VPS IP:

```text
@     A     <VPS_IP>
www   A     <VPS_IP>
```

Then run the automated connector:

```sh
sudo APP_DIR=/opt/saximi-shop deploy/scripts/connect-domain.sh example.com www.example.com admin@example.com
```

This script updates `.env`, configures host Nginx, reloads Nginx, restarts the web container and requests SSL with Certbot.

Manual fallback:

```sh
sudo cp deploy/nginx/host-saximi-shop.conf /etc/nginx/sites-available/saximi-shop
sudo nano /etc/nginx/sites-available/saximi-shop
sudo ln -s /etc/nginx/sites-available/saximi-shop /etc/nginx/sites-enabled/saximi-shop
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d example.com -d www.example.com
```

Replace `example.com` with the real domain before running Certbot.

## 4. Firewall and SSH

```sh
sudo ufw allow 24700/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Recommended SSH hardening after confirming key login works:

```sh
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl reload ssh
```

## 5. Object Storage backup

Install `awscli`, fill these values in `.env`, then run:

```sh
export $(grep -v '^#' .env | xargs)
deploy/backup/backup-data.sh
```

Cron example, daily at 02:15:

```cron
15 2 * * * cd /opt/saximi-shop && export $(grep -v '^#' .env | xargs) && deploy/backup/backup-data.sh >> /var/log/saximi-backup.log 2>&1
```
