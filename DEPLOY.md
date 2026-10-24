# Guía de despliegue (Oracle Cloud gratis + nicholas-delarosa.is-a.dev)

Costo: **$0**. Tiempo: ~1 hora de pasos + lo que tarde la revisión de is-a.dev.

```
Visitante ──HTTPS──> Caddy ──> web   (React + nginx)
                          └──> api   (.NET 10) ──> db (PostgreSQL)
                                           └────> screenshots (Chromium)
```

---

## 1. Subir el código a GitHub

Crea un repo (público: es parte de tu portafolio y así el servidor lo clona sin llaves) y sube el código.
El `.gitignore` ya deja fuera el `.env` y los respaldos. Las llaves de tu PC viven en *user-secrets*, fuera del repo.

## 2. Crear la cuenta de Oracle Cloud

1. Entra a https://www.oracle.com/cloud/free/ → **Start for free**.
2. **Home region**: elige la más cercana (Bogotá si aparece; si no, São Paulo o Querétaro).
   ⚠️ No se puede cambiar después y los recursos gratis solo existen en esa región.
3. Te pedirán una tarjeta **solo para verificar** que eres una persona. Oracle hace un cobro temporal pequeño (alrededor de 1 USD) que luego devuelve:
   ten unos 5.000 COP disponibles en ese momento. Mientras uses solo recursos "Always Free" no te cobran nada.

## 3. Crear la máquina virtual

En el menú: **Compute → Instances → Create instance**.

| Opción | Valor |
|---|---|
| Name | `portfolio` |
| Image | **Canonical Ubuntu 24.04** |
| Shape | **Ampere → VM.Standard.A1.Flex**, 2 OCPU y 12 GB de RAM (o el máximo gratis que te deje) |
| Networking | *Create new virtual cloud network* + *public subnet* + **Assign a public IPv4 address** |
| SSH keys | **Generate a key pair for me** → descarga la llave privada (`.key`) y guárdala bien |
| Boot volume | El de por defecto (hasta 200 GB son gratis) |

Si sale **"Out of capacity"**: prueba otro *Availability Domain* o vuelve a intentarlo más tarde (pasa seguido en las cuentas gratis).

Cuando quede en verde (**Running**), copia su **Public IP address**.

## 4. Abrir los puertos 80 y 443 en Oracle

**Networking → Virtual cloud networks →** tu red **→ Security Lists → Default Security List → Add Ingress Rules**:

| Source CIDR | Protocolo | Puerto destino |
|---|---|---|
| `0.0.0.0/0` | TCP | 80 |
| `0.0.0.0/0` | TCP | 443 |
| `0.0.0.0/0` | UDP | 443 |

(El firewall interno del servidor lo abre el script del paso 6.)

## 5. Entrar al servidor por SSH (desde PowerShell)

```powershell
# Solo la primera vez: Windows exige que la llave sea privada
icacls "C:\ruta\a\ssh-key.key" /inheritance:r /grant:r "$($env:USERNAME):(R)"

ssh -i "C:\ruta\a\ssh-key.key" ubuntu@IP-DEL-SERVIDOR
```

## 6. Preparar el servidor (una sola vez)

```bash
git clone https://github.com/nicholas-delarosa/NOMBRE-DEL-REPO.git portfolio
cd portfolio
bash deploy/setup-server.sh
exit   # sal y vuelve a entrar por SSH para poder usar docker sin sudo
```

El script instala Docker, abre el firewall interno, activa las actualizaciones de seguridad automáticas
y programa un respaldo diario de la base de datos (3:30 a. m.).

## 7. Configurar el `.env`

```bash
cd portfolio
cp .env.example .env
openssl rand -base64 32 | tr -d '/+='   # copia esto como contraseña de la base de datos
nano .env
```

| Variable | Valor |
|---|---|
| `SITE_ADDRESS` | Por ahora **`IP-CON-GUIONES.sslip.io`** (ej. `129-146-10-20.sslip.io`): un dominio gratis que apunta a tu IP y tiene HTTPS. Cuando is-a.dev apruebe, se cambia (paso 10). |
| `POSTGRES_PASSWORD` | La que generaste arriba |
| `GITHUB_TOKEN` | Tu token de solo lectura (el mismo de tu PC o uno nuevo) |
| `CLOUDINARY_URL` | El mismo de tu PC |
| `RESEND_API_KEY` | El mismo de tu PC |
| `GITHUB_OAUTH_CLIENT_ID` / `SECRET` | De una **app de OAuth nueva para producción** (abajo) |

**App de OAuth de producción**: https://github.com/settings/applications/new

- *Application name*: `Portfolio`
- *Homepage URL*: `https://EL-MISMO-SITE_ADDRESS`
- *Authorization callback URL*: `https://EL-MISMO-SITE_ADDRESS/api/auth/signin-github`

Guarda con `Ctrl+O`, `Enter`, `Ctrl+X`.

## 8. Publicar

```bash
bash deploy/deploy.sh
```

La primera vez tarda unos minutos (construye todo). Luego abre `https://TU-SITE_ADDRESS` 🎉
Caddy saca el certificado HTTPS solo.

## 9. Pasar lo que ya configuraste en tu PC (opcional)

Para no repetir en el admin lo que ya hiciste (proyectos visibles, perfil, CV, habilidades...):

```powershell
# En tu PC, desde la carpeta Portfolio
.\deploy\export-dev-data.ps1
scp -i "C:\ruta\a\ssh-key.key" "backups\portfolio-dev-FECHA.dump" ubuntu@IP-DEL-SERVIDOR:~/portfolio/backups/
```

```bash
# En el servidor
bash deploy/restore.sh backups/portfolio-dev-FECHA.dump
```

## 10. Tu dominio `nicholas-delarosa.is-a.dev`

La solicitud la haces tú siguiendo la documentación oficial: https://docs.is-a.dev
(ellos piden expresamente que **no** la escriba una IA, o la rechazan).
En resumen: un *fork* de https://github.com/is-a-dev/register, un archivo `domains/nicholas-delarosa.json`
con tu usuario de GitHub y un registro **A** con la IP de tu servidor, y un *pull request*.
Lo revisan voluntarios: puede tardar de horas a varios días. Si piden cambios, hazlos o lo cierran.

Cuando lo aprueben:

1. En el `.env`: `SITE_ADDRESS=nicholas-delarosa.is-a.dev`
2. En la app de OAuth de producción, cambia las dos URLs a `https://nicholas-delarosa.is-a.dev/...`
3. `docker compose up -d` (reinicia Caddy con el dominio nuevo y saca su certificado)

---

## Día a día

| Quiero... | Comando (en el servidor, en `~/portfolio`) |
|---|---|
| Publicar cambios que subí a GitHub | `bash deploy/deploy.sh` |
| Ver qué está corriendo | `docker compose ps` |
| Ver los logs de la API | `docker compose logs -f api` |
| Hacer un respaldo ahora | `bash deploy/backup.sh` |
| Bajar un respaldo a mi PC | `scp -i llave.key ubuntu@IP:~/portfolio/backups/ARCHIVO.dump .` |
| Restaurar un respaldo | `bash deploy/restore.sh backups/ARCHIVO.dump` |

Los respaldos se guardan en `~/portfolio/backups` (últimos 14). Baja uno a tu PC de vez en cuando:
si se pierde el servidor, el respaldo es lo único que trae de vuelta tus mensajes y configuración.

## ⚠️ Cosas a tener en cuenta de Oracle

- **Máquinas inactivas**: Oracle puede recuperar las máquinas gratis que pasan 7 días casi sin uso
  (CPU, red y memoria por debajo del 20 %). Un portafolio usa muy poco. Si te llega un correo de aviso, la solución
  oficial es pasar la cuenta a **Pay As You Go**: sigue sin cobrar mientras estés dentro de los límites gratis, y las
  máquinas ya no se recuperan. Si lo haces, crea una **alerta de presupuesto** (Billing → Budgets) de 1 USD para enterarte de cualquier cobro.
- En 2026 Oracle redujo el plan gratis de las cuentas nuevas (se reporta 2 OCPU y 12 GB). Sobra para este proyecto: usa ~1,5 GB.

## Plan B: Google Cloud (e2-micro gratis)

Si Oracle no te deja crear la cuenta: Google Cloud tiene una máquina **e2-micro** gratis (1 GB de RAM) en
`us-west1`, `us-central1` o `us-east1`. Los pasos son los mismos desde el paso 5, con dos cambios:

- Agrega 2 GB de *swap* antes del despliegue (con 1 GB de RAM no alcanza para compilar).
- En `docker-compose.yml`, quita el servicio `screenshots` (Chromium no cabe). Las capturas no se tomarán solas;
  súbelas a mano desde el admin.
