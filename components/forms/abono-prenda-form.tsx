"use client";

import { useActionState } from "react";
import { registrarAbonoPrenda } from "@/app/(panel)/prenda/actions";
import { estadoFormInicial } from "@/lib/forms";
import { Campo } from "@/components/forms/campo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function hoyInput() {
  return new Date().toISOString().slice(0, 10);
}

export function AbonoPrendaForm({
  prestamoId,
  saldo,
}: {
  prestamoId: string;
  saldo: number;
}) {
  const [state, formAction, pending] = useActionState(
    registrarAbonoPrenda,
    estadoFormInicial,
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="prestamoId" value={prestamoId} />

      <Campo label="Valor del abono (COP)" htmlFor="valorAbono" error={fe.valorAbono}>
        <Input
          id="valorAbono"
          name="valorAbono"
          type="number"
          min={1}
          step={1}
          max={saldo > 0 ? saldo : undefined}
          placeholder="0"
          required
        />
      </Campo>

      <Campo label="Fecha" htmlFor="fechaPago" error={fe.fechaPago}>
        <Input id="fechaPago" name="fechaPago" type="date" defaultValue={hoyInput()} />
      </Campo>

      <Campo label="Nota (opcional)" htmlFor="nota" error={fe.nota}>
        <Input id="nota" name="nota" placeholder="Referencia, observación..." />
      </Campo>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending || saldo <= 0}>
        {pending ? "Registrando..." : "Registrar abono"}
      </Button>
    </form>
  );
}
