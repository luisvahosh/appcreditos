import { prisma } from "@/lib/db";

export async function registrarAuditoria(params: {
  usuarioId?: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  detalle?: unknown;
}) {
  try {
    await prisma.auditoria.create({
      data: {
        usuarioId: params.usuarioId ?? null,
        accion: params.accion,
        entidad: params.entidad,
        entidadId: params.entidadId ?? null,
        detalle: params.detalle ? JSON.stringify(params.detalle) : null,
      },
    });
  } catch (e) {
    // La auditoría no debe romper la operación principal.
    console.error("Error registrando auditoría:", e);
  }
}
