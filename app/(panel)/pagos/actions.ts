"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { pagoSchema } from "@/lib/validaciones";
import { erroresZod, type FormState } from "@/lib/forms";
import { registrarAuditoria } from "@/lib/auditoria";
import { distribuirAbono, pendientesCuota } from "@/lib/finanzas";

export async function registrarAbono(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRol("ADMIN", "COBRADOR");

  const parsed = pagoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: erroresZod(parsed.error) };
  }
  const { creditoId, valorAbono, fechaPago, nota } = parsed.data;

  const credito = await prisma.credito.findUnique({
    where: { id: creditoId },
    include: { cuotas: { orderBy: { numero: "asc" } } },
  });
  if (!credito) return { ok: false, error: "Crédito no encontrado" };
  if (credito.estado === "CANCELADO") {
    return { ok: false, error: "El crédito está cancelado." };
  }

  const cuotasCalc = credito.cuotas.map((c) => ({
    id: c.id,
    numero: c.numero,
    fechaVencimiento: c.fechaVencimiento,
    valorCapital: c.valorCapital,
    valorInteres: c.valorInteres,
    abonado: c.abonado,
    multa: c.multa,
  }));

  const res = distribuirAbono(cuotasCalc, valorAbono);
  if (res.aplicado <= 0) {
    return { ok: false, error: "El crédito no tiene saldo pendiente por cobrar." };
  }

  // Aplica las asignaciones a las cuotas y recalcula totales del crédito.
  const cuotaPorId = new Map(credito.cuotas.map((c) => [c.id, { ...c }]));
  for (const a of res.asignaciones) {
    const cuota = cuotaPorId.get(a.cuotaId)!;
    cuota.abonado = cuota.abonado + a.multa + a.interes + a.capital;
  }

  let saldoCapital = 0;
  let saldoInteres = 0;
  let multaAcumulada = 0;
  const updates = [];
  for (const cuota of cuotaPorId.values()) {
    const pend = pendientesCuota(cuota);
    saldoCapital += pend.capitalPend;
    saldoInteres += pend.interesPend;
    multaAcumulada += pend.multaPend;
    const saldoPendiente = pend.totalPend;
    const estado = saldoPendiente <= 0 ? "PAGADA" : cuota.abonado > 0 ? "PARCIAL" : cuota.estado;
    updates.push(
      prisma.cuota.update({
        where: { id: cuota.id },
        data: { abonado: cuota.abonado, saldoPendiente, estado },
      }),
    );
  }

  const totalPendiente = saldoCapital + saldoInteres + multaAcumulada;
  const estadoCredito =
    totalPendiente <= 0
      ? "CANCELADO"
      : credito.estado === "CANCELADO"
        ? "ACTIVO"
        : credito.estado;

  await prisma.$transaction([
    prisma.pago.create({
      data: {
        creditoId,
        cuotaId: res.asignaciones[0]?.cuotaId ?? null,
        valorAbono: res.aplicado,
        aplicadoCapital: res.totalCapital,
        aplicadoInteres: res.totalInteres,
        aplicadoMulta: res.totalMulta,
        fechaPago: fechaPago ?? new Date(),
        registradoPorId: user.id,
        nota: nota ?? null,
      },
    }),
    ...updates,
    prisma.credito.update({
      where: { id: creditoId },
      data: { saldoCapital, saldoInteres, multaAcumulada, estado: estadoCredito },
    }),
  ]);

  await registrarAuditoria({
    usuarioId: user.id,
    accion: "ABONO",
    entidad: "Credito",
    entidadId: creditoId,
    detalle: {
      valorAbono: res.aplicado,
      capital: res.totalCapital,
      interes: res.totalInteres,
      multa: res.totalMulta,
    },
  });

  revalidatePath(`/creditos/${creditoId}`);
  revalidatePath("/pagos");
  revalidatePath("/");
  redirect(`/creditos/${creditoId}?abono=ok`);
}
