import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatCOP, formatFechaHora } from "@/lib/format";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Fila = {
  id: string;
  fecha: Date;
  tipo: "Crédito" | "Prenda";
  deudor: string;
  href: string;
  abono: number;
  capital: number | null;
  interes: number | null;
  multa: number | null;
  registrador: string;
};

export default async function PagosPage() {
  await requireUser();

  const [pagos, pagosPrenda] = await Promise.all([
    prisma.pago.findMany({
      orderBy: { fechaPago: "desc" },
      take: 200,
      include: { credito: { include: { deudor: true } }, registradoPor: true },
    }),
    prisma.pagoPrenda.findMany({
      orderBy: { fechaPago: "desc" },
      take: 200,
      include: { prestamo: { include: { deudor: true } }, registradoPor: true },
    }),
  ]);

  const filas: Fila[] = [
    ...pagos.map((p) => ({
      id: p.id,
      fecha: p.fechaPago,
      tipo: "Crédito" as const,
      deudor: p.credito.deudor.nombre,
      href: `/creditos/${p.creditoId}`,
      abono: p.valorAbono,
      capital: p.aplicadoCapital,
      interes: p.aplicadoInteres,
      multa: p.aplicadoMulta,
      registrador: p.registradoPor?.nombre ?? "—",
    })),
    ...pagosPrenda.map((p) => ({
      id: p.id,
      fecha: p.fechaPago,
      tipo: "Prenda" as const,
      deudor: p.prestamo.deudor.nombre,
      href: `/prenda/${p.prestamoId}`,
      abono: p.valorAbono,
      capital: null,
      interes: null,
      multa: null,
      registrador: p.registradoPor?.nombre ?? "—",
    })),
  ]
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .slice(0, 200);

  const total = filas.reduce((s, f) => s + f.abono, 0);

  return (
    <div>
      <PageHeader
        title="Pagos"
        description="Historial de abonos de créditos y prendas (últimos 200)"
      />

      <Card>
        <CardContent className="pt-4">
          {filas.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Aún no hay abonos registrados.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-500">
                Total mostrado:{" "}
                <span className="font-semibold text-slate-900">{formatCOP(total)}</span>
              </p>
              <Table>
                <THead>
                  <TR>
                    <TH>Fecha</TH>
                    <TH>Tipo</TH>
                    <TH>Deudor</TH>
                    <TH className="text-right">Abono</TH>
                    <TH className="text-right">Capital</TH>
                    <TH className="text-right">Interés</TH>
                    <TH className="text-right">Multa</TH>
                    <TH>Registró</TH>
                  </TR>
                </THead>
                <TBody>
                  {filas.map((f) => (
                    <TR key={`${f.tipo}-${f.id}`}>
                      <TD>{formatFechaHora(f.fecha)}</TD>
                      <TD>
                        <Badge tono={f.tipo === "Prenda" ? "ambar" : "azul"}>
                          {f.tipo}
                        </Badge>
                      </TD>
                      <TD>
                        <Link href={f.href} className="font-medium text-blue-700 hover:underline">
                          {f.deudor}
                        </Link>
                      </TD>
                      <TD className="text-right font-medium">{formatCOP(f.abono)}</TD>
                      <TD className="text-right">
                        {f.capital == null ? "—" : formatCOP(f.capital)}
                      </TD>
                      <TD className="text-right">
                        {f.interes == null ? "—" : formatCOP(f.interes)}
                      </TD>
                      <TD className="text-right">
                        {f.multa == null ? "—" : formatCOP(f.multa)}
                      </TD>
                      <TD>{f.registrador}</TD>
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
