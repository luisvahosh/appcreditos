"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { pagoSchema } from "@/lib/validaciones";
import { erroresZod, type FormState } from "@/lib/forms";
import { registrarAuditoria } from "@/lib/auditoria";
import { distribuirAbono, pendientesCuota } from "@/lib/finanzas";
import { desplazarUnPeriodo } from "@/lib/creditos";

export async function registrarAbono(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRol("ADMIN", "COBRADOR");

  const parsed = pagoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: erroresZod(parsed.error) };
  }
  const { creditoId, valorAbono, multaManual, fechaPago, nota } = parsed.data;

  const credito = await prisma.credito.findUnique({
    where: { id: creditoId },
    include: { cuotas: { orderBy: { numero: "asc" } } },
  });
  if (!credito) return { ok: false, error: "Crédito no encontrado" };
  if (credito.estado === "CANCELADO") {
    return { ok: false, error: "El crédito está cancelado." };
  }

  // Distribuye el abono (interés y capital) entre las cuotas pendientes.
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

  if (res.aplicado <= 0 && multaManual <= 0) {
    return { ok: false, error: "El crédito no tiene saldo pendiente por cobrar." };
  }

  // Estado en memoria de cada cuota tras aplicar el abono.
  const estados = new Map(
    credito.cuotas.map((c) => [
      c.id,
      {
        id: c.id,
        valorCapital: c.valorCapital,
        valorInteres: c.valorInteres,
        multa: c.multa,
        abonado: c.abonado,
        fechaVencimiento: c.fechaVencimiento,
      },
    ]),
  );
  for (const a of res.asignaciones) {
    const cu = estados.get(a.cuotaId)!;
    cu.abonado += a.multa + a.interes + a.capital;
  }

  const hoy = new Date();
  const aplaza = multaManual > 0;

  // Si se paga multa, se aplaza un período cada cuota que aún tiene saldo.
  let saldoCapital = 0;
  let saldoInteres = 0;
  let hayMora = false;
  let fechaVencimientoMax = credito.fechaVencimiento;
  const updates = [];

  for (const cu of estados.values()) {
    const pend = pendientesCuota(cu);
    let fechaVenc = cu.fechaVencimiento;

    if (aplaza && pend.totalPend > 0) {
      fechaVenc = desplazarUnPeriodo(cu.fechaVencimiento, credito.periodicidad);
    }

    saldoCapital += pend.capitalPend;
    saldoInteres += pend.interesPend;
    if (fechaVenc > fechaVencimientoMax) fechaVencimientoMax = fechaVenc;

    const vencida = pend.totalPend > 0 && fechaVenc < hoy;
    if (vencida) hayMora = true;
    const estadoCuota =
      pend.totalPend <= 0
        ? "PAGADA"
        : vencida
          ? "EN_MORA"
          : cu.abonado > 0
            ? "PARCIAL"
            : "PENDIENTE";

    updates.push(
      prisma.cuota.update({
        where: { id: cu.id },
        data: {
          abonado: cu.abonado,
          saldoPendiente: pend.totalPend,
          fechaVencimiento: fechaVenc,
          estado: estadoCuota,
        },
      }),
    );
  }

  const totalPend = saldoCapital + saldoInteres;
  const estadoCredito =
    totalPend <= 0
      ? "CANCELADO"
      : hayMora
        ? "EN_MORA"
        : fechaVencimientoMax < hoy
          ? "VENCIDO"
          : "ACTIVO";

  await prisma.$transaction([
    prisma.pago.create({
      data: {
        creditoId,
        cuotaId: res.asignaciones[0]?.cuotaId ?? null,
        valorAbono: res.aplicado + multaManual,
        aplicadoCapital: res.totalCapital,
        aplicadoInteres: res.totalInteres,
        aplicadoMulta: multaManual,
        fechaPago: fechaPago ?? new Date(),
        registradoPorId: user.id,
        nota: nota ?? null,
      },
    }),
    ...updates,
    prisma.credito.update({
      where: { id: creditoId },
      data: {
        saldoCapital,
        saldoInteres,
        multaAcumulada: 0,
        fechaVencimiento: fechaVencimientoMax,
        estado: estadoCredito,
      },
    }),
  ]);

  await registrarAuditoria({
    usuarioId: user.id,
    accion: aplaza ? "ABONO_CON_MULTA" : "ABONO",
    entidad: "Credito",
    entidadId: creditoId,
    detalle: {
      abono: res.aplicado,
      capital: res.totalCapital,
      interes: res.totalInteres,
      multa: multaManual,
      aplazo: aplaza,
    },
  });

  revalidatePath(`/creditos/${creditoId}`);
  revalidatePath("/pagos");
  revalidatePath("/");
  redirect(`/creditos/${creditoId}?abono=ok`);
}
