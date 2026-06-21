import { prisma } from "@/lib/db";
import { getConfigMulta } from "@/lib/config";
import { calcularMora, pendientesCuota } from "@/lib/finanzas";

/**
 * Recalcula multas por mora, saldos y estados de toda la cartera activa.
 * Idempotente: cada ejecución refleja los días de mora vigentes a `hoy`.
 */
export async function recalcularCartera(hoy: Date = new Date()) {
  const config = await getConfigMulta();
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
      const pendInicial = pendientesCuota(cuota);
      const baseMora = pendInicial.capitalPend + pendInicial.interesPend;

      let nuevaMulta = cuota.multa;
      let estadoCuota: string = cuota.estado;

      if (baseMora <= 0) {
        estadoCuota = "PAGADA";
      } else {
        const mora = calcularMora(
          { fechaVencimiento: cuota.fechaVencimiento, saldoPendiente: baseMora },
          hoy,
          config,
        );
        const multaYaPagada = Math.min(cuota.abonado, cuota.multa);
        nuevaMulta = multaYaPagada + mora.multa;
        if (mora.diasMora > 0) {
          estadoCuota = "EN_MORA";
          hayMora = true;
        } else {
          estadoCuota = cuota.abonado > 0 ? "PARCIAL" : "PENDIENTE";
        }
      }

      const pend = pendientesCuota({ ...cuota, multa: nuevaMulta });
      saldoCapital += pend.capitalPend;
      saldoInteres += pend.interesPend;
      multaAcumulada += pend.multaPend;

      if (nuevaMulta !== cuota.multa || estadoCuota !== cuota.estado || pend.totalPend !== cuota.saldoPendiente) {
        ops.push(
          prisma.cuota.update({
            where: { id: cuota.id },
            data: {
              multa: nuevaMulta,
              saldoPendiente: pend.totalPend,
              estado: estadoCuota,
            },
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

    const cambioCredito =
      credito.saldoCapital !== saldoCapital ||
      credito.saldoInteres !== saldoInteres ||
      credito.multaAcumulada !== multaAcumulada ||
      credito.estado !== estadoCredito;

    if (cambioCredito) {
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
