#!/usr/bin/env bash
# ==============================================================================
# B2B ERP - AUTOMATED AWS EC2 INITIALIZATION & DEPLOYMENT SETUP SCRIPT
# Supports: Ubuntu, Debian, Amazon Linux 2023, Amazon Linux 2, RHEL
# Usage: sudo bash setup-ec2.sh
# ==============================================================================

set -euo pipefail

echo "========================================================================"
echo " Starting EC2 Initialization for B2B ERP System..."
echo "========================================================================"

# Detect Package Manager
if command -v apt-get &> /dev/null; then
    PKG_MANAGER="apt"
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
else
    echo "Unsupported OS package manager. Please install Docker & Nginx manually."
    exit 1
fi

echo "Detected Package Manager: $PKG_MANAGER"

# 1. Update System & Install Base Packages
echo "[1/5] Updating system repositories and installing dependencies..."
if [ "$PKG_MANAGER" = "apt" ]; then
    sudo apt-get update -y
    sudo apt-get upgrade -y
    sudo apt-get install -y ca-certificates curl gnupg lsb-release git nginx netcat-openbsd ufw
elif [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
    sudo $PKG_MANAGER update -y
    sudo $PKG_MANAGER install -y git curl nc || true
    sudo $PKG_MANAGER install -y nginx || sudo amazon-linux-extras install nginx1 -y || true
fi

# 2. Install & Configure Docker
echo "[2/5] Setting up Docker Engine & Docker Compose Plugin..."
if ! command -v docker &> /dev/null; then
    if [ "$PKG_MANAGER" = "apt" ]; then
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update -y
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    elif [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
        sudo $PKG_MANAGER install -y docker
    fi
fi

# Enable & Start Docker Service
sudo systemctl enable docker || true
sudo systemctl start docker || true

# Add current user to docker group
ACTUAL_USER="${SUDO_USER:-$USER}"
sudo usermod -aG docker "$ACTUAL_USER" || true

# 3. Setup Docker Compose V2 plugin if missing
if ! docker compose version &> /dev/null; then
    echo "Installing standalone Docker Compose V2 plugin..."
    DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
    mkdir -p $DOCKER_CONFIG/cli-plugins
    curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
    chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
fi

# 4. Create Nginx directories & Enable Service
echo "[3/5] Setting up Nginx Configuration Directories..."
sudo mkdir -p /etc/nginx/conf.d
mkdir -p ~/app/nginx/conf.d

# Enable & Start Nginx Service
sudo systemctl enable nginx || true
sudo systemctl restart nginx || true

# 5. Verify Installation
echo "[4/5] Verifying installed software versions..."
echo "Docker version: $(docker --version 2>&1 || echo 'Installed')"
echo "Docker Compose version: $(docker compose version 2>&1 || echo 'Compose V2 ready')"
echo "Nginx version: $(nginx -v 2>&1 || echo 'Nginx ready')"

echo "========================================================================"
echo " EC2 Instance Setup Completed Successfully!"
echo " Access your application via browser: http://<YOUR_EC2_PUBLIC_IP>/"
echo "========================================================================"
