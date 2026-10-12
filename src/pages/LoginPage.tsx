import React from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { usePatientStore } from "@/store/usePatientStore";
import { toast } from "sonner";

interface LoginFormValues {
  identification: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = usePatientStore((s) => s.isAuthenticated);
  const login = usePatientStore((s) => s.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  if (isAuthenticated) {
    return <Navigate to="/agendar" replace />;
  }

  const onSubmit = (data: LoginFormValues) => {
    const ok = login(data.identification, data.password);
    if (!ok) {
      toast.error("Cédula o contraseña incorrecta", {
        description: "Verifica tus datos. Prueba con la cédula 1723456789 y contraseña 1234 en la demo.",
      });
      return;
    }
    navigate("/agendar");
  };

  return (
    <AuthLayout>
      <Card className="p-2">
        <CardHeader>
          <CardTitle className="text-xl">Inicia sesión</CardTitle>
          <CardDescription>Ingresa tu cédula y contraseña para agendar tu sesión.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="login-id">Cédula de Identidad</Label>
              <Input
                id="login-id"
                placeholder="Ej. 1723456789"
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
            <p className="text-xs text-muted-foreground text-center">
              ¿No tienes cuenta?{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Regístrate
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <Toaster position="bottom-right" richColors />
    </AuthLayout>
  );
};
