import Link from "next/link";
import { Plus, Eye } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser, puedeEscribir } from "@/lib/auth";
import { formatCOP, formatFecha } from "@/lib/format";
import { calcularPrenda, estadoPrenda } from "@/lib/prenda";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const TONO = { ACTIVO: "azul", VENCIDO: "ambar", CANCELADO: "verde" } as const;
const LABEL = { ACTIVO: "Activo", VENCIDO: "Vencido", CANCELADO: "Cancelado" };

export default async function PrendaPage() {
  const user = await requireUser();
  const prestamos = await prisma.prestamoPrenda.findMany({
    orderBy: { createdAt: "desc" },
    include: { deudor: true, cobros: true },
  });
  const hoy = new Date();

  return (
    <div>
      <PageHeader
        title="Préstamos con prenda"
        description="Préstamos respaldados con garantía"
        action={
          puedeEscribir(user.rol) && (
            <Link href="/prenda/nuevo" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> Nuevo préstamo
            </Link>
          )
        }
      />

      <Card>
        <CardContent className="pt-4">
          {prestamos.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Aún no hay préstamos con prenda.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Deudor</TH>
                  <TH>Garantía</TH>
                  <TH className="text-right">Capital</TH>
                  <TH className="text-right">Saldo</TH>
                  <TH>Vence</TH>
                  <TH>Estado</TH>
                  <TH className="text-right">Acción</TH>
                </TR>
              </THead>
              <TBody>
                {prestamos.map((p) => {
                  const r = calcularPrenda({
                    capital: p.capital,
                    tasaInteres: p.tasaInteres,
                    periodos: p.periodos,
                    cobros: p.cobros,
                    pagado: p.pagado,
                  });
                  const est = estadoPrenda(p.estado, r.saldo, p.fechaVencimiento, hoy);
                  return (
                    <TR key={p.id}>
                      <TD className="font-medium text-slate-900">{p.deudor.nombre}</TD>
                      <TD>{p.bienGarantia}</TD>
                      <TD className="text-right">{formatCOP(p.capital)}</TD>
                      <TD className="text-right">{formatCOP(r.saldo)}</TD>
                      <TD>{formatFecha(p.fechaVencimiento)}</TD>
                      <TD>
                        <Badge tono={TONO[est]}>{LABEL[est]}</Badge>
                      </TD>
                      <TD className="text-right">
                        <Link
                          href={`/prenda/${p.id}`}
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
