import Link from "next/link";
import { Plus, Eye, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser, puedeEscribir } from "@/lib/auth";
import { getConfigMulta } from "@/lib/config";
import { formatCOP, formatFecha } from "@/lib/format";
import { METODO_INTERES_LABEL, type MetodoInteres } from "@/lib/constantes";
import {
  calcularResumenCredito,
  generarMensajeCobro,
  type CuotaCalc,
} from "@/lib/finanzas";
import { linkWhatsApp } from "@/lib/whatsapp";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { EstadoCreditoBadge } from "@/components/panel/estado-badge";

export const dynamic = "force-dynamic";

export default async function CreditosPage() {
  const user = await requireUser();
  const [creditos, config] = await Promise.all([
    prisma.credito.findMany({
      orderBy: { createdAt: "desc" },
      include: { deudor: true, cuotas: { orderBy: { numero: "asc" } } },
    }),
    getConfigMulta(),
  ]);
  const hoy = new Date();

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
                  <TH className="text-right">Acciones</TH>
                </TR>
              </THead>
              <TBody>
                {creditos.map((c) => {
                  const saldo = c.saldoCapital + c.saldoInteres + c.multaAcumulada;
                  const activo = c.estado !== "CANCELADO";

                  // Mensaje de cobro y enlace de WhatsApp al número del cliente.
                  const cuotasCalc: CuotaCalc[] = c.cuotas.map((q) => ({
                    id: q.id,
                    numero: q.numero,
                    fechaVencimiento: q.fechaVencimiento,
                    valorCapital: q.valorCapital,
                    valorInteres: q.valorInteres,
                    abonado: q.abonado,
                    multa: q.multa,
                  }));
                  const resumen = calcularResumenCredito(cuotasCalc, hoy, config, c.estado);
                  const fechaVenc =
                    resumen.cuotaVencida?.fechaVencimiento ??
                    resumen.proximaCuota?.fechaVencimiento ??
                    c.fechaVencimiento;
                  const mensaje = generarMensajeCobro({
                    nombreDeudor: c.deudor.nombre,
                    saldoPendiente: resumen.saldoSinMulta,
                    fechaDesembolso: c.fechaDesembolso,
                    fechaVencimiento: fechaVenc,
                    diasMora: resumen.diasMora,
                    multa: resumen.multaPendiente,
                    totalPagar: resumen.totalPagar,
                  });
                  const wa = linkWhatsApp(c.deudor.telefono, mensaje);

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
                        <div className="flex items-center justify-end gap-1">
                          {activo && (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Enviar cobro por WhatsApp"
                              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                            >
                              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                            </a>
                          )}
                          <Link
                            href={`/creditos/${c.id}`}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-3.5 w-3.5" /> Ver
                          </Link>
                        </div>
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
