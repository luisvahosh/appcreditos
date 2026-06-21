import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { formatFecha } from "@/lib/format";
import { ROL_LABEL, type Rol } from "@/lib/constantes";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EliminarBoton } from "@/components/forms/eliminar-boton";
import { eliminarUsuario } from "./actions";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  await requireRol("ADMIN");
  const usuarios = await prisma.user.findMany({ orderBy: { nombre: "asc" } });

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Gestión de cuentas y perfiles de acceso"
        action={
          <Link href="/usuarios/nuevo" className={buttonVariants()}>
            <Plus className="h-4 w-4" /> Nuevo usuario
          </Link>
        }
      />

      <Card>
        <CardContent className="pt-4">
          <Table>
            <THead>
              <TR>
                <TH>Nombre</TH>
                <TH>Correo</TH>
                <TH>Rol</TH>
                <TH>Estado</TH>
                <TH>Creado</TH>
                <TH className="text-right">Acciones</TH>
              </TR>
            </THead>
            <TBody>
              {usuarios.map((u) => (
                <TR key={u.id}>
                  <TD className="font-medium text-slate-900">{u.nombre}</TD>
                  <TD>{u.email}</TD>
                  <TD>{ROL_LABEL[u.rol as Rol] ?? u.rol}</TD>
                  <TD>
                    {u.activo ? (
                      <Badge tono="verde">Activo</Badge>
                    ) : (
                      <Badge tono="gris">Inactivo</Badge>
                    )}
                  </TD>
                  <TD>{formatFecha(u.createdAt)}</TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/usuarios/${u.id}/editar`}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Link>
                      <EliminarBoton action={eliminarUsuario} id={u.id} />
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
