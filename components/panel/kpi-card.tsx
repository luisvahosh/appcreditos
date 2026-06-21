import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tono = "azul",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tono?: "azul" | "verde" | "rojo" | "ambar" | "gris";
}) {
  const tonos = {
    azul: "bg-blue-50 text-blue-600",
    verde: "bg-emerald-50 text-emerald-600",
    rojo: "bg-red-50 text-red-600",
    ambar: "bg-amber-50 text-amber-600",
    gris: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-500">{label}</p>
        {Icon && (
          <span className={cn("rounded-lg p-1.5", tonos[tono])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
