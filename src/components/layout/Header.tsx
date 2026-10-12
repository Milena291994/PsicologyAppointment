import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Wind, HeartHandshake, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePatientStore } from "@/store/usePatientStore";
import { APP_CONFIG } from "@/data/mockData";
import { toast } from "sonner";

interface HeaderProps {
  onOpenBreathing: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBreathing }) => {
  const navigate = useNavigate();
  const logout = usePatientStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    toast.info("Sesión cerrada", { description: "Vuelve pronto." });
    navigate("/login");
  };

  return (
    <>
      {/* Barra superior de contención y seguridad psicológica */}
      <aside className="bg-muted/60 border-b border-border py-2 px-4 text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Espacio clínico confidencial protegido bajo secreto profesional médico</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onOpenBreathing();
                toast("Pausa consciente", {
                  description: "Respira suavemente siguiendo el compás del círculo.",
                });
              }}
              className="inline-flex items-center justify-center h-7 px-2.5 text-[11px] gap-1.5 rounded-full border border-border bg-background hover:bg-accent font-semibold transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <Wind className="w-3 h-3 text-primary" />
              <span>Tómate un respiro consciente</span>
            </button>
            <span className="hidden md:inline text-border">|</span>
            <span className="text-[11px] hidden md:inline">
              ¿Crisis aguda? Llama al <strong>911 / 171</strong>
            </span>
          </div>
        </div>
      </aside>

      {/* Header oficial */}
      <header className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm sm:text-base font-semibold text-foreground tracking-tight truncate">
                  {APP_CONFIG.clinicName}
                </span>
                <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider">
                  Salud Mental
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Acompañamiento psicológico profesional y seguro
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleLogout}
            className="ml-auto gap-2 shrink-0"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </Button>
        </div>
      </header>
    </>
  );
};
