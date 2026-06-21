import { FileSpreadsheet, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";

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

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Exporta la información de la cartera"
      />
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
