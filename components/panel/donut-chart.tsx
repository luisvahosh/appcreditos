export type DonutDato = { label: string; value: number; color: string };

/** Gráfico de dona en SVG (server component, sin dependencias). */
export function DonutChart({
  data,
  formato = (n: number) => String(n),
}: {
  data: DonutDato[];
  formato?: (n: number) => string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 60;
  const C = 2 * Math.PI * R;
  const sw = 26;
  let acc = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <svg width="150" height="150" viewBox="0 0 160 160" className="shrink-0">
        <g transform="translate(80,80) rotate(-90)">
          <circle r={R} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
          {total > 0 &&
            data.map((d) => {
              const dash = (d.value / total) * C;
              const seg = (
                <circle
                  key={d.label}
                  r={R}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={sw}
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={-acc}
                />
              );
              acc += dash;
              return seg;
            })}
        </g>
        <text
          x="80"
          y="85"
          textAnchor="middle"
          className="fill-slate-900 text-lg font-semibold"
        >
          {total > 0 ? formato(total) : "—"}
        </text>
      </svg>

      <ul className="flex flex-col gap-1.5 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-slate-600">{d.label}</span>
            <span className="ml-auto pl-4 font-medium text-slate-900">
              {formato(d.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
