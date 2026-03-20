#!/bin/bash
# =============================================================================
# Digital Copilot — Initial Server Setup Script
# Run on a fresh Ubuntu 22.04 KVM 2 via SSH
# Usage: sudo bash setup-server.sh
# =============================================================================

set -euo pipefail

echo "=== Digital Copilot Server Setup ==="
echo ""

# --- System Updates ---
echo "[1/8] Updating system packages..."
apt update && apt upgrade -y

# --- Timezone ---
echo "[2/8] Setting timezone to UTC..."
timedatectl set-timezone UTC

# --- Swap ---
echo "[3/8] Configuring swap (4GB)..."
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
  echo "  ✓ Swap created"
else
  echo "  ⏭ Swap already exists"
fi

# --- Firewall ---
echo "[4/8] Configuring firewall (ufw)..."
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 25/tcp    # SMTP
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 465/tcp   # SMTPS
ufw allow 587/tcp   # SMTP Submission
ufw allow 993/tcp   # IMAPS
ufw --force enable
echo "  ✓ Firewall configured"

# --- Fail2ban ---
echo "[5/8] Installing fail2ban..."
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
echo "  ✓ Fail2ban active"

# --- Unattended Upgrades ---
echo "[6/8] Enabling unattended upgrades..."
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
echo "  ✓ Unattended upgrades enabled"

# --- Docker ---
echo "[7/8] Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker $SUDO_USER 2>/dev/null || true
  systemctl enable docker
  systemctl start docker
  echo "  ✓ Docker installed"
else
  echo "  ⏭ Docker already installed"
fi

# --- Docker Compose (v2 is included with Docker Engine) ---
echo "[8/8] Verifying Docker Compose..."
docker compose version
echo "  ✓ Docker Compose ready"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Configure DNS records (see docs/dns-records.md)"
echo "  2. Copy .env.example to .env and fill in values"
echo "  3. Run: docker compose up -d"
echo "  4. Request PTR/rDNS from Hostinger support"
echo ""
echo "Server IP: $(curl -s ifconfig.me)"
