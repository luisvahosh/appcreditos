import * as React from "react";
import { cn } from "@/lib/utils";

type Tono = "gris" | "verde" | "rojo" | "ambar" | "azul";

const tonos: Record<Tono, string> = {
  gris: "bg-slate-100 text-slate-700",
  verde: "bg-emerald-100 text-emerald-700",
  rojo: "bg-red-100 text-red-700",
  ambar: "bg-amber-100 text-amber-700",
  azul: "bg-blue-100 text-blue-700",
};

export function Badge({
  tono = "gris",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tono?: Tono }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tonos[tono],
        className,
      )}
      {...props}
    />
  );
}
