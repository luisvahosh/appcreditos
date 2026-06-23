import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatCOP, formatFecha } from "@/lib/format";
import { PageHeader } from "@/components/panel/page-header";
import { KpiCard } from "@/components/panel/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ReporteVencimientosPage() {
  await requireUser();
  const hoy = new Date();
  const inicio = startOfDay(hoy);
  const en30 = addDays(inicio, 30);

  const cuotas = await prisma.cuota.findMany({
    where: {
      saldoPendiente: { gt: 0 },
      fechaVencimiento: { gte: inicio, lte: en30 },
      credito: { estado: { not: "CANCELADO" } },
    },
    orderBy: { fechaVencimiento: "asc" },
    include: { credito: { include: { deudor: true } } },
  });

  const en7 = cuotas.filter(
    (c) => differenceInCalendarDays(c.fechaVencimiento, hoy) <= 7,
  );
  const total7 = en7.reduce((s, c) => s + c.saldoPendiente, 0);
  const total30 = cuotas.reduce((s, c) => s + c.saldoPendiente, 0);

  return (
    <div>
      <PageHeader
        title="Próximos vencimientos"
        description="Cuotas por cobrar en los próximos 30 días"
        action={
          <Link href="/reportes" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard label="Por cobrar en 7 días" value={formatCOP(total7)} hint={`${en7.length} cuotas`} tono="rojo" />
        <KpiCard label="Por cobrar en 30 días" value={formatCOP(total30)} hint={`${cuotas.length} cuotas`} tono="ambar" />
      </div>

      <Card>
        <CardContent className="pt-4">
          {cuotas.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No hay cuotas por vencer en los próximos 30 días.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Deudor</TH>
                  <TH className="text-center">Cuota</TH>
                  <TH>Vence</TH>
                  <TH className="text-center">En</TH>
                  <TH className="text-right">Saldo</TH>
                  <TH className="text-right">Ver</TH>
                </TR>
              </THead>
              <TBody>
                {cuotas.map((c) => {
                  const dias = differenceInCalendarDays(c.fechaVencimiento, hoy);
                  return (
                    <TR key={c.id}>
                      <TD className="font-medium text-slate-900">
                        {c.credito.deudor.nombre}
                      </TD>
                      <TD className="text-center">#{c.numero}</TD>
                      <TD>{formatFecha(c.fechaVencimiento)}</TD>
                      <TD className="text-center">
                        <Badge tono={dias <= 7 ? "rojo" : "gris"}>
                          {dias === 0 ? "hoy" : `${dias} días`}
                        </Badge>
                      </TD>
                      <TD className="text-right">{formatCOP(c.saldoPendiente)}</TD>
                      <TD className="text-right">
                        <Link
                          href={`/creditos/${c.creditoId}`}
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
