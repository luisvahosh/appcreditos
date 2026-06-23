import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { CreditoForm } from "@/components/forms/credito-form";

export const dynamic = "force-dynamic";

export default async function NuevoCreditoPage() {
  await requireRol("ADMIN", "COBRADOR");
  const deudores = await prisma.deudor.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, documento: true },
  });

  return (
    <div>
      <PageHeader title="Nuevo crédito" description="Registra un crédito otorgado" />
      <Card>
        <CardContent className="pt-5">
          {deudores.length === 0 ? (
            <p className="text-sm text-slate-600">
              Primero debes{" "}
              <Link href="/deudores/nuevo" className={buttonVariants({ variant: "outline", size: "sm" })}>
                registrar un deudor
              </Link>
              .
            </p>
          ) : (
            <CreditoForm deudores={deudores} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
