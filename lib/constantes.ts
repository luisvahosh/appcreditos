// Valores permitidos (sustituyen a los enums nativos para portabilidad de BD).
// Se usan tanto para validación (Zod) como para mostrar etiquetas en la UI.

export const ROLES = ["ADMIN", "COBRADOR", "CONSULTA"] as const;
export type Rol = (typeof ROLES)[number];

export const ROL_LABEL: Record<Rol, string> = {
  ADMIN: "Administrador",
  COBRADOR: "Cobrador / Operador",
  CONSULTA: "Consulta",
};

export const METODOS_INTERES = ["SIMPLE", "CUOTA_FIJA", "PLANO"] as const;
export type MetodoInteres = (typeof METODOS_INTERES)[number];

export const METODO_INTERES_LABEL: Record<MetodoInteres, string> = {
  SIMPLE: "Interés simple sobre saldo",
  CUOTA_FIJA: "Cuota fija (amortización)",
  PLANO: "Interés plano sobre capital",
};

export const PERIODICIDADES = [
  "UNICA",
  "DIARIA",
  "SEMANAL",
  "QUINCENAL",
  "MENSUAL",
] as const;
export type Periodicidad = (typeof PERIODICIDADES)[number];

export const PERIODICIDAD_LABEL: Record<Periodicidad, string> = {
  UNICA: "Pago único",
  DIARIA: "Diaria",
  SEMANAL: "Semanal",
  QUINCENAL: "Quincenal",
  MENSUAL: "Mensual",
};

// Días que representa cada período (para cálculo de fechas de cuotas).
export const PERIODICIDAD_DIAS: Record<Periodicidad, number> = {
  UNICA: 0,
  DIARIA: 1,
  SEMANAL: 7,
  QUINCENAL: 15,
  MENSUAL: 30,
};

export const ESTADOS_CREDITO = [
  "ACTIVO",
  "CANCELADO",
  "EN_MORA",
  "VENCIDO",
] as const;
export type EstadoCredito = (typeof ESTADOS_CREDITO)[number];

export const ESTADO_CREDITO_LABEL: Record<EstadoCredito, string> = {
  ACTIVO: "Activo",
  CANCELADO: "Cancelado",
  EN_MORA: "En mora",
  VENCIDO: "Vencido",
};

export const ESTADOS_CUOTA = ["PENDIENTE", "PAGADA", "PARCIAL", "EN_MORA"] as const;
export type EstadoCuota = (typeof ESTADOS_CUOTA)[number];

export const ESTADO_CUOTA_LABEL: Record<EstadoCuota, string> = {
  PENDIENTE: "Pendiente",
  PAGADA: "Pagada",
  PARCIAL: "Parcial",
  EN_MORA: "En mora",
};

export const TIPOS_MULTA = ["PORCENTAJE", "FIJO"] as const;
export type TipoMulta = (typeof TIPOS_MULTA)[number];

export const TIPO_MULTA_LABEL: Record<TipoMulta, string> = {
  PORCENTAJE: "Porcentaje del saldo",
  FIJO: "Valor fijo en pesos",
};
