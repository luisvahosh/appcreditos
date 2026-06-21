"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { creditoSchema } from "@/lib/validaciones";
import { construirCredito } from "@/lib/creditos";
import { erroresZod, type FormState } from "@/lib/forms";
import { registrarAuditoria } from "@/lib/auditoria";

function parseCredito(formData: FormData) {
  const raw = Object.fromEntries(formData);
  // Limpia campos opcionales vacíos para que Zod los trate como ausentes.
  if (!raw.fechaVencimiento) delete (raw as Record<string, unknown>).fechaVencimiento;
  return creditoSchema.safeParse(raw);
}

export async function crearCredito(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRol("ADMIN", "COBRADOR");

  const parsed = parseCredito(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: erroresZod(parsed.error) };
  }

  const c = construirCredito(parsed.data);

  const credito = await prisma.credito.create({
    data: {
      deudorId: parsed.data.deudorId,
      valorPrestado: c.saldoCapital,
      tasaInteres: c.tasaFraccion,
      metodoInteres: parsed.data.metodoInteres,
      periodicidad: parsed.data.periodicidad,
      numeroCuotas: c.numeroCuotas,
      fechaDesembolso: parsed.data.fechaDesembolso,
      fechaVencimiento: c.fechaVencimiento,
      estado: "ACTIVO",
      saldoCapital: c.saldoCapital,
      saldoInteres: c.saldoInteres,
      multaAcumulada: 0,
      notas: parsed.data.notas ?? null,
      creadoPorId: user.id,
      cuotas: { create: c.cuotas },
    },
  });

  await registrarAuditoria({
    usuarioId: user.id,
    accion: "CREAR",
    entidad: "Credito",
    entidadId: credito.id,
    detalle: {
      deudorId: parsed.data.deudorId,
      valorPrestado: c.saldoCapital,
      metodoInteres: parsed.data.metodoInteres,
    },
  });

  revalidatePath("/creditos");
  revalidatePath("/");
  redirect(`/creditos/${credito.id}`);
}

export async function editarCredito(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRol("ADMIN", "COBRADOR");
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Identificador inválido" };

  const pagos = await prisma.pago.count({ where: { creditoId: id } });
  if (pagos > 0) {
    return {
      ok: false,
      error:
        "No se pueden cambiar las condiciones: el crédito ya tiene abonos. Elimina los abonos o crea un crédito nuevo.",
    };
  }

  const parsed = parseCredito(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: erroresZod(parsed.error) };
  }

  const c = construirCredito(parsed.data);

  await prisma.$transaction([
    prisma.cuota.deleteMany({ where: { creditoId: id } }),
    prisma.credito.update({
      where: { id },
      data: {
        deudorId: parsed.data.deudorId,
        valorPrestado: c.saldoCapital,
        tasaInteres: c.tasaFraccion,
        metodoInteres: parsed.data.metodoInteres,
        periodicidad: parsed.data.periodicidad,
        numeroCuotas: c.numeroCuotas,
        fechaDesembolso: parsed.data.fechaDesembolso,
        fechaVencimiento: c.fechaVencimiento,
        estado: "ACTIVO",
        saldoCapital: c.saldoCapital,
        saldoInteres: c.saldoInteres,
        multaAcumulada: 0,
        notas: parsed.data.notas ?? null,
        cuotas: { create: c.cuotas },
      },
    }),
  ]);

  await registrarAuditoria({
    usuarioId: user.id,
    accion: "ACTUALIZAR",
    entidad: "Credito",
    entidadId: id,
  });

  revalidatePath("/creditos");
  revalidatePath(`/creditos/${id}`);
  redirect(`/creditos/${id}`);
}

export async function cancelarCredito(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRol("ADMIN", "COBRADOR");
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Identificador inválido" };

  await prisma.credito.update({ where: { id }, data: { estado: "CANCELADO" } });
  await registrarAuditoria({
    usuarioId: user.id,
    accion: "CANCELAR",
    entidad: "Credito",
    entidadId: id,
  });

  revalidatePath("/creditos");
  revalidatePath(`/creditos/${id}`);
  revalidatePath("/");
  return { ok: true };
}

export async function eliminarCredito(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Identificador inválido" };

  // Cuotas y pagos se eliminan en cascada (onDelete: Cascade).
  await prisma.credito.delete({ where: { id } });
  await registrarAuditoria({
    usuarioId: user.id,
    accion: "ELIMINAR",
    entidad: "Credito",
    entidadId: id,
  });

  revalidatePath("/creditos");
  revalidatePath("/");
  redirect("/creditos");
}
