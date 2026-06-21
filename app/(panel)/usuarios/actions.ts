"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { usuarioSchema } from "@/lib/validaciones";
import { erroresZod, type FormState } from "@/lib/forms";
import { registrarAuditoria } from "@/lib/auditoria";

function esP2002(e: unknown): boolean {
  return !!e && typeof e === "object" && (e as { code?: string }).code === "P2002";
}

export async function guardarUsuario(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireRol("ADMIN");
  const id = formData.get("id") ? String(formData.get("id")) : null;

  const parsed = usuarioSchema.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    rol: formData.get("rol"),
    activo: formData.get("activo") === "on",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: erroresZod(parsed.error) };
  }
  const { nombre, email, rol, activo, password } = parsed.data;

  if (!id && !password) {
    return { ok: false, fieldErrors: { password: "La contraseña es obligatoria" } };
  }

  try {
    if (id) {
      const data: {
        nombre: string;
        email: string;
        rol: string;
        activo: boolean;
        passwordHash?: string;
      } = { nombre, email, rol, activo };
      if (password) data.passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({ where: { id }, data });
    } else {
      const passwordHash = await bcrypt.hash(password as string, 10);
      await prisma.user.create({
        data: { nombre, email, rol, activo, passwordHash },
      });
    }
  } catch (e) {
    if (esP2002(e)) {
      return { ok: false, fieldErrors: { email: "Ese correo ya está registrado" } };
    }
    throw e;
  }

  await registrarAuditoria({
    usuarioId: me.id,
    accion: id ? "ACTUALIZAR" : "CREAR",
    entidad: "User",
    entidadId: id ?? undefined,
    detalle: { nombre, email, rol, activo },
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function eliminarUsuario(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Identificador inválido" };
  if (id === me.id) {
    return { ok: false, error: "No puedes eliminar tu propia cuenta." };
  }

  const [creditos, pagos] = await Promise.all([
    prisma.credito.count({ where: { creadoPorId: id } }),
    prisma.pago.count({ where: { registradoPorId: id } }),
  ]);
  if (creditos > 0 || pagos > 0) {
    return {
      ok: false,
      error: "Tiene registros asociados. Desactívalo en lugar de eliminarlo.",
    };
  }

  await prisma.user.delete({ where: { id } });
  await registrarAuditoria({
    usuarioId: me.id,
    accion: "ELIMINAR",
    entidad: "User",
    entidadId: id,
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}
