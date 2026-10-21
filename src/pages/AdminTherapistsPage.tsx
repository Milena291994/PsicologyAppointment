import React, { useState } from "react";
import { Plus, Pencil, Power, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePatientStore, TherapistInput } from "@/store/usePatientStore";
import { Specialist } from "@/types";
import { toast } from "sonner";

/** Valores del formulario como texto; se convierten a número al guardar para que el store valide. */
interface TherapistFormState {
  name: string;
  title: string;
  registry: string;
  experienceYears: string;
  price: string;
  identification: string;
  password: string;
}

const emptyForm: TherapistFormState = {
  name: "",
  title: "",
  registry: "",
  experienceYears: "",
  price: "",
  identification: "",
  password: "",
};

/** Un campo vacío pasa como NaN para que la validación del store lo rechace en vez de tomarlo como 0. */
function toNumber(value: string): number {
  return value.trim() === "" ? NaN : Number(value);
}

/** Gestión de terapeutas (rol admin): alta, edición de datos/valor de consulta/credenciales y activación. */
export const AdminTherapistsPage: React.FC = () => {
  const specialists = usePatientStore((s) => s.specialists);
  const therapistAccounts = usePatientStore((s) => s.therapistAccounts);
  const createTherapist = usePatientStore((s) => s.createTherapist);
  const updateTherapist = usePatientStore((s) => s.updateTherapist);
  const setTherapistActive = usePatientStore((s) => s.setTherapistActive);

  const [dialogOpen, setDialogOpen] = useState(false);
  // null = creando un terapeuta nuevo.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TherapistFormState>(emptyForm);

  const accountOf = (specialistId: string) => therapistAccounts.find((a) => a.specialistId === specialistId);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (sp: Specialist) => {
    setEditingId(sp.id);
    setForm({
      name: sp.name,
      title: sp.title,
      registry: sp.registry,
      experienceYears: String(sp.experienceYears),
      price: String(sp.price),
      identification: accountOf(sp.id)?.identification ?? "",
      password: "",
    });
    setDialogOpen(true);
  };

  const updateField = (field: keyof TherapistFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = () => {
    const input: TherapistInput = {
      name: form.name,
      title: form.title,
      registry: form.registry,
      experienceYears: toNumber(form.experienceYears),
      price: toNumber(form.price),
      identification: form.identification,
      password: form.password,
    };

    const result = editingId ? updateTherapist(editingId, input) : createTherapist(input);
    if (!result.ok) {
      toast.error("No se pudo guardar", { description: result.error });
      return;
    }

    toast.success(editingId ? "Terapeuta actualizado" : "Terapeuta creado", { description: form.name.trim() });
    setDialogOpen(false);
  };

  const toggleActive = async (sp: Specialist) => {
    const result = await setTherapistActive(sp.id, !sp.active);
    if (!result.ok) {
      toast.error(sp.active ? "No se pudo desactivar" : "No se pudo activar", { description: result.error });
      return;
    }
    toast.success(sp.active ? "Terapeuta desactivado" : "Terapeuta activado", {
      description: sp.active
        ? `${sp.name} ya no aparece al reservar y no puede iniciar sesión.`
        : `${sp.name} vuelve a estar disponible para reservas.`,
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">Terapeutas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los datos, el valor de consulta y el acceso de cada terapeuta.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span>Nuevo terapeuta</span>
        </Button>
      </div>

      <Card className="overflow-hidden">
        {specialists.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Stethoscope className="w-10 h-10 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Todavía no hay terapeutas registrados.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nombre</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Experiencia</TableHead>
                <TableHead>Valor consulta</TableHead>
                <TableHead>Cédula de acceso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specialists.map((sp) => (
                <TableRow key={sp.id}>
                  <TableCell className="min-w-[180px] font-semibold text-foreground">{sp.name}</TableCell>
                  <TableCell className="min-w-[200px] text-muted-foreground">{sp.title}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{sp.registry}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {sp.experienceYears} {sp.experienceYears === 1 ? "año" : "años"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-semibold text-foreground tabular-nums">
                    {sp.currencySymbol}
                    {sp.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums">
                    {accountOf(sp.id)?.identification ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sp.active ? "default" : "outline"} className="text-[10px]">
                      {sp.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(sp)} className="gap-1.5">
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleActive(sp)} className="gap-1.5">
                        <Power className="w-3.5 h-3.5" />
                        <span>{sp.active ? "Desactivar" : "Activar"}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar terapeuta" : "Nuevo terapeuta"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Los cambios de precio solo afectan a las reservas nuevas."
                : "El terapeuta podrá iniciar sesión con la cédula y contraseña que asignes."}
            </DialogDescription>
          </DialogHeader>

          <form
            id="therapist-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="therapist-name">Nombre completo</Label>
              <Input id="therapist-name" value={form.name} onChange={updateField("name")} placeholder="Ej. Dra. Ana López R." />
            </div>
            <div>
              <Label htmlFor="therapist-title">Título profesional</Label>
              <Input
                id="therapist-title"
                value={form.title}
                onChange={updateField("title")}
                placeholder="Ej. Psicóloga Clínica • Esp. Terapia Cognitivo-Conductual"
              />
            </div>
            <div>
              <Label htmlFor="therapist-registry">Registro sanitario</Label>
              <Input
                id="therapist-registry"
                value={form.registry}
                onChange={updateField("registry")}
                placeholder="Ej. Reg. Sanitario MSP #PS-00000"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="therapist-experience">Años de experiencia</Label>
                <Input
                  id="therapist-experience"
                  type="number"
                  min={0}
                  step={1}
                  value={form.experienceYears}
                  onChange={updateField("experienceYears")}
                />
              </div>
              <div>
                <Label htmlFor="therapist-price">Valor de consulta (USD)</Label>
                <Input
                  id="therapist-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={updateField("price")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="therapist-identification">Cédula de acceso</Label>
                <Input
                  id="therapist-identification"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.identification}
                  onChange={updateField("identification")}
                  placeholder="10 dígitos"
                />
              </div>
              <div>
                <Label htmlFor="therapist-password">Contraseña</Label>
                <Input
                  id="therapist-password"
                  type="password"
                  value={form.password}
                  onChange={updateField("password")}
                  placeholder={editingId ? "Dejar vacío para mantener" : "••••••"}
                />
              </div>
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="therapist-form">
              {editingId ? "Guardar cambios" : "Crear terapeuta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
