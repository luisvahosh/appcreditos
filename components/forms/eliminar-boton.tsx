"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { estadoFormInicial, type FormState } from "@/lib/forms";

type ServerAction = (prev: FormState, fd: FormData) => Promise<FormState>;

export function EliminarBoton({
  action,
  id,
  label = "Eliminar",
  confirmacion = "¿Eliminar este registro? Esta acción no se puede deshacer.",
}: {
  action: ServerAction;
  id: string;
  label?: string;
  confirmacion?: string;
}) {
  const [state, formAction, pending] = useActionState(action, estadoFormInicial);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(confirmacion)) e.preventDefault();
      }}
      className="inline-flex flex-col items-end"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {pending ? "Eliminando..." : label}
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
