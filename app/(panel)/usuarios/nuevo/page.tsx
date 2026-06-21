import { requireRol } from "@/lib/auth";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { UsuarioForm } from "@/components/forms/usuario-form";

export default async function NuevoUsuarioPage() {
  await requireRol("ADMIN");
  return (
    <div>
      <PageHeader title="Nuevo usuario" description="Crea una cuenta de acceso" />
      <Card>
        <CardContent className="pt-5">
          <UsuarioForm />
        </CardContent>
      </Card>
    </div>
  );
}
