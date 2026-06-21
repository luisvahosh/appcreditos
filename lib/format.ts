import { format, formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale";

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Formatea un valor en pesos colombianos: 1250000 -> "$1.250.000". */
export function formatCOP(valor: number | null | undefined): string {
  // Intl inserta un espacio tras el símbolo ("$ 1.250.000"); lo quitamos.
  return cop.format(Math.round(valor ?? 0)).replace(/\s/g, "");
}

const num = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export function formatNumero(valor: number | null | undefined): string {
  return num.format(valor ?? 0);
}

/** Muestra una tasa fraccionaria como porcentaje: 0.1 -> "10%". */
export function formatPorcentaje(fraccion: number | null | undefined): string {
  const v = (fraccion ?? 0) * 100;
  return `${num.format(Number(v.toFixed(2)))}%`;
}

/** Fecha corta en español: "15/06/2026". */
export function formatFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return format(d, "dd/MM/yyyy", { locale: es });
}

/** Fecha con hora: "15/06/2026 14:30". */
export function formatFechaHora(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return format(d, "dd/MM/yyyy HH:mm", { locale: es });
}

export function distanciaFechas(desde: Date, hasta: Date): string {
  return formatDistanceStrict(desde, hasta, { locale: es });
}
