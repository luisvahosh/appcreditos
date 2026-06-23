import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CreditoForm } from "@/components/forms/credito-form";

export const dynamic = "force-dynamic";

export default async function EditarCreditoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol("ADMIN", "COBRADOR");
  const { id } = await params;

  const [credito, deudores, pagos] = await Promise.all([
    prisma.credito.findUnique({ where: { id } }),
    prisma.deudor.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true, documento: true } }),
    prisma.pago.count({ where: { creditoId: id } }),
  ]);
  if (!credito) notFound();

  return (
    <div>
      <PageHeader
        title="Editar crédito"
        description={`Crédito de ${deudores.find((d) => d.id === credito.deudorId)?.nombre ?? ""}`}
      />
      {pagos > 0 && (
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Este crédito ya tiene abonos registrados. No es posible modificar sus
          condiciones financieras.
        </p>
      )}
      <Card>
        <CardContent className="pt-5">
          <CreditoForm deudores={deudores} credito={credito} />
        </CardContent>
      </Card>
    </div>
  );
}
