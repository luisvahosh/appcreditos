"use client";

import { useActionState } from "react";
import Link from "next/link";
import { crearPrenda } from "@/app/(panel)/prenda/actions";
import { estadoFormInicial } from "@/lib/forms";
import { Campo } from "@/components/forms/campo";
import {
  BuscadorDeudor,
  type DeudorOpcion,
} from "@/components/forms/buscador-deudor";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";

function hoyInput() {
  return new Date().toISOString().slice(0, 10);
}

export function PrendaForm({ deudores }: { deudores: DeudorOpcion[] }) {
  const [state, formAction, pending] = useActionState(
    crearPrenda,
    estadoFormInicial,
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <Campo label="Deudor" htmlFor="deudorId" error={fe.deudorId}>
        <BuscadorDeudor deudores={deudores} />
      </Campo>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          label="Bien en garantía"
          htmlFor="bienGarantia"
          error={fe.bienGarantia}
          hint="Ej: Motocicleta, televisor, herramienta..."
        >
          <Input id="bienGarantia" name="bienGarantia" required />
        </Campo>
        <Campo label="Descripción (opcional)" htmlFor="descripcion" error={fe.descripcion}>
          <Input id="descripcion" name="descripcion" placeholder="Marca, placa, modelo..." />
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Capital prestado (COP)" htmlFor="capital" error={fe.capital}>
          <Input id="capital" name="capital" type="number" min={1} step={1} required />
        </Campo>
        <Campo
          label="Tasa de interés mensual (%)"
          htmlFor="tasaInteresPct"
          error={fe.tasaInteresPct}
          hint="Interés mensual sobre el capital (ej. 10 = 10%)"
        >
          <Input
            id="tasaInteresPct"
            name="tasaInteresPct"
            type="number"
            min={0}
            step={0.01}
            required
          />
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          label="Fecha de desembolso"
          htmlFor="fechaDesembolso"
          error={fe.fechaDesembolso}
        >
          <Input
            id="fechaDesembolso"
            name="fechaDesembolso"
            type="date"
            defaultValue={hoyInput()}
            required
          />
        </Campo>
        <Campo
          label="Fecha de vencimiento (opcional)"
          htmlFor="fechaVencimiento"
          error={fe.fechaVencimiento}
          hint="Si la dejas vacía, será un mes después del desembolso."
        >
          <Input id="fechaVencimiento" name="fechaVencimiento" type="date" />
        </Campo>
      </div>

      <Campo label="Notas" htmlFor="notas" error={fe.notas}>
        <textarea
          id="notas"
          name="notas"
          rows={2}
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
          {pending ? "Guardando..." : "Guardar préstamo"}
        </Button>
        <Link href="/prenda" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
