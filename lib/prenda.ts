import { redondearPesos } from "@/lib/finanzas";

export interface CobroCalc {
  valor: number;
  recurrente: boolean;
}

export interface ResumenPrenda {
  interesPorPeriodo: number;
  interesAcumulado: number;
  otrosRecurrentes: number; // suma de cobros recurrentes por período
  otrosUnicos: number;
  otrosAcumulados: number;
  totalDeuda: number;
  pagado: number;
  saldo: number;
}

/**
 * Calcula la deuda de un préstamo con prenda.
 * - Interés = capital × tasa, una vez por cada período acumulado (sobre el capital inicial).
 * - Cobros recurrentes (ej. parqueadero) se suman una vez por período.
 * - Cobros únicos se suman una sola vez.
 */
export function calcularPrenda(p: {
  capital: number;
  tasaInteres: number;
  periodos: number;
  cobros: CobroCalc[];
  pagado: number;
}): ResumenPrenda {
  const interesPorPeriodo = redondearPesos(p.capital * p.tasaInteres);
  const interesAcumulado = interesPorPeriodo * p.periodos;
  const otrosRecurrentes = p.cobros
    .filter((c) => c.recurrente)
    .reduce((s, c) => s + c.valor, 0);
  const otrosUnicos = p.cobros
    .filter((c) => !c.recurrente)
    .reduce((s, c) => s + c.valor, 0);
  const otrosAcumulados = otrosRecurrentes * p.periodos + otrosUnicos;
  const totalDeuda = p.capital + interesAcumulado + otrosAcumulados;
  const saldo = Math.max(0, totalDeuda - p.pagado);

  return {
    interesPorPeriodo,
    interesAcumulado,
    otrosRecurrentes,
    otrosUnicos,
    otrosAcumulados,
    totalDeuda,
    pagado: p.pagado,
    saldo,
  };
}

/** Estado a mostrar: CANCELADO, VENCIDO (vencido con saldo) o ACTIVO. */
export function estadoPrenda(
  estado: string,
  saldo: number,
  fechaVencimiento: Date,
  hoy: Date = new Date(),
): "CANCELADO" | "VENCIDO" | "ACTIVO" {
  if (estado === "CANCELADO" || saldo <= 0) return "CANCELADO";
  if (fechaVencimiento < hoy) return "VENCIDO";
  return "ACTIVO";
}
