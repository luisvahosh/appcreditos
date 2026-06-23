import {
  FileSpreadsheet,
  FileText,
  Banknote,
  Percent,
  Coins,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatCOP } from "@/lib/format";
import { PageHeader } from "@/components/panel/page-header";
import { KpiCard } from "@/components/panel/kpi-card";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const reportes = [
  {
    href: "/api/export/creditos",
    titulo: "Créditos (Excel)",
    descripcion: "Listado completo de créditos con saldos y estados.",
    icon: FileSpreadsheet,
    tono: "text-emerald-600",
  },
  {
    href: "/api/export/pagos",
    titulo: "Pagos (Excel)",
    descripcion: "Historial de abonos registrados.",
    icon: FileSpreadsheet,
    tono: "text-emerald-600",
  },
  {
    href: "/api/export/cartera",
    titulo: "Cartera (PDF)",
    descripcion: "Resumen ejecutivo con indicadores y créditos vigentes.",
    icon: FileText,
    tono: "text-red-600",
  },
];

export default async function ReportesPage() {
  await requireUser();

  const [pagos, cartera] = await Promise.all([
    prisma.pago.aggregate({
      _sum: {
        aplicadoCapital: true,
        aplicadoInteres: true,
        aplicadoMulta: true,
      },
    }),
    prisma.credito.aggregate({
      _sum: { saldoCapital: true, saldoInteres: true, multaAcumulada: true },
    }),
  ]);

  const capital = pagos._sum.aplicadoCapital ?? 0;
  const intereses = pagos._sum.aplicadoInteres ?? 0;
  const multas = pagos._sum.aplicadoMulta ?? 0;
  const utilidad = intereses + multas;
  const carteraPendiente =
    (cartera._sum.saldoCapital ?? 0) +
    (cartera._sum.saldoInteres ?? 0) +
    (cartera._sum.multaAcumulada ?? 0);

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Resumen financiero y exportación de la cartera"
      />

      <h2 className="mb-3 text-sm font-semibold text-slate-700">
        Resumen financiero
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Capital recuperado"
          value={formatCOP(capital)}
          hint="Abonos aplicados a capital"
          icon={Banknote}
          tono="azul"
        />
        <KpiCard
          label="Intereses obtenidos"
          value={formatCOP(intereses)}
          hint="Abonos aplicados a interés"
          icon={Percent}
          tono="verde"
        />
        <KpiCard
          label="Multas recaudadas"
          value={formatCOP(multas)}
          hint="Abonos aplicados a multa"
          icon={Coins}
          tono="rojo"
        />
        <KpiCard
          label="Utilidad acumulada"
          value={formatCOP(utilidad)}
          hint="Intereses + multas"
          icon={TrendingUp}
          tono="verde"
        />
        <KpiCard
          label="Cartera pendiente"
          value={formatCOP(carteraPendiente)}
          hint="Capital + interés + multa por cobrar"
          icon={Wallet}
          tono="ambar"
        />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-slate-700">
        Exportar
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportes.map((r) => {
          const Icon = r.icon;
          return (
            <a key={r.href} href={r.href} download>
              <Card className="transition-colors hover:border-blue-300">
                <CardContent className="flex items-start gap-3 p-5">
                  <Icon className={`h-8 w-8 ${r.tono}`} />
                  <div>
                    <p className="font-medium text-slate-900">{r.titulo}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {r.descripcion}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}
