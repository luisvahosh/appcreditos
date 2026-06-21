import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { UsuarioForm } from "@/components/forms/usuario-form";

export const dynamic = "force-dynamic";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol("ADMIN");
  const { id } = await params;
  const usuario = await prisma.user.findUnique({ where: { id } });
  if (!usuario) notFound();

  return (
    <div>
      <PageHeader title="Editar usuario" description={usuario.email} />
      <Card>
        <CardContent className="pt-5">
          <UsuarioForm usuario={usuario} />
        </CardContent>
      </Card>
    </div>
  );
}
