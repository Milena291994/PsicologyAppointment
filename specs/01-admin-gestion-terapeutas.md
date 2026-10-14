# SPEC 01 — Rol admin y gestión de terapeutas

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-10-13
> **Objetivo:** Añadir un rol `admin` que, desde `/admin/terapeutas`, crea, edita y activa/desactiva terapeutas (datos profesionales, valor de consulta y credenciales de acceso).

## Por qué existe esta spec

Hoy toda la app lee los terapeutas directamente de `APP_CONFIG.specialists`, una constante. Los lugares son `Step1Date`, `BookingPage`, `AppointmentsPage`, `AuthLayout` y `loginTherapist`. Para que los cambios del admin se vean en el resto del flujo, la lista de terapeutas y sus cuentas pasa a vivir en `usePatientStore`. `APP_CONFIG` queda solo como estado inicial.

## Alcance

**Dentro:**

- Nuevo rol `"admin"` en `UserRole`, con sesión en `usePatientStore` (`currentAdmin`, `loginAdmin`).
- Cuentas admin mock en `APP_CONFIG.adminAccounts` (cédula + contraseña `1234`).
- Pantalla de login separada en `/admin/login` (no aparece como pestaña en `/login`).
- Pantalla `/admin/terapeutas` dentro de `AppLayout`, con una tabla de terapeutas y un Dialog con el formulario para crear y editar.
- Campos editables por el admin: `name`, `title`, `registry`, `experienceYears`, `price`, cédula de acceso (`identification`) y contraseña.
- Activar/desactivar un terapeuta (`active: boolean`).
- Un terapeuta desactivado no aparece al reservar ni al reprogramar, y **no puede iniciar sesión**.
- `specialists` y `therapistAccounts` se mueven a `usePatientStore`, y todos los consumidores leen del store.
- `AppointmentsPage` compara el precio nuevo contra `appt.amountPaid` (el precio pagado) en lugar del precio actual del terapeuta original.
- Persistencia en memoria (zustand), igual que pacientes y citas: los cambios se pierden al recargar.

**Fuera de alcance (para futuras specs):**

- Persistencia real (Supabase) o en `localStorage`.
- Eliminar terapeutas de verdad (solo se desactivan).
- Editar `avatar`, `about`, `sessionDuration`, `languages`, `currency`, `rating` o `reviewsCount` desde el admin.
- Sistema de reseñas o valoraciones.
- Gestión de pacientes, citas u horarios por parte del admin.
- CRUD de cuentas admin (la cuenta es fija en el mock).
- Versión legacy en vanilla JS (`index.html`, `js/app.js`, `js/data.js`): no se toca.

## Modelo de datos

```ts
// src/types/index.ts
export type UserRole = "patient" | "therapist" | "admin";

export interface Specialist {
  // ...campos actuales sin cambios...
  /** false = oculto al reservar/reprogramar y sin acceso al login. */
  active: boolean;
}

/** Cuenta de administrador. Solo para el demo, ver CLAUDE.md. */
export interface AdminAccount {
  id: string;
  name: string;
  identification: string;
  password: string;
}

export interface AppConfig {
  // ...
  adminAccounts: AdminAccount[];
}
```

```ts
// src/data/mockData.ts
adminAccounts: [
  { id: "adm1", name: "Administración Psicología y Mente", identification: "0999999999", password: "1234" },
],
// Los specialists existentes reciben active: true.
```

```ts
// src/store/usePatientStore.ts — se añade al estado
export interface TherapistInput {
  name: string;
  title: string;
  registry: string;
  experienceYears: number;
  price: number;
  identification: string;
  /** Obligatoria al crear; al editar, "" = mantener la actual. */
  password: string;
}

specialists: Specialist[];               // inicial: APP_CONFIG.specialists
therapistAccounts: TherapistAccount[];   // inicial: APP_CONFIG.therapistAccounts
currentAdmin: AdminAccount | null;       // excluyente con currentPatient / currentTherapist

loginAdmin: (identification: string, password: string) => boolean;
createTherapist: (data: TherapistInput) => { ok: boolean; error?: string };
updateTherapist: (id: string, data: TherapistInput) => { ok: boolean; error?: string };
setTherapistActive: (id: string, active: boolean) => void;
```

Valores por defecto de un terapeuta nuevo (campos que el admin no edita):

- `id`: `nextId("sp")`.
- `avatar: ""`. `Step1Date` muestra un círculo con las iniciales cuando está vacío.
- `about: ""`, `sessionDuration: "50 minutos"`, `languages: ["Español"]`.
- `rating: 0`, `reviewsCount: 0`. `Step1Date` no muestra la valoración cuando `reviewsCount === 0`.
- `currency: "USD"`, `currencySymbol: "$"`, `active: true`.

Validaciones (en el store; el formulario muestra el `error` con `toast.error`):

- Todos los campos son obligatorios, excepto la contraseña al editar.
- `price > 0` con 2 decimales como máximo.
- `experienceYears` es un entero `>= 0`.
- `identification` tiene exactamente 10 dígitos y es única entre `therapistAccounts` (se excluye la propia cuenta al editar).

Rutas nuevas en `src/routes/paths.ts`:

- `ROUTES.adminLogin = "/admin/login"`
- `ROUTES.adminTherapists = "/admin/terapeutas"`
- `homePathForRole("admin")` devuelve `ROUTES.adminTherapists`.

## Plan de implementación

1. **Tipos y mock.** Añadir `"admin"` a `UserRole`, `active` a `Specialist`, `AdminAccount` y `AppConfig.adminAccounts`. En `mockData.ts`, poner `active: true` en los tres specialists y añadir `adminAccounts`. Comprobación: `npm run build` compila.
2. **Terapeutas en el store.** Añadir `specialists` y `therapistAccounts` a `usePatientStore`, inicializados desde `APP_CONFIG`. `loginTherapist` lee del store y rechaza a los terapeutas con `active === false`. Comprobación: el login de terapeuta sigue funcionando.
3. **Consumidores leen del store.** Cambiar `APP_CONFIG.specialists` por el `specialists` del store en `BookingPage`, `Step1Date`, `AppointmentsPage` y `AuthLayout`. En los listados de selección (`Step1Date` y el selector de reprogramación de `AppointmentsPage`) filtrar `active`. `findTherapist` en `AppointmentsPage` sigue buscando entre todos, para poder mostrar el nombre en citas antiguas. `AuthLayout` cuenta solo los activos. Comprobación: reservar y reprogramar funcionan igual que antes.
4. **Precio pagado al reprogramar.** En `AppointmentsPage`, `priceChanged` compara `appt.amountPaid` con `newTherapist.price`, y el texto "la cita original se pagó a …" usa `amountPaid`. Comprobación: el aviso aparece solo si el precio difiere del pagado.
5. **Placeholder sin avatar ni reseñas.** En `Step1Date`, mostrar las iniciales si `avatar` está vacío y ocultar la valoración si `reviewsCount === 0`. Comprobación visual con un specialist mock modificado temporalmente.
6. **Sesión admin.** Añadir `currentAdmin` y `loginAdmin` (contra `APP_CONFIG.adminAccounts`) a `usePatientStore`. `logout` limpia también `currentAdmin`, y `login`, `loginTherapist` y `register` lo ponen en `null`. Añadir `ROUTES.adminLogin`, `ROUTES.adminTherapists` y el caso `admin` en `homePathForRole`.
7. **Login admin y ruta protegida.** Crear `src/pages/AdminLoginPage.tsx` (cédula + contraseña, con el mismo `AuthLayout` que `LoginPage`, sin pestañas de rol). En `app.router.tsx`:
   - Registrar `/admin/login` bajo `GuestOnly`.
   - Registrar `/admin/terapeutas` bajo `RequireRole role="admin"` dentro de `AppLayout`, con un placeholder de la página.
   - Hacer que `RequireRole` redirija a `ROUTES.adminLogin` (no a `ROUTES.login`) cuando el rol requerido es `admin` y no hay sesión.

   Comprobación: entrar con la cuenta admin lleva a `/admin/terapeutas`.
8. **Navegación del admin.** En `Sidebar`, añadir `adminNavItems` ("Terapeutas") cuando `role === "admin"`. En `Header`, al cerrar sesión, ir a `ROUTES.adminLogin` si el rol era `admin`.
9. **Acciones del store.** Implementar `createTherapist`, `updateTherapist` y `setTherapistActive` con las validaciones descritas. Crear y editar actualizan juntos `specialists` y `therapistAccounts` (vinculados por `specialistId`).
10. **Página `AdminTherapistsPage`.** Crear `src/pages/AdminTherapistsPage.tsx`:
    - Una tabla (`components/ui/table`) con las columnas nombre, título, registro, experiencia, precio, cédula de acceso, estado (`Badge` Activo/Inactivo) y acciones (Editar, Activar/Desactivar).
    - Un botón "Nuevo terapeuta" y "Editar" que abren el mismo `Dialog` con el formulario.
    - `toast.success` al guardar, cambiar el estado o crear.
11. **Documentación.** Actualizar la sección "Roles" de `CLAUDE.md` con el rol admin, `/admin/login`, `/admin/terapeutas` y el hecho de que `specialists` y `therapistAccounts` viven en `usePatientStore`.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores.
- [ ] En `/admin/login`, la cédula `0999999999` con la contraseña `1234` lleva a `/admin/terapeutas`.
- [ ] Credenciales incorrectas en `/admin/login` muestran un `toast.error` y no inician sesión.
- [ ] `/login` no muestra ninguna opción de admin.
- [ ] Un paciente o terapeuta que navega a `/admin/terapeutas` es redirigido a su propio inicio.
- [ ] Sin sesión, ir a `/admin/terapeutas` redirige a `/admin/login`.
- [ ] Un admin que navega a `/agendar` o `/terapeuta/agenda` es redirigido a `/admin/terapeutas`.
- [ ] La tabla lista los 3 terapeutas del mock con su precio actual.
- [ ] Si el admin cambia el precio de `sp1` a `60`, el paciente ve `$60.00` en `Step1Date`, `BookingSummary`, `Step4Payment` y `PayphoneModal` para una reserva nueva.
- [ ] Tras ese cambio, una cita existente con `sp1` conserva su `amountPaid` original (`45`).
- [ ] Al reprogramar esa cita al mismo `sp1`, aparece el aviso de diferencia: pagó `$45.00` y la sesión ahora cuesta `$60.00`. El aviso aparece solo cuando `amountPaid !== newTherapist.price`.
- [ ] Un terapeuta creado por el admin aparece en `Step1Date` con iniciales en lugar de foto y sin valoración.
- [ ] Un terapeuta creado por el admin puede iniciar sesión en `/login` (pestaña Terapeuta) con la cédula y la contraseña asignadas, y ve su agenda.
- [ ] Crear un terapeuta con una cédula ya usada por otro terapeuta muestra un `toast.error` y no lo crea.
- [ ] Precio `0`, negativo o con 3 decimales, y experiencia negativa o decimal, muestran un `toast.error` y no guardan.
- [ ] Editar dejando la contraseña vacía conserva la contraseña anterior.
- [ ] Desactivar un terapeuta lo oculta de `Step1Date` y del selector de reprogramación de `AppointmentsPage`.
- [ ] Un terapeuta desactivado no puede iniciar sesión.
- [ ] Las citas existentes de un terapeuta desactivado siguen mostrando su nombre en "Mis citas" del paciente.
- [ ] Reactivar al terapeuta lo vuelve a mostrar en `Step1Date` y le devuelve el acceso al login.
- [ ] `AuthLayout` muestra el número de terapeutas activos.
- [ ] Al cerrar sesión como admin se vuelve a `/admin/login`.
- [ ] Ningún componente fuera de `usePatientStore` lee `APP_CONFIG.specialists` ni `APP_CONFIG.therapistAccounts`. La excepción es `mockData.ts` para generar `SEED_APPOINTMENTS`.

## Decisiones

- **Sí:** persistencia en memoria con zustand. Es coherente con el resto del demo; recargar restaura el mock.
- **No:** `localStorage`. Añade versionado y migración del mock sin aportar al demo.
- **No:** Supabase en esta spec. Requiere esquema, RLS y auth reales; va en su propia spec.
- **Sí:** desactivar en vez de eliminar. Las citas referencian `therapistId`, y borrar dejaría citas huérfanas.
- **Sí:** un terapeuta desactivado tampoco puede iniciar sesión. Es una decisión explícita del usuario: es un bloqueo total.
- **Sí:** el admin gestiona las credenciales en el mismo formulario. Sin esto, un terapeuta nuevo no podría entrar a su agenda.
- **Sí:** solo se editan `name`, `title`, `registry`, `experienceYears` y `price`, además de las credenciales. El resto usa valores por defecto.
- **No:** editar `rating` o `reviewsCount`. No existe un sistema de reseñas, y el admin no debe inventar valoraciones.
- **Sí:** el precio pagado vive en la cita (`amountPaid`, ya existente). Cambiar el precio solo afecta a las reservas nuevas.
- **Sí:** login admin en una ruta separada `/admin/login`. Así el acceso admin queda fuera de la pantalla pública.
- **No:** una tercera pestaña en `/login`.
- **Sí:** todo el estado (terapeutas, cuentas, sesión admin) en `usePatientStore`, por decisión del usuario. Se descartó un `useTherapistStore` separado.
- **Sí:** tabla + Dialog de formulario, siguiendo el patrón de `TherapistAgendaPage`.
- **No:** una página de detalle por terapeuta. Son demasiadas rutas para pocos campos.
- **Sí:** cuenta admin con cédula + `1234` en `APP_CONFIG.adminAccounts`, el mismo patrón que `therapistAccounts`.
- **Sí:** las validaciones viven en las acciones del store, igual que `register` y `addDependent`.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Queda algún consumidor leyendo `APP_CONFIG.specialists` y no ve los cambios del admin. | Hay un criterio de aceptación explícito; buscar con grep `APP_CONFIG.specialists` y `APP_CONFIG.therapistAccounts` antes de cerrar. |
| `usePatientStore` crece y mezcla dominios. | Se acepta por decisión explícita. Si crece más, separarlo en otra spec. |
| Se desactiva a un terapeuta seleccionado en una reserva en curso. | No aplica en el demo: admin y paciente no comparten sesión simultánea en la misma pestaña. |
| Los cambios se pierden al recargar. | Es el comportamiento esperado del demo. La persistencia real va en la spec de Supabase. |

## Lo que **no** entra en esta spec

- Persistencia (Supabase o `localStorage`).
- Eliminar terapeutas.
- Editar foto, descripción, duración, idiomas, moneda, valoración o reseñas.
- Sistema de reseñas.
- Gestión de pacientes, citas u horarios por parte del admin.
- CRUD de cuentas admin.
- Cambios en la versión legacy vanilla JS.

Cada uno de estos, si llega, va en su propia spec.
