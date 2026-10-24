#!/usr/bin/env bash
# Prepara un servidor Ubuntu 24.04 nuevo (Oracle Cloud Always Free, ARM) para el portafolio.
# Uso (una sola vez, en el servidor): bash deploy/setup-server.sh
set -euo pipefail

echo "* Actualizando el sistema..."
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git curl unattended-upgrades netfilter-persistent iptables-persistent

echo "* Actualizaciones de seguridad automáticas..."
sudo dpkg-reconfigure -f noninteractive unattended-upgrades

echo "* Zona horaria de Colombia..."
sudo timedatectl set-timezone America/Bogota

if ! command -v docker >/dev/null 2>&1; then
  echo "* Instalando Docker..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi

# Las imágenes de Ubuntu de Oracle traen un firewall (iptables) que bloquea todo menos SSH.
# Además de abrir los puertos en la "Security List" de Oracle, hay que abrirlos aquí
echo "* Abriendo los puertos 80 y 443 en el firewall del servidor..."
for rule in "-p tcp --dport 80" "-p tcp --dport 443" "-p udp --dport 443"; do
  # shellcheck disable=SC2086
  sudo iptables -C INPUT -m state --state NEW $rule -j ACCEPT 2>/dev/null \
    || sudo iptables -I INPUT 6 -m state --state NEW $rule -j ACCEPT
done
sudo netfilter-persistent save

echo "* Respaldo diario de la base de datos (3:30 a. m.)..."
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CRON_LINE="30 3 * * * cd $REPO_DIR && bash deploy/backup.sh >> $REPO_DIR/backups/backup.log 2>&1"
mkdir -p "$REPO_DIR/backups"
( crontab -l 2>/dev/null | grep -v "deploy/backup.sh" ; echo "$CRON_LINE" ) | crontab -

echo
echo "* Listo. Cierra la sesión SSH y vuelve a entrar para poder usar 'docker' sin sudo."
echo "* Después: cp .env.example .env, llénalo y ejecuta: bash deploy/deploy.sh"
