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

## Sincronización con GitHub

Cada 6 horas (y con el botón del admin) la API trae:

| Origen | Relación | Etiqueta |
|---|---|---|
| Repos de `nicholas-delarosa` | `Owner` | — |
| Repos `nicholas-delarosa-*` en organizaciones (ej. Esthercita-Factory) | `Organization` | Asociación |
| Repos ajenos con commits o PRs tuyos | `Contributor` | "Trabajé en…" (+ asociación si es de una organización) |

- Los proyectos nuevos llegan **ocultos** hasta aprobarlos en el admin.
- Lo que personalizas en el admin (títulos, descripciones, demo, asociación fijada, imagen subida) nunca se sobrescribe.
- Si el proyecto tiene demo, un Chromium sin pantalla (contenedor `screenshots`) toma la captura y la sube a Cloudinary.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado de la API y la BD |
| GET | `/api/projects?lang=es\|en` | Proyectos visibles con etiquetas |
| GET | `/api/auth/login?returnUrl=/admin` | Inicia sesión con GitHub |
| GET | `/api/auth/signin-github` | Callback de GitHub |
| GET | `/api/auth/me` | ¿Hay sesión de admin? |
| POST | `/api/auth/logout` | Cierra sesión |

**Admin** (requiere sesión):

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/projects` | Todos los proyectos |
| PUT | `/api/admin/projects/{id}` | Personalizar un proyecto |
| PATCH | `/api/admin/projects/visibility` | Mostrar/ocultar varios |
| PUT | `/api/admin/projects/order` | Guardar el orden |
| POST | `/api/admin/projects` | Agregar un proyecto manual |
| DELETE | `/api/admin/projects/{id}` | Borrar un proyecto |
| POST / DELETE | `/api/admin/projects/{id}/image` | Subir / quitar imagen propia |
| POST | `/api/admin/projects/{id}/screenshot` | Volver a tomar la captura |
| GET / POST | `/api/admin/associations` | Listar / crear asociaciones |
| PUT / DELETE | `/api/admin/associations/{id}` | Editar / borrar asociación |
| GET / POST | `/api/admin/sync` | Estado / sincronizar ahora |
