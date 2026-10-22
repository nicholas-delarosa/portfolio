# Portfolio — Nicholas De la Rosa

Portafolio personal con estética Deltarune/Undertale. Los proyectos se sincronizan desde GitHub y se administran desde un panel privado.

## Stack

| Pieza | Tecnología |
|---|---|
| API | .NET 10 (Minimal APIs) + EF Core 10 |
| Base de datos | PostgreSQL 18 |
| Login admin | GitHub OAuth (solo `nicholas-delarosa`) |
| Servidor web / HTTPS | Caddy 2 |
| Despliegue | Docker Compose |

## Estructura

```
Portfolio/
├── Portfolio.Backend/              Todo lo de C# / .NET
│   ├── src/
│   │   └── Portfolio.Api/          API en .NET 10
│   │       ├── Auth/               Login con GitHub y endpoints /api/auth
│   │       ├── Data/               DbContext, migraciones y datos iniciales
│   │       └── Entities/           Tablas (proyectos, asociaciones, perfil, ...)
│   ├── Portfolio.Backend.slnx      Solución
│   ├── dotnet-tools.json           Herramientas (dotnet-ef)
│   └── Dockerfile
├── Portfolio.Frontend/             React + Vite (Fase 3)
├── Caddyfile                       Proxy inverso + HTTPS automático
├── docker-compose.yml              Producción (db + api + caddy)
└── docker-compose.dev.yml          Desarrollo (solo db en el puerto 5440)
```

## Desarrollo local

Requisitos: Docker Desktop, .NET SDK 10.

```bash
# 1. Base de datos
docker compose -f docker-compose.dev.yml up -d

# 2. API (aplica migraciones y datos iniciales al arrancar)
cd Portfolio.Backend/src/Portfolio.Api
dotnet run --launch-profile http   # http://localhost:5055/api/health
```

Para probar el login de GitHub en local guarda las credenciales con *user-secrets* (no quedan en el repo):

```bash
cd Portfolio.Backend/src/Portfolio.Api
dotnet user-secrets init
dotnet user-secrets set "GitHubOAuth:ClientId" "xxx"
dotnet user-secrets set "GitHubOAuth:ClientSecret" "xxx"
```

### Migraciones

```bash
cd Portfolio.Backend
dotnet tool restore
dotnet ef migrations add NombreDelCambio --project src/Portfolio.Api -o Data/Migrations
```

## Producción

```bash
cp .env.example .env   # y llena los valores
docker compose up -d --build
```

## Endpoints (Fase 1)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado de la API y la BD |
| GET | `/api/auth/login?returnUrl=/admin` | Inicia sesión con GitHub |
| GET | `/api/auth/signin-github` | Callback de GitHub |
| GET | `/api/auth/me` | ¿Hay sesión de admin? |
| POST | `/api/auth/logout` | Cierra sesión |
| GET | `/api/admin/ping` | Prueba de acceso de admin |
