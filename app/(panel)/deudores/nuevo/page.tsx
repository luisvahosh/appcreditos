import { requireRol } from "@/lib/auth";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DeudorForm } from "@/components/forms/deudor-form";

export default async function NuevoDeudorPage() {
  await requireRol("ADMIN", "COBRADOR");
  return (
    <div>
      <PageHeader title="Nuevo deudor" description="Registra una nueva persona" />
      <Card>
        <CardContent className="pt-5">
          <DeudorForm />
        </CardContent>
      </Card>
    </div>
  );
}
