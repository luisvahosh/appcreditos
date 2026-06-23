import Link from "next/link";
import { ArrowLeft, Eye, MessageCircle } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatCOP } from "@/lib/format";
import { linkWhatsApp } from "@/lib/whatsapp";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ReporteMoraPage() {
  await requireUser();
  const hoy = new Date();

  const creditos = await prisma.credito.findMany({
    where: { estado: { not: "CANCELADO" } },
    include: {
      deudor: true,
      cuotas: { where: { saldoPendiente: { gt: 0 } }, select: { fechaVencimiento: true } },
    },
  });

  const filas = creditos
    .map((c) => {
      let dias = 0;
      for (const q of c.cuotas) {
        const d = differenceInCalendarDays(hoy, q.fechaVencimiento);
        if (d > dias) dias = d;
      }
      return {
        id: c.id,
        deudor: c.deudor.nombre,
        telefono: c.deudor.telefono,
        dias,
        saldo: c.saldoCapital + c.saldoInteres + c.multaAcumulada,
      };
    })
    .filter((f) => f.dias > 0)
    .sort((a, b) => b.dias - a.dias);

  const totalMora = filas.reduce((s, f) => s + f.saldo, 0);

  return (
    <div>
      <PageHeader
        title="Créditos en mora"
        description="Ordenados por días de atraso"
        action={
          <Link href="/reportes" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        }
      />
      <Card>
        <CardContent className="pt-4">
          {filas.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No hay créditos en mora. 🎉
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-500">
                {filas.length} crédito(s) en mora · saldo total{" "}
                <span className="font-semibold text-slate-900">{formatCOP(totalMora)}</span>
              </p>
              <Table>
                <THead>
                  <TR>
                    <TH>Deudor</TH>
                    <TH className="text-center">Días de atraso</TH>
                    <TH className="text-right">Saldo</TH>
                    <TH className="text-right">Acciones</TH>
                  </TR>
                </THead>
                <TBody>
                  {filas.map((f) => {
                    const msg = `Le recordamos que su crédito presenta un saldo de ${formatCOP(
                      f.saldo,
                    )} con ${f.dias} días de atraso. Por favor comunicarse para regularizar su pago.`;
                    return (
                      <TR key={f.id}>
                        <TD className="font-medium text-slate-900">{f.deudor}</TD>
                        <TD className="text-center">
                          <Badge tono={f.dias > 30 ? "rojo" : "ambar"}>{f.dias} días</Badge>
                        </TD>
                        <TD className="text-right">{formatCOP(f.saldo)}</TD>
                        <TD className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={linkWhatsApp(f.telefono, msg)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                            >
                              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                            </a>
                            <Link
                              href={`/creditos/${f.id}`}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
