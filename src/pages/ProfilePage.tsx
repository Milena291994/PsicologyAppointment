import React from "react";
import { useForm } from "react-hook-form";
import { Lock, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePatientStore } from "@/store/usePatientStore";
import { calculateAge, isMinor } from "@/lib/age";
import { Sex } from "@/types";
import { toast } from "sonner";

interface ProfileFormValues {
  sex: Sex | "";
  genderIdentity: string;
  pronouns: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
}

const selectClassName =
  "flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p className="text-[11px] text-destructive mt-1">{message}</p> : null;

const ReadOnlyField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <span className="text-xs text-muted-foreground">{label}</span>
    <p className="text-sm font-medium text-foreground mt-0.5">{value || "—"}</p>
  </div>
);

export const ProfilePage: React.FC = () => {
  const currentPatient = usePatientStore((s) => s.currentPatient);
  const updateProfile = usePatientStore((s) => s.updateProfile);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormValues>({
    defaultValues: {
      sex: currentPatient?.sex || "",
      genderIdentity: currentPatient?.genderIdentity || "",
      pronouns: currentPatient?.pronouns || "",
      email: currentPatient?.email || "",
      phone: currentPatient?.phone || "",
      city: currentPatient?.city || "",
      address: currentPatient?.address || "",
      emergencyName: currentPatient?.emergencyContact?.name || "",
      emergencyRelationship: currentPatient?.emergencyContact?.relationship || "",
      emergencyPhone: currentPatient?.emergencyContact?.phone || "",
    },
  });

  if (!currentPatient) return null;

  const birthDate = currentPatient.birthDate || "";
  const age = calculateAge(birthDate);

  // El contacto de emergencia es opcional, pero si se llena un campo se piden los tres.
  const requiredIfEmergency = (value: string) => {
    const { emergencyName, emergencyRelationship, emergencyPhone } = getValues();
    const anyFilled = [emergencyName, emergencyRelationship, emergencyPhone].some((v) => v.trim());
    return !anyFilled || !!value.trim() || "Completa los datos del contacto de emergencia";
  };

  const onSubmit = (data: ProfileFormValues) => {
    const hasEmergency = !!data.emergencyName.trim();
    updateProfile({
      sex: data.sex || undefined,
      genderIdentity: data.genderIdentity.trim() || undefined,
      pronouns: data.pronouns.trim() || undefined,
      email: data.email.trim(),
      phone: data.phone.trim(),
      city: data.city.trim(),
      address: data.address.trim() || undefined,
      emergencyContact: hasEmergency
        ? {
            name: data.emergencyName.trim(),
            relationship: data.emergencyRelationship.trim(),
            phone: data.emergencyPhone.trim(),
          }
        : undefined,
    });
    reset(data);
    toast.success("Perfil actualizado", { description: "Tus datos se guardaron correctamente." });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mantén tus datos al día para que podamos contactarte y acompañarte mejor.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-3xl">
        {/* Datos de identidad: no editables */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Datos de identificación
            </CardTitle>
            <CardDescription>
              Estos datos no se pueden modificar. Si hay un error, comunícate con la clínica.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField label="Nombres" value={currentPatient.firstName} />
            <ReadOnlyField label="Apellidos" value={currentPatient.lastName} />
            <ReadOnlyField label="Cédula de identidad" value={currentPatient.identification} />
            <div>
              <span className="text-xs text-muted-foreground">Fecha de nacimiento</span>
              <p className="text-sm font-medium text-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                {birthDate || "—"}
                {age >= 0 && <span className="text-muted-foreground font-normal">({age} años)</span>}
                {isMinor(birthDate) && (
                  <Badge variant="secondary" className="text-[10px]">
                    Menor de edad
                  </Badge>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sexo y género */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sexo y género</CardTitle>
            <CardDescription>
              Opcional. Nos ayuda a dirigirnos a ti como prefieras durante la terapia.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="profile-sex">Sexo</Label>
              <select id="profile-sex" className={selectClassName} {...register("sex")}>
                <option value="">Sin especificar</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
                <option value="intersexual">Intersexual</option>
                <option value="no_indica">Prefiero no indicarlo</option>
              </select>
            </div>
            <div>
              <Label htmlFor="profile-gender">Identidad de género</Label>
              <Input id="profile-gender" placeholder="Ej. mujer, hombre, no binarie" {...register("genderIdentity")} />
            </div>
            <div>
              <Label htmlFor="profile-pronouns">Pronombres</Label>
              <Input id="profile-pronouns" placeholder="Ej. ella, él, elle" {...register("pronouns")} />
            </div>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contacto y ubicación</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="profile-email">Correo electrónico</Label>
              <Input
                id="profile-email"
                type="email"
                autoComplete="email"
                {...register("email", { required: "Campo obligatorio" })}
              />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="profile-phone">Teléfono</Label>
              <Input
                id="profile-phone"
                type="tel"
                autoComplete="tel"
                {...register("phone", { required: "Campo obligatorio" })}
              />
              <FieldError message={errors.phone?.message} />
            </div>

            <div>
              <Label htmlFor="profile-city">Ciudad</Label>
              <Input
                id="profile-city"
                placeholder="Ej. Quito"
                autoComplete="address-level2"
                {...register("city", { required: "Campo obligatorio" })}
              />
              <FieldError message={errors.city?.message} />
            </div>
            <div>
              <Label htmlFor="profile-address">Dirección (opcional)</Label>
              <Input
                id="profile-address"
                placeholder="Calle principal, número y referencia"
                autoComplete="street-address"
                {...register("address")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contacto de emergencia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contacto de emergencia</CardTitle>
            <CardDescription>Persona a quien podamos llamar si fuera necesario.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="profile-em-name">Nombre</Label>
              <Input id="profile-em-name" {...register("emergencyName", { validate: requiredIfEmergency })} />
              <FieldError message={errors.emergencyName?.message} />
            </div>
            <div>
              <Label htmlFor="profile-em-rel">Parentesco</Label>
              <Input
                id="profile-em-rel"
                placeholder="Ej. madre, pareja, amigo"
                {...register("emergencyRelationship", { validate: requiredIfEmergency })}
              />
              <FieldError message={errors.emergencyRelationship?.message} />
            </div>
            <div>
              <Label htmlFor="profile-em-phone">Teléfono</Label>
              <Input
                id="profile-em-phone"
                type="tel"
                {...register("emergencyPhone", { validate: requiredIfEmergency })}
              />
              <FieldError message={errors.emergencyPhone?.message} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="gap-2" disabled={!isDirty}>
            <Save className="w-4 h-4" />
            <span>Guardar cambios</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
