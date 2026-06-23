import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import {
  calcularPlanPagos,
  distribuirAbono,
  pendientesCuota,
} from "../lib/finanzas/index";
import type { MetodoInteres, Periodicidad } from "../lib/constantes";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const HOY = new Date();
function dias(n: number): Date {
  const d = new Date(HOY);
  d.setDate(d.getDate() + n);
  return d;
}

type AbonoDemo = { valor: number; fecha: Date };

interface EscenarioDemo {
  nombre: string;
  documento: string;
  telefono: string;
  valorPrestado: number;
  tasaInteres: number; // fracción por período
  metodoInteres: MetodoInteres;
  periodicidad: Periodicidad;
  numeroCuotas: number;
  fechaDesembolso: Date;
  fechaVencimiento?: Date; // solo UNICA
  abonos: AbonoDemo[];
  notas?: string;
}

// Cubre los 3 métodos de interés, todas las periodicidades y los estados
// (al día, en mora, parcial, pagado/cancelado).
const ESCENARIOS: EscenarioDemo[] = [
  {
    nombre: "Juan Pérez",
    documento: "DEMO-001",
    telefono: "3001112233",
    valorPrestado: 2_000_000,
    tasaInteres: 0.025,
    metodoInteres: "CUOTA_FIJA",
    periodicidad: "MENSUAL",
    numeroCuotas: 12,
    fechaDesembolso: dias(-60),
    abonos: [
      { valor: 190_000, fecha: dias(-30) },
      { valor: 190_000, fecha: dias(-1) },
    ],
    notas: "Cliente al día, cuota fija mensual.",
  },
  {
    nombre: "María Gómez",
    documento: "DEMO-002",
    telefono: "3004445566",
    valorPrestado: 1_200_000,
    tasaInteres: 0.08,
    metodoInteres: "SIMPLE",
    periodicidad: "MENSUAL",
    numeroCuotas: 6,
    fechaDesembolso: dias(-95),
    abonos: [],
    notas: "Sin abonos, cuotas vencidas (en mora).",
  },
  {
    nombre: "Carlos Ruiz",
    documento: "DEMO-003",
    telefono: "3007778899",
    valorPrestado: 500_000,
    tasaInteres: 0.2,
    metodoInteres: "PLANO",
    periodicidad: "UNICA",
    numeroCuotas: 1,
    fechaDesembolso: dias(-40),
    fechaVencimiento: dias(-10),
    abonos: [],
    notas: "Pago único vencido hace 10 días (mora + multa).",
  },
  {
    nombre: "Ana Torres",
    documento: "DEMO-004",
    telefono: "3002223344",
    valorPrestado: 800_000,
    tasaInteres: 0.05,
    metodoInteres: "CUOTA_FIJA",
    periodicidad: "QUINCENAL",
    numeroCuotas: 8,
    fechaDesembolso: dias(-10),
    abonos: [{ valor: 130_000, fecha: dias(-1) }],
    notas: "Crédito quincenal reciente, al día.",
  },
  {
    nombre: "Pedro Sánchez",
    documento: "DEMO-005",
    telefono: "3005556677",
    valorPrestado: 300_000,
    tasaInteres: 0.005,
    metodoInteres: "SIMPLE",
    periodicidad: "DIARIA",
    numeroCuotas: 30,
    fechaDesembolso: dias(-20),
    abonos: [
      { valor: 11_000, fecha: dias(-15) },
      { valor: 11_000, fecha: dias(-10) },
      { valor: 11_000, fecha: dias(-5) },
    ],
    notas: "Gota a gota (diario) con abonos parciales.",
  },
  {
    nombre: "Laura Díaz",
    documento: "DEMO-006",
    telefono: "3008889900",
    valorPrestado: 1_000_000,
    tasaInteres: 0.1,
    metodoInteres: "PLANO",
    periodicidad: "MENSUAL",
    numeroCuotas: 4,
    fechaDesembolso: dias(-50),
    abonos: [{ valor: 1_400_000, fecha: dias(-2) }],
    notas: "Crédito totalmente pagado (cancelado).",
  },
  {
    nombre: "Jorge Castro",
    documento: "DEMO-007",
    telefono: "3001234500",
    valorPrestado: 3_000_000,
    tasaInteres: 0.02,
    metodoInteres: "CUOTA_FIJA",
    periodicidad: "MENSUAL",
    numeroCuotas: 10,
    fechaDesembolso: dias(-20),
    abonos: [{ valor: 200_000, fecha: dias(-3) }],
    notas: "Crédito grande con un abono parcial.",
  },
  {
    nombre: "Sofía Romero",
    documento: "DEMO-008",
    telefono: "3009990011",
    valorPrestado: 600_000,
    tasaInteres: 0.03,
    metodoInteres: "SIMPLE",
    periodicidad: "SEMANAL",
    numeroCuotas: 12,
    fechaDesembolso: dias(-63),
    abonos: [
      { valor: 70_000, fecha: dias(-40) },
      { valor: 70_000, fecha: dias(-20) },
    ],
    notas: "Semanal con cuotas atrasadas (en mora).",
  },
];

async function main() {
  console.log("Cargando datos de demostración...");

  const admin = await prisma.user.findFirst({ where: { rol: "ADMIN" } });
  const cobrador =
    (await prisma.user.findFirst({ where: { rol: "COBRADOR" } })) ?? admin;

  for (const e of ESCENARIOS) {
    const deudor = await prisma.deudor.create({
      data: {
        nombre: e.nombre,
        documento: e.documento,
        telefono: e.telefono,
        notas: "[DEMO] " + (e.notas ?? ""),
      },
    });

    const plan = calcularPlanPagos({
      valorPrestado: e.valorPrestado,
      tasaInteres: e.tasaInteres,
      metodoInteres: e.metodoInteres,
      periodicidad: e.periodicidad,
      numeroCuotas: e.numeroCuotas,
      fechaDesembolso: e.fechaDesembolso,
      fechaVencimiento: e.fechaVencimiento,
    });
    const saldoInteres = plan.reduce((s, c) => s + c.valorInteres, 0);
    const fechaVenc = plan[plan.length - 1].fechaVencimiento;

    const credito = await prisma.credito.create({
      data: {
        deudorId: deudor.id,
        valorPrestado: e.valorPrestado,
        tasaInteres: e.tasaInteres,
        metodoInteres: e.metodoInteres,
        periodicidad: e.periodicidad,
        numeroCuotas: plan.length,
        fechaDesembolso: e.fechaDesembolso,
        fechaVencimiento: fechaVenc,
        estado: "ACTIVO",
        saldoCapital: e.valorPrestado,
        saldoInteres,
        multaAcumulada: 0,
        notas: "[DEMO] " + (e.notas ?? ""),
        creadoPorId: admin?.id ?? null,
        cuotas: {
          create: plan.map((c) => ({
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
        },
      },
      include: { cuotas: { orderBy: { numero: "asc" } } },
    });

    // Estado en memoria de las cuotas para aplicar abonos secuencialmente.
    const cuotas = credito.cuotas.map((c) => ({
      id: c.id,
      numero: c.numero,
      fechaVencimiento: c.fechaVencimiento,
      valorCapital: c.valorCapital,
      valorInteres: c.valorInteres,
      abonado: c.abonado,
      multa: c.multa,
    }));

    for (const abono of e.abonos) {
      const res = distribuirAbono(cuotas, abono.valor);
      if (res.aplicado <= 0) continue;
      for (const a of res.asignaciones) {
        const cu = cuotas.find((x) => x.id === a.cuotaId)!;
        cu.abonado += a.multa + a.interes + a.capital;
      }
      await prisma.pago.create({
        data: {
          creditoId: credito.id,
          cuotaId: res.asignaciones[0]?.cuotaId ?? null,
          valorAbono: res.aplicado,
          aplicadoCapital: res.totalCapital,
          aplicadoInteres: res.totalInteres,
          aplicadoMulta: res.totalMulta,
          fechaPago: abono.fecha,
          registradoPorId: cobrador?.id ?? null,
          nota: "[DEMO] abono",
        },
      });
    }

    // Recalcula saldos y estados por fecha (multas manuales, sin mora automática).
    let saldoCapital = 0;
    let saldoInteres2 = 0;
    let hayMora = false;

    for (const cuota of cuotas) {
      const pend = pendientesCuota(cuota);
      saldoCapital += pend.capitalPend;
      saldoInteres2 += pend.interesPend;

      let estadoCuota: string;
      if (pend.totalPend <= 0) {
        estadoCuota = "PAGADA";
      } else if (cuota.fechaVencimiento < HOY) {
        estadoCuota = "EN_MORA";
        hayMora = true;
      } else {
        estadoCuota = cuota.abonado > 0 ? "PARCIAL" : "PENDIENTE";
      }

      await prisma.cuota.update({
        where: { id: cuota.id },
        data: {
          abonado: cuota.abonado,
          saldoPendiente: pend.totalPend,
          estado: estadoCuota,
        },
      });
    }

    const totalPend = saldoCapital + saldoInteres2;
    const estadoCredito =
      totalPend <= 0
        ? "CANCELADO"
        : hayMora
          ? "EN_MORA"
          : fechaVenc < HOY
            ? "VENCIDO"
            : "ACTIVO";

    await prisma.credito.update({
      where: { id: credito.id },
      data: { saldoCapital, saldoInteres: saldoInteres2, multaAcumulada: 0, estado: estadoCredito },
    });

    console.log(`  ${e.nombre} (${e.metodoInteres}/${e.periodicidad}) -> ${estadoCredito}`);
  }

  console.log(`Listo. ${ESCENARIOS.length} créditos de demostración creados.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
