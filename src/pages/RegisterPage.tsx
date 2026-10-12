import React from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { usePatientStore } from "@/store/usePatientStore";
import { APP_CONFIG } from "@/data/mockData";
import { toast } from "sonner";

interface RegisterFormValues {
  identification: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = usePatientStore((s) => s.isAuthenticated);
  const registerPatient = usePatientStore((s) => s.register);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>();

  if (isAuthenticated) {
    return <Navigate to="/agendar" replace />;
  }

  const onSubmit = (data: RegisterFormValues) => {
    const result = registerPatient({
      identification: data.identification,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      birthDate: data.birthDate,
      password: data.password,
    });

    if (!result.ok) {
      toast.error("No se pudo crear la cuenta", { description: result.error });
      return;
    }

    toast.success("Cuenta creada con éxito", { description: "Ya puedes agendar tu sesión." });
    navigate("/agendar");
  };

  return (
    <AuthLayout maxWidthClassName="max-w-lg">
      <Card className="p-2">
        <CardHeader>
          <CardTitle className="text-xl">Crea tu cuenta</CardTitle>
          <CardDescription>Los menores de edad no pueden registrarse en la plataforma.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reg-first-name">Nombres</Label>
                <Input
                  id="reg-first-name"
                  placeholder="Ej. Camila Andrea"
                  autoComplete="given-name"
                  {...register("firstName", { required: "Campo obligatorio" })}
                />
                {errors.firstName && (
                  <p className="text-[11px] text-destructive mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reg-last-name">Apellidos</Label>
                <Input
                  id="reg-last-name"
                  placeholder="Ej. Vega Morales"
                  autoComplete="family-name"
                  {...register("lastName", { required: "Campo obligatorio" })}
                />
                {errors.lastName && (
                  <p className="text-[11px] text-destructive mt-1">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reg-id">Cédula de Identidad / DNI</Label>
                <Input
                  id="reg-id"
                  placeholder="Ej. 1723456789"
                  {...register("identification", { required: "Campo obligatorio" })}
                />
                {errors.identification && (
                  <p className="text-[11px] text-destructive mt-1">{errors.identification.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reg-email">Correo Electrónico</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="tuemail@ejemplo.com"
                  {...register("email", { required: "Campo obligatorio" })}
                />
                {errors.email && (
                  <p className="text-[11px] text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reg-phone">Teléfono Móvil / WhatsApp</Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="+593 99 123 4567"
                  {...register("phone", { required: "Campo obligatorio" })}
                />
                {errors.phone && (
                  <p className="text-[11px] text-destructive mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reg-birth">Fecha de Nacimiento</Label>
                <Input
                  id="reg-birth"
                  type="date"
                  {...register("birthDate", { required: "Campo obligatorio" })}
                />
                {errors.birthDate && (
                  <p className="text-[11px] text-destructive mt-1">{errors.birthDate.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reg-password">Contraseña</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="••••••"
                  {...register("password", { required: "Campo obligatorio", minLength: { value: 4, message: "Mínimo 4 caracteres" } })}
                />
                {errors.password && (
                  <p className="text-[11px] text-destructive mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reg-confirm-password">Confirmar Contraseña</Label>
                <Input
                  id="reg-confirm-password"
                  type="password"
                  placeholder="••••••"
                  {...register("confirmPassword", {
                    required: "Campo obligatorio",
                    validate: (value) => value === watch("password") || "Las contraseñas no coinciden",
                  })}
                />
                {errors.confirmPassword && (
                  <p className="text-[11px] text-destructive mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-muted/40">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="reg-consent"
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer mt-0.5"
                  {...register("acceptedTerms", { required: true })}
                />
                <label htmlFor="reg-consent" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                  <strong className="text-foreground font-semibold">Términos y condiciones:</strong>{" "}
                  Declaro que los datos ingresados son veraces y acepto los{" "}
                  <a
                    href={APP_CONFIG.termsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold underline underline-offset-2"
                  >
                    Términos y Condiciones y la Política de Protección de Datos
                  </a>{" "}
                  de Psicología y Mente.
                </label>
              </div>
              {errors.acceptedTerms && (
                <p className="text-[11px] text-destructive mt-1.5">Debes aceptar los términos y condiciones.</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full gap-2">
              <UserPlus className="w-4 h-4" />
              <span>Crear cuenta</span>
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <Toaster position="bottom-right" richColors />
    </AuthLayout>
  );
};
