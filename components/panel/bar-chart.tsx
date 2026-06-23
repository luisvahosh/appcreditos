import { formatCOP } from "@/lib/format";

export type BarDato = { label: string; value: number };

/** Gráfico de barras horizontales (server component, sin dependencias). */
export function BarChart({
  data,
  formato = formatCOP,
  color = "#3b82f6",
}: {
  data: BarDato[];
  formato?: (n: number) => string;
  color?: string;
}) {
  if (data.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-500">Sin datos.</p>;
  }
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate text-slate-600" title={d.label}>
            {d.label}
          </span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
            <div
              className="h-full rounded"
              style={{
                width: `${Math.max(2, (d.value / max) * 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="w-28 shrink-0 text-right font-medium text-slate-900">
            {formato(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
