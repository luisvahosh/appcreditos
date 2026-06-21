import Decimal from "decimal.js";

/** Redondea a pesos enteros (medio hacia arriba). */
export function redondearPesos(v: Decimal | number): number {
  const d = v instanceof Decimal ? v : new Decimal(v);
  return d.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Redondea una lista de valores a pesos enteros garantizando que la suma
 * sea exactamente `total` (la última cuota absorbe la diferencia de redondeo).
 */
export function distribuirRedondeo(valores: Decimal[], total: number): number[] {
  const redondeados = valores.map((v) => redondearPesos(v));
  if (redondeados.length === 0) return redondeados;
  const suma = redondeados.reduce((a, b) => a + b, 0);
  redondeados[redondeados.length - 1] += total - suma;
  return redondeados;
}

export { Decimal };
