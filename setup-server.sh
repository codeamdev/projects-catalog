#!/bin/bash
# =============================================================================
# setup-server.sh — Configuración automatizada del servidor
# Ubuntu 22.04 LTS · Puerto SSH 22
# Ejecutar como root: bash setup-server.sh
# =============================================================================

set -euo pipefail

# ── Colores ───────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
info() { echo -e "${YELLOW}→${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; exit 1; }

[ "$EUID" -ne 0 ] && err "Ejecutar como root: sudo bash setup-server.sh"

# =============================================================================
# 1. Fail2ban
# =============================================================================
info "Instalando Fail2ban..."
apt-get install -y fail2ban > /dev/null

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port    = 22
EOF

systemctl enable fail2ban
systemctl restart fail2ban
ok "Fail2ban instalado y activo"

# =============================================================================
# 2. Actualizaciones automáticas de seguridad
# =============================================================================
info "Configurando actualizaciones automáticas..."
apt-get install -y unattended-upgrades > /dev/null

cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

systemctl enable unattended-upgrades
systemctl restart unattended-upgrades
ok "Actualizaciones automáticas configuradas"

# =============================================================================
# 3. Límites del sistema
# =============================================================================
info "Configurando límites del sistema..."

grep -qxF 'deploy soft nofile 65536' /etc/security/limits.conf || \
  echo -e 'deploy soft nofile 65536\ndeploy hard nofile 65536' >> /etc/security/limits.conf

cat > /etc/sysctl.d/99-catalogo.conf << 'EOF'
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.core.somaxconn = 1024
EOF

sysctl -p /etc/sysctl.d/99-catalogo.conf > /dev/null
ok "Límites del sistema configurados"

# =============================================================================
# 4. Firewall (UFW) — puerto SSH 22
# =============================================================================
info "Configurando UFW..."
apt-get install -y ufw > /dev/null

ufw --force reset > /dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw --force enable > /dev/null

ok "UFW activo — puertos 22, 80, 443 abiertos"

# =============================================================================
# 5. Docker
# =============================================================================
info "Instalando Docker..."

if command -v docker &> /dev/null; then
  ok "Docker ya instalado ($(docker --version | cut -d' ' -f3 | tr -d ','))"
else
  apt-get install -y ca-certificates curl gnupg > /dev/null
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update > /dev/null
  apt-get install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin > /dev/null

  systemctl enable docker
  systemctl start docker
  ok "Docker instalado ($(docker --version | cut -d' ' -f3 | tr -d ','))"
fi

# Agregar usuario deploy al grupo docker
if id "deploy" &>/dev/null; then
  usermod -aG docker deploy
  ok "Usuario deploy agregado al grupo docker"
fi

# =============================================================================
# 6. Nginx
# =============================================================================
info "Instalando Nginx..."

if command -v nginx &> /dev/null; then
  ok "Nginx ya instalado"
else
  apt-get install -y nginx > /dev/null
  systemctl enable nginx
  systemctl start nginx
  ok "Nginx instalado y activo"
fi

# =============================================================================
# 7. Node.js 22
# =============================================================================
info "Instalando Node.js 22..."

if command -v node &> /dev/null && node --version | grep -q "^v22"; then
  ok "Node.js $(node --version) ya instalado"
else
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
  apt-get install -y nodejs > /dev/null
  ok "Node.js $(node --version) instalado"
fi

# =============================================================================
# 8. PostgreSQL 15
# =============================================================================
info "Instalando PostgreSQL 15..."

if command -v psql &> /dev/null; then
  ok "PostgreSQL ya instalado ($(psql --version))"
else
  # Agregar repositorio oficial de PostgreSQL
  apt-get install -y curl gnupg lsb-release > /dev/null
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | \
    gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg
  echo "deb [signed-by=/etc/apt/keyrings/postgresql.gpg] \
    https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | \
    tee /etc/apt/sources.list.d/pgdg.list > /dev/null

  apt-get update > /dev/null
  apt-get install -y postgresql-15 postgresql-client-15 > /dev/null
  systemctl enable postgresql
  systemctl start postgresql
  ok "PostgreSQL 15 instalado"
fi

# Verificar que escucha solo en localhost
PG_CONF="/etc/postgresql/15/main/postgresql.conf"
if [ -f "$PG_CONF" ]; then
  sed -i "s/^#listen_addresses\s*=.*/listen_addresses = 'localhost'/" "$PG_CONF"
  sed -i "s/^listen_addresses\s*=.*/listen_addresses = 'localhost'/"  "$PG_CONF"
  systemctl restart postgresql
  ok "PostgreSQL escucha solo en localhost"
fi

# =============================================================================
# 9. Certbot (SSL)
# =============================================================================
info "Instalando Certbot..."

if command -v certbot &> /dev/null; then
  ok "Certbot ya instalado"
else
  apt-get install -y certbot python3-certbot-nginx > /dev/null
  ok "Certbot instalado"
fi

# =============================================================================
# Resumen final
# =============================================================================
echo ""
echo "=============================================="
echo -e "${GREEN}  Servidor configurado correctamente${NC}"
echo "=============================================="
echo ""
echo "  Servicios activos:"
systemctl is-active --quiet fail2ban   && echo -e "  ${GREEN}✓${NC} fail2ban" || echo -e "  ${RED}✗${NC} fail2ban"
systemctl is-active --quiet ufw        && echo -e "  ${GREEN}✓${NC} ufw" || true
systemctl is-active --quiet docker     && echo -e "  ${GREEN}✓${NC} docker" || echo -e "  ${RED}✗${NC} docker"
systemctl is-active --quiet nginx      && echo -e "  ${GREEN}✓${NC} nginx" || echo -e "  ${RED}✗${NC} nginx"
systemctl is-active --quiet postgresql && echo -e "  ${GREEN}✓${NC} postgresql" || echo -e "  ${RED}✗${NC} postgresql"
echo ""
echo "  Versiones:"
echo "    Node.js : $(node --version)"
echo "    Docker  : $(docker --version | cut -d' ' -f3 | tr -d ',')"
echo "    Nginx   : $(nginx -v 2>&1 | cut -d'/' -f2)"
echo "    Psql    : $(psql --version | cut -d' ' -f3)"
echo ""
echo "  Próximos pasos manuales:"
echo "    1. Crear la base de datos PostgreSQL:"
echo "       sudo -u postgres psql"
echo "       > CREATE DATABASE project_catalogo;"
echo "       > CREATE USER catalogo_user WITH ENCRYPTED PASSWORD 'TU_CONTRASEÑA';"
echo "       > GRANT ALL PRIVILEGES ON DATABASE project_catalogo TO catalogo_user;"
echo "       > \\c project_catalogo"
echo "       > GRANT ALL ON SCHEMA public TO catalogo_user;"
echo "       > ALTER USER catalogo_user CREATESCHEMA;"
echo ""
echo "    2. Generar certificado SSL:"
echo "       certbot certonly --manual --preferred-challenges dns \\"
echo "         -d 'allexclusive.com' -d '*.allexclusive.com'"
echo ""
echo "    3. Configurar Nginx en /etc/nginx/sites-available/catalogo"
echo "       (ver DEPLOY.md paso 15)"
echo ""
echo "    4. Subir el código y crear el .env"
echo "       (ver DEPLOY.md pasos 16-17)"
echo ""
