import { prisma } from "@/lib/db";
import type { ConfigMulta } from "@/lib/finanzas";

const DEFECTO: ConfigMulta = {
  tipo: "PORCENTAJE",
  valor: 0,
  aplicaPorDiaMora: false,
  diasGracia: 0,
};

/** Devuelve la configuración de multa activa (o valores por defecto). */
export async function getConfigMulta(): Promise<ConfigMulta> {
  const c = await prisma.configuracionMulta.findFirst({
    where: { activa: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!c) return DEFECTO;
  return {
    tipo: c.tipo === "FIJO" ? "FIJO" : "PORCENTAJE",
    valor: c.valor,
    aplicaPorDiaMora: c.aplicaPorDiaMora,
    diasGracia: c.diasGracia,
  };
}
