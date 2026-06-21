import { Badge } from "@/components/ui/badge";
import {
  ESTADO_CREDITO_LABEL,
  ESTADO_CUOTA_LABEL,
  type EstadoCredito,
  type EstadoCuota,
} from "@/lib/constantes";

const tonoCredito: Record<EstadoCredito, "azul" | "verde" | "rojo" | "ambar"> = {
  ACTIVO: "azul",
  CANCELADO: "verde",
  EN_MORA: "rojo",
  VENCIDO: "ambar",
};

export function EstadoCreditoBadge({ estado }: { estado: string }) {
  const e = estado as EstadoCredito;
  return <Badge tono={tonoCredito[e] ?? "gris"}>{ESTADO_CREDITO_LABEL[e] ?? estado}</Badge>;
}

const tonoCuota: Record<EstadoCuota, "azul" | "verde" | "rojo" | "ambar"> = {
  PENDIENTE: "azul",
  PAGADA: "verde",
  PARCIAL: "ambar",
  EN_MORA: "rojo",
};

export function EstadoCuotaBadge({ estado }: { estado: string }) {
  const e = estado as EstadoCuota;
  return <Badge tono={tonoCuota[e] ?? "gris"}>{ESTADO_CUOTA_LABEL[e] ?? estado}</Badge>;
}
