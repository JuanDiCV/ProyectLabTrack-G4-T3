# Instrucciones de LabTrack

## Requisitos
- Node.js ≥ 20 y npm
- (Opcional) Google Chrome para pruebas E2E, JMeter para la prueba de carga

## 1. Instalar y preparar la base de datos
Desde la raíz del proyecto:
```bash
npm run setup
```
Instala dependencias, crea `backend/.env` (con `JWT_SECRET` aleatorio), crea la BD SQLite y carga los datos semilla (2 usuarios, 4 equipos con imagen).

Credenciales de prueba:

| Rol | Código | Contraseña |
|---|---|---|
| Estudiante | `20261001` | `Estudiante123` |
| Admin | `ADMIN001` | `Admin123` |

Reiniciar datos: `npm run db:seed`.

> Si cambia `backend/prisma/schema.prisma`: `npm run db:setup -w backend`.

## 2. Ejecutar el proyecto
```bash
npm run dev
```
- Frontend: http://localhost:5173
- API: http://localhost:4000/api (salud: `/api/health`)

Otros comandos: `npm run build`, `npm run typecheck`.

## 3. Pruebas unitarias
```bash
npm test                 # Vitest (CP-001 a CP-030)
npm run test:coverage    # cobertura en backend/coverage
```
Una sola prueba: `npm run test -w backend -- tests/unit/hu02-catalog.unit.test.ts`

## 4. Pruebas E2E (opcional)
Con `npm run dev` activo, en otra terminal: `npm run e2e`.

## 5. Docker y SonarQube Community
Requiere Docker Desktop.
```bash
docker compose up -d --build                      # app (5173/4000) + SonarQube (9000)
docker compose --profile test run --rm tests      # pruebas unitarias + cobertura (backend/coverage)
```
1. Abra http://localhost:9000 (usuario/clave inicial `admin`/`admin`, le pedirá cambiarla).
2. Cree el proyecto `labtrack` (manual) y genere un token (My Account → Security).
3. Ejecute el análisis:
```powershell
$env:SONAR_TOKEN='<TOKEN>'; docker compose --profile scan run --rm scanner
```
Si SonarQube no arranca en Linux/WSL: `sysctl -w vm.max_map_count=262144`.
Detener: `docker compose down` (agregue `-v` para borrar los datos de SonarQube).

## 6. Imágenes de equipos
Cada equipo tiene el campo `imageUrl` (BD). Las imágenes están en `frontend/public/equipment/`.
Para usar una foto propia, copie el archivo allí, cambie `imageUrl` en `backend/prisma/seed.ts` (ej. `/equipment/mi-foto.jpg`) y ejecute `npm run db:seed`.
Si un equipo no tiene imagen, el catálogo muestra "Sin imagen".

