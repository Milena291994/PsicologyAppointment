import { useEffect, useState } from "react";
import { Appointment, BusySlot } from "@/types";
import {
  AppointmentFilter,
  listAppointments,
  listBusySlots,
  subscribeAppointments,
} from "@/services/appointmentsService";

/** Ejecuta `fetcher` al montar, cuando cambia `key` y cada vez que el servicio avisa de cambios. */
function useLiveQuery<T>(key: string | null, fetcher: () => Promise<T[]>): { data: T[]; loading: boolean } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(key !== null);

  useEffect(() => {
    if (key === null) {
      setData([]);
      setLoading(false);
      return;
    }
    let stale = false;
    const load = () =>
      fetcher().then((result) => {
        if (stale) return;
        setData(result);
        setLoading(false);
      });

    setLoading(true);
    load();
    const unsubscribe = subscribeAppointments(load);
    return () => {
      stale = true;
      unsubscribe();
    };
    // `key` resume el filtro; `fetcher` cambia en cada render y no va en las dependencias.
  }, [key]);

  return { data, loading };
}

/** Citas completas según el filtro; null = no consultar (p. ej. sin sesión). */
export function useAppointments(filter: AppointmentFilter | null): { appointments: Appointment[]; loading: boolean } {
  const key = filter ? JSON.stringify(filter) : null;
  const { data, loading } = useLiveQuery(key, () => listAppointments(filter ?? {}));
  return { appointments: data, loading };
}

/** Horarios ocupados de un terapeuta (sin datos de pacientes); null = sin terapeuta elegido. */
export function useBusySlots(therapistId: string | null): { busySlots: BusySlot[]; loading: boolean } {
  const { data, loading } = useLiveQuery(therapistId, () => listBusySlots(therapistId ?? ""));
  return { busySlots: data, loading };
}
