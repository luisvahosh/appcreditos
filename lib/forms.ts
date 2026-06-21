import { z } from "zod";

export type FormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export const estadoFormInicial: FormState = { ok: false };

/** Convierte un ZodError en un mapa campo -> primer mensaje. */
export function erroresZod(e: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of e.issues) {
    const k = issue.path.join(".") || "_";
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}
