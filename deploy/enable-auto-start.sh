#!/usr/bin/env bash
# ==============================================================================
# B2B ERP - 24/7 PERMANENT AUTO-START & AUTO-RESTART SYSTEMD SERVICE
# Run this script on your EC2 instance: sudo bash deploy/enable-auto-start.sh
# ==============================================================================

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Setting up 24/7 permanent auto-start service for directory: $APP_DIR"

# 1. Enable Docker and Nginx on system boot
sudo systemctl enable docker
sudo systemctl start docker
sudo systemctl enable nginx
sudo systemctl start nginx

# 2. Find docker compose executable path
DOCKER_BIN=$(which docker || echo "/usr/bin/docker")

# 3. Create Systemd Service File
sudo cat << EOF > /etc/systemd/system/b2b-erp.service
[Unit]
Description=Gemini B2B ERP Docker Compose Production Services
Requires=docker.service nginx.service
After=docker.service nginx.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=$DOCKER_BIN compose -f docker-compose.prod.yml up -d
ExecStop=$DOCKER_BIN compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# 4. Reload systemd daemon and enable service
sudo systemctl daemon-reload
sudo systemctl enable b2b-erp.service
sudo systemctl start b2b-erp.service

echo "========================================================================"
echo " ✅ 24/7 Permanent Auto-Start is now ACTIVE!"
echo " Even if you close your terminal, disconnect, or reboot your EC2 instance,"
echo " all services (Nginx, Database, Redis, Backend & UI) will stay running 24/7."
echo "========================================================================"
