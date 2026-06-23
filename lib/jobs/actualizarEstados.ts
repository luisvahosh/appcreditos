import { prisma } from "@/lib/db";
import { pendientesCuota } from "@/lib/finanzas";

/**
 * Recalcula saldos y estados (en mora / vencido / cancelado) de la cartera.
 * Las multas son MANUALES (se registran al recibir el pago), por lo que este
 * proceso ya no genera multas automáticas; solo actualiza estados por fecha.
 */
export async function recalcularCartera(hoy: Date = new Date()) {
  const creditos = await prisma.credito.findMany({
    where: { estado: { not: "CANCELADO" } },
    include: { cuotas: true },
  });

  let creditosActualizados = 0;

  for (const credito of creditos) {
    const ops = [];
    let saldoCapital = 0;
    let saldoInteres = 0;
    let multaAcumulada = 0;
    let hayMora = false;

    for (const cuota of credito.cuotas) {
      const pend = pendientesCuota(cuota);
      saldoCapital += pend.capitalPend;
      saldoInteres += pend.interesPend;
      multaAcumulada += pend.multaPend;

      let estadoCuota: string;
      if (pend.totalPend <= 0) {
        estadoCuota = "PAGADA";
      } else if (cuota.fechaVencimiento < hoy) {
        estadoCuota = "EN_MORA";
        hayMora = true;
      } else {
        estadoCuota = cuota.abonado > 0 ? "PARCIAL" : "PENDIENTE";
      }

      if (
        estadoCuota !== cuota.estado ||
        pend.totalPend !== cuota.saldoPendiente
      ) {
        ops.push(
          prisma.cuota.update({
            where: { id: cuota.id },
            data: { saldoPendiente: pend.totalPend, estado: estadoCuota },
          }),
        );
      }
    }

    const totalPend = saldoCapital + saldoInteres + multaAcumulada;
    let estadoCredito: string;
    if (totalPend <= 0) estadoCredito = "CANCELADO";
    else if (hayMora) estadoCredito = "EN_MORA";
    else if (credito.fechaVencimiento < hoy) estadoCredito = "VENCIDO";
    else estadoCredito = "ACTIVO";

    if (
      credito.saldoCapital !== saldoCapital ||
      credito.saldoInteres !== saldoInteres ||
      credito.multaAcumulada !== multaAcumulada ||
      credito.estado !== estadoCredito
    ) {
      ops.push(
        prisma.credito.update({
          where: { id: credito.id },
          data: { saldoCapital, saldoInteres, multaAcumulada, estado: estadoCredito },
        }),
      );
    }

    if (ops.length > 0) {
      await prisma.$transaction(ops);
      creditosActualizados++;
    }
  }

  return { creditosActualizados, total: creditos.length };
}
