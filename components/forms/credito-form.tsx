"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { crearCredito, editarCredito } from "@/app/(panel)/creditos/actions";
import { estadoFormInicial } from "@/lib/forms";
import { PERIODICIDADES, PERIODICIDAD_LABEL } from "@/lib/constantes";
import { Campo } from "@/components/forms/campo";
import {
  BuscadorDeudor,
  type DeudorOpcion,
} from "@/components/forms/buscador-deudor";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";

type CreditoData = {
  id: string;
  deudorId: string;
  valorPrestado: number;
  tasaInteres: number;
  metodoInteres: string;
  periodicidad: string;
  numeroCuotas: number;
  fechaDesembolso: Date;
  fechaVencimiento: Date;
  notas: string | null;
};

function fechaInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function CreditoForm({
  deudores,
  credito,
  deudorIdFijo,
}: {
  deudores: DeudorOpcion[];
  credito?: CreditoData;
  deudorIdFijo?: string;
}) {
  const accion = credito ? editarCredito : crearCredito;
  const [state, formAction, pending] = useActionState(accion, estadoFormInicial);
  const fe = state.fieldErrors ?? {};

  const [periodicidad, setPeriodicidad] = useState(
    credito?.periodicidad ?? "MENSUAL",
  );
  const esUnica = periodicidad === "UNICA";

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      {credito && <input type="hidden" name="id" value={credito.id} />}
      {/* Crédito convencional: siempre interés plano. */}
      <input
        type="hidden"
        name="metodoInteres"
        value={credito?.metodoInteres ?? "PLANO"}
      />

      <Campo label="Deudor" htmlFor="deudorId" error={fe.deudorId}>
        <BuscadorDeudor
          deudores={deudores}
          defaultId={credito?.deudorId ?? deudorIdFijo}
        />
      </Campo>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          label="Valor prestado (COP)"
          htmlFor="valorPrestado"
          error={fe.valorPrestado}
        >
          <Input
            id="valorPrestado"
            name="valorPrestado"
            type="number"
            min={1}
            step={1}
            defaultValue={credito?.valorPrestado}
            required
          />
        </Campo>
        <Campo
          label="Tasa de interés (%)"
          htmlFor="tasaInteresPct"
          error={fe.tasaInteresPct}
          hint="Interés plano sobre el capital (ej. 15 = 15%)"
        >
          <Input
            id="tasaInteresPct"
            name="tasaInteresPct"
            type="number"
            min={0}
            step={0.01}
            defaultValue={credito ? credito.tasaInteres * 100 : ""}
            required
          />
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Periodicidad" htmlFor="periodicidad" error={fe.periodicidad}>
          <Select
            id="periodicidad"
            name="periodicidad"
            value={periodicidad}
            onChange={(e) => setPeriodicidad(e.target.value)}
          >
            {PERIODICIDADES.map((p) => (
              <option key={p} value={p}>
                {PERIODICIDAD_LABEL[p]}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo
          label="Número de cuotas"
          htmlFor="numeroCuotas"
          error={fe.numeroCuotas}
        >
          <Input
            id="numeroCuotas"
            name="numeroCuotas"
            type="number"
            min={1}
            step={1}
            defaultValue={credito?.numeroCuotas ?? 1}
            disabled={esUnica}
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
            defaultValue={fechaInput(credito?.fechaDesembolso) || fechaInput(new Date())}
            required
          />
        </Campo>
        {esUnica && (
          <Campo
            label="Fecha de vencimiento"
            htmlFor="fechaVencimiento"
            error={fe.fechaVencimiento}
          >
            <Input
              id="fechaVencimiento"
              name="fechaVencimiento"
              type="date"
              defaultValue={fechaInput(credito?.fechaVencimiento)}
            />
          </Campo>
        )}
      </div>

      <Campo label="Notas" htmlFor="notas" error={fe.notas}>
        <textarea
          id="notas"
          name="notas"
          rows={2}
          defaultValue={credito?.notas ?? ""}
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
          {pending ? "Guardando..." : "Guardar crédito"}
        </Button>
        <Link href="/creditos" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
