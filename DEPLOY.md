# Manual de despliegue — Catálogo Multi-tenant en Hostinger VPS

Guía completa para crear y configurar un VPS en Hostinger y desplegar la aplicación con Docker y PostgreSQL local.

**Stack:** Hostinger KVM VPS · Ubuntu 22.04 LTS · Docker · PostgreSQL 15 · Nginx · Let's Encrypt (wildcard)

---

## Parte 1 — Crear el VPS en Hostinger

### 1. Contratar el VPS

1. Ir a [hostinger.com](https://hostinger.com) → **VPS Hosting**
2. **Plan recomendado:**

   | Plan   | CPU | RAM  | Disco  | Ancho de banda | Precio/mes | Cuándo usarlo                   |
   |--------|-----|------|--------|----------------|------------|---------------------------------|
   | KVM 1  | 1   | 4 GB | 50 GB  | 4 TB           | ~$5–7      | Pruebas / desarrollo            |
   | KVM 2  | 2   | 8 GB | 100 GB | 8 TB           | ~$8–12     | **Recomendado para producción** |
   | KVM 4  | 4   | 16 GB| 200 GB | 16 TB          | ~$14–18    | Alto tráfico / muchos tenants   |
   | KVM 8  | 8   | 32 GB| 400 GB | 32 TB          | ~$22–30    | Escala grande                   |

3. **Sistema operativo:** Ubuntu 22.04 LTS (seleccionar al activar el VPS en hPanel)
4. **Región:** elegir la más cercana a tus usuarios (ej: Estados Unidos, Europa, Brasil)
5. Completar el pago y esperar el email de activación

---

### 2. Acceder al panel hPanel y configurar el VPS

1. Ir a **hPanel → VPS → Administrar**
2. En **Información general** se encuentra la **IP del servidor** y la **contraseña root** temporal
3. En **Sistema operativo** verificar que sea Ubuntu 22.04. Si no, reinstalar desde ahí.

**Agregar tu clave SSH (recomendado):**

1. En hPanel → VPS → **SSH Keys** → **Add SSH Key**
2. Si no tenés clave, generarla en tu máquina local:
   ```bash
   ssh-keygen -t ed25519 -C "tu@email.com"
   cat ~/.ssh/id_ed25519.pub   # copiar este contenido
   ```
3. Pegar la clave pública en hPanel y guardar

---

### 3. Firewall en Hostinger

En hPanel → VPS → **Firewall** → **Create new firewall** → nombre: `catalogo-fw`

**Reglas de entrada:**

| Protocolo | Puerto | Fuente              | Descripción |
|-----------|--------|---------------------|-------------|
| TCP       | 2222   | Tu IP               | SSH         |
| TCP       | 80     | Cualquiera          | HTTP        |
| TCP       | 443    | Cualquiera          | HTTPS       |

Guardar y aplicar el firewall al VPS desde **VPS → Firewall → Asignar**.

> El firewall de Hostinger actúa antes de llegar al servidor — es la primera línea de defensa.

---

### 4. Configurar DNS en Hostinger

Si tu dominio está registrado en Hostinger, ir a **hPanel → Dominios → DNS / Servidores de nombres**.

Si el dominio está en otro registrador (GoDaddy, Namecheap, etc.), apuntar los nameservers a Hostinger:

```
ns1.dns-cluster.net
ns2.dns-cluster.net
```

Luego en hPanel → **Dominios → DNS Zone** agregar los registros:

| Tipo  | Nombre | Valor              | TTL  |
|-------|--------|--------------------|------|
| A     | @      | IP del VPS         | 3600 |
| A     | *      | IP del VPS         | 3600 |
| CNAME | www    | allexclusive.com   | 3600 |

> El registro `*` (wildcard) hace que `perfumeria.allexclusive.com`, `ropa.allexclusive.com`, etc. apunten todos al mismo servidor.

Verificar propagación (puede tardar hasta 24 hs, normalmente menos de 1 hora):
```bash
dig allexclusive.com
dig perfumeria.allexclusive.com
```

---

## Parte 2 — Configuración del servidor

### 4. Primer acceso como root

```bash
ssh root@IP_DE_LA_INSTANCIA

# Actualizar todo antes de hacer cualquier otra cosa
apt update && apt upgrade -y && apt autoremove -y
reboot
```

Reconectar después del reinicio:
```bash
ssh root@IP_DE_LA_INSTANCIA
```

---

### 5. Crear usuario no-root

```bash
adduser deploy
usermod -aG sudo deploy

# Copiar la clave SSH de root al nuevo usuario
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Verificar **antes de continuar** (abrir una nueva terminal):
```bash
ssh -p 22 deploy@IP_DE_LA_INSTANCIA
sudo whoami   # debe responder: root
```

---

### 6. Hardening SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Cambiar / verificar estas líneas:

```
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
X11Forwarding no
MaxAuthTries 3
LoginGraceTime 20
```

```bash
sudo systemctl restart ssh

# Verificar con nueva terminal ANTES de cerrar la sesión actual
ssh -p 2222 deploy@IP_DE_LA_INSTANCIA
```

> A partir de aquí todos los comandos se ejecutan como `deploy` con `sudo`.

---

### 7. Firewall en el servidor (UFW — segunda capa)

```bash
sudo apt install ufw -y

sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow 2222/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

sudo ufw enable
sudo ufw status verbose
```

---

### 8. Fail2ban — bloquear fuerza bruta

```bash
sudo apt install fail2ban -y

sudo bash -c 'cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port    = 2222
EOF'

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

### 9. Actualizaciones automáticas de seguridad

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
# Seleccionar "Yes"
```

---

### 10. Límites del sistema

```bash
sudo bash -c 'cat >> /etc/security/limits.conf << EOF
deploy soft nofile 65536
deploy hard nofile 65536
EOF'

sudo bash -c 'cat >> /etc/sysctl.conf << EOF
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.core.somaxconn = 1024
EOF'

sudo sysctl -p
```

---

### 11. Instalar Docker

```bash
sudo apt install ca-certificates curl gnupg -y
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

# Agregar deploy al grupo docker (sin sudo)
sudo usermod -aG docker deploy
newgrp docker

# Verificar
docker --version
docker compose version
```

---

### 12. Instalar Nginx y Node.js

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx

# Node.js 22 (para correr migraciones fuera del contenedor)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install nodejs -y
node --version
```

---

### 13. PostgreSQL 15 local

```bash
sudo apt install postgresql-15 postgresql-contrib-15 -y
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Crear base de datos y usuario
sudo -u postgres psql << 'EOF'
CREATE DATABASE project_catalogo;
CREATE USER catalogo_user WITH ENCRYPTED PASSWORD 'CONTRASEÑA_SEGURA_AQUI';
GRANT ALL PRIVILEGES ON DATABASE project_catalogo TO catalogo_user;
\c project_catalogo
GRANT ALL ON SCHEMA public TO catalogo_user;
ALTER USER catalogo_user CREATESCHEMA;
EOF
```

Verificar que PostgreSQL solo escucha en localhost:

```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
# Confirmar que dice:
# listen_addresses = 'localhost'

sudo systemctl restart postgresql
```

---

### 14. SSL con Let's Encrypt — certificado wildcard

```bash
sudo apt install certbot python3-certbot-nginx -y

sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d "allexclusive.com" \
  -d "*.allexclusive.com"
```

Certbot mostrará algo así:

```
Please deploy a DNS TXT record under the name:
_acme-challenge.allexclusive.com
with the following value:
AbCdEfGhIjKlMnOpQrStUvWxYz123456789
```

En Vultr → **DNS → allexclusive.com → Add Record**:

| Tipo | Nombre          | Valor                          | TTL |
|------|-----------------|--------------------------------|-----|
| TXT  | _acme-challenge | (el valor que muestra Certbot) | 300 |

Esperar 1-2 minutos y presionar Enter en Certbot para continuar.

```bash
# Renovación automática (Let's Encrypt vence cada 90 días)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Probar que la renovación automática funciona
sudo certbot renew --dry-run
```

---

### 15. Configurar Nginx como reverse proxy

```bash
sudo nano /etc/nginx/sites-available/catalogo
```

```nginx
# Redirigir HTTP → HTTPS
server {
    listen 80;
    server_name allexclusive.com *.allexclusive.com;
    return 301 https://$host$request_uri;
}

# HTTPS — wildcard para todos los subdominios
server {
    listen 443 ssl;
    server_name allexclusive.com *.allexclusive.com;

    ssl_certificate     /etc/letsencrypt/live/allexclusive.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/allexclusive.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;

    # Límite para subida de videos (200 MB + margen)
    client_max_body_size 210M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/catalogo /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Parte 3 — Despliegue de la aplicación

### 16. Subir el código

**Opción A — Git (recomendado):**

```bash
# En tu máquina local: subir a GitHub
git remote add origin git@github.com:TU_USUARIO/catalogo.git
git push -u origin master

# En el servidor:
sudo mkdir -p /srv/catalogo && sudo chown deploy:deploy /srv/catalogo
git clone git@github.com:TU_USUARIO/catalogo.git /srv/catalogo
```

**Opción B — rsync (sin Git):**

```bash
# Desde tu máquina local (en Windows usar Git Bash o WSL):
rsync -avz --exclude node_modules --exclude .next \
  -e "ssh -p 2222" \
  ./catalogo/ deploy@IP_DE_LA_INSTANCIA:/srv/catalogo/
```

---

### 17. Crear el archivo `.env` de producción

```bash
cd /srv/catalogo

# Generar el secreto PRIMERO
openssl rand -base64 32
# Copiar el resultado para usarlo en NEXTAUTH_SECRET

nano .env
```

```bash
DATABASE_URL="postgresql://catalogo_user:CONTRASEÑA_SEGURA_AQUI@localhost:5432/project_catalogo"
NEXTAUTH_URL="https://perfumeria.allexclusive.com"
NEXTAUTH_SECRET="PEGAR_RESULTADO_DE_openssl_rand"
NEXT_PUBLIC_ROOT_DOMAIN="allexclusive.com"
```

```bash
chmod 600 .env
```

---

### 18. Crear directorio de uploads persistente

```bash
sudo mkdir -p /srv/catalogo/uploads
sudo chown -R deploy:deploy /srv/catalogo/uploads
```

---

### 19. Correr migraciones

```bash
cd /srv/catalogo
npm install
npm run db:migrate:prod
```

---

### 20. Construir y levantar con Docker

```bash
cd /srv/catalogo

# Build (2-5 minutos la primera vez)
docker compose build

# Levantar en background
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f app
```

---

### 21. Verificar que todo funciona

```bash
# Health check interno
curl http://localhost:3000/api/health
# → {"ok":true}

# Verificar desde fuera con SSL
curl https://perfumeria.allexclusive.com/api/health
# → {"ok":true}
```

---

### 22. Crear superadmin y primer tenant

```bash
cd /srv/catalogo
NODE_ENV=production npx tsx sql/create-superadmin.ts
NODE_ENV=production npx tsx sql/create-tenant.ts
```

---

### 23. Backup automático de PostgreSQL

```bash
sudo mkdir -p /srv/backups
sudo chown deploy:deploy /srv/backups
nano /srv/backups/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M)
FILE="/srv/backups/catalogo_${DATE}.sql.gz"

PGPASSWORD="CONTRASEÑA_SEGURA_AQUI" pg_dump \
  -U catalogo_user \
  -h localhost \
  project_catalogo | gzip > "$FILE"

# Conservar solo los últimos 30 backups
ls -t /srv/backups/*.sql.gz | tail -n +31 | xargs -r rm

echo "Backup completado: $FILE"
```

```bash
chmod +x /srv/backups/backup-db.sh

# Backup manual de prueba
/srv/backups/backup-db.sh

# Programar: backup diario a las 3am
crontab -e
# Agregar esta línea:
0 3 * * * /srv/backups/backup-db.sh >> /srv/backups/backup.log 2>&1
```

---

### 24. Script de deploy para actualizaciones futuras

```bash
nano /srv/catalogo/deploy.sh
```

```bash
#!/bin/bash
set -e
cd /srv/catalogo

echo "→ Bajando cambios..."
git pull origin master

echo "→ Corriendo migraciones..."
npm run db:migrate:prod

echo "→ Reconstruyendo imagen..."
docker compose build app

echo "→ Reiniciando sin downtime..."
docker compose up -d --no-deps app

echo "✅ Deploy completado - $(date)"
```

```bash
chmod +x /srv/catalogo/deploy.sh

# Para deployar en el futuro, solo correr:
/srv/catalogo/deploy.sh
```

---

## Referencia rápida

### Puertos y servicios

| Servicio      | Puerto | Acceso                      |
|---------------|--------|-----------------------------|
| Nginx HTTP    | 80     | público → redirige a HTTPS  |
| Nginx HTTPS   | 443    | público → proxy a Next.js   |
| Next.js       | 3000   | solo localhost               |
| PostgreSQL    | 5432   | solo localhost               |
| SSH           | 2222   | solo IPs autorizadas         |

### Comandos frecuentes

```bash
# Ver estado del contenedor
docker compose -f /srv/catalogo/docker-compose.yml ps

# Ver logs en tiempo real
docker compose -f /srv/catalogo/docker-compose.yml logs -f app

# Reiniciar la app
docker compose -f /srv/catalogo/docker-compose.yml restart app

# Parar todo
docker compose -f /srv/catalogo/docker-compose.yml down

# Backup manual
/srv/backups/backup-db.sh

# Deploy de nueva versión
/srv/catalogo/deploy.sh

# Estado de PostgreSQL
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Ver uso de disco
df -h
du -sh /srv/catalogo/uploads
```

### Monitoreo

```bash
# Uso de recursos del contenedor
docker stats catalogo-app

# Logs con errores solamente
docker compose -f /srv/catalogo/docker-compose.yml logs app | grep -i error

# Logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Procesos del sistema
htop
```

---

## Checklist final antes de ir a producción

```
[ ] VPS KVM contratado con Ubuntu 22.04 y clave SSH agregada en hPanel
[ ] Firewall de Hostinger configurado (2222, 80, 443) y asignado al VPS
[ ] DNS: registro A  allexclusive.com    → IP del VPS
[ ] DNS: registro A  *.allexclusive.com  → IP del VPS
[ ] Nameservers apuntando a ns1.dns-cluster.net / ns2.dns-cluster.net
[ ] DNS propagado (verificar con: dig allexclusive.com)
[ ] Usuario deploy creado, acceso root deshabilitado por SSH
[ ] SSH en puerto 2222, sin contraseñas
[ ] UFW activo (segunda capa de firewall)
[ ] Fail2ban activo
[ ] Actualizaciones automáticas activas
[ ] Docker instalado y deploy en grupo docker
[ ] PostgreSQL 15 instalado, escucha solo en localhost
[ ] SSL wildcard generado con Certbot
[ ] Renovación automática de SSL verificada (--dry-run)
[ ] Nginx configurado y funcionando
[ ] .env creado con NEXTAUTH_SECRET real (openssl rand -base64 32)
[ ] .env con NEXTAUTH_URL en https://
[ ] .env con contraseña segura en DATABASE_URL
[ ] Migraciones corridas correctamente
[ ] docker compose up -d corriendo
[ ] Health check OK: https://tudominio.com/api/health → {"ok":true}
[ ] Backups automáticos configurados y probados
[ ] Superadmin creado
[ ] Al menos un tenant creado y probado desde el celular
```
