import {
  FileSpreadsheet,
  FileText,
  Banknote,
  Percent,
  Coins,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatCOP } from "@/lib/format";
import { ESTADO_CREDITO_LABEL, type EstadoCredito } from "@/lib/constantes";
import { PageHeader } from "@/components/panel/page-header";
import { KpiCard } from "@/components/panel/kpi-card";
import { BarChart } from "@/components/panel/bar-chart";
import { DonutChart } from "@/components/panel/donut-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

const ESTADO_COLOR: Record<string, string> = {
  ACTIVO: "#3b82f6",
  EN_MORA: "#ef4444",
  VENCIDO: "#f59e0b",
  CANCELADO: "#10b981",
};

const exportaciones = [
  {
    href: "/api/export/creditos",
    titulo: "Créditos (Excel)",
    descripcion: "Listado de créditos con saldos y estados.",
    icon: FileSpreadsheet,
    tono: "text-emerald-600",
  },
  {
    href: "/api/export/pagos",
    titulo: "Pagos (Excel)",
    descripcion: "Abonos de créditos y prendas.",
    icon: FileSpreadsheet,
    tono: "text-emerald-600",
  },
  {
    href: "/api/export/cartera",
    titulo: "Cartera (PDF)",
    descripcion: "Resumen ejecutivo de la cartera.",
    icon: FileText,
    tono: "text-red-600",
  },
];

export default async function ReportesPage() {
  await requireUser();
  const hoy = new Date();
  const desde6 = new Date(hoy);
  desde6.setMonth(desde6.getMonth() - 5);
  desde6.setDate(1);
  desde6.setHours(0, 0, 0, 0);

  const [
    pagosAgg,
    cartera,
    prendaAgg,
    estados,
    pagosMes,
    prendaMes,
    pagoPorUser,
    prendaPorUser,
    usuarios,
    saldoPorDeudor,
  ] = await Promise.all([
    prisma.pago.aggregate({
      _sum: { aplicadoCapital: true, aplicadoInteres: true, aplicadoMulta: true },
    }),
    prisma.credito.aggregate({
      _sum: { saldoCapital: true, saldoInteres: true, multaAcumulada: true },
    }),
    prisma.pagoPrenda.aggregate({ _sum: { valorAbono: true } }),
    prisma.credito.groupBy({ by: ["estado"], _count: { _all: true } }),
    prisma.pago.findMany({
      where: { fechaPago: { gte: desde6 } },
      select: { fechaPago: true, valorAbono: true },
    }),
    prisma.pagoPrenda.findMany({
      where: { fechaPago: { gte: desde6 } },
      select: { fechaPago: true, valorAbono: true },
    }),
    prisma.pago.groupBy({ by: ["registradoPorId"], _sum: { valorAbono: true } }),
    prisma.pagoPrenda.groupBy({
      by: ["registradoPorId"],
      _sum: { valorAbono: true },
    }),
    prisma.user.findMany({ select: { id: true, nombre: true } }),
    prisma.credito.groupBy({
      by: ["deudorId"],
      _sum: { saldoCapital: true, saldoInteres: true, multaAcumulada: true },
    }),
  ]);

  // Resumen financiero
  const capital = pagosAgg._sum.aplicadoCapital ?? 0;
  const intereses = pagosAgg._sum.aplicadoInteres ?? 0;
  const multas = pagosAgg._sum.aplicadoMulta ?? 0;
  const prendaRecaudo = prendaAgg._sum.valorAbono ?? 0;
  const utilidad = intereses + multas;
  const carteraPendiente =
    (cartera._sum.saldoCapital ?? 0) +
    (cartera._sum.saldoInteres ?? 0) +
    (cartera._sum.multaAcumulada ?? 0);

  // Donut: créditos por estado
  const donutEstado = estados.map((e) => ({
    label: ESTADO_CREDITO_LABEL[e.estado as EstadoCredito] ?? e.estado,
    value: e._count._all,
    color: ESTADO_COLOR[e.estado] ?? "#94a3b8",
  }));

  // Barras: recaudo últimos 6 meses
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy);
    d.setMonth(d.getMonth() - (5 - i));
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: format(d, "MMM yy", { locale: es }),
      value: 0,
    };
  });
  const idxMes = new Map(meses.map((m, i) => [m.key, i]));
  for (const p of [...pagosMes, ...prendaMes]) {
    const d = new Date(p.fechaPago);
    const i = idxMes.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (i != null) meses[i].value += p.valorAbono;
  }

  // Donut: composición del recaudo
  const donutComp = [
    { label: "Capital", value: capital, color: "#3b82f6" },
    { label: "Interés", value: intereses, color: "#10b981" },
    { label: "Multas", value: multas, color: "#ef4444" },
    { label: "Prendas", value: prendaRecaudo, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  // Barras: recaudo por cobrador
  const nombreUser = new Map(usuarios.map((u) => [u.id, u.nombre]));
  const recaudoUser = new Map<string, number>();
  for (const g of [...pagoPorUser, ...prendaPorUser]) {
    const k = g.registradoPorId ?? "—";
    recaudoUser.set(k, (recaudoUser.get(k) ?? 0) + (g._sum.valorAbono ?? 0));
  }
  const barCobrador = [...recaudoUser.entries()]
    .map(([id, v]) => ({
      label: id === "—" ? "Sin asignar" : nombreUser.get(id) ?? "—",
      value: v,
    }))
    .sort((a, b) => b.value - a.value);

  // Tabla: mayores saldos por deudor
  const topSaldos = saldoPorDeudor
    .map((g) => ({
      deudorId: g.deudorId,
      saldo:
        (g._sum.saldoCapital ?? 0) +
        (g._sum.saldoInteres ?? 0) +
        (g._sum.multaAcumulada ?? 0),
    }))
    .filter((x) => x.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo)
    .slice(0, 10);
  const deudoresTop = await prisma.deudor.findMany({
    where: { id: { in: topSaldos.map((t) => t.deudorId) } },
    select: { id: true, nombre: true },
  });
  const nombreDeudor = new Map(deudoresTop.map((d) => [d.id, d.nombre]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <PageHeader
          title="Reportes"
          description="Indicadores, gráficos y exportación"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Capital recuperado" value={formatCOP(capital)} icon={Banknote} tono="azul" />
          <KpiCard label="Intereses obtenidos" value={formatCOP(intereses)} icon={Percent} tono="verde" />
          <KpiCard label="Multas recaudadas" value={formatCOP(multas)} icon={Coins} tono="rojo" />
          <KpiCard label="Recaudo prendas" value={formatCOP(prendaRecaudo)} icon={Coins} tono="ambar" />
          <KpiCard label="Utilidad acumulada" value={formatCOP(utilidad)} hint="Intereses + multas" icon={TrendingUp} tono="verde" />
          <KpiCard label="Cartera pendiente" value={formatCOP(carteraPendiente)} icon={Wallet} tono="ambar" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Créditos por estado</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={donutEstado} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Composición del recaudo</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={donutComp} formato={formatCOP} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recaudo últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={meses.map((m) => ({ label: m.label, value: m.value }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recaudo por cobrador</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={barCobrador} color="#10b981" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mayores saldos por deudor</CardTitle>
        </CardHeader>
        <CardContent>
          {topSaldos.length === 0 ? (
            <p className="py-2 text-sm text-slate-500">Sin cartera pendiente.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>#</TH>
                  <TH>Deudor</TH>
                  <TH className="text-right">Saldo</TH>
                </TR>
              </THead>
              <TBody>
                {topSaldos.map((t, i) => (
                  <TR key={t.deudorId}>
                    <TD>{i + 1}</TD>
                    <TD className="font-medium text-slate-900">
                      {nombreDeudor.get(t.deudorId) ?? "—"}
                    </TD>
                    <TD className="text-right">{formatCOP(t.saldo)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Exportar</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exportaciones.map((r) => {
            const Icon = r.icon;
            return (
              <a key={r.href} href={r.href} download>
                <Card className="transition-colors hover:border-blue-300">
                  <CardContent className="flex items-start gap-3 p-5">
                    <Icon className={`h-8 w-8 ${r.tono}`} />
                    <div>
                      <p className="font-medium text-slate-900">{r.titulo}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{r.descripcion}</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
