import { z } from "zod";
import {
  ESTADOS_CREDITO,
  METODOS_INTERES,
  PERIODICIDADES,
  ROLES,
  TIPOS_MULTA,
} from "@/lib/constantes";

export const deudorSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  documento: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
  notas: z.string().trim().optional(),
});
export type DeudorInput = z.infer<typeof deudorSchema>;

export const creditoSchema = z
  .object({
    deudorId: z.string().min(1, "Selecciona un deudor"),
    valorPrestado: z.coerce.number().positive("Debe ser mayor a 0"),
    // Porcentaje por período ingresado por el usuario (ej. 10 = 10%).
    tasaInteresPct: z.coerce.number().min(0, "No puede ser negativa"),
    metodoInteres: z.enum(METODOS_INTERES),
    periodicidad: z.enum(PERIODICIDADES),
    numeroCuotas: z.coerce.number().int().min(1, "Mínimo 1 cuota"),
    fechaDesembolso: z.coerce.date(),
    fechaVencimiento: z.coerce.date().optional(),
    notas: z.string().trim().optional(),
  })
  .refine(
    (d) => d.periodicidad !== "UNICA" || !!d.fechaVencimiento,
    {
      message: "Indica la fecha de vencimiento para pago único",
      path: ["fechaVencimiento"],
    },
  );
export type CreditoInput = z.infer<typeof creditoSchema>;

export const pagoSchema = z.object({
  creditoId: z.string().min(1),
  valorAbono: z.coerce.number().positive("Debe ser mayor a 0"),
  fechaPago: z.coerce.date().optional(),
  nota: z.string().trim().optional(),
});
export type PagoInput = z.infer<typeof pagoSchema>;

export const configMultaSchema = z.object({
  tipo: z.enum(TIPOS_MULTA),
  // Si PORCENTAJE: porcentaje (2 = 2%). Si FIJO: pesos.
  valor: z.coerce.number().min(0),
  aplicaPorDiaMora: z.boolean(),
  diasGracia: z.coerce.number().int().min(0),
});
export type ConfigMultaInput = z.infer<typeof configMultaSchema>;

export const usuarioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.string().trim().email("Correo inválido"),
  rol: z.enum(ROLES),
  activo: z.boolean(),
  password: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .optional()
    .or(z.literal("")),
});
export type UsuarioInput = z.infer<typeof usuarioSchema>;

export const estadoCreditoSchema = z.enum(ESTADOS_CREDITO);
