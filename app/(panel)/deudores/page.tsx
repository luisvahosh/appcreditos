import Link from "next/link";
import { Plus, Pencil, FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser, puedeEscribir, esAdmin } from "@/lib/auth";
import { formatFecha } from "@/lib/format";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { EliminarBoton } from "@/components/forms/eliminar-boton";
import { eliminarDeudor } from "./actions";

export const dynamic = "force-dynamic";

export default async function DeudoresPage() {
  const user = await requireUser();
  const deudores = await prisma.deudor.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { creditos: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Deudores"
        description="Personas a las que se otorgan créditos"
        action={
          puedeEscribir(user.rol) && (
            <Link href="/deudores/nuevo" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> Nuevo deudor
            </Link>
          )
        }
      />

      <Card>
        <CardContent className="pt-4">
          {deudores.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Aún no hay deudores registrados.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Nombre</TH>
                  <TH>Documento</TH>
                  <TH>Teléfono</TH>
                  <TH className="text-center">Créditos</TH>
                  <TH>Registrado</TH>
                  <TH className="text-right">Acciones</TH>
                </TR>
              </THead>
              <TBody>
                {deudores.map((d) => (
                  <TR key={d.id}>
                    <TD className="font-medium text-slate-900">{d.nombre}</TD>
                    <TD>{d.documento ?? "—"}</TD>
                    <TD>{d.telefono ?? "—"}</TD>
                    <TD className="text-center">{d._count.creditos}</TD>
                    <TD>{formatFecha(d.createdAt)}</TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/api/export/estado-cuenta/${d.id}`}
                          download
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <FileText className="h-3.5 w-3.5" /> Estado de cuenta
                        </a>
                        {puedeEscribir(user.rol) && (
                          <Link
                            href={`/deudores/${d.id}/editar`}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </Link>
                        )}
                        {esAdmin(user.rol) && (
                          <EliminarBoton action={eliminarDeudor} id={d.id} />
                        )}
                      </div>
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
