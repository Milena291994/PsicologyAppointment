import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BreathingModal } from "@/components/booking/BreathingModal";
import { Toaster } from "@/components/ui/sonner";
import { APP_CONFIG } from "@/data/mockData";

/** Solo estructura visual; la autenticación y el rol los controlan los guards de `src/routes/guards.tsx`. */
export const AppLayout: React.FC = () => {
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);

  return (
    <div className="flex min-h-screen text-foreground antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 mental-health-bg">
        <Header onOpenBreathing={() => setIsBreathingOpen(true)} />

        <main className="flex-1 w-full px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

        <footer className="bg-background border-t border-border py-6 px-4 mt-auto">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>
              © 2026 {APP_CONFIG.clinicName} — atención confidencial amparada por secreto profesional médico.
            </span>
          </div>
        </footer>
      </div>

      <BreathingModal open={isBreathingOpen} onOpenChange={setIsBreathingOpen} />
      <Toaster position="bottom-right" richColors />
    </div>
  );
};
