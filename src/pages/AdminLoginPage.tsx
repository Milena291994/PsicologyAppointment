import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { usePatientStore } from "@/store/usePatientStore";
import { homePathForRole } from "@/routes/paths";
import { toast } from "sonner";

interface AdminLoginFormValues {
  identification: string;
  password: string;
}

/** Login de administración, separado de /login para no exponer el acceso admin en la pantalla pública. */
export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const loginAdmin = usePatientStore((s) => s.loginAdmin);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormValues>();

  const onSubmit = (data: AdminLoginFormValues) => {
    if (!loginAdmin(data.identification, data.password)) {
      toast.error("Cédula o contraseña incorrecta", {
        description: "Verifica tus datos. Prueba con la cédula 0999999999 y contraseña 1234 en la demo.",
      });
      return;
    }
    navigate(homePathForRole("admin"));
  };

  return (
    <AuthLayout>
      <Card className="p-2">
        <CardHeader>
          <div className="w-10 h-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <CardTitle className="text-xl">Acceso de administración</CardTitle>
          <CardDescription>Ingresa tu cédula y contraseña para gestionar a los terapeutas.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="admin-login-id">Cédula de Identidad</Label>
              <Input
                id="admin-login-id"
                placeholder="Ej. 0999999999"
                {...register("identification", { required: "La cédula es obligatoria" })}
              />
              {errors.identification && (
                <p className="text-[11px] text-destructive mt-1">{errors.identification.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="admin-login-password">Contraseña</Label>
              <Input
                id="admin-login-password"
                type="password"
                placeholder="••••••"
                {...register("password", { required: "La contraseña es obligatoria" })}
              />
              {errors.password && (
                <p className="text-[11px] text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full gap-2">
              <LogIn className="w-4 h-4" />
              <span>Iniciar sesión</span>
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Toaster position="bottom-right" richColors />
    </AuthLayout>
  );
};
