"use client";

import { useActionState } from "react";
import { registrarAbono } from "@/app/(panel)/pagos/actions";
import { estadoFormInicial } from "@/lib/forms";
import { Campo } from "@/components/forms/campo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function hoyInput() {
  return new Date().toISOString().slice(0, 10);
}

export function AbonoForm({
  creditoId,
  totalPagar,
  periodicidadLabel,
}: {
  creditoId: string;
  totalPagar: number;
  periodicidadLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    registrarAbono,
    estadoFormInicial,
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="creditoId" value={creditoId} />

      <Campo label="Valor del abono (COP)" htmlFor="valorAbono" error={fe.valorAbono}>
        <Input
          id="valorAbono"
          name="valorAbono"
          type="number"
          min={0}
          step={1}
          max={totalPagar > 0 ? totalPagar : undefined}
          placeholder="0"
        />
      </Campo>

      <Campo
        label="Multa (COP) — opcional"
        htmlFor="multaManual"
        error={fe.multaManual}
        hint={`Si registras una multa, la cuota se aplaza un período (${periodicidadLabel}).`}
      >
        <Input
          id="multaManual"
          name="multaManual"
          type="number"
          min={0}
          step={1}
          placeholder="0"
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

      <Button type="submit" disabled={pending}>
        {pending ? "Registrando..." : "Registrar pago"}
      </Button>
    </form>
  );
}
