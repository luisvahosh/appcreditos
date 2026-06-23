"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMonths } from "date-fns";
import { prisma } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import {
  prendaSchema,
  cobroPrendaSchema,
  abonoPrendaSchema,
} from "@/lib/validaciones";
import { erroresZod, type FormState } from "@/lib/forms";
import { registrarAuditoria } from "@/lib/auditoria";
import { calcularPrenda } from "@/lib/prenda";

export async function crearPrenda(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRol("ADMIN", "COBRADOR");

  const raw = Object.fromEntries(formData);
  if (!raw.fechaVencimiento) delete (raw as Record<string, unknown>).fechaVencimiento;
  const parsed = prendaSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: erroresZod(parsed.error) };
  }
  const d = parsed.data;
  const fechaVencimiento = d.fechaVencimiento ?? addMonths(d.fechaDesembolso, 1);

  const prestamo = await prisma.prestamoPrenda.create({
    data: {
      deudorId: d.deudorId,
      bienGarantia: d.bienGarantia,
      descripcion: d.descripcion ?? null,
      capital: Math.round(d.capital),
      tasaInteres: d.tasaInteresPct / 100,
      fechaDesembolso: d.fechaDesembolso,
      fechaVencimiento,
      periodos: 1,
      pagado: 0,
      estado: "ACTIVO",
      notas: d.notas ?? null,
      creadoPorId: user.id,
    },
  });

  await registrarAuditoria({
    usuarioId: user.id,
    accion: "CREAR",
    entidad: "PrestamoPrenda",
    entidadId: prestamo.id,
    detalle: { bien: d.bienGarantia, capital: d.capital },
  });

  revalidatePath("/prenda");
  redirect(`/prenda/${prestamo.id}`);
}

export async function agregarCobro(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRol("ADMIN", "COBRADOR");
  const parsed = cobroPrendaSchema.safeParse({
    prestamoId: formData.get("prestamoId"),
    concepto: formData.get("concepto"),
    valor: formData.get("valor"),
    recurrente: formData.get("recurrente") === "on",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: erroresZod(parsed.error) };
  }

  await prisma.cobroPrenda.create({
    data: {
      prestamoId: parsed.data.prestamoId,
      concepto: parsed.data.concepto,
      valor: Math.round(parsed.data.valor),
      recurrente: parsed.data.recurrente,
    },
  });
  await registrarAuditoria({
    usuarioId: user.id,
    accion: "COBRO",
    entidad: "PrestamoPrenda",
    entidadId: parsed.data.prestamoId,
    detalle: { concepto: parsed.data.concepto, valor: parsed.data.valor },
  });

  revalidatePath(`/prenda/${parsed.data.prestamoId}`);
  return { ok: true };
}

export async function eliminarCobro(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRol("ADMIN", "COBRADOR");
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Identificador inválido" };
  const cobro = await prisma.cobroPrenda.delete({ where: { id } });
  revalidatePath(`/prenda/${cobro.prestamoId}`);
  return { ok: true };
}

export async function registrarAbonoPrenda(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRol("ADMIN", "COBRADOR");
  const parsed = abonoPrendaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: erroresZod(parsed.error) };
  }
  const { prestamoId, valorAbono, fechaPago, nota } = parsed.data;

  const prestamo = await prisma.prestamoPrenda.findUnique({
    where: { id: prestamoId },
    include: { cobros: true },
  });
  if (!prestamo) return { ok: false, error: "Préstamo no encontrado" };
  if (prestamo.estado === "CANCELADO") {
    return { ok: false, error: "El préstamo está cancelado." };
  }

  const resumen = calcularPrenda({
    capital: prestamo.capital,
    tasaInteres: prestamo.tasaInteres,
    periodos: prestamo.periodos,
    cobros: prestamo.cobros,
    pagado: prestamo.pagado,
  });

  const aplicado = Math.min(Math.round(valorAbono), resumen.saldo);
  if (aplicado <= 0) {
    return { ok: false, error: "El préstamo no tiene saldo pendiente." };
  }
  const nuevoPagado = prestamo.pagado + aplicado;
  const cancelado = nuevoPagado >= resumen.totalDeuda;

  await prisma.$transaction([
    prisma.pagoPrenda.create({
      data: {
        prestamoId,
        valorAbono: aplicado,
        fechaPago: fechaPago ?? new Date(),
        registradoPorId: user.id,
        nota: nota ?? null,
      },
    }),
    prisma.prestamoPrenda.update({
      where: { id: prestamoId },
      data: { pagado: nuevoPagado, estado: cancelado ? "CANCELADO" : prestamo.estado },
    }),
  ]);

  await registrarAuditoria({
    usuarioId: user.id,
    accion: "ABONO",
    entidad: "PrestamoPrenda",
    entidadId: prestamoId,
    detalle: { abono: aplicado },
  });

  revalidatePath(`/prenda/${prestamoId}`);
  revalidatePath("/prenda");
  redirect(`/prenda/${prestamoId}?abono=ok`);
}

export async function recalcularPrenda(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRol("ADMIN", "COBRADOR");
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Identificador inválido" };

  const prestamo = await prisma.prestamoPrenda.findUnique({ where: { id } });
  if (!prestamo) return { ok: false, error: "Préstamo no encontrado" };
  if (prestamo.estado === "CANCELADO") {
    return { ok: false, error: "El préstamo está cancelado." };
  }

  await prisma.prestamoPrenda.update({
    where: { id },
    data: {
      periodos: prestamo.periodos + 1,
      fechaVencimiento: addMonths(prestamo.fechaVencimiento, 1),
      estado: "ACTIVO",
    },
  });
  await registrarAuditoria({
    usuarioId: user.id,
    accion: "RECALCULAR",
    entidad: "PrestamoPrenda",
    entidadId: id,
    detalle: { periodos: prestamo.periodos + 1 },
  });

  revalidatePath(`/prenda/${id}`);
  revalidatePath("/prenda");
  return { ok: true };
}

export async function eliminarPrenda(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Identificador inválido" };

  await prisma.prestamoPrenda.delete({ where: { id } });
  await registrarAuditoria({
    usuarioId: user.id,
    accion: "ELIMINAR",
    entidad: "PrestamoPrenda",
    entidadId: id,
  });

  revalidatePath("/prenda");
  redirect("/prenda");
}
