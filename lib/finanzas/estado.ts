import { differenceInCalendarDays } from "date-fns";
import type { EstadoCredito } from "../constantes";
import { pendientesCuota } from "./abonos";
import type { ConfigMulta, CuotaCalc } from "./tipos";

export interface ResumenCredito {
  saldoCapital: number;
  saldoInteres: number;
  multaPendiente: number;
  saldoSinMulta: number;
  totalPagar: number;
  diasMora: number;
  proximaCuota: CuotaCalc | null;
  cuotaVencida: CuotaCalc | null;
  estado: EstadoCredito;
}

/**
 * Resume el estado financiero de un crédito a partir de sus cuotas.
 * `estadoActual` permite preservar CANCELADO manual; el resto se deriva.
 */
export function calcularResumenCredito(
  cuotas: CuotaCalc[],
  hoy: Date,
  config: ConfigMulta,
  estadoActual?: string,
): ResumenCredito {
  let saldoCapital = 0;
  let saldoInteres = 0;
  let multaPendiente = 0;
  let proximaCuota: CuotaCalc | null = null;
  let cuotaVencida: CuotaCalc | null = null;
  let diasMora = 0;

  const ordenadas = [...cuotas].sort((a, b) => a.numero - b.numero);

  for (const c of ordenadas) {
    const pend = pendientesCuota(c);
    saldoCapital += pend.capitalPend;
    saldoInteres += pend.interesPend;
    multaPendiente += pend.multaPend;

    if (pend.totalPend > 0) {
      if (!proximaCuota) proximaCuota = c;
      const atraso = differenceInCalendarDays(hoy, c.fechaVencimiento);
      const moraCuota = Math.max(0, atraso - (config.diasGracia ?? 0));
      if (moraCuota > 0) {
        if (!cuotaVencida) cuotaVencida = c;
        if (moraCuota > diasMora) diasMora = moraCuota;
      }
    }
  }

  const saldoSinMulta = saldoCapital + saldoInteres;
  const totalPagar = saldoSinMulta + multaPendiente;

  let estado: EstadoCredito;
  if (estadoActual === "CANCELADO" || saldoSinMulta + multaPendiente <= 0) {
    estado = "CANCELADO";
  } else if (cuotaVencida) {
    estado = "EN_MORA";
  } else {
    estado = "ACTIVO";
  }

  return {
    saldoCapital,
    saldoInteres,
    multaPendiente,
    saldoSinMulta,
    totalPagar,
    diasMora,
    proximaCuota,
    cuotaVencida,
    estado,
  };
}
