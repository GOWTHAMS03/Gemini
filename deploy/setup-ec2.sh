#!/usr/bin/env bash
# ==============================================================================
# B2B ERP - AUTOMATED AWS EC2 INITIALIZATION & DEPLOYMENT SETUP SCRIPT
# Run this script on your EC2 instance (Ubuntu 22.04 LTS / 24.04 LTS)
# Usage: sudo bash setup-ec2.sh yourdomain.com admin@yourdomain.com
# ==============================================================================

set -euo pipefail

DOMAIN_NAME="${1:-yourdomain.com}"
EMAIL_ADDRESS="${2:-admin@$DOMAIN_NAME}"

echo "========================================================================"
echo " Starting EC2 Initialization for $DOMAIN_NAME..."
echo "========================================================================"

# 1. Update System & Install Base Packages
echo "[1/6] Updating system repositories and installing dependencies..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    netcat-openbsd \
    ufw

# 2. Install Docker & Docker Compose Plugin
echo "[2/6] Installing Docker Engine & Docker Compose Plugin..."
if ! command -v docker &> /dev/null; then
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# Enable & Start Docker Service
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker "$USER" || true

# 3. Configure Firewall (UFW)
echo "[3/6] Configuring Security Firewall (UFW)..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable || true

# 4. Create App Directory Structure
echo "[4/6] Setting up Application Directory..."
mkdir -p ~/app/nginx/conf.d
cd ~/app

# 5. Provision Initial SSL Certificate using Certbot
echo "[5/6] Requesting SSL Certificate from Let's Encrypt for $DOMAIN_NAME..."
sudo systemctl stop nginx || true

if [ "$DOMAIN_NAME" != "yourdomain.com" ]; then
    sudo certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL_ADDRESS" \
        -d "$DOMAIN_NAME" \
        -d "www.$DOMAIN_NAME" || true
else
    echo "Skipping live Certbot execution because domain is still placeholder ($DOMAIN_NAME)."
    echo "Run: sudo certbot certonly --standalone -d youractualdomain.com"
fi

# Enable & Start Nginx Service
sudo systemctl enable nginx
sudo systemctl start nginx

# 6. Verify Installation
echo "[6/6] Verifying installed software versions..."
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker compose version)"
echo "Nginx version: $(nginx -v 2>&1)"
echo "Certbot version: $(certbot --version)"

echo "========================================================================"
echo " EC2 Instance Setup Completed Successfully!"
echo " Next step: Configure your GitHub repository secrets and push to main."
echo "========================================================================"
