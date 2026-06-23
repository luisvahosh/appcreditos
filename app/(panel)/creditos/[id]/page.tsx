import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser, puedeEscribir, esAdmin } from "@/lib/auth";
import { getConfigMulta } from "@/lib/config";
import { formatCOP, formatFecha, formatFechaHora, formatPorcentaje } from "@/lib/format";
import {
  METODO_INTERES_LABEL,
  PERIODICIDAD_LABEL,
  type MetodoInteres,
  type Periodicidad,
} from "@/lib/constantes";
import {
  calcularResumenCredito,
  generarMensajeCobro,
  type CuotaCalc,
} from "@/lib/finanzas";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import {
  EstadoCreditoBadge,
  EstadoCuotaBadge,
} from "@/components/panel/estado-badge";
import { AbonoForm } from "@/components/forms/abono-form";
import { MensajeCobro } from "@/components/panel/mensaje-cobro";
import { AccionBoton } from "@/components/forms/accion-boton";
import { EliminarBoton } from "@/components/forms/eliminar-boton";
import { cancelarCredito, eliminarCredito } from "../actions";

export const dynamic = "force-dynamic";

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

export default async function CreditoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const credito = await prisma.credito.findUnique({
    where: { id },
    include: {
      deudor: true,
      creadoPor: true,
      cuotas: { orderBy: { numero: "asc" } },
      pagos: {
        orderBy: { fechaPago: "desc" },
        include: { registradoPor: true },
      },
    },
  });
  if (!credito) notFound();

  const config = await getConfigMulta();
  const hoy = new Date();
  const cuotasCalc: CuotaCalc[] = credito.cuotas.map((c) => ({
    id: c.id,
    numero: c.numero,
    fechaVencimiento: c.fechaVencimiento,
    valorCapital: c.valorCapital,
    valorInteres: c.valorInteres,
    abonado: c.abonado,
    multa: c.multa,
  }));
  const resumen = calcularResumenCredito(cuotasCalc, hoy, config, credito.estado);

  const fechaVenc =
    resumen.cuotaVencida?.fechaVencimiento ??
    resumen.proximaCuota?.fechaVencimiento ??
    credito.fechaVencimiento;

  const mensaje = generarMensajeCobro({
    nombreDeudor: credito.deudor.nombre,
    saldoPendiente: resumen.saldoSinMulta,
    fechaDesembolso: credito.fechaDesembolso,
    fechaVencimiento: fechaVenc,
    diasMora: resumen.diasMora,
    multa: resumen.multaPendiente,
    totalPagar: resumen.totalPagar,
  });

  const puedeEditar = puedeEscribir(user.rol);
  const activo = credito.estado !== "CANCELADO";

  return (
    <div>
      <PageHeader
        title={credito.deudor.nombre}
        description={
          credito.deudor.documento
            ? `Documento: ${credito.deudor.documento}`
            : credito.deudor.telefono ?? undefined
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/creditos"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
            {puedeEditar && (
              <Link
                href={`/creditos/${credito.id}/editar`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Pencil className="h-4 w-4" /> Editar
              </Link>
            )}
            {puedeEditar && activo && (
              <AccionBoton
                action={cancelarCredito}
                id={credito.id}
                label="Cancelar crédito"
                pendingLabel="Cancelando..."
                confirmacion="¿Marcar este crédito como cancelado?"
              />
            )}
            {esAdmin(user.rol) && (
              <EliminarBoton
                action={eliminarCredito}
                id={credito.id}
                label="Eliminar"
                confirmacion="¿Eliminar el crédito y todo su historial? Esta acción no se puede deshacer."
              />
            )}
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <EstadoCreditoBadge estado={resumen.estado} />
        {resumen.diasMora > 0 && (
          <span className="text-sm text-red-600">
            {resumen.diasMora} días de mora
          </span>
        )}
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <Dato label="Valor prestado" value={formatCOP(credito.valorPrestado)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Dato label="Saldo capital" value={formatCOP(resumen.saldoCapital)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Dato label="Interés pendiente" value={formatCOP(resumen.saldoInteres)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Dato
              label="Multa pendiente"
              value={formatCOP(resumen.multaPendiente)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Columna izquierda: condiciones + cuotas + pagos */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Condiciones del crédito</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Dato
                  label="Método"
                  value={METODO_INTERES_LABEL[credito.metodoInteres as MetodoInteres]}
                />
                <Dato
                  label="Tasa por período"
                  value={formatPorcentaje(credito.tasaInteres)}
                />
                <Dato
                  label="Periodicidad"
                  value={PERIODICIDAD_LABEL[credito.periodicidad as Periodicidad]}
                />
                <Dato label="N° de cuotas" value={credito.numeroCuotas} />
                <Dato label="Desembolso" value={formatFecha(credito.fechaDesembolso)} />
                <Dato label="Vencimiento" value={formatFecha(credito.fechaVencimiento)} />
                <Dato
                  label="Total a pagar hoy"
                  value={formatCOP(resumen.totalPagar)}
                />
                <Dato
                  label="Registrado por"
                  value={credito.creadoPor?.nombre ?? "—"}
                />
              </div>
              {credito.notas && (
                <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {credito.notas}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan de cuotas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>#</TH>
                    <TH>Vence</TH>
                    <TH className="text-right">Cuota</TH>
                    <TH className="text-right">Capital</TH>
                    <TH className="text-right">Interés</TH>
                    <TH className="text-right">Multa</TH>
                    <TH className="text-right">Saldo</TH>
                    <TH>Estado</TH>
                  </TR>
                </THead>
                <TBody>
                  {credito.cuotas.map((c) => (
                    <TR key={c.id}>
                      <TD>{c.numero}</TD>
                      <TD>{formatFecha(c.fechaVencimiento)}</TD>
                      <TD className="text-right">{formatCOP(c.valorCuota)}</TD>
                      <TD className="text-right">{formatCOP(c.valorCapital)}</TD>
                      <TD className="text-right">{formatCOP(c.valorInteres)}</TD>
                      <TD className="text-right">{formatCOP(c.multa)}</TD>
                      <TD className="text-right">{formatCOP(c.saldoPendiente)}</TD>
                      <TD>
                        <EstadoCuotaBadge estado={c.estado} />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {credito.pagos.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">
                  Sin abonos registrados.
                </p>
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Fecha</TH>
                      <TH className="text-right">Abono</TH>
                      <TH className="text-right">Capital</TH>
                      <TH className="text-right">Interés</TH>
                      <TH className="text-right">Multa</TH>
                      <TH>Registró</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {credito.pagos.map((p) => (
                      <TR key={p.id}>
                        <TD>{formatFechaHora(p.fechaPago)}</TD>
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: abono + mensaje de cobro */}
        <div className="flex flex-col gap-4">
          {puedeEditar && activo && (
            <Card>
              <CardHeader>
                <CardTitle>Registrar abono</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-slate-500">
                  Total a pagar: {" "}
                  <span className="font-semibold text-slate-900">
                    {formatCOP(resumen.totalPagar)}
                  </span>
                </p>
                <AbonoForm
                  creditoId={credito.id}
                  totalPagar={resumen.totalPagar}
                  periodicidadLabel={PERIODICIDAD_LABEL[
                    credito.periodicidad as Periodicidad
                  ].toLowerCase()}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Mensaje de cobro</CardTitle>
            </CardHeader>
            <CardContent>
              <MensajeCobro mensaje={mensaje} telefono={credito.deudor.telefono} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
