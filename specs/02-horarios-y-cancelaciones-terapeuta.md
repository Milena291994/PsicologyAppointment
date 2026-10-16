# SPEC 02 — Horario semanal y cancelaciones del terapeuta

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-15
> **Objetivo:** Que el terapeuta pueda configurar su horario por día (hora desde, hora hasta e intervalo de cita), bloquear tramos de horario o días completos, y ver y reprogramar sus citas canceladas, siempre solo sobre sus propias citas.

## Por qué existe esta spec

Antes de esta spec, los horarios eran globales (`APP_CONFIG.defaultSlots`, una lista fija) y el domingo estaba cerrado para todos (`disabledDaysOfWeek`). Además, `Step2Time` no comprobaba si un horario ya estaba ocupado. `Appointment` tampoco tenía estado.

Para que el terapeuta controle su disponibilidad hacen falta cuatro cosas:

- un horario por terapeuta, definido como **rango por día + intervalo de cita**;
- bloqueos de tramos o de días completos;
- un estado de cancelación en la cita;
- que la reserva, las reprogramaciones, Ingresos y "Mis citas" respeten todo lo anterior.

**Regla transversal:** el terapeuta solo gestiona citas con `therapistId === currentTherapist.id`. La regla se aplica en las acciones del store, no solo en la UI.

### Revisión del 2026-10-15

La primera versión de esta spec definía el horario marcando casillas sobre la lista fija `APP_CONFIG.defaultSlots`, y esa versión ya está implementada en la rama `spec-02-horarios-y-cancelaciones-terapeuta`. El usuario pidió cambiar el modelo a **hora desde, hora hasta e intervalo**, con **bloqueos de horario por fecha**, y abrir los domingos a decisión del terapeuta.

Esta revisión reemplaza el modelo de horario. Todo lo demás que ya está implementado se conserva: cancelaciones, filtro de "Mi agenda", Ingresos, la vista del paciente y la validación de pertenencia. El plan de implementación de abajo solo describe los cambios sobre lo ya implementado.

## Alcance

**Dentro:**

- **Horario semanal por terapeuta:** para cada día de la semana, de lunes a domingo, el terapeuta indica si atiende y, si atiende, la **hora desde** y la **hora hasta** (un solo rango por día).
- **Intervalo de cita por terapeuta** (`slotIntervalMinutes`), igual para toda la semana.
  - Es un valor libre, múltiplo de 5, entre 15 y 180 minutos.
  - El intervalo **es la duración de la cita**: no hay descansos entre citas.
- **Horarios generados:** los horarios de un día salen de desde, hasta e intervalo.
  - Ejemplo: de 08:00 a 16:00 con 60 min se generan 08:00, 09:00 … 15:00.
  - Una cita solo se genera si termina dentro del rango (`inicio + intervalo ≤ hasta`).
- **Bloqueos de horario por fecha concreta:** por ejemplo, el 20-10 de 13:00 a 14:00.
  - Puede haber varios por fecha, sin solaparse, y solo en fechas de hoy en adelante.
  - Los horarios cuya cita se solapa con un bloqueo no se ofrecen.
  - Se listan en "Mis horarios", cada uno con el botón "Quitar".
- **Cancelar un día completo** (ya implementado): Dialog "Se cancelarán N citas"; las citas activas de ese día pasan a canceladas.
- **Reabrir un día** (ya implementado): las citas siguen canceladas.
- **Conflictos:** si cambiar el rango, el intervalo o agregar un bloqueo deja fuera citas activas futuras, el cambio se rechaza con un `toast.error` que indica cuántas citas quedan fuera.
- **Cancelar una cita individual** desde "Mi agenda" (ya implementado).
- **"Mi agenda"** (ya implementado): filtro Activas / Canceladas / Todas, Badge "Cancelada", y reprogramar citas canceladas.
- **La reserva del paciente respeta el horario generado:**
  - `Step1Date` deshabilita los días sin horarios libres;
  - `Step2Time` muestra los horarios generados, agrupados en mañana (antes de las 12:00) y tarde, con los ocupados deshabilitados.
- **Duración visible:** el flujo de reserva muestra el intervalo real del terapeuta, por ejemplo "09:00 AM (60 min)", en lugar de "50 min" fijo. Afecta a `Step2Time`, `BookingSummary`, `Step3Patient`, `Step4Payment` y `SuccessScreen`.
- **Los dos diálogos de reprogramar** ofrecen los horarios generados del terapeuta destino (ya conectados a `offeredSlotLabels`).
- **"Mis citas" del paciente** (ya implementado): Badge "Cancelada por el terapeuta", sin reprogramar.
- **"Ingresos"** excluye las canceladas (ya implementado).
- **Domingos:** dejan de estar cerrados globalmente. Cada terapeuta decide qué días atiende.
- **Se eliminan de `AppConfig`** `defaultSlots` y `disabledDaysOfWeek`.
- **Horario de los terapeutas mock** (`sp1`–`sp3`): lunes a sábado de 08:00 a 18:00, intervalo 60 y domingo sin atención. Las citas semilla se regeneran con esos horarios.
- **Terapeutas creados por el admin:** empiezan sin días de atención (horario vacío), con intervalo 60 y sin bloqueos.
- **Persistencia en memoria** (zustand).

**Fuera de alcance (para futuras specs):**

- Varios rangos por día. Las pausas se hacen con bloqueos por fecha.
- Bloqueos recurrentes, por ejemplo "todos los lunes 13:00–14:00".
- Intervalo distinto por día.
- Descansos entre citas.
- Que el paciente cancele o reprograme una cita cancelada.
- Notificaciones, motivo de cancelación y reembolsos reales.
- Restaurar citas al reabrir un día.
- Que el admin gestione horarios.
- Persistencia real (Supabase o `localStorage`).
- Versión legacy en vanilla JS.
- Unificar `Specialist.sessionDuration` (texto de perfil) con el intervalo.

## Modelo de datos

```ts
// src/types/index.ts
export type AppointmentStatus = "active" | "cancelled";          // ya implementado

/** Rango de atención de un día, horas "HH:mm" en 24 h. */
export interface DayRange {
  start: string; // ej. "08:00"
  end: string;   // ej. "16:00"
}

/** 0 = domingo … 6 = sábado; null = ese día no atiende. Reemplaza al WeeklySchedule de labels. */
export type WeeklySchedule = Record<number, DayRange | null>;

/** Tramo bloqueado en una fecha concreta, horas "HH:mm" en 24 h. */
export interface TimeBlock {
  date: string;  // YYYY-MM-DD
  start: string;
  end: string;
}

export interface Specialist {
  // ...campos actuales...
  weeklySchedule: WeeklySchedule;
  /** Duración de cada cita en minutos (múltiplo de 5, 15–180); también es el paso entre citas. */
  slotIntervalMinutes: number;
  cancelledDates: string[];   // ya implementado
  timeBlocks: TimeBlock[];
}

export interface AppConfig {
  // se eliminan: defaultSlots, disabledDaysOfWeek
}
```

`Appointment.timeLabel` conserva el formato actual de 12 h ("09:00 AM"). `TimeSlot` (`{ time: "HH:mm", period, label }`) se sigue usando para los horarios generados. `period` es `"morning"` si la hora es anterior a las 12:00 y `"afternoon"` en el resto de casos.

Helpers en `src/lib/schedule.ts`:

```ts
/** "13:00" → "01:00 PM" (formato de Appointment.timeLabel). */
formatSlotLabel(time: string): string
/** Horarios del día: rango del weekday + intervalo, excluyendo los que se solapan con bloqueos de esa fecha; [] si el día está cancelado o sin rango. */
generateDaySlots(specialist: Specialist, dateKey: string): TimeSlot[]
/** Ya existe; pasa a usar generateDaySlots. */
offeredSlotLabels(specialist: Specialist, dateKey: string): string[]
/** Sin cambios. */
takenSlotLabels(...) / hasAvailability(...)
```

Acciones de `usePatientStore` (rol therapist, siempre sobre `currentTherapist`, sincronizando `specialists` y `currentTherapist`):

```ts
// Reemplaza la firma actual.
updateWeeklySchedule: (schedule: WeeklySchedule, slotIntervalMinutes: number) => Result;
addTimeBlock: (block: TimeBlock) => Result;
removeTimeBlock: (block: TimeBlock) => Result;
// Sin cambios: cancelDay, reopenDay, cancelAppointment, rescheduleAppointment.
```

Validaciones:

- **`updateWeeklySchedule`:**
  - el intervalo es un entero múltiplo de 5 entre 15 y 180;
  - en cada día con rango, `start < end`, y el rango admite al menos una cita (`end - start ≥ intervalo`).
  - Se rechaza si alguna cita activa futura del terapeuta no está entre los horarios que generaría el nuevo horario para su fecha. El error es "Hay N citas agendadas que quedarían fuera del nuevo horario. Reprográmalas o cancélalas primero.".
- **`addTimeBlock`:**
  - la fecha es hoy o futura y `start < end`;
  - el bloqueo no se solapa con otro de la misma fecha.
  - Se rechaza si alguna cita activa del terapeuta en esa fecha se solapa con el bloqueo, contando como tramo de la cita `[inicio, inicio + intervalo)`. El error es "Hay N citas agendadas en ese tramo. Reprográmalas o cancélalas primero.".
- **`removeTimeBlock`:** quita el bloqueo con esa fecha, inicio y fin.

## Plan de implementación

Los pasos parten del estado actual de la rama, donde ya están implementados los 14 pasos de la versión anterior.

1. **Tipos.**
   - Añadir `DayRange` y `TimeBlock`.
   - Cambiar `WeeklySchedule` a `Record<number, DayRange | null>`.
   - Añadir `Specialist.slotIntervalMinutes` y `Specialist.timeBlocks`.
   - Quitar `defaultSlots` y `disabledDaysOfWeek` de `AppConfig`.

   Ajustar `mockData.ts`:
   - `sp1`–`sp3`: días 1–6 con `08:00`–`18:00`, día 0 en `null`, intervalo 60 y sin bloqueos.
   - Regenerar las citas semilla, las pasadas y las fijas, con horarios de 08:00 AM a 05:00 PM.
   - El cierre de domingo de las semillas pasa a una constante local del mock.

   En `createTherapist`: horario con los 7 días en `null`, intervalo 60 y sin bloqueos. Comprobación: `npm run build` solo falla en los consumidores de `defaultSlots` y `disabledDaysOfWeek`, que se corrigen en los pasos 2–4.
2. **Helpers.** En `src/lib/schedule.ts`, añadir `formatSlotLabel` y `generateDaySlots`, y reescribir `offeredSlotLabels` sobre `generateDaySlots`.
3. **Reserva.**
   - `Step2Time` usa `generateDaySlots`, agrupa por `period` y quita los rangos fijos de los títulos de turno.
   - `Step1Date` quita la regla fija del domingo.
   - `TherapistAgendaPage` ordena por la hora real del label, no por el índice de `defaultSlots`.
4. **Duración visible.** Reemplazar "50 min" por el intervalo del terapeuta elegido en `Step2Time`, `BookingSummary`, `Step3Patient`, `Step4Payment` y `SuccessScreen`, pasándoles el terapeuta o el intervalo como prop donde haga falta. Comprobación: `npm run build` pasa.
5. **Acciones del store.** Reescribir `updateWeeklySchedule` con la firma y las validaciones nuevas. Añadir `addTimeBlock` y `removeTimeBlock`.
6. **"Mis horarios": horario semanal.** Reemplazar la grilla de casillas por:
   - un campo "Intervalo de cita (min)";
   - una tabla de lunes a domingo, con el checkbox "Atiende" y los inputs `type="time"` "Desde" y "Hasta";
   - el botón "Guardar". Si hay error, se muestra con `toast.error`.
7. **"Mis horarios": bloqueos de horario.**
   - Una sección con fecha (mínimo hoy), desde, hasta y el botón "Agregar bloqueo".
   - La lista de bloqueos de hoy en adelante, ordenada, cada uno con "Quitar".
   - La sección "Cancelar un día" queda igual.
8. **Documentación.** Actualizar la sección "Schedules and cancellations (SPEC 02)" de `CLAUDE.md`: rango, intervalo, bloqueos, que ya no existen `defaultSlots` ni `disabledDaysOfWeek`, y que el domingo depende del terapeuta.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores.
- [ ] `APP_CONFIG` ya no tiene `defaultSlots` ni `disabledDaysOfWeek`, y ningún archivo de `src/` los referencia.
- [ ] El terapeuta ve "Mis horarios" en el menú. `/terapeuta/horarios` muestra el intervalo y los rangos de lunes a domingo con su configuración actual.
- [ ] Un paciente o admin que navega a `/terapeuta/horarios` es redirigido a su propio inicio.
- [ ] `sp1` configura el miércoles de 08:00 a 12:00 con intervalo 60 y guarda (sin citas fuera). Al reservar un miércoles con `sp1`, `Step2Time` muestra exactamente 08:00, 09:00, 10:00 y 11:00 AM.
- [ ] Con intervalo 45 y un rango de 08:00 a 10:00, se generan 08:00 y 08:45 AM. 09:30 no se genera, porque terminaría a las 10:15.
- [ ] Un intervalo de 37 o de 200, o un rango con desde ≥ hasta, muestra un `toast.error` y no guarda.
- [ ] Un cambio de rango o de intervalo que deja fuera una cita activa futura muestra un `toast.error` con el número de citas y no guarda.
- [ ] `sp1` activa el domingo de 09:00 a 13:00 y guarda. Ese domingo aparece habilitado en `Step1Date` con sus horarios.
- [ ] Al agregar un bloqueo de 13:00 a 14:00 en una fecha futura sin citas en ese tramo, `Step2Time` no ofrece la 01:00 PM esa fecha y sí la ofrece en otras fechas.
- [ ] Agregar un bloqueo que se solapa con otro de la misma fecha, o en una fecha pasada, muestra un `toast.error`.
- [ ] Agregar un bloqueo sobre un tramo con una cita activa muestra un `toast.error` con el número de citas y no se guarda.
- [ ] Quitar un bloqueo vuelve a ofrecer esos horarios.
- [ ] El flujo de reserva con un terapeuta de intervalo 60 muestra "(60 min)" en `Step2Time`, `BookingSummary`, `Step3Patient`, `Step4Payment` y `SuccessScreen`.
- [ ] Un terapeuta creado por el admin aparece en `Step1Date` sin días habilitados y con el aviso "Este terapeuta aún no tiene horarios disponibles".
- [ ] En `Step2Time`, un horario ya reservado con ese terapeuta y en esa fecha aparece deshabilitado.
- [ ] Cancelar un día futuro con 3 citas activas muestra "Se cancelarán 3 citas". Al confirmar, las 3 pasan a canceladas.
- [ ] Al reabrir el día, este acepta reservas y las 3 citas siguen canceladas.
- [ ] Un día cancelado no se puede elegir ni en `Step1Date` ni en los diálogos de reprogramar.
- [ ] Cancelar una cita individual activa futura desde "Mi agenda" la deja cancelada. Las citas pasadas no muestran "Cancelar".
- [ ] El filtro de "Mi agenda" funciona (Activas por defecto, Canceladas, Todas). Al reprogramar una cancelada a un horario libre, vuelve a Activas.
- [ ] El paciente ve "Cancelada por el terapeuta" sin botón de reprogramar.
- [ ] "Ingresos" no suma las canceladas.
- [ ] `cancelAppointment` o `rescheduleAppointment` como terapeuta sobre una cita ajena devuelve "Solo puedes gestionar tus propias citas." y no la modifica.
- [ ] `updateWeeklySchedule`, `addTimeBlock`, `removeTimeBlock` y `cancelDay` solo modifican el `Specialist` y las citas del terapeuta en sesión.
- [ ] El Excel de "Mi agenda" incluye la columna "Estado".

## Decisiones

- **Sí:** un rango (desde–hasta) por día, más un intervalo por terapeuta. El usuario lo pidió así.
- **No (descartado en la revisión):** marcar casillas sobre la lista fija `defaultSlots`. Era el modelo de la primera versión; el usuario necesita definir sus propias horas.
- **No:** varios rangos por día. Las pausas se cubren con bloqueos por fecha.
- **Sí:** bloqueos por fecha concreta, varios por fecha y sin solaparse, por decisión del usuario.
- **No:** bloqueos recurrentes por día de la semana.
- **Sí:** el intervalo es la duración de la cita, sin descansos. El usuario lo confirmó: "no hay descansos".
- **Sí:** el intervalo es libre, múltiplo de 5 entre 15 y 180, por decisión del usuario. Se descartó la lista fija.
- **Sí:** una cita solo se genera si termina dentro del rango. Así no se ofrecen citas que se salen del horario.
- **Sí:** se rechaza cualquier cambio que deje fuera citas activas futuras, incluidos los bloqueos. Es coherente con la regla anterior de no dejar citas huérfanas.
- **Sí:** el flujo de reserva muestra el intervalo real en lugar de "50 min", por decisión del usuario.
- **No:** unificar `sessionDuration` con el intervalo. Es texto de perfil que el admin no edita (SPEC 01); queda fuera.
- **Sí:** se eliminan `defaultSlots` y `disabledDaysOfWeek` de `AppConfig`, porque ya no representan nada real.
- **Sí:** los domingos los decide cada terapeuta, por decisión del usuario. Se revierte la decisión anterior de mantenerlos cerrados.
- **Sí:** los mock trabajan de lunes a sábado de 08:00 a 18:00 con intervalo 60, y las semillas se regeneran. Las semillas anteriores (08:30 y 02:00 PM) no encajaban en un único rango con intervalo fijo.
- **Sí:** un terapeuta nuevo empieza sin días, con intervalo 60. Se mantiene "horario vacío por defecto", y 60 es solo el valor inicial del campo.
- **Sí:** `Appointment.timeLabel` conserva el formato de 12 h. Así no hay que migrar las citas ni la exportación.
- **Se mantienen todas las decisiones de cancelación de la primera versión:**
  - el estado de la cita;
  - reabrir el día sin restaurar citas;
  - cancelar una cita individual;
  - el filtro en "Mi agenda";
  - Ingresos sin canceladas;
  - el paciente sin acciones sobre citas canceladas;
  - la pertenencia validada en el store;
  - la columna Estado en el Excel.
- **Sí:** se rehace esta spec antes de mergear en lugar de abrir una spec 03, por decisión del usuario.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Cambiar el tipo de `WeeklySchedule` rompe a la vez todos los usos del modelo de casillas. | El paso 1 deja que `tsc` liste los consumidores, y los pasos 2–4 los corrigen antes de seguir. |
| Las citas semilla quedan fuera del nuevo horario mock. | El paso 1 las regenera con horarios de 08:00 AM a 05:00 PM y el domingo cerrado en el mock. |
| Comparar horas como texto ("9:00" frente a "09:00") da resultados erróneos. | Los inputs `type="time"` producen "HH:mm", y los helpers convierten a minutos antes de comparar. |
| `currentTherapist` queda desincronizado al editar el horario o los bloqueos. | Las acciones nuevas usan `updateCurrentSpecialist`, igual que las existentes. |

## Lo que **no** entra en esta spec

- Varios rangos por día, bloqueos recurrentes, intervalo por día y descansos.
- Cancelación o reprogramación de canceladas por el paciente.
- Notificaciones, motivo de cancelación y reembolsos reales.
- Restaurar citas al reabrir un día.
- Gestión de horarios por el admin.
- Unificar `sessionDuration` con el intervalo.
- Persistencia real y versión legacy en vanilla JS.

Cada uno de estos, si llega, va en su propia spec.
