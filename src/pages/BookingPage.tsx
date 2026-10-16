import { useState } from "react";
import { Sparkles, Video, MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stepper } from "@/components/booking/Stepper";
import { Step1Date } from "@/components/booking/Step1Date";
import { Step2Time } from "@/components/booking/Step2Time";
import { Step3Patient } from "@/components/booking/Step3Patient";
import { Step4Payment } from "@/components/booking/Step4Payment";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { PayphoneModal } from "@/components/booking/PayphoneModal";
import { SuccessScreen } from "@/components/booking/SuccessScreen";
import { Modality, PatientFormData, AttendeeSelection } from "@/types";
import { usePatientStore } from "@/store/usePatientStore";
import { hasAvailability } from "@/lib/schedule";
import { toast } from "sonner";

export function BookingPage() {
  const currentPatient = usePatientStore((s) => s.currentPatient);
  const addAppointment = usePatientStore((s) => s.addAppointment);
  const appointments = usePatientStore((s) => s.appointments);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(null);
  const specialists = usePatientStore((s) => s.specialists);
  const selectedTherapist = specialists.find((s) => s.id === selectedTherapistId) || null;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTimeLabel, setSelectedTimeLabel] = useState<string | null>(null);
  const [modality, setModality] = useState<Modality>("online");
  const [isPayphoneOpen, setIsPayphoneOpen] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [bookingCode, setBookingCode] = useState<string>("");

  const [attendee, setAttendee] = useState<AttendeeSelection>({
    type: "patient",
    id: currentPatient?.id || "",
    name: currentPatient?.fullName || "",
  });

  const [formData, setFormData] = useState<PatientFormData>({
    identification: currentPatient?.identification || "",
    fullName: currentPatient?.fullName || "",
    email: currentPatient?.email || "",
    phone: currentPatient?.phone || "",
    birthDate: currentPatient?.birthDate || "",
    consultReason: currentPatient?.consultReason || "Ansiedad y estrés",
    firstTimeTherapy: "no",
    acceptedTerms: false,
    acceptedDataProcessing: false,
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

  /** Al cambiar de terapeuta se descarta el horario y, si la fecha ya no tiene cupo con él, también la fecha. */
  const handleSelectTherapist = (id: string) => {
    setSelectedTherapistId(id);
    setSelectedTime(null);
    setSelectedTimeLabel(null);
    const therapist = specialists.find((sp) => sp.id === id);
    if (selectedDate && !(therapist && hasAvailability(therapist, appointments, selectedDate))) {
      setSelectedDate(null);
    }
  };

  const handleSelectTime = (time: string, label: string) => {
    setSelectedTime(time);
    setSelectedTimeLabel(label);
  };

  const handlePaymentSuccess = () => {
    const code = "CS-" + Math.floor(100000 + Math.random() * 900000);
    setBookingCode(code);
    setIsSuccess(true);

    if (selectedDate && selectedTimeLabel && currentPatient) {
      const attendeeIdentification =
        attendee.type === "patient"
          ? currentPatient.identification
          : currentPatient.dependents.find((d) => d.id === attendee.id)?.identification || "";

      addAppointment({
        attendeeType: attendee.type,
        attendeeId: attendee.id,
        attendeeName: attendee.name,
        attendeeIdentification,
        therapistId: selectedTherapistId,
        date: selectedDate,
        timeLabel: selectedTimeLabel,
        modality,
        bookingCode: code,
        amountPaid: selectedTherapist?.price ?? 0,
      });
    }

    window.scrollTo({ top: 80, behavior: "smooth" });
  };

  if (!currentPatient) return null;

  return (
    <>
      {!isSuccess ? (
        <>
          {/* Bienvenida + Modalidad */}
          <div className="mb-8 flex flex-col items-center text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 border border-border bg-secondary px-3 py-1 rounded-full text-xs font-semibold text-secondary-foreground mb-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Agendamiento Seguro en 4 Pasos</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Agendar Sesión Terapéutica
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Dar este paso es un acto de valentía y cuidado contigo mismo. Elige la fecha y hora que mejor se adapten a tu bienestar.
            </p>

            <Tabs value={modality} onValueChange={handleModalityChange} className="mt-4">
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

          {/* Stepper de 4 Pasos */}
          <Stepper currentStep={currentStep} onStepClick={(step) => setCurrentStep(step)} />

          {/* Grid 2 Columnas: Pasos + Resumen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              {currentStep === 1 && (
                <Step1Date
                  selectedTherapistId={selectedTherapistId}
                  onSelectTherapist={handleSelectTherapist}
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
                  therapist={selectedTherapist}
                  dateKey={selectedDate}
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
                  selectedTherapist={selectedTherapist}
                  attendee={attendee}
                  setAttendee={setAttendee}
                  onBack={() => setCurrentStep(2)}
                  onContinue={() => setCurrentStep(4)}
                />
              )}

              {currentStep === 4 && (
                <Step4Payment
                  formData={formData}
                  modality={modality}
                  selectedTherapist={selectedTherapist}
                  onOpenPayphone={() => setIsPayphoneOpen(true)}
                  onBack={() => setCurrentStep(3)}
                />
              )}
            </div>

            {/* Columna lateral: resumen en vivo */}
            <div className="lg:col-span-4">
              <BookingSummary
                selectedDate={selectedDate}
                selectedTimeLabel={selectedTimeLabel}
                modality={modality}
                formData={formData}
                selectedTherapist={selectedTherapist}
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
          selectedTherapist={selectedTherapist}
        />
      )}

      <PayphoneModal
        open={isPayphoneOpen}
        onOpenChange={setIsPayphoneOpen}
        formData={formData}
        selectedTherapist={selectedTherapist}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}
