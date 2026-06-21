import { differenceInCalendarDays } from "date-fns";
import { redondearPesos } from "./dinero";
import type { ConfigMulta } from "./tipos";

export interface ResultadoMora {
  diasMora: number;
  multa: number;
}

/**
 * Calcula los días de mora y la multa de una cuota vencida.
 * - `diasGracia` se descuenta de los días de atraso.
 * - tipo FIJO: multa = valor (× días si `aplicaPorDiaMora`).
 * - tipo PORCENTAJE: multa = saldoPendiente × valor (× días si aplica).
 */
export function calcularMora(
  params: { fechaVencimiento: Date; saldoPendiente: number },
  hoy: Date,
  config: ConfigMulta,
): ResultadoMora {
  const diasAtraso = differenceInCalendarDays(hoy, params.fechaVencimiento);
  const diasMora = Math.max(0, diasAtraso - (config.diasGracia ?? 0));

  if (diasMora <= 0 || params.saldoPendiente <= 0) {
    return { diasMora: Math.max(0, diasMora), multa: 0 };
  }

  const factorDias = config.aplicaPorDiaMora ? diasMora : 1;
  let multa = 0;
  if (config.tipo === "FIJO") {
    multa = config.valor * factorDias;
  } else {
    multa = params.saldoPendiente * config.valor * factorDias;
  }

  return { diasMora, multa: redondearPesos(multa) };
}
