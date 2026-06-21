"use client";

import { useState } from "react";
import { Copy, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MensajeCobro({ mensaje }: { mensaje: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

  return (
    <div className="flex flex-col gap-3">
      <textarea
        readOnly
        value={mensaje}
        rows={5}
        className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={copiar}>
          {copiado ? (
            <>
              <Check className="h-4 w-4" /> Copiado
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copiar mensaje
            </>
          )}
        </Button>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <MessageSquare className="h-4 w-4" /> Abrir en WhatsApp
        </a>
      </div>
    </div>
  );
}
