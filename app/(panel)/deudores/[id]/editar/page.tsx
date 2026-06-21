import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DeudorForm } from "@/components/forms/deudor-form";

export default async function EditarDeudorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol("ADMIN", "COBRADOR");
  const { id } = await params;
  const deudor = await prisma.deudor.findUnique({ where: { id } });
  if (!deudor) notFound();

  return (
    <div>
      <PageHeader title="Editar deudor" description={deudor.nombre} />
      <Card>
        <CardContent className="pt-5">
          <DeudorForm deudor={deudor} />
        </CardContent>
      </Card>
    </div>
  );
}
