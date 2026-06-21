import { RefreshCw } from "lucide-react";
import { requireRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigMultaForm } from "@/components/forms/config-multa-form";
import { recalcularAhora } from "./actions";

export const dynamic = "force-dynamic";

export default async function ConfiguracionMultasPage() {
  await requireRol("ADMIN");
  const config = await prisma.configuracionMulta.findFirst({
    where: { activa: true },
    orderBy: { updatedAt: "desc" },
  });

  const datos = {
    tipo: config?.tipo ?? "PORCENTAJE",
    valorMostrado:
      (config?.tipo ?? "PORCENTAJE") === "PORCENTAJE"
        ? Math.round((config?.valor ?? 0) * 10000) / 100
        : (config?.valor ?? 0),
    aplicaPorDiaMora: config?.aplicaPorDiaMora ?? false,
    diasGracia: config?.diasGracia ?? 0,
  };

  return (
    <div>
      <PageHeader
        title="Configuración de multas"
        description="Reglas para el cálculo de multas por mora"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Regla de multa</CardTitle>
            </CardHeader>
            <CardContent>
              <ConfigMultaForm config={datos} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recalcular cartera</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-slate-500">
              Aplica multas por mora y actualiza los estados de todos los créditos
              según la fecha de hoy.
            </p>
            <form action={recalcularAhora}>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" /> Recalcular ahora
              </button>
            </form>
            <p className="mt-3 text-xs text-slate-400">
              También puede automatizarse llamando a{" "}
              <code className="rounded bg-slate-100 px-1">/api/cron/recalcular</code>{" "}
              con el token configurado.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
