"use client";

import { useActionState } from "react";
import Link from "next/link";
import { guardarUsuario } from "@/app/(panel)/usuarios/actions";
import { estadoFormInicial } from "@/lib/forms";
import { ROLES, ROL_LABEL } from "@/lib/constantes";
import { Campo } from "@/components/forms/campo";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
};

export function UsuarioForm({ usuario }: { usuario?: Usuario }) {
  const [state, formAction, pending] = useActionState(
    guardarUsuario,
    estadoFormInicial,
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {usuario && <input type="hidden" name="id" value={usuario.id} />}

      <Campo label="Nombre" htmlFor="nombre" error={fe.nombre}>
        <Input id="nombre" name="nombre" defaultValue={usuario?.nombre} required />
      </Campo>

      <Campo label="Correo electrónico" htmlFor="email" error={fe.email}>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={usuario?.email}
          required
        />
      </Campo>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Rol" htmlFor="rol" error={fe.rol}>
          <Select id="rol" name="rol" defaultValue={usuario?.rol ?? "COBRADOR"}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROL_LABEL[r]}
              </option>
            ))}
          </Select>
        </Campo>
        <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="activo"
            defaultChecked={usuario ? usuario.activo : true}
            className="h-4 w-4 rounded border-slate-300"
          />
          Usuario activo
        </label>
      </div>

      <Campo
        label={usuario ? "Nueva contraseña (opcional)" : "Contraseña"}
        htmlFor="password"
        error={fe.password}
        hint={usuario ? "Déjala vacía para no cambiarla." : "Mínimo 6 caracteres."}
      >
        <Input id="password" name="password" type="password" autoComplete="new-password" />
      </Campo>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
        <Link href="/usuarios" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
