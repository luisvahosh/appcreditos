"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { configMultaSchema } from "@/lib/validaciones";
import { erroresZod, type FormState } from "@/lib/forms";
import { registrarAuditoria } from "@/lib/auditoria";
import { recalcularCartera } from "@/lib/jobs/actualizarEstados";

export async function guardarConfigMulta(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRol("ADMIN");

  const parsed = configMultaSchema.safeParse({
    tipo: formData.get("tipo"),
    valor: formData.get("valor"),
    aplicaPorDiaMora: formData.get("aplicaPorDiaMora") === "on",
    diasGracia: formData.get("diasGracia"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: erroresZod(parsed.error) };
  }

  // PORCENTAJE: el usuario ingresa % (2 => 0.02). FIJO: pesos enteros.
  const valor =
    parsed.data.tipo === "PORCENTAJE"
      ? parsed.data.valor / 100
      : Math.round(parsed.data.valor);

  const data = {
    tipo: parsed.data.tipo,
    valor,
    aplicaPorDiaMora: parsed.data.aplicaPorDiaMora,
    diasGracia: parsed.data.diasGracia,
    activa: true,
    updatedPorId: user.id,
  };

  const actual = await prisma.configuracionMulta.findFirst({
    where: { activa: true },
  });
  if (actual) {
    await prisma.configuracionMulta.update({ where: { id: actual.id }, data });
  } else {
    await prisma.configuracionMulta.create({ data });
  }

  await registrarAuditoria({
    usuarioId: user.id,
    accion: "CONFIG_MULTA",
    entidad: "ConfiguracionMulta",
    detalle: data,
  });

  revalidatePath("/configuracion/multas");
  return { ok: true };
}

export async function recalcularAhora() {
  const user = await requireRol("ADMIN");
  const res = await recalcularCartera();
  await registrarAuditoria({
    usuarioId: user.id,
    accion: "RECALCULAR",
    entidad: "Cartera",
    detalle: res,
  });
  revalidatePath("/configuracion/multas");
  revalidatePath("/");
  revalidatePath("/creditos");
}
