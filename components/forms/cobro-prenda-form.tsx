"use client";

import { useActionState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { agregarCobro } from "@/app/(panel)/prenda/actions";
import { estadoFormInicial } from "@/lib/forms";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CobroPrendaForm({ prestamoId }: { prestamoId: string }) {
  const [state, formAction, pending] = useActionState(
    agregarCobro,
    estadoFormInicial,
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  const fe = state.fieldErrors ?? {};

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="prestamoId" value={prestamoId} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input name="concepto" placeholder="Concepto (ej. Parqueadero)" required />
        <Input
          name="valor"
          type="number"
          min={1}
          step={1}
          placeholder="Valor"
          className="sm:w-32"
          required
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" name="recurrente" className="h-4 w-4 rounded border-slate-300" />
        Recurrente (se cobra en cada recálculo)
      </label>
      {(fe.concepto || fe.valor) && (
        <p className="text-xs text-red-600">{fe.concepto ?? fe.valor}</p>
      )}
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        <Plus className="h-4 w-4" /> {pending ? "Agregando..." : "Agregar cobro"}
      </Button>
    </form>
  );
}
