import type { MetodoInteres, Periodicidad } from "../constantes";

export interface PlanInput {
  valorPrestado: number;
  /** Tasa fraccionaria por período (0.1 = 10%). */
  tasaInteres: number;
  metodoInteres: MetodoInteres;
  periodicidad: Periodicidad;
  numeroCuotas: number;
  fechaDesembolso: Date;
  /** Solo para periodicidad UNICA: fecha del único vencimiento. */
  fechaVencimiento?: Date;
}

export interface PlanCuota {
  numero: number;
  fechaVencimiento: Date;
  valorCapital: number;
  valorInteres: number;
  valorCuota: number;
}

/** Estado mínimo de una cuota necesario para cálculos de saldo/abono. */
export interface CuotaCalc {
  id: string;
  numero: number;
  fechaVencimiento: Date;
  valorCapital: number;
  valorInteres: number;
  abonado: number;
  multa: number;
}

export interface PendientesCuota {
  multaPend: number;
  interesPend: number;
  capitalPend: number;
  totalPend: number;
}

export interface AsignacionAbono {
  cuotaId: string;
  multa: number;
  interes: number;
  capital: number;
}

export interface ResultadoAbono {
  asignaciones: AsignacionAbono[];
  totalMulta: number;
  totalInteres: number;
  totalCapital: number;
  aplicado: number;
  sobrante: number;
}

export interface ConfigMulta {
  tipo: "PORCENTAJE" | "FIJO";
  valor: number;
  aplicaPorDiaMora: boolean;
  diasGracia: number;
}
