import React from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { BookingPage } from "@/pages/BookingPage";
import { AppointmentsPage } from "@/pages/AppointmentsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { FaqPage } from "@/pages/FaqPage";
import { TherapistAgendaPage } from "@/pages/TherapistAgendaPage";
import { TherapistRevenuePage } from "@/pages/TherapistRevenuePage";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { AdminTherapistsPage } from "@/pages/AdminTherapistsPage";
import { usePatientStore } from "@/store/usePatientStore";
import { ROUTES, homePathForRole } from "@/routes/paths";
import { UserRole } from "@/types";

interface RequireRoleProps {
  role: UserRole;
}

/** Deja pasar solo a usuarios autenticados con el rol indicado; otro rol se redirige a su propio inicio. */
const RequireRole: React.FC<RequireRoleProps> = ({ role }) => {
  const isAuthenticated = usePatientStore((s) => s.isAuthenticated);
  const currentRole = usePatientStore((s) => s.role);

  if (!isAuthenticated) {
    // El admin tiene su propio login; el resto de roles usa /login.
    return <Navigate to={role === "admin" ? ROUTES.adminLogin : ROUTES.login} replace />;
  }

  if (currentRole !== role) {
    return <Navigate to={homePathForRole(currentRole)} replace />;
  }

  return <Outlet />;
};

/** Pantallas públicas (login / registro): un usuario con sesión se envía a su inicio. */
const GuestOnly: React.FC = () => {
  const isAuthenticated = usePatientStore((s) => s.isAuthenticated);
  const currentRole = usePatientStore((s) => s.role);

  if (isAuthenticated) {
    return <Navigate to={homePathForRole(currentRole)} replace />;
  }

  return <Outlet />;
};

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.register, element: <RegisterPage /> },
      { path: ROUTES.adminLogin, element: <AdminLoginPage /> },
    ],
  },
  {
    element: <RequireRole role="patient" />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: ROUTES.booking, element: <BookingPage /> },
          { path: ROUTES.appointments, element: <AppointmentsPage /> },
          { path: ROUTES.profile, element: <ProfilePage /> },
          { path: ROUTES.faq, element: <FaqPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireRole role="therapist" />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: ROUTES.therapistAgenda, element: <TherapistAgendaPage /> },
          { path: ROUTES.therapistRevenue, element: <TherapistRevenuePage /> },
        ],
      },
    ],
  },
  {
    element: <RequireRole role="admin" />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: ROUTES.adminTherapists, element: <AdminTherapistsPage /> }],
      },
    ],
  },
  { path: "*", element: <Navigate to={ROUTES.booking} replace /> },
]);
