import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { UserCheck, Users, UserPlus, Pencil, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PatientFormData, AttendeeSelection, Specialist } from "@/types";
import { usePatientStore } from "@/store/usePatientStore";
import { APP_CONFIG } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Step3PatientProps {
  formData: PatientFormData;
  setFormData: React.Dispatch<React.SetStateAction<PatientFormData>>;
  selectedDate: string | null;
  selectedTimeLabel: string | null;
  selectedTherapist: Specialist | null;
  attendee: AttendeeSelection;
  setAttendee: React.Dispatch<React.SetStateAction<AttendeeSelection>>;
  onBack: () => void;
  onContinue: () => void;
}

interface ContactFormValues {
  email: string;
  phone: string;
  consultReason: string;
  acceptedTerms: boolean;
  acceptedDataProcessing: boolean;
}

interface DependentFormValues {
  identification: string;
  fullName: string;
  birthDate: string;
  consultReason: string;
  legalConsent: boolean;
}

const consultReasonOptions = [
  { value: "Ansiedad y estrés", label: "Ansiedad, estrés o sobrecarga emocional" },
  { value: "Estado de ánimo y tristeza", label: "Estado de ánimo, desmotivación o tristeza" },
  { value: "Duelo y pérdida", label: "Procesos de duelo o transiciones vitales" },
  { value: "Crecimiento personal", label: "Crecimiento personal y autoconocimiento" },
  { value: "Terapia de pareja", label: "Terapia de pareja / Relaciones afectivas" },
  { value: "Otro motivo", label: "Otro motivo específico" },
];

export const Step3Patient: React.FC<Step3PatientProps> = ({
  formData,
  setFormData,
  selectedDate,
  selectedTimeLabel,
  selectedTherapist,
  attendee,
  setAttendee,
  onBack,
  onContinue,
}) => {
  const currentPatient = usePatientStore((s) => s.currentPatient);
  const updateContactInfo = usePatientStore((s) => s.updateContactInfo);
  const addDependent = usePatientStore((s) => s.addDependent);
  const updateDependent = usePatientStore((s) => s.updateDependent);

  const [showDependentForm, setShowDependentForm] = useState(false);
  const [editingDependentId, setEditingDependentId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormValues>({
    defaultValues: {
      email: currentPatient?.email || "",
      phone: currentPatient?.phone || "",
      consultReason: currentPatient?.consultReason || "Ansiedad y estrés",
      acceptedTerms: formData.acceptedTerms,
      acceptedDataProcessing: formData.acceptedDataProcessing,
    },
  });

  const {
    register: registerDependent,
    handleSubmit: handleSubmitDependent,
    reset: resetDependentForm,
    formState: { errors: dependentErrors },
  } = useForm<DependentFormValues>({
    defaultValues: { consultReason: "Ansiedad y estrés", legalConsent: false },
  });

  if (!currentPatient) return null;

  const onSubmitContact = (data: ContactFormValues) => {
    updateContactInfo(data.email, data.phone, data.consultReason);
    setFormData({
      identification: currentPatient.identification,
      fullName: currentPatient.fullName,
      email: data.email,
      phone: data.phone,
      birthDate: currentPatient.birthDate || "",
      consultReason: data.consultReason,
      firstTimeTherapy: "no",
      acceptedTerms: true,
      acceptedDataProcessing: true,
    });
    toast.success("Datos confirmados", {
      description: "Información verificada. Procediendo al pago de la cita.",
    });
    onContinue();
  };

  const onSubmitDependent = (data: DependentFormValues) => {
    const result = editingDependentId
      ? updateDependent(editingDependentId, data)
      : addDependent(data);

    if (!result.ok) {
      toast.error(
        editingDependentId ? "No se pudo actualizar el dependiente" : "No se pudo agregar el dependiente",
        { description: result.error }
      );
      return;
    }

    toast.success(editingDependentId ? "Dependiente actualizado" : "Dependiente agregado", {
      description: data.fullName,
    });
    resetDependentForm({ identification: "", fullName: "", birthDate: "", consultReason: "Ansiedad y estrés", legalConsent: false });
    setShowDependentForm(false);
    setEditingDependentId(null);
  };

  const handleEditDependent = (dep: Omit<DependentFormValues, "legalConsent"> & { id: string }) => {
    setEditingDependentId(dep.id);
    resetDependentForm({
      identification: dep.identification,
      fullName: dep.fullName,
      birthDate: dep.birthDate,
      consultReason: dep.consultReason,
      // Al editar se vuelve a pedir el consentimiento: es una nueva autorización sobre los datos del menor.
      legalConsent: false,
    });
    setShowDependentForm(true);
  };

  const handleToggleDependentForm = () => {
    if (showDependentForm) {
      resetDependentForm({ identification: "", fullName: "", birthDate: "", consultReason: "Ansiedad y estrés", legalConsent: false });
      setEditingDependentId(null);
    }
    setShowDependentForm((v) => !v);
  };

  return (
    <Card>
      <CardHeader className="border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="secondary" className="text-primary font-semibold">
              Paso 3 de 4
            </Badge>
            <CardTitle className="text-xl mt-2">
              Confirma tus Datos y Selecciona al Paciente
            </CardTitle>
            <CardDescription>
              Tu cédula, nombre y fecha de nacimiento están tomados de tu cuenta. Puedes actualizar tu correo, celular y motivo de consulta.
            </CardDescription>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <form onSubmit={handleSubmit(onSubmitContact)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Cédula de Identidad / DNI</Label>
              <Input value={currentPatient.identification} disabled />
            </div>

            <div>
              <Label>Nombres y Apellidos Completos</Label>
              <Input value={currentPatient.fullName} disabled />
            </div>

            <div>
              <Label htmlFor="form-email">
                Correo Electrónico <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-email"
                type="email"
                placeholder="tuemail@ejemplo.com"
                {...register("email", { required: "Campo obligatorio" })}
              />
              {errors.email && (
                <p className="text-[11px] text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="form-phone">
                Teléfono Móvil / WhatsApp <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-phone"
                type="tel"
                placeholder="+593 99 123 4567"
                {...register("phone", { required: "Campo obligatorio" })}
              />
              {errors.phone && (
                <p className="text-[11px] text-destructive mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label>Fecha de Nacimiento</Label>
              <Input value={currentPatient.birthDate || "—"} disabled />
            </div>

            <div>
              <Label htmlFor="form-reason">Motivo Principal de Consulta</Label>
              <select
                id="form-reason"
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-xs sm:text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("consultReason", { required: true })}
              >
                {consultReasonOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dependientes */}
          <div className="p-4 sm:p-5 rounded-xl border border-border bg-secondary/40 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-foreground">
                <Users className="w-3.5 h-3.5 text-primary" />
                Dependientes (menores de edad)
              </Label>
              <button
                type="button"
                onClick={handleToggleDependentForm}
                className="text-[11px] text-primary hover:underline underline-offset-2 font-semibold cursor-pointer flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {showDependentForm ? "Cancelar" : "Agregar dependiente"}
              </button>
            </div>

            {currentPatient.dependents.length === 0 && !showDependentForm && (
              <p className="text-[11px] text-muted-foreground">
                Aún no has registrado dependientes menores de edad.
              </p>
            )}

            {currentPatient.dependents.length > 0 && (
              <ul className="space-y-1.5">
                {currentPatient.dependents.map((dep) => (
                  <li
                    key={dep.id}
                    className="text-xs bg-card border border-border rounded-lg px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-foreground block truncate">{dep.fullName}</span>
                      <span className="text-muted-foreground text-[11px]">Nac. {dep.birthDate}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditDependent(dep)}
                      className="text-[11px] text-primary hover:underline underline-offset-2 font-semibold cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {showDependentForm && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <Label htmlFor="dep-id">Cédula del dependiente</Label>
                  <Input
                    id="dep-id"
                    placeholder="Ej. 1756789012"
                    {...registerDependent("identification", { required: "Campo obligatorio" })}
                  />
                  {dependentErrors.identification && (
                    <p className="text-[11px] text-destructive mt-1">{dependentErrors.identification.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dep-name">Nombres y Apellidos</Label>
                  <Input
                    id="dep-name"
                    placeholder="Ej. Sofía Vega Morales"
                    {...registerDependent("fullName", { required: "Campo obligatorio" })}
                  />
                  {dependentErrors.fullName && (
                    <p className="text-[11px] text-destructive mt-1">{dependentErrors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dep-birth">Fecha de Nacimiento</Label>
                  <Input
                    id="dep-birth"
                    type="date"
                    {...registerDependent("birthDate", { required: "Campo obligatorio" })}
                  />
                  {dependentErrors.birthDate && (
                    <p className="text-[11px] text-destructive mt-1">{dependentErrors.birthDate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dep-reason">Motivo Principal de Consulta</Label>
                  <select
                    id="dep-reason"
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-xs sm:text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...registerDependent("consultReason")}
                  >
                    {consultReasonOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 p-3 rounded-lg border border-border bg-muted/40">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="dep-consent"
                      className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer mt-0.5"
                      {...registerDependent("legalConsent", { required: true })}
                    />
                    <label htmlFor="dep-consent" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                      <strong className="text-foreground font-semibold">Consentimiento del representante legal:</strong>{" "}
                      Declaro que soy padre, madre o representante legal de este menor y, en esa calidad, autorizo de
                      forma expresa a Psicología y Mente a tratar sus datos personales, incluidos datos de salud, con la
                      única finalidad de brindarle atención psicológica, conforme a la Ley Orgánica de Protección de
                      Datos Personales.
                    </label>
                  </div>
                  {dependentErrors.legalConsent && (
                    <p className="text-[11px] text-destructive mt-1.5">
                      Debes aceptar el consentimiento para guardar al dependiente.
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmitDependent(onSubmitDependent)}
                    className="gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{editingDependentId ? "Guardar cambios" : "Guardar dependiente"}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Selector de asistente a la cita */}
          <div>
            <Label className="mb-2 block">¿Para quién es esta cita?</Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setAttendee({ type: "patient", id: currentPatient.id, name: currentPatient.fullName })
                }
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                  attendee.type === "patient"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-card text-foreground hover:bg-accent/40"
                )}
              >
                {currentPatient.fullName} (Titular)
              </button>

              {currentPatient.dependents.map((dep) => (
                <button
                  key={dep.id}
                  type="button"
                  onClick={() => setAttendee({ type: "dependent", id: dep.id, name: dep.fullName })}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                    attendee.type === "dependent" && attendee.id === dep.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-card text-foreground hover:bg-accent/40"
                  )}
                >
                  {dep.fullName} (Dependiente)
                </button>
              ))}
            </div>
          </div>

          {/* Términos del servicio y consentimiento de datos de salud: casillas separadas (LOPDP arts. 8 y 26) */}
          <div className="mt-4 p-4 rounded-xl border border-border bg-muted/40 space-y-3">
            <div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="form-terms"
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer mt-0.5"
                  {...register("acceptedTerms", { required: true })}
                />
                <label htmlFor="form-terms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                  <strong className="text-foreground font-semibold">Términos y condiciones:</strong>{" "}
                  Declaro que los datos ingresados son veraces y acepto los{" "}
                  <a
                    href={APP_CONFIG.termsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold underline underline-offset-2"
                  >
                    Términos y Condiciones
                  </a>{" "}
                  del servicio de Psicología y Mente (reservas, pagos, cancelaciones y reembolsos).
                </label>
              </div>
              {errors.acceptedTerms && (
                <p className="text-[11px] text-destructive mt-1.5">Debes aceptar los términos y condiciones.</p>
              )}
            </div>

            <div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="form-consent"
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer mt-0.5"
                  {...register("acceptedDataProcessing", { required: true })}
                />
                <label htmlFor="form-consent" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                  <strong className="text-foreground font-semibold">
                    Consentimiento informado y secreto profesional:
                  </strong>{" "}
                  Autorizo de forma expresa a Psicología y Mente a tratar los datos personales de la persona que
                  asistirá a esta cita, incluidos sus datos de salud, con la única finalidad de brindarle atención
                  psicológica. Comprendo que toda la información tratada en consulta está amparada por la
                  confidencialidad psicológica y el código ético profesional.
                </label>
              </div>
              {errors.acceptedDataProcessing && (
                <p className="text-[11px] text-destructive mt-1.5">Debes aceptar el consentimiento informado.</p>
              )}
            </div>
          </div>

          {/* Resumen preliminar */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
              Revisión preliminar de tu sesión
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-muted/30 p-3.5 rounded-xl border border-border">
              <div>
                <span className="text-muted-foreground block text-[11px]">Especialista:</span>
                <span className="font-semibold text-foreground">{selectedTherapist?.name || "Por seleccionar"}</span>
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

          <CardFooter className="border-t border-border pt-4 px-0 flex-col-reverse sm:flex-row justify-between gap-3">
            <Button type="button" variant="outline" onClick={onBack} className="gap-2 w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4" />
              <span>Cambiar Hora</span>
            </Button>

            <Button type="submit" className="gap-2 w-full sm:w-auto">
              <span>Confirmar y Pasar al Pago</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};
