import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatCOP, formatFechaHora } from "@/lib/format";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  await requireUser();
  const pagos = await prisma.pago.findMany({
    orderBy: { fechaPago: "desc" },
    take: 200,
    include: {
      credito: { include: { deudor: true } },
      registradoPor: true,
    },
  });

  const total = pagos.reduce((s, p) => s + p.valorAbono, 0);

  return (
    <div>
      <PageHeader
        title="Pagos"
        description="Historial de abonos registrados (últimos 200)"
      />

      <Card>
        <CardContent className="pt-4">
          {pagos.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Aún no hay abonos registrados.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-500">
                Total mostrado:{" "}
                <span className="font-semibold text-slate-900">
                  {formatCOP(total)}
                </span>
              </p>
              <Table>
                <THead>
                  <TR>
                    <TH>Fecha</TH>
                    <TH>Deudor</TH>
                    <TH className="text-right">Abono</TH>
                    <TH className="text-right">Capital</TH>
                    <TH className="text-right">Interés</TH>
                    <TH className="text-right">Multa</TH>
                    <TH>Registró</TH>
                  </TR>
                </THead>
                <TBody>
                  {pagos.map((p) => (
                    <TR key={p.id}>
                      <TD>{formatFechaHora(p.fechaPago)}</TD>
                      <TD>
                        <Link
                          href={`/creditos/${p.creditoId}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {p.credito.deudor.nombre}
                        </Link>
                      </TD>
                      <TD className="text-right font-medium">
                        {formatCOP(p.valorAbono)}
                      </TD>
                      <TD className="text-right">{formatCOP(p.aplicadoCapital)}</TD>
                      <TD className="text-right">{formatCOP(p.aplicadoInteres)}</TD>
                      <TD className="text-right">{formatCOP(p.aplicadoMulta)}</TD>
                      <TD>{p.registradoPor?.nombre ?? "—"}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
