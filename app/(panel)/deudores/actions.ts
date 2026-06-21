"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { deudorSchema } from "@/lib/validaciones";
import { erroresZod, type FormState } from "@/lib/forms";
import { registrarAuditoria } from "@/lib/auditoria";

function limpiar(v: FormDataEntryValue | null): string | null {
  const s = v ? String(v).trim() : "";
  return s.length ? s : null;
}

export async function guardarDeudor(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRol("ADMIN", "COBRADOR");
  const id = formData.get("id") ? String(formData.get("id")) : null;

  const parsed = deudorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: erroresZod(parsed.error) };
  }

  const data = {
    nombre: parsed.data.nombre,
    documento: limpiar(formData.get("documento")),
    telefono: limpiar(formData.get("telefono")),
    direccion: limpiar(formData.get("direccion")),
    notas: limpiar(formData.get("notas")),
  };

  if (id) {
    await prisma.deudor.update({ where: { id }, data });
    await registrarAuditoria({
      usuarioId: user.id,
      accion: "ACTUALIZAR",
      entidad: "Deudor",
      entidadId: id,
      detalle: data,
    });
  } else {
    const creado = await prisma.deudor.create({ data });
    await registrarAuditoria({
      usuarioId: user.id,
      accion: "CREAR",
      entidad: "Deudor",
      entidadId: creado.id,
      detalle: data,
    });
  }

  revalidatePath("/deudores");
  redirect("/deudores");
}

export async function eliminarDeudor(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Identificador inválido" };

  const creditos = await prisma.credito.count({ where: { deudorId: id } });
  if (creditos > 0) {
    return {
      ok: false,
      error: "No se puede eliminar: el deudor tiene créditos registrados.",
    };
  }

  await prisma.deudor.delete({ where: { id } });
  await registrarAuditoria({
    usuarioId: user.id,
    accion: "ELIMINAR",
    entidad: "Deudor",
    entidadId: id,
  });

  revalidatePath("/deudores");
  redirect("/deudores");
}
