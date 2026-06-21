import { addDays, addMonths } from "date-fns";
import { PERIODICIDAD_DIAS, type Periodicidad } from "../constantes";
import { Decimal, distribuirRedondeo, redondearPesos } from "./dinero";
import type { PlanCuota, PlanInput } from "./tipos";

/** Genera las fechas de vencimiento de cada cuota. */
function fechasCuotas(
  desembolso: Date,
  periodicidad: Periodicidad,
  n: number,
  fechaUnica?: Date,
): Date[] {
  if (periodicidad === "UNICA") {
    return [fechaUnica ?? addMonths(desembolso, 1)];
  }
  if (periodicidad === "MENSUAL") {
    return Array.from({ length: n }, (_, k) => addMonths(desembolso, k + 1));
  }
  const dias = PERIODICIDAD_DIAS[periodicidad];
  return Array.from({ length: n }, (_, k) => addDays(desembolso, dias * (k + 1)));
}

/**
 * Genera el cronograma de cuotas según el método de interés.
 * Todos los valores se devuelven en pesos enteros.
 */
export function calcularPlanPagos(input: PlanInput): PlanCuota[] {
  const n =
    input.periodicidad === "UNICA" ? 1 : Math.max(1, Math.trunc(input.numeroCuotas));
  const P = new Decimal(input.valorPrestado);
  const i = new Decimal(input.tasaInteres);
  const fechas = fechasCuotas(
    input.fechaDesembolso,
    input.periodicidad,
    n,
    input.fechaVencimiento,
  );

  const capitalesRaw: Decimal[] = [];
  const interesesRaw: Decimal[] = [];

  if (input.metodoInteres === "PLANO") {
    // Interés total = capital * tasa * nº períodos, repartido por igual.
    const capitalPorCuota = P.div(n);
    const interesPorCuota = P.mul(i); // = (P*i*n)/n
    for (let k = 0; k < n; k++) {
      capitalesRaw.push(capitalPorCuota);
      interesesRaw.push(interesPorCuota);
    }
  } else if (input.metodoInteres === "CUOTA_FIJA") {
    // Amortización francesa: cuota fija = P·i·(1+i)^n / ((1+i)^n − 1).
    let cuota: Decimal;
    if (i.isZero()) {
      cuota = P.div(n);
    } else {
      const f = i.plus(1).pow(n);
      cuota = P.mul(i).mul(f).div(f.minus(1));
    }
    let saldo = P;
    for (let k = 0; k < n; k++) {
      const interes = saldo.mul(i);
      const capital = cuota.minus(interes);
      capitalesRaw.push(capital);
      interesesRaw.push(interes);
      saldo = saldo.minus(capital);
    }
  } else {
    // SIMPLE: capital en partes iguales; interés sobre el saldo restante.
    const capitalPorCuota = P.div(n);
    let saldo = P;
    for (let k = 0; k < n; k++) {
      const interes = saldo.mul(i);
      capitalesRaw.push(capitalPorCuota);
      interesesRaw.push(interes);
      saldo = saldo.minus(capitalPorCuota);
    }
  }

  const capitales = distribuirRedondeo(capitalesRaw, redondearPesos(P));
  const intereses = interesesRaw.map((v) => redondearPesos(v));

  return fechas.map((fecha, k) => ({
    numero: k + 1,
    fechaVencimiento: fecha,
    valorCapital: capitales[k],
    valorInteres: intereses[k],
    valorCuota: capitales[k] + intereses[k],
  }));
}
