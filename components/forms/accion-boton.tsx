"use client";

import { useActionState } from "react";
import { estadoFormInicial, type FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";

type ServerAction = (prev: FormState, fd: FormData) => Promise<FormState>;

export function AccionBoton({
  action,
  id,
  label,
  pendingLabel,
  confirmacion,
  className,
}: {
  action: ServerAction;
  id: string;
  label: string;
  pendingLabel?: string;
  confirmacion?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, estadoFormInicial);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirmacion && !window.confirm(confirmacion)) e.preventDefault();
      }}
      className="inline-flex flex-col"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50",
          className,
        )}
      >
        {pending ? (pendingLabel ?? "Procesando...") : label}
      </button>
      {state.error && <span className="mt-1 text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
