import { prisma } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { formatFechaHora } from "@/lib/format";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AuditoriaPage() {
  await requireRol("ADMIN");
  const registros = await prisma.auditoria.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { usuario: true },
  });

  return (
    <div>
      <PageHeader
        title="Auditoría"
        description="Registro de operaciones del sistema (últimos 300)"
      />
      <Card>
        <CardContent className="pt-4">
          {registros.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Sin registros de auditoría.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Fecha</TH>
                  <TH>Usuario</TH>
                  <TH>Acción</TH>
                  <TH>Entidad</TH>
                  <TH>Detalle</TH>
                </TR>
              </THead>
              <TBody>
                {registros.map((r) => (
                  <TR key={r.id}>
                    <TD className="whitespace-nowrap">{formatFechaHora(r.createdAt)}</TD>
                    <TD>{r.usuario?.nombre ?? "—"}</TD>
                    <TD>
                      <Badge tono="azul">{r.accion}</Badge>
                    </TD>
                    <TD>{r.entidad}</TD>
                    <TD className="max-w-xs truncate text-xs text-slate-500">
                      {r.detalle ?? "—"}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
