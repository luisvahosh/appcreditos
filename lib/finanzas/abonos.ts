import type {
  AsignacionAbono,
  CuotaCalc,
  PendientesCuota,
  ResultadoAbono,
} from "./tipos";

/**
 * Calcula cuánto resta por pagar de cada componente de una cuota.
 * El campo `abonado` se asume aplicado en el orden multa → interés → capital.
 */
export function pendientesCuota(c: {
  valorCapital: number;
  valorInteres: number;
  abonado: number;
  multa: number;
}): PendientesCuota {
  const paidMulta = Math.min(c.abonado, c.multa);
  const restoTrasMulta = c.abonado - paidMulta;
  const paidInteres = Math.min(restoTrasMulta, c.valorInteres);
  const restoTrasInteres = restoTrasMulta - paidInteres;
  const paidCapital = Math.min(restoTrasInteres, c.valorCapital);

  const multaPend = c.multa - paidMulta;
  const interesPend = c.valorInteres - paidInteres;
  const capitalPend = c.valorCapital - paidCapital;

  return {
    multaPend,
    interesPend,
    capitalPend,
    totalPend: multaPend + interesPend + capitalPend,
  };
}

/**
 * Distribuye un abono entre las cuotas (más antiguas primero) aplicando el
 * orden multa → interés → capital dentro de cada cuota.
 */
export function distribuirAbono(
  cuotas: CuotaCalc[],
  valorAbono: number,
): ResultadoAbono {
  const ordenadas = [...cuotas].sort((a, b) => a.numero - b.numero);
  let restante = Math.max(0, Math.round(valorAbono));

  const asignaciones: AsignacionAbono[] = [];
  let totalMulta = 0;
  let totalInteres = 0;
  let totalCapital = 0;

  for (const c of ordenadas) {
    if (restante <= 0) break;
    const pend = pendientesCuota(c);
    if (pend.totalPend <= 0) continue;

    const aMulta = Math.min(restante, pend.multaPend);
    restante -= aMulta;
    const aInteres = Math.min(restante, pend.interesPend);
    restante -= aInteres;
    const aCapital = Math.min(restante, pend.capitalPend);
    restante -= aCapital;

    if (aMulta + aInteres + aCapital > 0) {
      asignaciones.push({
        cuotaId: c.id,
        multa: aMulta,
        interes: aInteres,
        capital: aCapital,
      });
      totalMulta += aMulta;
      totalInteres += aInteres;
      totalCapital += aCapital;
    }
  }

  const aplicado = totalMulta + totalInteres + totalCapital;
  return {
    asignaciones,
    totalMulta,
    totalInteres,
    totalCapital,
    aplicado,
    sobrante: restante,
  };
}
