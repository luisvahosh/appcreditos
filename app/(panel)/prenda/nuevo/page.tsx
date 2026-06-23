import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PrendaForm } from "@/components/forms/prenda-form";

export const dynamic = "force-dynamic";

export default async function NuevaPrendaPage() {
  await requireRol("ADMIN", "COBRADOR");
  const deudores = await prisma.deudor.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, documento: true },
  });

  return (
    <div>
      <PageHeader
        title="Nuevo préstamo con prenda"
        description="Registra un préstamo respaldado con garantía"
      />
      <Card>
        <CardContent className="pt-5">
          {deudores.length === 0 ? (
            <p className="text-sm text-slate-600">
              Primero debes{" "}
              <Link
                href="/deudores/nuevo"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                registrar un deudor
              </Link>
              .
            </p>
          ) : (
            <PrendaForm deudores={deudores} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
