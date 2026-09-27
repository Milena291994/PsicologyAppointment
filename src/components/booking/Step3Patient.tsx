import React, { useState } from "react";
import { UserCheck, Search, Fingerprint, Check, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PatientFormData, Patient } from "@/types";
import { APP_CONFIG } from "@/data/mockData";
import { toast } from "sonner";

interface Step3PatientProps {
  formData: PatientFormData;
  setFormData: React.Dispatch<React.SetStateAction<PatientFormData>>;
  selectedDate: string | null;
  selectedTimeLabel: string | null;
  onBack: () => void;
  onContinue: () => void;
}

export const Step3Patient: React.FC<Step3PatientProps> = ({
  formData,
  setFormData,
  selectedDate,
  selectedTimeLabel,
  onBack,
  onContinue,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchStatus, setSearchStatus] = useState<"idle" | "found" | "not_found">("idle");
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);

  const handleSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      toast.error("Ingresa una identificación", {
        description: "Por favor escribe tu cédula, DNI o correo para buscar tu expediente.",
      });
      return;
    }

    const match = APP_CONFIG.registeredPatients.find(
      (p) =>
        p.identification.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.fullName.toLowerCase().includes(q)
    );

    if (match) {
      setFoundPatient(match);
      setSearchStatus("found");
      setFormData({
        identification: match.identification,
        fullName: match.fullName,
        email: match.email,
        phone: match.phone,
        birthDate: match.birthDate || "",
        consultReason: match.consultReason || "Ansiedad y estrés",
        firstTimeTherapy: "no",
        acceptedTerms: true,
      });
      toast.success(`¡Bienvenido(a) de nuevo, ${match.fullName.split(" ")[0]}!`, {
        description: "Tus datos clínicos fueron cargados automáticamente con éxito.",
      });
    } else {
      setFoundPatient(null);
      setSearchStatus("not_found");
      toast.warning("Expediente no encontrado", {
        description: "No encontramos un registro previo. Puedes completar tus datos como paciente nuevo.",
      });
    }
  };

  const handleQuickChip = (patient: Patient) => {
    setSearchQuery(patient.identification);
    setFoundPatient(patient);
    setSearchStatus("found");
    setFormData({
      identification: patient.identification,
      fullName: patient.fullName,
      email: patient.email,
      phone: patient.phone,
      birthDate: patient.birthDate || "",
      consultReason: patient.consultReason || "Ansiedad y estrés",
      firstTimeTherapy: "no",
      acceptedTerms: true,
    });
    toast.success(`¡Bienvenido(a) de nuevo, ${patient.fullName.split(" ")[0]}!`, {
      description: "Expediente cargado con éxito.",
    });
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchStatus("idle");
    setFoundPatient(null);
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
    toast("Modo nuevo paciente", {
      description: "Formulario restablecido para ingresar datos por primera vez.",
    });
  };

  const handleProceed = () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.identification) {
      toast.error("Datos incompletos", {
        description: "Por favor completa Cédula, Nombre, Correo y Celular para agendar tu cita.",
      });
      return;
    }

    if (!formData.acceptedTerms) {
      toast.warning("Consentimiento requerido", {
        description: "Por favor acepta el consentimiento informado y confidencialidad médica.",
      });
      return;
    }

    toast.success("Datos confirmados", {
      description: "Información verificada. Procediendo al pago de la cita.",
    });
    onContinue();
  };

  return (
    <Card>
      <CardHeader className="border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="secondary" className="text-primary font-semibold">
              Paso 3 de 4
            </Badge>
            <CardTitle className="text-xl font-bold mt-2">
              Identificación y Datos del Paciente
            </CardTitle>
            <CardDescription>
              Ingresa tus datos o busca tu historial si ya te has atendido en Psicología y Mente previamente.
            </CardDescription>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Módulo de Búsqueda Previa */}
        <div className="p-4 sm:p-5 rounded-xl border border-border bg-secondary/40 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-xs text-foreground">
              <Search className="w-3.5 h-3.5 text-primary" />
              ¿Ya eres paciente del consultorio? Busca tu registro:
            </Label>
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-muted-foreground hover:text-foreground underline font-medium cursor-pointer"
            >
              Limpiar / Paciente nuevo
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Ingresa Cédula, DNI o Correo electrónico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 text-xs sm:text-sm"
              />
              <Fingerprint className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            </div>
            <Button
              type="button"
              onClick={handleSearch}
              className="h-10 px-4 text-xs sm:text-sm gap-1.5 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Buscar Expediente</span>
            </Button>
          </div>

          {/* Chips demo rápidos */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <span>Prueba demo rápida:</span>
            {APP_CONFIG.registeredPatients.map((p) => (
              <Badge
                key={p.id}
                variant="outline"
                onClick={() => handleQuickChip(p)}
                className="hover:bg-accent cursor-pointer py-1 px-2.5 transition-colors"
              >
                👤 {p.fullName.split(" ")[0]} ({p.identification})
              </Badge>
            ))}
          </div>

          {/* Resultado de búsqueda */}
          {searchStatus === "found" && foundPatient && (
            <div className="p-3.5 rounded-xl bg-secondary/80 border border-border flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-xs sm:text-sm">
                    ¡Hola, {foundPatient.fullName.split(" ")[0]}!
                  </span>
                  <Badge variant="secondary" className="text-[10px] text-primary">
                    Expediente Encontrado
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hemos cargado tus datos personales de forma segura para agilizar tu cita.
                </p>
                <div className="mt-1 text-[11px] text-primary font-medium">
                  {foundPatient.notes || "Paciente en seguimiento regular"}
                </div>
              </div>
            </div>
          )}

          {searchStatus === "not_found" && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground text-xs">
                  No encontramos un expediente previo con ese dato.
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  No te preocupes, puedes completar tus datos a continuación como paciente nuevo.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="form-id">
                Cédula de Identidad / DNI <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-id"
                required
                placeholder="Ej. 1723456789"
                value={formData.identification}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, identification: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="form-name">
                Nombres y Apellidos Completos <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-name"
                required
                placeholder="Ej. Camila Andrea Vega Morales"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="form-email">
                Correo Electrónico (para enlace privado) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-email"
                type="email"
                required
                placeholder="tuemail@ejemplo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="form-phone">
                Teléfono Móvil / WhatsApp <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-phone"
                type="tel"
                required
                placeholder="+593 99 123 4567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="form-birth">Fecha de Nacimiento (expediente clínico)</Label>
              <Input
                id="form-birth"
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, birthDate: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="form-reason">Motivo Principal de Consulta</Label>
              <select
                id="form-reason"
                className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-xs sm:text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.consultReason}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, consultReason: e.target.value }))
                }
              >
                <option value="Ansiedad y estrés">Ansiedad, estrés o sobrecarga emocional</option>
                <option value="Estado de ánimo y tristeza">Estado de ánimo, desmotivación o tristeza</option>
                <option value="Duelo y pérdida">Procesos de duelo o transiciones vitales</option>
                <option value="Crecimiento personal">Crecimiento personal y autoconocimiento</option>
                <option value="Terapia de pareja">Terapia de pareja / Relaciones afectivas</option>
                <option value="Otro motivo">Otro motivo específico</option>
              </select>
            </div>
          </div>

          {/* Consentimiento informado */}
          <div className="mt-4 p-4 rounded-xl border border-border bg-muted/40">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="form-consent"
                checked={formData.acceptedTerms}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, acceptedTerms: e.target.checked }))
                }
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer mt-0.5"
              />
              <label htmlFor="form-consent" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                <strong className="text-foreground font-semibold">
                  Consentimiento informado y secreto profesional:
                </strong>{" "}
                Declaro que los datos ingresados son veraces y acepto las condiciones de atención psicológica en Psicología y Mente. Comprendo que toda la información tratada en consulta está amparada por la confidencialidad médica y el código ético profesional.
              </label>
            </div>
          </div>
        </form>

        {/* Resumen preliminar */}
        <div className="pt-4 border-t border-border">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
            Revisión preliminar de tu sesión
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-muted/30 p-3.5 rounded-xl border border-border">
            <div>
              <span className="text-muted-foreground block text-[11px]">Especialista:</span>
              <span className="font-semibold text-foreground">{APP_CONFIG.specialist.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Fecha reservada:</span>
              <span className="font-semibold text-primary">{selectedDate || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Horario y Duración:</span>
              <span className="font-semibold text-foreground">
                {selectedTimeLabel ? `${selectedTimeLabel} (50 min)` : "—"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border pt-4 flex-col-reverse sm:flex-row justify-between gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2 w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4" />
          <span>Cambiar Hora</span>
        </Button>

        <Button onClick={handleProceed} className="gap-2 w-full sm:w-auto">
          <span>Confirmar y Pasar al Pago</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
