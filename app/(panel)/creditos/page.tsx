import Link from "next/link";
import { Plus, Eye } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser, puedeEscribir } from "@/lib/auth";
import { formatCOP, formatFecha } from "@/lib/format";
import { METODO_INTERES_LABEL, type MetodoInteres } from "@/lib/constantes";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { EstadoCreditoBadge } from "@/components/panel/estado-badge";

export const dynamic = "force-dynamic";

export default async function CreditosPage() {
  const user = await requireUser();
  const creditos = await prisma.credito.findMany({
    orderBy: { createdAt: "desc" },
    include: { deudor: true },
  });

  return (
    <div>
      <PageHeader
        title="Créditos"
        description="Cartera de créditos otorgados"
        action={
          puedeEscribir(user.rol) && (
            <Link href="/creditos/nuevo" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> Nuevo crédito
            </Link>
          )
        }
      />

      <Card>
        <CardContent className="pt-4">
          {creditos.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Aún no hay créditos registrados.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Deudor</TH>
                  <TH className="text-right">Prestado</TH>
                  <TH>Método</TH>
                  <TH className="text-right">Saldo</TH>
                  <TH>Vence</TH>
                  <TH>Estado</TH>
                  <TH className="text-right">Acción</TH>
                </TR>
              </THead>
              <TBody>
                {creditos.map((c) => {
                  const saldo = c.saldoCapital + c.saldoInteres + c.multaAcumulada;
                  return (
                    <TR key={c.id}>
                      <TD className="font-medium text-slate-900">
                        {c.deudor.nombre}
                      </TD>
                      <TD className="text-right">{formatCOP(c.valorPrestado)}</TD>
                      <TD>{METODO_INTERES_LABEL[c.metodoInteres as MetodoInteres]}</TD>
                      <TD className="text-right">{formatCOP(saldo)}</TD>
                      <TD>{formatFecha(c.fechaVencimiento)}</TD>
                      <TD>
                        <EstadoCreditoBadge estado={c.estado} />
                      </TD>
                      <TD className="text-right">
                        <Link
                          href={`/creditos/${c.id}`}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="h-3.5 w-3.5" /> Ver
                        </Link>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
