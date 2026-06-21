"use client";

import { useActionState, useState } from "react";
import { guardarConfigMulta } from "@/app/(panel)/configuracion/multas/actions";
import { estadoFormInicial } from "@/lib/forms";
import { TIPOS_MULTA, TIPO_MULTA_LABEL } from "@/lib/constantes";
import { Campo } from "@/components/forms/campo";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Config = {
  tipo: string;
  valorMostrado: number;
  aplicaPorDiaMora: boolean;
  diasGracia: number;
};

export function ConfigMultaForm({ config }: { config: Config }) {
  const [state, formAction, pending] = useActionState(
    guardarConfigMulta,
    estadoFormInicial,
  );
  const fe = state.fieldErrors ?? {};
  const [tipo, setTipo] = useState(config.tipo);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Campo label="Tipo de multa" htmlFor="tipo" error={fe.tipo}>
        <Select
          id="tipo"
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          {TIPOS_MULTA.map((t) => (
            <option key={t} value={t}>
              {TIPO_MULTA_LABEL[t]}
            </option>
          ))}
        </Select>
      </Campo>

      <Campo
        label={tipo === "PORCENTAJE" ? "Porcentaje de multa (%)" : "Valor fijo (COP)"}
        htmlFor="valor"
        error={fe.valor}
        hint={
          tipo === "PORCENTAJE"
            ? "Se aplica sobre el saldo pendiente (capital + interés)."
            : "Monto fijo en pesos."
        }
      >
        <Input
          id="valor"
          name="valor"
          type="number"
          min={0}
          step={tipo === "PORCENTAJE" ? 0.01 : 1}
          defaultValue={config.valorMostrado}
          required
        />
      </Campo>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Días de gracia" htmlFor="diasGracia" error={fe.diasGracia} hint="Días de atraso antes de aplicar multa.">
          <Input
            id="diasGracia"
            name="diasGracia"
            type="number"
            min={0}
            step={1}
            defaultValue={config.diasGracia}
          />
        </Campo>
        <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="aplicaPorDiaMora"
            defaultChecked={config.aplicaPorDiaMora}
            className="h-4 w-4 rounded border-slate-300"
          />
          Multiplicar la multa por cada día de mora
        </label>
      </div>

      {state.ok && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Configuración guardada correctamente.
        </p>
      )}
      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>
    </form>
  );
}
