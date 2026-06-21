import Link from "next/link";
import {
  Banknote,
  TrendingUp,
  Wallet,
  CircleAlert,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Coins,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatCOP, formatFecha } from "@/lib/format";
import { PageHeader } from "@/components/panel/page-header";
import { KpiCard } from "@/components/panel/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EstadoCuotaBadge } from "@/components/panel/estado-badge";

export const dynamic = "force-dynamic";

export default async function TableroPage() {
  await requireUser();
  const hoy = new Date();

  const [prestado, recaudado, saldo, multas, activos, enMora, vencidos, proximas] =
    await Promise.all([
      prisma.credito.aggregate({ _sum: { valorPrestado: true } }),
      prisma.pago.aggregate({ _sum: { valorAbono: true } }),
      prisma.credito.aggregate({
        _sum: { saldoCapital: true, saldoInteres: true },
      }),
      prisma.credito.aggregate({ _sum: { multaAcumulada: true } }),
      prisma.credito.count({ where: { estado: "ACTIVO" } }),
      prisma.credito.count({ where: { estado: "EN_MORA" } }),
      prisma.credito.count({
        where: { estado: { not: "CANCELADO" }, fechaVencimiento: { lt: hoy } },
      }),
      prisma.cuota.findMany({
        where: { saldoPendiente: { gt: 0 }, credito: { estado: { not: "CANCELADO" } } },
        orderBy: { fechaVencimiento: "asc" },
        take: 8,
        include: { credito: { include: { deudor: true } } },
      }),
    ]);

  const saldoPendiente =
    (saldo._sum.saldoCapital ?? 0) + (saldo._sum.saldoInteres ?? 0);

  return (
    <div>
      <PageHeader
        title="Tablero"
        description={`Resumen de cartera al ${formatFecha(hoy)}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total prestado"
          value={formatCOP(prestado._sum.valorPrestado ?? 0)}
          icon={Banknote}
          tono="azul"
        />
        <KpiCard
          label="Total recaudado"
          value={formatCOP(recaudado._sum.valorAbono ?? 0)}
          icon={TrendingUp}
          tono="verde"
        />
        <KpiCard
          label="Saldo por cobrar"
          value={formatCOP(saldoPendiente)}
          icon={Wallet}
          tono="ambar"
        />
        <KpiCard
          label="Multas acumuladas"
          value={formatCOP(multas._sum.multaAcumulada ?? 0)}
          icon={Coins}
          tono="rojo"
        />
        <KpiCard
          label="Créditos activos"
          value={String(activos)}
          icon={CheckCircle2}
          tono="azul"
        />
        <KpiCard
          label="Créditos en mora"
          value={String(enMora)}
          icon={CircleAlert}
          tono="rojo"
        />
        <KpiCard
          label="Créditos vencidos"
          value={String(vencidos)}
          icon={AlertTriangle}
          tono="ambar"
        />
        <KpiCard
          label="Próximos vencimientos"
          value={String(proximas.length)}
          hint="Cuotas pendientes más próximas"
          icon={CalendarClock}
          tono="gris"
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Próximos vencimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {proximas.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No hay cuotas pendientes registradas.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Deudor</TH>
                  <TH>Cuota</TH>
                  <TH>Vence</TH>
                  <TH className="text-right">Saldo cuota</TH>
                  <TH>Estado</TH>
                </TR>
              </THead>
              <TBody>
                {proximas.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <Link
                        href={`/creditos/${c.creditoId}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {c.credito.deudor.nombre}
                      </Link>
                    </TD>
                    <TD>
                      #{c.numero}
                    </TD>
                    <TD>{formatFecha(c.fechaVencimiento)}</TD>
                    <TD className="text-right">{formatCOP(c.saldoPendiente)}</TD>
                    <TD>
                      <EstadoCuotaBadge estado={c.estado} />
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
