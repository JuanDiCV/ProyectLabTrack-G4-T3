# LabTrack — Gestión de Préstamos de Laboratorios Universitarios

Monorepo (NPM Workspaces) del curso **Calidad y Pruebas de Software**.

| Carpeta     | Contenido |
|-------------|-----------|
| `backend/`  | API REST: Node.js + Express 5 + TypeScript + Prisma (SQLite) + Zod + bcryptjs + JWT + node-cache |
| `frontend/` | React 18 + Vite + TypeScript + TailwindCSS + Axios + React Router + fondo 3D (@react-three/fiber) |
| `qa/`       | E2E con Selenium WebDriver (`qa/selenium`) y prueba de carga JMeter (`qa/jmeter`) |
| raíz        | `sonar-project.properties` para SonarQube |

## Requisitos
- Node.js ≥ 20 (probado con Node 24 / npm 12)
- Google Chrome (para Selenium; el driver lo descarga Selenium Manager automáticamente)
- Apache JMeter 5.6+ (solo para CP-013)
- SonarQube + `sonar-scanner` (opcional)

## 1. Instalación y base de datos
```bash
npm run setup
```
Esto ejecuta `npm install` y luego `npm run db:setup -w backend`, que:
1. Crea `backend/.env` desde `.env.example` con un `JWT_SECRET` aleatorio (no hay secretos en el código).
2. Crea la BD SQLite (`prisma db push`).
3. Carga los datos semilla (`prisma/seed.ts`): Juan Pérez `20261001` / `Estudiante123`, Admin `ADMIN001` / `Admin123` y los 4 equipos.

> npm 12 bloquea los scripts de instalación por defecto. Prisma y esbuild ya están aprobados en `allowScripts`
> del `package.json` raíz. Si actualiza sus versiones, apruébelos de nuevo con
> `npm install-scripts approve @prisma/client prisma @prisma/engines esbuild`.

Para reiniciar los datos (desbloquea cuentas, borra reservas): `npm run db:seed`.

## 2. Levantar el proyecto
```bash
npm run dev
```
- API: http://localhost:4000/api (salud: `/api/health`)
- Web: http://localhost:5173 (Vite redirige `/api` al backend)

## 3. Pruebas unitarias (CP-001 a CP-030) con cobertura
```bash
npm test                 # Vitest
npm run test:coverage    # genera backend/coverage/lcov.info (+ reporte HTML)
```
| Archivo | Casos |
|---|---|
| `backend/tests/unit/hu01-auth.unit.test.ts` | CP-001 … CP-006 |
| `backend/tests/unit/hu02-catalog.unit.test.ts` | CP-007 … CP-012 |
| `backend/tests/unit/hu03-reservations.unit.test.ts` | CP-014 … CP-019 |
| `backend/tests/unit/hu04-admin.unit.test.ts` | CP-020 … CP-024 |
| `backend/tests/unit/hu05-returns.unit.test.ts` | CP-025 … CP-030 |

Los servicios se prueban con repositorios en memoria (`tests/helpers/in-memory.ts`) y un **reloj inyectable**
(`FixedClock` de `src/shared/clock.ts`) para fijar la hora exacta (10:30 / 11:00 / 11:30 en HU-05).

## 4. Pruebas E2E con Selenium (HU-01 y HU-03)
Con `npm run dev` corriendo, en otra terminal:
```bash
npm run e2e              # seed → login → reservas → bloqueo → seed
HEADLESS=false npm run e2e   # (bash) para ver el navegador
```
En PowerShell: `$env:HEADLESS='false'; npm run e2e`.

| Script | Cubre |
|---|---|
| `01-login.e2e.test.mjs` | CP-001…CP-004, ingreso de admin, el canvas 3D no bloquea el formulario |
| `02-reservation.e2e.test.mjs` | Filtro HU-02, CP-014, CP-018, aprobación (HU-04) y devolución (HU-05) |
| `03-lockout.e2e.test.mjs` | CP-005, CP-006 (bloqueo; el seed final desbloquea la cuenta) |

Variables opcionales: `E2E_BASE_URL`, `E2E_STUDENT_CODE`, `E2E_STUDENT_PASSWORD`, `E2E_ADMIN_CODE`, `E2E_ADMIN_PASSWORD`.

## 5. Prueba de carga JMeter (CP-013)
Con el backend corriendo:
```bash
cd qa
jmeter -n -t jmeter/CP-013-catalog-load.jmx -l jmeter/results/cp013.jtl -e -o jmeter/report
# o: npm run jmeter -w qa
```
- 50 hilos, rampa de 5 s, duración de 60 s, `GET /api/catalog` y `GET /api/catalog?category=Cómputo`.
- Aserciones: HTTP 200 y `$.total == 4`. Criterio: **0 % de errores** (ver `qa/jmeter/report/index.html`).
- Parámetros: `-Jhost=localhost -Jport=4000 -Jusers=50 -Jduration=60 -Jrampup=5`.

El catálogo usa caché en memoria (`node-cache`, TTL configurable con `CATALOG_CACHE_TTL_SECONDS`) que se
invalida al aprobar o devolver equipos. Verificación rápida sin JMeter: `npm run load:smoke -w qa`.

## 6. SonarQube
```bash
npm run test:coverage
sonar-scanner -Dsonar.host.url=http://localhost:9000 -Dsonar.token=<TOKEN>
```
`sonar-project.properties` apunta a `backend/src`, `frontend/src` y a los `lcov.info`.

## Arquitectura del backend
```
backend/src/
├── app.ts / server.ts          # composition root / arranque
├── middlewares/                # auth (JWT + roles), errores
├── shared/                     # dominio, clock, errores, caché, seguridad, tiempo, mensajes
└── modules/<modulo>/           # auth | catalog | reservations | returns
    ├── *.routes.ts             # endpoints Express
    ├── *.schema.ts             # validaciones Zod
    ├── *.controller.ts         # req/res y códigos HTTP
    ├── *.service.ts            # lógica de negocio pura (sin Express)
    └── *.repository.ts         # interfaz + implementación Prisma
```

### Endpoints
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | — | Login (400 / 401 / 423) |
| GET | `/api/auth/me` | autenticado | Usuario actual |
| GET | `/api/catalog?category=` | — | Catálogo con caché (HU-02) |
| POST | `/api/reservations` | STUDENT | Crear reserva (HU-03, 409 en conflictos) |
| GET | `/api/reservations/me` | STUDENT | Mis reservas |
| GET | `/api/admin/reservations/pending` | ADMIN | Solicitudes pendientes (HU-04) |
| PATCH | `/api/admin/reservations/:id/approve` | ADMIN | Aprobar → equipo "Prestado" |
| PATCH | `/api/admin/reservations/:id/reject` | ADMIN | Rechazar (motivo obligatorio, 400) |
| GET | `/api/returns/active?q=` | ADMIN | Reservas activas por nombre/código (HU-05) |
| POST | `/api/returns/:id` | ADMIN | Marcar devolución (+ penalización automática) |

### Decisiones de negocio
- **Bloqueo (HU-01):** 3 intentos fallidos consecutivos → `isLocked=true`, `lockedUntil = ahora + LOCK_MINUTES` (15 min) y HTTP 423. Un ingreso exitoso reinicia el contador; al expirar el bloqueo, la cuenta se libera sola.
- **Disponibilidad por bloque horario (HU-03):** el estado "Prestado" se evalúa por horario contra reservas **Aprobadas** (`newStart < existingEnd && newEnd > existingStart`). Si la reserva aprobada cubre todo el horario pedido se informa que el equipo figura como "Prestado"; si solo se superpone parcialmente, se informa cruce de horarios. Ambos casos responden 409.
- **Simultaneidad:** se comparan las reservas Pendientes y Aprobadas del estudiante en la misma fecha.
- **Extras:** no se permite reservar en el pasado ni a estudiantes "Penalizados".
- **Penalización (HU-05):** solo si `ahora > horaFinAcordada` (estrictamente). Devolver a las 11:00 exactas no penaliza.
