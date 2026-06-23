import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser, puedeEscribir, esAdmin } from "@/lib/auth";
import { formatCOP, formatFecha, formatFechaHora, formatPorcentaje } from "@/lib/format";
import { calcularPrenda, estadoPrenda } from "@/lib/prenda";
import { linkWhatsApp } from "@/lib/whatsapp";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AccionBoton } from "@/components/forms/accion-boton";
import { EliminarBoton } from "@/components/forms/eliminar-boton";
import { CobroPrendaForm } from "@/components/forms/cobro-prenda-form";
import { AbonoPrendaForm } from "@/components/forms/abono-prenda-form";
import { MensajeCobro } from "@/components/panel/mensaje-cobro";
import { recalcularPrenda, eliminarPrenda, eliminarCobro } from "../actions";

export const dynamic = "force-dynamic";

const TONO = { ACTIVO: "azul", VENCIDO: "ambar", CANCELADO: "verde" } as const;
const LABEL = { ACTIVO: "Activo", VENCIDO: "Vencido", CANCELADO: "Cancelado" };

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

export default async function PrendaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const prestamo = await prisma.prestamoPrenda.findUnique({
    where: { id },
    include: {
      deudor: true,
      creadoPor: true,
      cobros: { orderBy: { createdAt: "asc" } },
      pagos: { orderBy: { fechaPago: "desc" }, include: { registradoPor: true } },
    },
  });
  if (!prestamo) notFound();

  const hoy = new Date();
  const r = calcularPrenda({
    capital: prestamo.capital,
    tasaInteres: prestamo.tasaInteres,
    periodos: prestamo.periodos,
    cobros: prestamo.cobros,
    pagado: prestamo.pagado,
  });
  const est = estadoPrenda(prestamo.estado, r.saldo, prestamo.fechaVencimiento, hoy);
  const puedeEditar = puedeEscribir(user.rol);
  const activo = est !== "CANCELADO";

  const mensaje =
    `Señor(a) ${prestamo.deudor.nombre}, su préstamo con garantía (${prestamo.bienGarantia}) ` +
    `otorgado el ${formatFecha(prestamo.fechaDesembolso)} presenta un saldo total de ${formatCOP(r.saldo)}. ` +
    `Fecha de pago: ${formatFecha(prestamo.fechaVencimiento)}.` +
    (est === "VENCIDO" ? " El préstamo se encuentra vencido." : "");

  return (
    <div>
      <PageHeader
        title={prestamo.deudor.nombre}
        description={`Garantía: ${prestamo.bienGarantia}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/prenda" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
            {puedeEditar && activo && (
              <AccionBoton
                action={recalcularPrenda}
                id={prestamo.id}
                label="Recalcular deuda"
                pendingLabel="Recalculando..."
                confirmacion="¿Agregar un período más de interés y cobros recurrentes por incumplimiento?"
              />
            )}
            {esAdmin(user.rol) && (
              <EliminarBoton
                action={eliminarPrenda}
                id={prestamo.id}
                confirmacion="¿Eliminar el préstamo y todo su historial? No se puede deshacer."
              />
            )}
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Badge tono={TONO[est]}>{LABEL[est]}</Badge>
        <span className="text-sm text-slate-500">
          Período {prestamo.periodos} · vence {formatFecha(prestamo.fechaVencimiento)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <Dato label="Capital" value={formatCOP(prestamo.capital)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Dato label="Interés acumulado" value={formatCOP(r.interesAcumulado)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Dato label="Otros cobros" value={formatCOP(r.otrosAcumulados)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Dato label="Saldo total" value={formatCOP(r.saldo)} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de la deuda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Dato label="Tasa mensual" value={formatPorcentaje(prestamo.tasaInteres)} />
                <Dato label="Interés por período" value={formatCOP(r.interesPorPeriodo)} />
                <Dato label="Períodos acumulados" value={prestamo.periodos} />
                <Dato label="Desembolso" value={formatFecha(prestamo.fechaDesembolso)} />
                <Dato label="Vencimiento" value={formatFecha(prestamo.fechaVencimiento)} />
                <Dato label="Total deuda" value={formatCOP(r.totalDeuda)} />
                <Dato label="Pagado" value={formatCOP(r.pagado)} />
                <Dato label="Saldo" value={formatCOP(r.saldo)} />
                <Dato label="Registró" value={prestamo.creadoPor?.nombre ?? "—"} />
              </div>
              {prestamo.descripcion && (
                <p className="mt-3 text-sm text-slate-600">
                  <span className="text-slate-400">Garantía:</span> {prestamo.descripcion}
                </p>
              )}
              {prestamo.notas && (
                <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {prestamo.notas}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Otros cobros</CardTitle>
            </CardHeader>
            <CardContent>
              {prestamo.cobros.length === 0 ? (
                <p className="py-2 text-sm text-slate-500">Sin cobros adicionales.</p>
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Concepto</TH>
                      <TH className="text-right">Valor</TH>
                      <TH>Tipo</TH>
                      {puedeEditar && <TH></TH>}
                    </TR>
                  </THead>
                  <TBody>
                    {prestamo.cobros.map((c) => (
                      <TR key={c.id}>
                        <TD>{c.concepto}</TD>
                        <TD className="text-right">{formatCOP(c.valor)}</TD>
                        <TD>
                          {c.recurrente ? (
                            <Badge tono="ambar">Recurrente</Badge>
                          ) : (
                            <Badge tono="gris">Único</Badge>
                          )}
                        </TD>
                        {puedeEditar && (
                          <TD className="text-right">
                            <EliminarBoton action={eliminarCobro} id={c.id} label="Quitar" />
                          </TD>
                        )}
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
              {puedeEditar && activo && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <CobroPrendaForm prestamoId={prestamo.id} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de abonos</CardTitle>
            </CardHeader>
            <CardContent>
              {prestamo.pagos.length === 0 ? (
                <p className="py-2 text-sm text-slate-500">Sin abonos registrados.</p>
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Fecha</TH>
                      <TH className="text-right">Abono</TH>
                      <TH>Registró</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {prestamo.pagos.map((p) => (
                      <TR key={p.id}>
                        <TD>{formatFechaHora(p.fechaPago)}</TD>
                        <TD className="text-right font-medium">{formatCOP(p.valorAbono)}</TD>
                        <TD>{p.registradoPor?.nombre ?? "—"}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {puedeEditar && activo && (
            <Card>
              <CardHeader>
                <CardTitle>Registrar abono</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-slate-500">
                  Saldo:{" "}
                  <span className="font-semibold text-slate-900">{formatCOP(r.saldo)}</span>
                </p>
                <AbonoPrendaForm prestamoId={prestamo.id} saldo={r.saldo} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Mensaje de cobro</CardTitle>
            </CardHeader>
            <CardContent>
              <MensajeCobro mensaje={mensaje} telefono={prestamo.deudor.telefono} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
