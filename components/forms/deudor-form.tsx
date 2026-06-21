"use client";

import { useActionState } from "react";
import Link from "next/link";
import { guardarDeudor } from "@/app/(panel)/deudores/actions";
import { estadoFormInicial } from "@/lib/forms";
import { Campo } from "@/components/forms/campo";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";

type Deudor = {
  id: string;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  direccion: string | null;
  notas: string | null;
};

export function DeudorForm({ deudor }: { deudor?: Deudor }) {
  const [state, formAction, pending] = useActionState(
    guardarDeudor,
    estadoFormInicial,
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {deudor && <input type="hidden" name="id" value={deudor.id} />}

      <Campo label="Nombre completo" htmlFor="nombre" error={fe.nombre}>
        <Input id="nombre" name="nombre" defaultValue={deudor?.nombre} required />
      </Campo>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Documento" htmlFor="documento" error={fe.documento}>
          <Input id="documento" name="documento" defaultValue={deudor?.documento ?? ""} />
        </Campo>
        <Campo label="Teléfono" htmlFor="telefono" error={fe.telefono}>
          <Input id="telefono" name="telefono" defaultValue={deudor?.telefono ?? ""} />
        </Campo>
      </div>

      <Campo label="Dirección" htmlFor="direccion" error={fe.direccion}>
        <Input id="direccion" name="direccion" defaultValue={deudor?.direccion ?? ""} />
      </Campo>

      <Campo label="Notas" htmlFor="notas" error={fe.notas}>
        <textarea
          id="notas"
          name="notas"
          rows={3}
          defaultValue={deudor?.notas ?? ""}
          className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
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
        <Link href="/deudores" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
