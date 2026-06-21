import { calcularPlanPagos, redondearPesos } from "@/lib/finanzas";
import type { CreditoInput } from "@/lib/validaciones";

export interface CreditoConstruido {
  tasaFraccion: number;
  numeroCuotas: number;
  saldoCapital: number;
  saldoInteres: number;
  fechaVencimiento: Date;
  cuotas: {
    numero: number;
    fechaVencimiento: Date;
    valorCuota: number;
    valorCapital: number;
    valorInteres: number;
    saldoPendiente: number;
    abonado: number;
    multa: number;
    estado: string;
  }[];
}

/**
 * A partir de los datos validados del formulario calcula el plan de cuotas y
 * los totales denormalizados para persistir el crédito.
 */
export function construirCredito(input: CreditoInput): CreditoConstruido {
  const tasaFraccion = input.tasaInteresPct / 100;
  const numeroCuotas = input.periodicidad === "UNICA" ? 1 : input.numeroCuotas;
  const valorPrestado = redondearPesos(input.valorPrestado);

  const plan = calcularPlanPagos({
    valorPrestado,
    tasaInteres: tasaFraccion,
    metodoInteres: input.metodoInteres,
    periodicidad: input.periodicidad,
    numeroCuotas,
    fechaDesembolso: input.fechaDesembolso,
    fechaVencimiento: input.fechaVencimiento,
  });

  const saldoInteres = plan.reduce((s, c) => s + c.valorInteres, 0);
  const fechaVencimiento = plan[plan.length - 1].fechaVencimiento;

  return {
    tasaFraccion,
    numeroCuotas,
    saldoCapital: valorPrestado,
    saldoInteres,
    fechaVencimiento,
    cuotas: plan.map((c) => ({
      numero: c.numero,
      fechaVencimiento: c.fechaVencimiento,
      valorCuota: c.valorCuota,
      valorCapital: c.valorCapital,
      valorInteres: c.valorInteres,
      saldoPendiente: c.valorCuota,
      abonado: 0,
      multa: 0,
      estado: "PENDIENTE",
    })),
  };
}
