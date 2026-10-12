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
2. `Step2Time` — time slot selection (morning/afternoon), from `APP_CONFIG.defaultSlots`.
3. `Step3Patient` — patient lookup against `APP_CONFIG.registeredPatients` (by identification/email) to autofill returning patients, or a new-patient form; writes into `PatientFormData`.
4. `Step4Payment` — price breakdown and the button that opens `PayphoneModal`.

Alongside the steps, `BookingSummary` renders a live sidebar summary of the current selections, and on payment success `App.tsx` swaps the whole step UI for `SuccessScreen` (booking code, confirmation details). `BreathingModal` is an unrelated, always-available "mindful pause" utility triggered from the top bar.

All domain types (`Modality`, `Patient`, `PatientFormData`, `TimeSlot`, `AppConfig`, etc.) live in `src/types/index.ts`. All configurable content (clinic/specialist info, Payphone URL, mock registered patients, time slots, disabled weekdays) lives in `src/data/mockData.ts` as `APP_CONFIG` — this is the single place to change demo data or the payment link.

`src/components/ui/*` are shadcn/ui-style primitives (Button, Card, Badge, Dialog, Tabs, Input, Label, Separator, Sonner toaster) built on Radix UI primitives and `class-variance-authority`; styling tokens (HSL CSS variables for background/foreground/primary/etc.) are defined in `src/index.css` and consumed via `tailwind.config.js`. The `@/*` import alias maps to `src/*` (configured in both `vite.config.ts` and `tsconfig.json`).

Notifications throughout the flow use `sonner`'s `toast(...)` API (`toast.success`, `toast.error`, `toast.info`, plain `toast`) instead of native `alert()`.

## Pending: proof of consent (LOPDP)

The informed-consent checkbox (`acceptedTerms` in `Step3Patient`) currently exists only in the UI — nothing is persisted. Under Ecuador's LOPDP the clinic must be able to prove consent, so once a backend exists it must store, per booking: the version of the consent text accepted, the date, the time, and the patient's IP address. Store it server-side (the IP can't be trusted from the client); keep the frontend UI-only until then.
