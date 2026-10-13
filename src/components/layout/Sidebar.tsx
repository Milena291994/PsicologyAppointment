import React from "react";
import { NavLink } from "react-router-dom";
import { CalendarPlus, ListChecks, HeartHandshake, UserRound, CircleHelp } from "lucide-react";
import { usePatientStore } from "@/store/usePatientStore";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/agendar", label: "Agendar cita", icon: CalendarPlus },
  { to: "/citas", label: "Mis citas", icon: ListChecks },
  { to: "/perfil", label: "Mi perfil", icon: UserRound },
  { to: "/preguntas", label: "Preguntas y respuestas", icon: CircleHelp },
];

export const Sidebar: React.FC = () => {
  const currentPatient = usePatientStore((s) => s.currentPatient);

  return (
    <nav className="w-16 sm:w-56 shrink-0 border-r border-border bg-card flex flex-col">
      <div>
        <div className="h-16 flex items-center justify-center sm:justify-start gap-2 px-2 sm:px-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline font-display text-sm font-semibold text-foreground truncate">
            {currentPatient?.fullName.split(" ")[0] || "Paciente"}
          </span>
        </div>

        <div className="p-2 sm:p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center sm:justify-start gap-2.5 px-2 sm:px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
              title={label}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};
