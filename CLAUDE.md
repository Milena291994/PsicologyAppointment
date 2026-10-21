# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A frontend-only demo of a booking/payment flow for psychology therapy sessions ("Psicología y Mente"), built with React + TypeScript + Vite, styled with Tailwind using the shadcn/ui token system, and using Sonner for toast notifications. There is no backend — all data (specialist info, registered patients, time slots) is mocked in `src/data/mockData.ts`, and "payment" via Payphone is simulated in a modal.

## Commands

- `npm run dev` — start the Vite dev server.
- `npm run build` — type-check (`tsc`) then build for production.
- `npm run preview` — preview the production build locally.

There is no test suite and no linter configured in this repo.

## Two parallel implementations — know which one you're editing

This repo contains **two independent implementations of the same demo**:

1. **`src/` (React + TypeScript, current)** — entry point `src/main.tsx` → `src/App.tsx`. This is the active codebase; new work should go here.
2. **`index.html` / `standalone.html` / `js/app.js` / `js/data.js` (vanilla JS, legacy)** — a self-contained, no-build version of the same flow that can be opened directly in a browser. `js/data.js` holds its mock config/data equivalent to `src/data/mockData.ts`.

These do not share code. When asked to change app behavior, confirm which version the user means (or update both if the request implies keeping them in sync) rather than assuming.

## Architecture (`src/`)

`App.tsx` owns all booking flow state (current step, selected date/time, modality, form data, dialog open states, success state) and passes it down as props — there is no state management library or context. The flow is a 4-step wizard driven by `currentStep`:

1. `Step1Date` — calendar/date selection + modality (`online` / `presencial`) via shadcn `<Tabs>`.
2. `Step2Time` — time slot selection (morning/afternoon), from the therapist's generated slots (`generateDaySlots`, see SPEC 02 below).
3. `Step3Patient` — patient lookup against `APP_CONFIG.registeredPatients` (by identification/email) to autofill returning patients, or a new-patient form; writes into `PatientFormData`.
4. `Step4Payment` — price breakdown and the button that opens `PayphoneModal`.

Alongside the steps, `BookingSummary` renders a live sidebar summary of the current selections, and on payment success `App.tsx` swaps the whole step UI for `SuccessScreen` (booking code, confirmation details). `BreathingModal` is an unrelated, always-available "mindful pause" utility triggered from the top bar.

All domain types (`Modality`, `Patient`, `PatientFormData`, `TimeSlot`, `AppConfig`, etc.) live in `src/types/index.ts`. All configurable content (clinic/specialist info, Payphone URL, mock registered patients, mock therapist schedules) lives in `src/data/mockData.ts` as `APP_CONFIG` — this is the single place to change demo data or the payment link.

`src/components/ui/*` are shadcn/ui-style primitives (Button, Card, Badge, Dialog, Tabs, Input, Label, Separator, Sonner toaster) built on Radix UI primitives and `class-variance-authority`; styling tokens (HSL CSS variables for background/foreground/primary/etc.) are defined in `src/index.css` and consumed via `tailwind.config.js`. The `@/*` import alias maps to `src/*` (configured in both `vite.config.ts` and `tsconfig.json`).

Notifications throughout the flow use `sonner`'s `toast(...)` API (`toast.success`, `toast.error`, `toast.info`, plain `toast`) instead of native `alert()`.

## Roles (paciente / terapeuta / admin)

`usePatientStore` (zustand) holds `role` (`"patient" | "therapist" | "admin"`). `/login` has a patient/therapist toggle; therapists log in with their `therapistAccounts` entry (mock, password `1234`) linked to a `specialists` entry, and an inactive specialist (`active: false`) cannot log in. Admins log in separately at `/admin/login` (`AdminLoginPage`, `APP_CONFIG.adminAccounts`, mock cédula `0999999999` / `1234`) — there is no admin tab in `/login`. The admin view is `src/pages/AdminTherapistsPage.tsx` (`/admin/terapeutas`): table + Dialog form to create/edit therapists (name, title, registry, experience, consultation price, login cédula/password) and activate/deactivate them; validation lives in the store actions (`createTherapist`, `updateTherapist`, `setTherapistActive`). **`specialists` and `therapistAccounts` live in `usePatientStore`** (seeded from `APP_CONFIG`, which is only the initial state) — components must read them from the store, never from `APP_CONFIG.specialists` / `APP_CONFIG.therapistAccounts`, and booking/rescheduling lists show only `active` ones. Routing logic lives in `src/app.router.tsx` (route tree plus the guards: `RequireRole` redirects unauthenticated users to login — `/admin/login` for admin routes — and a mismatched role to its own home; `GuestOnly` keeps logged-in users out of login/register/admin login); built with `createBrowserRouter` and exported as `router`; `App.tsx` only renders `<RouterProvider router={router} />`. Path constants (`ROUTES`) and `homePathForRole()` stay in `src/routes/paths.ts` so components can import them without a circular import through the router — never hardcode path strings elsewhere. `AppLayout` is purely visual. The therapist view is `src/pages/TherapistAgendaPage.tsx` (`/terapeuta/agenda`): table of their appointments filterable by date / patient name / cédula, with rescheduling. `src/pages/TherapistRevenuePage.tsx` (`/terapeuta/ingresos`) shows money collected in a date range, grouped by payment date (`Appointment.createdAt`) using the `amountPaid` snapshot stored at booking; cancelled appointments are excluded. `SEED_APPOINTMENTS` in `mockData.ts` preloads demo appointments relative to today.

**Appointments do not live in the store.** They live in `src/services/appointmentsService.ts`, an async in-memory mock (seeded from `SEED_APPOINTMENTS`, simulated latency) shaped like the future API: `listAppointments`, `listBusySlots` (only `BusySlot` data — never other patients' details), `createAppointment`, `rescheduleAppointment`, `cancelAppointment`, `cancelTherapistDay`. All appointment validation (permissions, active therapist, past dates, cancelled days, offered/taken slots, `amountPaid` taken from the therapist's current price) happens in the service, not the UI. Mutations take an `AppointmentActor` built by `getAppointmentActor()` (exported from the store; `null` if there's no session or the therapist was deactivated) — with a real API the backend will resolve it from the session. Components read appointments with `useAppointments(filter)` / `useBusySlots(therapistId)` from `src/hooks/useAppointments.ts`, which re-fetch when the service notifies changes. Admin store actions (`createTherapist`, `updateTherapist`, `setTherapistActive`) reject any role other than admin, and `setTherapistActive` refuses to deactivate a therapist with active appointments from today onward. Therapist store actions check the therapist is still active in `specialists` (`requireActiveTherapist`); the ones that need appointments (`updateWeeklySchedule`, `addTimeBlock`, `cancelDay`, `setTherapistActive`) are async.

## Schedules and cancellations (SPEC 02)

There is no global slot list: `APP_CONFIG` has no `defaultSlots` / `disabledDaysOfWeek`, and every therapist decides which days they work (Sunday included). Each `Specialist` has `weeklySchedule` (`Record<0..6, { start, end } | null>`, one `"HH:mm"` range per day, `null` = doesn't work), `slotIntervalMinutes` (multiple of 5, 15–180; it is both the appointment length and the step between appointments — no breaks), `timeBlocks` (`{ date, start, end }[]`, blocked stretches on specific dates) and `cancelledDates` (`YYYY-MM-DD[]`). `generateDaySlots` in `src/lib/schedule.ts` builds a day's slots from the range every interval, only when `start + interval <= end`, skipping slots that overlap a block and returning `[]` for cancelled days; `Appointment.timeLabel` keeps the 12 h format (`"09:00 AM"`, `formatSlotLabel`). Compare times in minutes (`timeToMinutes`, `labelToMinutes`), never as strings. Mock therapists `sp1`–`sp3` work Mon–Sat 08:00–18:00 with 60 min (seed appointments are generated on those slots); therapists created by the admin start with no working days and a 60 min interval. `Appointment.status` is `"active" | "cancelled"` (+ `cancelledAt`); a cancelled appointment frees its slot and becomes active again when rescheduled. Availability is always computed with `offeredSlotLabels` / `takenSlotLabels` (active appointments only) / `hasAvailability`, used by `Step1Date`, `Step2Time` and both reschedule dialogs. The booking flow shows the therapist's interval as the session length (`(60 min)`), not a fixed value.

`src/pages/TherapistSchedulePage.tsx` (`/terapeuta/horarios`, "Mis horarios") edits the interval and the per-day ranges, adds/removes time blocks by date and cancels/reopens whole days; `TherapistAgendaPage` filters by status (Activas / Canceladas / Todas), cancels single appointments and reschedules cancelled ones. Patients see cancelled appointments as "Cancelada por el terapeuta" with no actions. **A therapist can only manage their own appointments**: `updateWeeklySchedule`, `addTimeBlock`, `removeTimeBlock`, `cancelDay`, `reopenDay` (store) and `cancelAppointment` / `rescheduleAppointment` (service, via the actor) enforce ownership outside the UI, and keep `specialists` and `currentTherapist` in sync (`updateCurrentSpecialist`). Any schedule/interval change or new block that would leave future active appointments outside the offered slots is rejected; only today or future days/appointments can be cancelled.

## Pending: proof of consent (LOPDP)

The informed-consent checkbox (`acceptedTerms` in `Step3Patient`) currently exists only in the UI — nothing is persisted. Under Ecuador's LOPDP the clinic must be able to prove consent, so once a backend exists it must store, per booking: the version of the consent text accepted, the date, the time, and the patient's IP address. Store it server-side (the IP can't be trusted from the client); keep the frontend UI-only until then.

## Supabase

`@supabase/supabase-js` is installed and the client is configured in `src/lib/supabase.ts` (exported as `supabase`), reading `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env.local` (git-ignored; template in `.env.example`, typings in `src/vite-env.d.ts`). Only the publishable key goes in the frontend — never the service_role key. No data logic (queries/inserts/updates) is wired yet; the app still runs on the mocks in `mockData.ts`.
