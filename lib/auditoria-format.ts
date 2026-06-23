import { formatCOP } from "@/lib/format";

const LABELS: Record<string, string> = {
  abono: "Abono",
  capital: "Capital",
  interes: "Interés",
  multa: "Multa",
  aplazo: "Aplazó cuota",
  valorAbono: "Abono",
  valorPrestado: "Valor prestado",
  metodoInteres: "Método",
  deudorId: "Deudor (id)",
  nombre: "Nombre",
  documento: "Documento",
  telefono: "Teléfono",
  direccion: "Dirección",
  notas: "Notas",
  bien: "Garantía",
  periodos: "Períodos",
  concepto: "Concepto",
  valor: "Valor",
  recurrente: "Recurrente",
  email: "Correo",
  rol: "Rol",
  activo: "Activo",
  tipo: "Tipo",
  diasGracia: "Días de gracia",
  aplicaPorDiaMora: "Por día de mora",
  creditosActualizados: "Créditos actualizados",
  total: "Total",
};

const MONEY = new Set([
  "abono",
  "capital",
  "interes",
  "multa",
  "valorAbono",
  "valorPrestado",
  "valor",
]);

/** Convierte el JSON de auditoría en un texto legible "Clave: valor · ...". */
export function formatearDetalle(detalle: string | null): string {
  if (!detalle) return "—";
  let obj: unknown;
  try {
    obj = JSON.parse(detalle);
  } catch {
    return detalle;
  }
  if (!obj || typeof obj !== "object") return String(detalle);

  const partes = Object.entries(obj as Record<string, unknown>).map(([k, v]) => {
    const label = LABELS[k] ?? k;
    let val: string;
    if (typeof v === "boolean") val = v ? "Sí" : "No";
    else if (MONEY.has(k) && v != null && !Number.isNaN(Number(v)))
      val = formatCOP(Number(v));
    else val = v == null || v === "" ? "—" : String(v);
    return `${label}: ${val}`;
  });

  return partes.length ? partes.join(" · ") : "—";
}
