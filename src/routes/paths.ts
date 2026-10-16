import { UserRole } from "@/types";

/** Única fuente de verdad de los paths de la app; usar siempre estas constantes en vez de strings sueltos. */
export const ROUTES = {
  login: "/login",
  register: "/register",
  booking: "/agendar",
  appointments: "/citas",
  profile: "/perfil",
  faq: "/preguntas",
  therapistAgenda: "/terapeuta/agenda",
  therapistRevenue: "/terapeuta/ingresos",
  therapistSchedule: "/terapeuta/horarios",
  adminLogin: "/admin/login",
  adminTherapists: "/admin/terapeutas",
} as const;

/** Pantalla de inicio de cada rol tras iniciar sesión. */
export function homePathForRole(role: UserRole | null): string {
  if (role === "admin") return ROUTES.adminTherapists;
  return role === "therapist" ? ROUTES.therapistAgenda : ROUTES.booking;
}
