import React from "react";
import { HeartHandshake, ShieldCheck, Video } from "lucide-react";
import { APP_CONFIG } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  maxWidthClassName?: string;
}

/**
 * Composición asimétrica para /login y /register: panel de marca a la izquierda,
 * formulario a la derecha — evita el patrón "todo centrado" de las pantallas de
 * autenticación genéricas.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, maxWidthClassName = "max-w-md" }) => {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="auth-brand-gradient text-primary-foreground flex flex-col justify-between px-6 sm:px-10 py-8 lg:py-12">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary-foreground/15 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-4.5 h-4.5" />
          </div>
          <span className="font-display font-semibold tracking-tight">{APP_CONFIG.clinicName}</span>
        </div>

        <div className="max-w-sm py-10 lg:py-0">
          <p className="font-display text-xl sm:text-2xl font-semibold leading-snug">
            Dar este paso es un acto de valentía y cuidado contigo mismo.
          </p>
          <p className="text-sm text-primary-foreground/80 mt-3 leading-relaxed">
            Agenda tu sesión con {APP_CONFIG.specialists.length} terapeutas disponibles, de forma
            confidencial y segura.
          </p>
        </div>

        <div className="space-y-2.5 text-xs text-primary-foreground/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Espacio clínico confidencial protegido bajo secreto profesional médico</span>
          </div>
          <div className="flex items-center gap-2">
            <Video className="w-3.5 h-3.5 shrink-0" />
            <span>Videoconsulta o presencial, según tu preferencia</span>
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:py-14 auth-form-bg">
        <div className={cn("w-full", maxWidthClassName)}>{children}</div>
      </main>
    </div>
  );
};
