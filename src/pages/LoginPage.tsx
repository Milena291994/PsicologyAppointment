import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, UserRound, Stethoscope } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { usePatientStore } from "@/store/usePatientStore";
import { ROUTES, homePathForRole } from "@/routes/paths";
import { UserRole } from "@/types";
import { toast } from "sonner";

interface LoginFormValues {
  identification: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = usePatientStore((s) => s.login);
  const loginTherapist = usePatientStore((s) => s.loginTherapist);
  const [role, setRole] = useState<UserRole>("patient");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const isTherapist = role === "therapist";

  const onSubmit = (data: LoginFormValues) => {
    const ok = isTherapist
      ? loginTherapist(data.identification, data.password)
      : login(data.identification, data.password);
    if (!ok) {
      toast.error("Cédula o contraseña incorrecta", {
        description: isTherapist
          ? "Verifica tus datos. Prueba con la cédula 1711111111 y contraseña 1234 en la demo."
          : "Verifica tus datos. Prueba con la cédula 1723456789 y contraseña 1234 en la demo.",
      });
      return;
    }
    navigate(homePathForRole(role));
  };

  return (
    <AuthLayout>
      <Card className="p-2">
        <CardHeader>
          <Tabs value={role} onValueChange={(v) => setRole(v as UserRole)} className="mb-2">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="patient" className="gap-1.5">
                <UserRound className="w-3.5 h-3.5" />
                <span>Paciente</span>
              </TabsTrigger>
              <TabsTrigger value="therapist" className="gap-1.5">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Terapeuta</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <CardTitle className="text-xl">Inicia sesión</CardTitle>
          <CardDescription>
            {isTherapist
              ? "Ingresa tu cédula y contraseña para consultar tu agenda de citas."
              : "Ingresa tu cédula y contraseña para agendar tu sesión."}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="login-id">Cédula de Identidad</Label>
              <Input
                id="login-id"
                placeholder={isTherapist ? "Ej. 1711111111" : "Ej. 1723456789"}
                {...register("identification", { required: "La cédula es obligatoria" })}
              />
              {errors.identification && (
                <p className="text-[11px] text-destructive mt-1">{errors.identification.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="login-password">Contraseña</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••"
                {...register("password", { required: "La contraseña es obligatoria" })}
              />
              {errors.password && (
                <p className="text-[11px] text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full gap-2">
              <LogIn className="w-4 h-4" />
              <span>Iniciar sesión</span>
            </Button>
            {!isTherapist && (
              <p className="text-xs text-muted-foreground text-center">
                ¿No tienes cuenta?{" "}
                <Link to={ROUTES.register}className="text-primary font-semibold hover:underline">
                  Regístrate
                </Link>
              </p>
            )}
          </CardFooter>
        </form>
      </Card>

      <Toaster position="bottom-right" richColors />
    </AuthLayout>
  );
};
