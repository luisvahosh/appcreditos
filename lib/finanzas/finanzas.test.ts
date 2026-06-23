import { describe, expect, it } from "vitest";
import {
  calcularMora,
  calcularPlanPagos,
  distribuirAbono,
  generarMensajeCobro,
  pendientesCuota,
  type ConfigMulta,
  type CuotaCalc,
} from "./index";

const desembolso = new Date(2026, 4, 15); // 15/05/2026

describe("calcularPlanPagos", () => {
  it("PLANO: una cuota única, interés = capital * tasa", () => {
    const plan = calcularPlanPagos({
      valorPrestado: 1_000_000,
      tasaInteres: 0.1,
      metodoInteres: "PLANO",
      periodicidad: "UNICA",
      numeroCuotas: 1,
      fechaDesembolso: desembolso,
      fechaVencimiento: new Date(2026, 5, 15),
    });
    expect(plan).toHaveLength(1);
    expect(plan[0].valorCapital).toBe(1_000_000);
    expect(plan[0].valorInteres).toBe(100_000);
    expect(plan[0].valorCuota).toBe(1_100_000);
  });

  it("PLANO: interés plano = capital * tasa (una vez), repartido entre cuotas", () => {
    const plan = calcularPlanPagos({
      valorPrestado: 1_200_000,
      tasaInteres: 0.05,
      metodoInteres: "PLANO",
      periodicidad: "MENSUAL",
      numeroCuotas: 3,
      fechaDesembolso: desembolso,
    });
    expect(plan).toHaveLength(3);
    const capital = plan.reduce((s, c) => s + c.valorCapital, 0);
    const interes = plan.reduce((s, c) => s + c.valorInteres, 0);
    expect(capital).toBe(1_200_000);
    // 1.200.000 * 0.05 = 60.000 (una sola vez)
    expect(interes).toBe(60_000);
    expect(plan[0].valorInteres).toBe(20_000);
  });

  it("PLANO: ejemplo del requerimiento (500.000 al 15%, 4 cuotas)", () => {
    const plan = calcularPlanPagos({
      valorPrestado: 500_000,
      tasaInteres: 0.15,
      metodoInteres: "PLANO",
      periodicidad: "MENSUAL",
      numeroCuotas: 4,
      fechaDesembolso: desembolso,
    });
    const interes = plan.reduce((s, c) => s + c.valorInteres, 0);
    const total = plan.reduce((s, c) => s + c.valorCuota, 0);
    expect(interes).toBe(75_000); // 500.000 * 15%
    expect(total).toBe(575_000); // capital + interés
    expect(plan[0].valorCuota).toBe(143_750); // 575.000 / 4
  });

  it("SIMPLE: capital igual por cuota, interés decreciente sobre saldo", () => {
    const plan = calcularPlanPagos({
      valorPrestado: 900_000,
      tasaInteres: 0.1,
      metodoInteres: "SIMPLE",
      periodicidad: "MENSUAL",
      numeroCuotas: 3,
      fechaDesembolso: desembolso,
    });
    const capital = plan.reduce((s, c) => s + c.valorCapital, 0);
    expect(capital).toBe(900_000);
    // saldo inicial 900k -> 90k; luego 600k -> 60k; luego 300k -> 30k
    expect(plan[0].valorInteres).toBe(90_000);
    expect(plan[1].valorInteres).toBe(60_000);
    expect(plan[2].valorInteres).toBe(30_000);
  });

  it("CUOTA_FIJA: cuota constante y capital suma el total prestado", () => {
    const plan = calcularPlanPagos({
      valorPrestado: 1_000_000,
      tasaInteres: 0.02,
      metodoInteres: "CUOTA_FIJA",
      periodicidad: "MENSUAL",
      numeroCuotas: 12,
      fechaDesembolso: desembolso,
    });
    const capital = plan.reduce((s, c) => s + c.valorCapital, 0);
    expect(capital).toBe(1_000_000);
    // Las cuotas deben ser casi iguales (diferencia de redondeo < $2).
    const min = Math.min(...plan.map((c) => c.valorCuota));
    const max = Math.max(...plan.map((c) => c.valorCuota));
    expect(max - min).toBeLessThanOrEqual(2);
  });

  it("CUOTA_FIJA con tasa 0: capital / n sin interés", () => {
    const plan = calcularPlanPagos({
      valorPrestado: 1_000_000,
      tasaInteres: 0,
      metodoInteres: "CUOTA_FIJA",
      periodicidad: "MENSUAL",
      numeroCuotas: 4,
      fechaDesembolso: desembolso,
    });
    expect(plan.every((c) => c.valorInteres === 0)).toBe(true);
    expect(plan.reduce((s, c) => s + c.valorCapital, 0)).toBe(1_000_000);
  });
});

describe("pendientesCuota / distribuirAbono", () => {
  const cuota: CuotaCalc = {
    id: "c1",
    numero: 1,
    fechaVencimiento: new Date(2026, 5, 15),
    valorCapital: 100_000,
    valorInteres: 20_000,
    abonado: 0,
    multa: 5_000,
  };

  it("orden de aplicación: multa -> interés -> capital", () => {
    const res = distribuirAbono([cuota], 30_000);
    expect(res.totalMulta).toBe(5_000);
    expect(res.totalInteres).toBe(20_000);
    expect(res.totalCapital).toBe(5_000);
    expect(res.sobrante).toBe(0);
  });

  it("abono mayor al total deja sobrante", () => {
    const res = distribuirAbono([cuota], 200_000);
    expect(res.aplicado).toBe(125_000);
    expect(res.sobrante).toBe(75_000);
  });

  it("distribuye entre varias cuotas, la más antigua primero", () => {
    const c2: CuotaCalc = { ...cuota, id: "c2", numero: 2, multa: 0 };
    const res = distribuirAbono([cuota, c2], 130_000);
    // c1: 5k multa + 20k interés + 100k capital = 125k; quedan 5k para c2
    const a1 = res.asignaciones.find((a) => a.cuotaId === "c1")!;
    const a2 = res.asignaciones.find((a) => a.cuotaId === "c2")!;
    expect(a1.capital).toBe(100_000);
    expect(a2.interes).toBe(5_000);
  });

  it("pendientesCuota deriva pagos parciales en orden", () => {
    const pend = pendientesCuota({
      valorCapital: 100_000,
      valorInteres: 20_000,
      abonado: 10_000,
      multa: 5_000,
    });
    // 10k cubre 5k multa + 5k interés
    expect(pend.multaPend).toBe(0);
    expect(pend.interesPend).toBe(15_000);
    expect(pend.capitalPend).toBe(100_000);
  });
});

describe("calcularMora", () => {
  const config: ConfigMulta = {
    tipo: "PORCENTAJE",
    valor: 0.02,
    aplicaPorDiaMora: false,
    diasGracia: 0,
  };

  it("sin atraso no genera multa", () => {
    const r = calcularMora(
      { fechaVencimiento: new Date(2026, 5, 20), saldoPendiente: 1_000_000 },
      new Date(2026, 5, 15),
      config,
    );
    expect(r.diasMora).toBe(0);
    expect(r.multa).toBe(0);
  });

  it("porcentaje fijo sobre saldo", () => {
    const r = calcularMora(
      { fechaVencimiento: new Date(2026, 5, 15), saldoPendiente: 1_250_000 },
      new Date(2026, 5, 21),
      config,
    );
    expect(r.diasMora).toBe(6);
    expect(r.multa).toBe(25_000); // 1.250.000 * 0.02
  });

  it("valor fijo por día de mora respeta días de gracia", () => {
    const r = calcularMora(
      { fechaVencimiento: new Date(2026, 5, 15), saldoPendiente: 500_000 },
      new Date(2026, 5, 21),
      { tipo: "FIJO", valor: 5_000, aplicaPorDiaMora: true, diasGracia: 2 },
    );
    // 6 días - 2 gracia = 4 días * 5.000
    expect(r.diasMora).toBe(4);
    expect(r.multa).toBe(20_000);
  });
});

describe("generarMensajeCobro", () => {
  it("reproduce el formato del ejemplo del requerimiento", () => {
    const msg = generarMensajeCobro({
      nombreDeudor: "Juan Pérez",
      saldoPendiente: 1_250_000,
      fechaDesembolso: new Date(2026, 4, 15),
      fechaVencimiento: new Date(2026, 5, 15),
      diasMora: 6,
      multa: 25_000,
      totalPagar: 1_275_000,
    });
    expect(msg).toContain("Señor(a) Juan Pérez");
    expect(msg).toContain("saldo pendiente de $1.250.000");
    expect(msg).toContain("crédito otorgado el 15/05/2026");
    expect(msg).toContain("venció el 15/06/2026");
    expect(msg).toContain("6 días de mora");
    expect(msg).toContain("multa de $25.000");
    expect(msg).toContain("total a cancelar es de $1.275.000");
  });
});
