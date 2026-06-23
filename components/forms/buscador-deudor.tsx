"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DeudorOpcion = {
  id: string;
  nombre: string;
  documento?: string | null;
};

export function BuscadorDeudor({
  deudores,
  name = "deudorId",
  defaultId,
}: {
  deudores: DeudorOpcion[];
  name?: string;
  defaultId?: string;
}) {
  const inicial = deudores.find((d) => d.id === defaultId) ?? null;
  const [seleccion, setSeleccion] = useState<DeudorOpcion | null>(inicial);
  const [query, setQuery] = useState(inicial?.nombre ?? "");
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const q = query.trim().toLowerCase();
  const hayBusqueda = q.length > 0 && (!seleccion || query !== seleccion.nombre);
  const filtrados = (
    hayBusqueda
      ? deudores.filter(
          (d) =>
            d.nombre.toLowerCase().includes(q) ||
            (d.documento ?? "").toLowerCase().includes(q),
        )
      : deudores
  ).slice(0, 50);

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name={name} value={seleccion?.id ?? ""} />
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          placeholder="Escribe para buscar por nombre o documento..."
          autoComplete="off"
          className="pl-9"
          onChange={(e) => {
            setQuery(e.target.value);
            setSeleccion(null);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
        />
      </div>

      {abierto && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {filtrados.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500">Sin resultados</p>
          ) : (
            <ul>
              {filtrados.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSeleccion(d);
                      setQuery(d.nombre);
                      setAbierto(false);
                    }}
                    className={cn(
                      "flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-100",
                      seleccion?.id === d.id && "bg-blue-50",
                    )}
                  >
                    <span className="text-sm font-medium text-slate-900">
                      {d.nombre}
                    </span>
                    {d.documento && (
                      <span className="text-xs text-slate-500">{d.documento}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
