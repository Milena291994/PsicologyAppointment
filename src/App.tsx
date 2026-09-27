import { useState } from "react";
import { ShieldCheck, Wind, HeartHandshake, Video, MapPin, Sparkles, Box } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stepper } from "@/components/booking/Stepper";
import { Step1Date } from "@/components/booking/Step1Date";
import { Step2Time } from "@/components/booking/Step2Time";
import { Step3Patient } from "@/components/booking/Step3Patient";
import { Step4Payment } from "@/components/booking/Step4Payment";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { PayphoneModal } from "@/components/booking/PayphoneModal";
import { SuccessScreen } from "@/components/booking/SuccessScreen";
import { BreathingModal } from "@/components/booking/BreathingModal";
import { Modality, PatientFormData } from "@/types";
import { APP_CONFIG } from "@/data/mockData";
import { toast } from "sonner";

export function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTimeLabel, setSelectedTimeLabel] = useState<string | null>(null);
  const [modality, setModality] = useState<Modality>("online");
  const [isPayphoneOpen, setIsPayphoneOpen] = useState<boolean>(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [bookingCode, setBookingCode] = useState<string>("");

  const [formData, setFormData] = useState<PatientFormData>({
    identification: "",
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    consultReason: "Ansiedad y estrés",
    firstTimeTherapy: "si",
    acceptedTerms: false,
  });

  const handleModalityChange = (val: string) => {
    const mod = val as Modality;
    setModality(mod);
    toast(mod === "online" ? "Modalidad: Videoconsulta" : "Modalidad: Presencial", {
      description:
        mod === "online"
          ? "Plataforma segura y encriptada (Meet / Zoom Salud)."
          : "Consultorio 302, Edificio Árbol de Vida.",
    });
  };

  const handleSelectTime = (time: string, label: string) => {
    setSelectedTime(time);
    setSelectedTimeLabel(label);
  };

  const handlePaymentSuccess = () => {
    const code = "CS-" + Math.floor(100000 + Math.random() * 900000);
    setBookingCode(code);
    setIsSuccess(true);
    window.scrollTo({ top: 80, behavior: "smooth" });
  };

  const handleResetDemo = () => {
    setCurrentStep(1);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedTimeLabel(null);
    setIsSuccess(false);
    setFormData({
      identification: "",
      fullName: "",
      email: "",
      phone: "",
      birthDate: "",
      consultReason: "Ansiedad y estrés",
      firstTimeTherapy: "si",
      acceptedTerms: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info("Demo reiniciado", {
      description: "Puedes volver a probar el flujo de citas desde el inicio.",
    });
  };

  return (
    <div className="mental-health-bg min-h-screen flex flex-col text-foreground antialiased">
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
                setIsBreathingOpen(true);
                toast("Pausa consciente", {
                  description: "Respira suavemente siguiendo el compás del círculo.",
                });
              }}
              className="inline-flex items-center justify-center h-7 px-2.5 text-[11px] gap-1.5 rounded-full border border-border bg-background hover:bg-accent font-semibold transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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

      {/* Header oficial shadcn/ui */}
      <header className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground tracking-tight">
                  {APP_CONFIG.clinicName}
                </span>
                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                  Salud Mental
                </Badge>
                <Badge variant="outline" className="hidden sm:inline-flex text-[10px] gap-1 text-muted-foreground">
                  <Box className="w-3 h-3 text-primary" /> TypeScript & shadcn/ui
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Acompañamiento psicológico profesional y seguro
              </p>
            </div>
          </div>

          {/* Selector de Modalidad con shadcn Tabs */}
          <Tabs value={modality} onValueChange={handleModalityChange}>
            <TabsList className="h-9">
              <TabsTrigger value="online" className="gap-1.5 text-xs">
                <Video className="w-3.5 h-3.5" />
                <span>Videoconsulta</span>
              </TabsTrigger>
              <TabsTrigger value="presencial" className="gap-1.5 text-xs">
                <MapPin className="w-3.5 h-3.5" />
                <span>Presencial</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {!isSuccess ? (
          <>
            {/* Bienvenida */}
            <div className="mb-8 text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 border border-border bg-secondary px-3 py-1 rounded-full text-xs font-semibold text-secondary-foreground mb-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Agendamiento Seguro en 4 Pasos</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Agendar Sesión Terapéutica
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Dar este paso es un acto de valentía y cuidado contigo mismo. Elige la fecha y hora que mejor se adapten a tu bienestar.
              </p>
            </div>

            {/* Stepper de 4 Pasos */}
            <Stepper currentStep={currentStep} onStepClick={(step) => setCurrentStep(step)} />

            {/* Grid 2 Columnas: Pasos + Resumen */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8">
                {currentStep === 1 && (
                  <Step1Date
                    selectedDate={selectedDate}
                    onSelectDate={(d) => {
                      setSelectedDate(d);
                      setSelectedTime(null);
                      setSelectedTimeLabel(null);
                    }}
                    onContinue={() => setCurrentStep(2)}
                  />
                )}

                {currentStep === 2 && (
                  <Step2Time
                    selectedTime={selectedTime}
                    onSelectTime={handleSelectTime}
                    onBack={() => setCurrentStep(1)}
                    onContinue={() => setCurrentStep(3)}
                  />
                )}

                {currentStep === 3 && (
                  <Step3Patient
                    formData={formData}
                    setFormData={setFormData}
                    selectedDate={selectedDate}
                    selectedTimeLabel={selectedTimeLabel}
                    onBack={() => setCurrentStep(2)}
                    onContinue={() => setCurrentStep(4)}
                  />
                )}

                {currentStep === 4 && (
                  <Step4Payment
                    formData={formData}
                    modality={modality}
                    onOpenPayphone={() => setIsPayphoneOpen(true)}
                    onBack={() => setCurrentStep(3)}
                  />
                )}
              </div>

              {/* Columna lateral: resumen en vivo y especialista */}
              <div className="lg:col-span-4">
                <BookingSummary
                  selectedDate={selectedDate}
                  selectedTimeLabel={selectedTimeLabel}
                  modality={modality}
                  formData={formData}
                />
              </div>
            </div>
          </>
        ) : (
          <SuccessScreen
            bookingCode={bookingCode}
            selectedDate={selectedDate}
            selectedTimeLabel={selectedTimeLabel}
            modality={modality}
            formData={formData}
            onReset={handleResetDemo}
          />
        )}
      </main>

      {/* Modales */}
      <PayphoneModal
        open={isPayphoneOpen}
        onOpenChange={setIsPayphoneOpen}
        formData={formData}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <BreathingModal open={isBreathingOpen} onOpenChange={setIsBreathingOpen} />

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>
              © 2026 {APP_CONFIG.clinicName} • Desarrollado con <strong>TypeScript</strong>,{" "}
              <strong>shadcn/ui</strong> y <strong>Sonner</strong>.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span className="hover:text-foreground transition-colors cursor-pointer">
              Código de Ética Psicológica
            </span>
            <span>•</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">
              Secreto Profesional y Privacidad
            </span>
            <span>•</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">
              Términos de Consulta
            </span>
          </div>
        </div>
      </footer>

      {/* shadcn Sonner Toaster */}
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default App;
