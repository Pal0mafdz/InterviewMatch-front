# InterviewMatch Frontend — Diseño y Especificación MVP

**Fecha:** 2026-03-14
**Autor:** Claude Code (brainstorming session)
**Estado:** Aprobado por usuario
**Revisado:** 2026-03-14 — actualizado con datos reales del repo backend

---

## 1. Visión General

InterviewMatch es una plataforma donde desarrolladores practican mock interviews emparejándose entre sí. Los usuarios se registran, suben su CV, y se apuntan a fechas de práctica. El sistema empareja participantes automáticamente. Cada persona puede ver quién es su compañero y descargar su CV.

---

## 2. Backend (Referencia)

| Detalle | Valor |
|---------|-------|
| Framework | Express.js 5.2.1 + MongoDB + Mongoose |
| Puerto | 5000 |
| Auth | JWT Bearer token (30 días) |
| Base URL | `http://localhost:5000/api` |
| Archivos estáticos | `http://localhost:5000/uploads/cvs/` |
| CORS | Abierto a todos los orígenes (sin restricciones) |
| Ruta local | `/Users/palomafernandez/Developer/InterviewMatch-back` |

### Roles de usuario

El modelo `User` tiene tres roles en su enum:

- `user` — usuario normal (por defecto al registrarse)
- `interviewer` — rol intermedio (no tiene endpoints especiales en MVP, tratar igual que `user` en el frontend)
- `admin` — puede crear sesiones, publicar shuffle, ver stats, gestionar matches

Para los guards del frontend usar `user.rol === 'admin'` para rutas admin, y cualquier otro rol tiene acceso de usuario normal.

### Estados de sesión

```
abierta → publicada → finalizada/cancelada
```

- `abierta`: usuarios pueden inscribirse, admin puede hacer matches manuales
- `publicada`: matches visibles para usuarios, no se aceptan más inscripciones
- `finalizada`: sesión terminada (solo informativo)
- `cancelada`: sesión cancelada (solo informativo)

---

## 3. Scope MVP

### Vistas de Usuario
- Registro y login
- Perfil (ver info + bio + subir CV en PDF)
- Listado de sesiones abiertas
- Detalle de sesión + inscribirse (1, 2 o 3 mocks)
- Ver pareja(s) asignada(s) cuando sesión publicada + descargar su CV

### Vistas de Admin (básico)
- Listado de todas las sesiones con stats
- Crear nueva sesión
- Ver detalle de sesión con stats + publicar shuffle

---

## 4. Stack Tecnológico Frontend

| Capa | Tecnología |
|------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite (inicializar con `bash scripts/init-artifact.sh interviewmatch`) |
| Estilos | **98.css** (Windows 98 aesthetic) |
| Routing | react-router-dom v6 |
| Estado auth | React Context + localStorage |
| HTTP | fetch nativo con wrapper tipado |

**¿Por qué 98.css?** Decisión estética del cliente: la app tendrá apariencia de aplicación Windows 98, lo cual le da personalidad única y resulta memorable para una plataforma de práctica entre developers.

**¿Por qué no shadcn/ui?** El template incluye shadcn/ui pero su sistema de diseño entraría en conflicto con 98.css. Se usa 98.css como sistema primario y se ignora shadcn para el MVP.

---

## 5. Arquitectura de Archivos

```
src/
├── api/
│   ├── client.ts          # fetch wrapper con Auth header
│   ├── auth.ts            # login, register
│   ├── users.ts           # getProfile, uploadCV
│   ├── sessions.ts        # getSessions, register, cancel, createSession
│   └── matches.ts         # getMyMatch, getSessionMatches, publishShuffle
├── context/
│   └── AuthContext.tsx    # { user, token, login, logout }
├── hooks/
│   ├── useAuth.ts
│   ├── useSessions.ts
│   └── useMatches.ts
├── components/
│   ├── Win98Window.tsx    # wrapper .window con .title-bar
│   ├── ProtectedRoute.tsx
│   ├── AdminRoute.tsx
│   └── StatusBar.tsx      # barra inferior Win98
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── user/
│   │   ├── Sessions.tsx
│   │   ├── SessionDetail.tsx
│   │   ├── Profile.tsx
│   │   └── MyMatch.tsx
│   └── admin/
│       ├── AdminSessions.tsx
│       ├── CreateSession.tsx
│       └── AdminSessionDetail.tsx
├── router/
│   └── AppRouter.tsx
├── App.tsx
└── main.tsx
```

---

## 6. Rutas de la Aplicación

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/login` | Login | público |
| `/register` | Register | público |
| `/sessions` | Sessions | usuario |
| `/sessions/:id` | SessionDetail | usuario |
| `/sessions/:id/match` | MyMatch | usuario |
| `/profile` | Profile | usuario |
| `/admin/sessions` | AdminSessions | admin |
| `/admin/sessions/new` | CreateSession | admin |
| `/admin/sessions/:id` | AdminSessionDetail | admin |

---

## 7. Diseño Visual Windows 98

### Estructura base de cada página
```html
<div class="window" style="width: 800px; margin: 20px auto">
  <div class="title-bar">
    <div class="title-bar-text">InterviewMatch — [Nombre Sección]</div>
    <div class="title-bar-controls">
      <button aria-label="Minimize"></button>
      <button aria-label="Maximize"></button>
      <button aria-label="Close"></button>
    </div>
  </div>
  <div class="window-body">
    <!-- contenido -->
  </div>
</div>
```

### Componentes Win98 en uso
- **Formularios**: `field-row`, `field-row-stacked` para inputs y labels
- **Tablas**: `<div class="sunken-panel"><table class="interactive">`
- **Botones primarios**: clase `default`
- **Grupos de opciones**: `<fieldset>` con `<legend>`
- **Progreso/loading**: `<progress>`
- **Tabs de navegación**: `<menu role="tablist">`
- **Barra de estado**: `<div class="status-bar">` al fondo

### Layout general de la app
```
┌──────────────────────────────────────────────────┐
│ 🖥 InterviewMatch                      _ □ X     │
├──────────────────────────────────────────────────┤
│ [Sesiones] [Mi Perfil] [Mi Pareja] | [Admin ▼]  │
├──────────────────────────────────────────────────┤
│                                                  │
│         [contenido de la página]                 │
│                                                  │
├──────────────────────────────────────────────────┤
│ ana@mail.com    Sesión: Mock Marzo    Listo   ✓  │
└──────────────────────────────────────────────────┘
```

---

## 8. Tipos TypeScript (modelos del dominio)

Estas interfaces reflejan exactamente los campos del backend. Usar como fuente de verdad para tipado en `api/*.ts` y componentes.

```typescript
// Roles posibles — en MVP, solo 'admin' tiene rutas especiales
type UserRole = 'user' | 'interviewer' | 'admin';

// Respuesta del servidor tras login/register y en AuthContext
interface AuthUser {
  _id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  token: string; // solo en respuesta de login/register, no en getProfile
}

// Perfil completo (GET /users/profile)
interface UserProfile {
  _id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  cvPath: string;  // ruta relativa, ej: "/uploads/cvs/userId-ts-rand.pdf" — puede ser ''
  bio: string;     // puede ser ''
}

type SessionEstado = 'abierta' | 'publicada' | 'finalizada' | 'cancelada';

interface Session {
  _id: string;
  titulo: string;
  fechaProgramada: string; // ISO 8601
  estado: SessionEstado;
  publicadaAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SessionStats {
  sessionId: string;
  titulo: string;
  fechaProgramada: string;
  estado: SessionEstado;
  totalPersonasRegistradas: number;
  totalMocksActivas: number;
  totalParesActivos: number;
  totalMocksEmparejadas: number;
  totalMocksPendientes: number;
  totalParesManuales: number;
  totalParesShuffle: number;
}

type RegistrationEstado = 'activa' | 'cancelada';

interface Registration {
  _id: string;
  user: string;        // ObjectId
  session: string;     // ObjectId
  slotNumber: number;  // 1, 2 o 3
  estado: RegistrationEstado;
  cancelReason?: 'user-cancel' | 'user-reduction';
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type MatchEstado = 'activo' | 'cancelado';
type MatchSource = 'manual' | 'shuffle';

// Partner en getMyMatch — datos del compañero
interface MatchPartner {
  _id: string;
  nombre: string;
  email: string;
  bio: string;
  cvPath: string;  // para construir URL de descarga: "http://localhost:5000" + cvPath
}

// Un match dentro de getMyMatch
interface MyMatchItem {
  matchId: string;
  slotNumber: number;       // slot del usuario autenticado en este match
  enlaceReunion: string;    // puede ser ''
  partner: MatchPartner;
}

// Respuesta completa de GET /matches/session/:id/my-match
interface MyMatchResponse {
  totalMocks: number;
  matches: MyMatchItem[];
  // campos adicionales cuando totalMocks === 1 (single match):
  matchId?: string;
  enlaceReunion?: string;
  partner?: MatchPartner;
}

// Match en vista admin (GET /matches/session/:id)
interface AdminMatch {
  matchId: string;
  source: MatchSource;
  estado: MatchEstado;
  enlaceReunion: string;
  user1: { _id: string; nombre: string; email: string };
  user2: { _id: string; nombre: string; email: string };
  registration1: { _id: string; slotNumber: number };
  registration2: { _id: string; slotNumber: number };
}

// Respuesta de POST /matches/session/:id/shuffle
interface ShuffleResult {
  mensaje: string;
  sessionId: string;
  titulo: string;
  fechaProgramada: string;
  estado: SessionEstado;
  algoritmo: string;         // ej: "deterministic"
  totalPares: number;
  nuevosPares: number;
  totalPendientes: number;
  pendientesPorUsuario: number;
  personasPendientes: number;
  matches: AdminMatch[];
}

// Respuesta de POST/PUT /sessions/:id/register
interface RegisterResponse {
  operation: 'created' | 'updated' | 'unchanged';
  mensaje: string;
  mockCount: number;
  createdCount: number;
  cancelledCount: number;
  unmatchedCancelledCount: number;
  matchedCancelledCount: number;
  releasedMatchesCount: number;
  requeuedRegistrationsCount: number;
  registrations: Registration[];
}

// Respuesta de DELETE /sessions/:id/register
interface CancelRegistrationResponse {
  mensaje: string;
  cancelledCount: number;
  unmatchedCancelledCount: number;
  matchedCancelledCount: number;
  releasedMatchesCount: number;
  requeuedRegistrationsCount: number;
  remainingMockCount: number;
}

// Todos los errores del backend usan este formato
interface ApiError {
  mensaje: string;
  detalles?: unknown; // presente en algunos errores de validación
}
```

---

## 9. Capa API — Endpoints Usados

### 9.1 Auth

| Función | Método | Ruta | Auth | Status OK |
|---------|--------|------|------|-----------|
| `login` | POST | `/auth/login` | No | 200 |
| `register` | POST | `/auth/register` | No | 201 |

**Body register:**
```json
{ "nombre": "Ana", "email": "ana@mail.com", "password": "123456" }
```

**Body login:**
```json
{ "email": "ana@mail.com", "password": "123456" }
```

**Response (ambos):** `AuthUser` — `{ _id, nombre, email, rol, token }`

---

### 9.2 Usuario

| Función | Método | Ruta | Auth | Status OK |
|---------|--------|------|------|-----------|
| `getProfile` | GET | `/users/profile` | Bearer | 200 |
| `uploadCV` | POST | `/users/upload-cv` | Bearer | 200 |

**getProfile response:** `UserProfile` — `{ _id, nombre, email, rol, cvPath, bio }`

**uploadCV:** multipart/form-data, campo `cv`, solo PDF, máx 5MB

**uploadCV response:**
```json
{ "mensaje": "CV subido correctamente", "user": { /* UserProfile */ } }
```

**URL de descarga de CV:**
```
http://localhost:5000{cvPath}
// Ejemplo: cvPath = "/uploads/cvs/64a1b2c-1710000000000-123.pdf"
// URL final: "http://localhost:5000/uploads/cvs/64a1b2c-1710000000000-123.pdf"
```

---

### 9.3 Sesiones

| Función | Método | Ruta | Auth | Status OK |
|---------|--------|------|------|-----------|
| `getSessions` | GET | `/sessions` | Bearer | 200 |
| `registerForSession` | POST | `/sessions/:id/register` | Bearer | 201 (create) / 200 (update) |
| `updateRegistration` | PUT | `/sessions/:id/register` | Bearer | 200 |
| `cancelRegistration` | DELETE | `/sessions/:id/register` | Bearer | 200 |
| `createSession` | POST | `/sessions` | Admin | 201 |
| `getSessionStats` | GET | `/sessions/:id/stats` | Admin | 200 |

**getSessions response:** `Session[]` ordenada por fecha

**registerForSession / updateRegistration body:** `{ "mockCount": 1 | 2 | 3 }`

**registerForSession response:** `RegisterResponse`

> Nota: POST y PUT en `/sessions/:id/register` invocan el mismo handler. POST crea inscripción nueva, PUT actualiza slots. En la práctica usar POST para ambas operaciones es suficiente para el MVP.

**cancelRegistration query params:**
- `?all=true` — cancela todos los mocks del usuario en la sesión
- `?count=N` — cancela N mocks (elimina primero los no emparejados)
- Sin params — cancela 1 mock

**cancelRegistration response:** `CancelRegistrationResponse`

**createSession body:**
```json
{ "titulo": "Mock Backend Marzo", "fechaProgramada": "2026-03-20T18:00:00.000Z" }
```

**createSession response:** `Session`

**getSessionStats response:** `SessionStats`

---

### 9.4 Matches

| Función | Método | Ruta | Auth | Status OK |
|---------|--------|------|------|-----------|
| `getMyMatch` | GET | `/matches/session/:id/my-match` | Bearer | 200 |
| `getSessionMatches` | GET | `/matches/session/:id` | Admin | 200 |
| `publishShuffle` | POST | `/matches/session/:id/shuffle` | Admin | 201 |
| `updateMeetingLink` | PUT | `/matches/:matchId/meeting-link` | Admin | 200 |
| `createManualMatch` | POST | `/matches/session/:id/manual` | Admin | 201 |
| `removeManualMatch` | DELETE | `/matches/session/:id/manual/:matchId` | Admin | 200 |

**getMyMatch response:** `MyMatchResponse`

- Si la sesión no está publicada → 404 con `{ mensaje: "..." }`
- Si `totalMocks === 1`: los campos `matchId`, `enlaceReunion` y `partner` están al nivel raíz además de en `matches[0]`
- Si `totalMocks > 1`: solo el array `matches[]` — iterar para mostrar una card por slot

**getSessionMatches query params (todos opcionales):**
- `view=all|matched|unmatched` (default: `all`)
- `source=all|manual|shuffle` (default: `all`)

**getSessionMatches response:**
```typescript
{
  sessionId: string;
  titulo: string;
  fechaProgramada: string;
  estado: SessionEstado;
  view: string;
  source: string;
  totalRegistrosActivos: number;
  totalPersonasRegistradas: number;
  totalMatchesActivos: number;
  totalMocksEmparejadas: number;
  totalMocksPendientes: number;
  matches: AdminMatch[];
  unmatched: Array<{
    registrationId: string;
    userId: string;
    nombre: string;
    email: string;
    slotNumber: number;
  }>;
}
```

**publishShuffle response:** `ShuffleResult`

**updateMeetingLink body:** `{ "enlaceReunion": "https://meet.google.com/abc-defg-hij" }`

**updateMeetingLink response:** `{ mensaje: string; match: AdminMatch }`

**createManualMatch body:** `{ "registrationId1": "...", "registrationId2": "..." }`

---

## 10. Flujo de Autenticación

```
App carga → leer token de localStorage
         → si existe: GET /users/profile → rehidratar user en contexto
         → si falla (token expirado): limpiar y redirigir a /login

Login exitoso → guardar token en localStorage → guardar user en contexto
Logout → limpiar localStorage → resetear contexto → redirigir a /login

ProtectedRoute: si !token → <Navigate to="/login" />
AdminRoute: si user.rol !== 'admin' → <Navigate to="/sessions" />
```

**Clave de localStorage:** `token` (string del JWT)

**El token se envía así:**
```
Authorization: Bearer <token>
```

---

## 11. Comportamiento por Pantalla

### SessionDetail.tsx

Para saber si el usuario está inscrito: llamar `GET /sessions` y buscar el id, luego `GET /sessions/:id/register` no existe — el estado de inscripción se infiere de la lista de registros que devuelve `registerForSession`. Alternativa práctica: mantener estado local tras cada operación de registro/cancelación.

**Flujo recomendado:**
1. Cargar sesión desde la lista de sesiones (ya disponible)
2. Intentar GET my-match para saber si hay inscripción activa (si 404 → no inscrito, si 200 → inscrito)
3. Actualizar estado local tras cada acción

**Estados:**
- Sesión `abierta` + usuario NO inscrito → radio buttons (1/2/3 mocks) + botón "Inscribirse"
- Sesión `abierta` + usuario inscrito → muestra nº mocks actuales, radio para cambiar + botón "Cancelar inscripción"
- Sesión `publicada` → enlace "Ver mi pareja" hacia `/sessions/:id/match`
- Sesión `finalizada` o `cancelada` → mensaje informativo

> Para saber cuántos mocks tiene el usuario en una sesión abierta, usar `RegisterResponse.mockCount` que devuelve el total actual tras cualquier operación de registro.

### MyMatch.tsx

- Llama GET `/matches/session/:id/my-match`
- Si `totalMocks === 1`: card única con nombre, email, bio, enlace reunión, botón descarga CV
- Si `totalMocks > 1`: lista de cards (una por slot) con pareja de cada slot — iterar `matches[]`
- CV se descarga via `<a href={"http://localhost:5000" + partner.cvPath} download>`
- Si `partner.cvPath === ''`: botón de descarga deshabilitado / oculto
- Si sesión no publicada (404): mensaje "Los emparejamientos aún no se han publicado"
- Si enlaceReunion vacío: no mostrar o mostrar como pendiente

### AdminSessionDetail.tsx

- Llama GET `/sessions/:id/stats` para mostrar: personas, mocks activos, pares, pendientes
- Botón "Publicar Shuffle" solo si `estado === 'abierta'`
- Al hacer clic → diálogo de confirmación Win98 → POST `/matches/session/:id/shuffle`
- Muestra `ShuffleResult`: nuevos pares (`nuevosPares`), pendientes (`totalPendientes`)
- Tras publicar, el estado de la sesión cambia a `publicada` — re-fetch o actualizar estado local

### Profile.tsx

- Llama GET `/users/profile` al montar
- Muestra: nombre, email, rol, bio (puede estar vacía)
- Si `cvPath !== ''`: botón para ver/descargar CV actual (`http://localhost:5000` + cvPath)
- Formulario de subida: input file (accept=".pdf"), máx 5MB, campo `cv`
- `uploadCV` usa FormData con `formData.append('cv', file)`
- No incluir `Content-Type` header en la petición — el browser lo pone con boundary automático

---

## 12. Manejo de Errores

- Todos los errores del backend vienen en `{ mensaje: string }` — en español
- Algunos errores incluyen `detalles` adicionales (ignorar en MVP)
- Mostrar errores como ventanas de diálogo Win98 secundarias o en el mismo formulario
- HTTP 401 → redirigir a `/login` (token expirado o inválido)
- HTTP 403 → mostrar "Sin permisos suficientes"
- HTTP 404 → mostrar mensaje descriptivo (usar `error.mensaje` del backend)
- HTTP 400 → mostrar `error.mensaje` en el formulario correspondiente

**Códigos frecuentes por endpoint:**

| Situación | Código |
|-----------|--------|
| Token inválido / expirado | 401 |
| Usuario bloqueado (login) | 403 |
| No es admin | 403 |
| Sesión no encontrada | 404 |
| Match no publicado | 404 |
| mockCount inválido (no 1/2/3) | 400 |
| Sesión no abierta (al inscribirse) | 400 |
| Archivo no PDF | 400 |
| Email ya registrado | 400 |

---

## 13. Plan de Implementación por Fases

### Fase 0 — Setup del proyecto
1. `bash scripts/init-artifact.sh interviewmatch`
2. `npm install 98.css react-router-dom`
3. Importar `98.css` en `main.tsx`
4. CSS global: fondo teal (#008080), contenido centrado

### Fase 1 — Infraestructura
5. `api/client.ts` — fetch wrapper tipado con Bearer token y manejo de 401
6. `api/auth.ts`, `api/users.ts`, `api/sessions.ts`, `api/matches.ts`
7. `context/AuthContext.tsx` + rehidratación desde localStorage
8. `components/Win98Window.tsx`, `ProtectedRoute.tsx`, `AdminRoute.tsx`
9. `router/AppRouter.tsx` con todas las rutas y guards
10. `App.tsx` con providers

### Fase 2 — Auth
11. `pages/auth/Login.tsx`
12. `pages/auth/Register.tsx`

### Fase 3 — Vistas Usuario
13. `pages/user/Sessions.tsx`
14. `pages/user/SessionDetail.tsx`
15. `pages/user/Profile.tsx`
16. `pages/user/MyMatch.tsx`

### Fase 4 — Admin Básico
17. `pages/admin/AdminSessions.tsx`
18. `pages/admin/CreateSession.tsx`
19. `pages/admin/AdminSessionDetail.tsx`

### Fase 5 — Pulido
20. `components/StatusBar.tsx`
21. Navegación principal con tabs Win98
22. Mensajes de loading con `<progress>`

---

## 14. Verificación

### Prerrequisitos
```bash
# Terminal 1 — Backend
cd ~/Developer/InterviewMatch-back
node server.js  # corre en :5000

# Terminal 2 — Frontend
cd ~/Developer/interviewMatch-front
npm run dev     # corre en :5173
```

### Checklist de prueba
- [ ] Registro de usuario nuevo
- [ ] Login y persistencia al refrescar página
- [ ] Subir CV en perfil (PDF < 5MB)
- [ ] Ver CV subido (enlace de descarga disponible)
- [ ] Ver lista de sesiones abiertas
- [ ] Inscribirse con 1 mock
- [ ] Cambiar inscripción a 3 mocks
- [ ] Cancelar inscripción
- [ ] Admin: crear sesión nueva
- [ ] Admin: ver stats de sesión
- [ ] Admin: publicar shuffle
- [ ] Usuario: ver pareja asignada
- [ ] Usuario: ver bio de la pareja
- [ ] Usuario: descargar CV de pareja
- [ ] Enlace de reunión visible si está disponible
- [ ] Logout limpia sesión
- [ ] Rutas protegidas redirigen si no hay token
- [ ] Rutas admin redirigen si no es admin
- [ ] Error 401 en cualquier ruta redirige a /login
