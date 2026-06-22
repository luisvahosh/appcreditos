// Utilidades para abrir WhatsApp con el número del cliente y un mensaje.

/**
 * Normaliza un teléfono al formato que espera wa.me (solo dígitos, con código
 * de país). Para Colombia: si son 10 dígitos y empieza por 3 (celular), antepone 57.
 * Devuelve null si no hay número.
 */
export function normalizarTelefonoWa(tel?: string | null): string | null {
  if (!tel) return null;
  let d = tel.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2); // prefijo internacional 00
  if (d.length === 10 && d.startsWith("3")) d = "57" + d; // celular Colombia
  return d;
}

/**
 * Construye el enlace de WhatsApp. Si hay número, abre el chat de ese cliente;
 * si no, abre WhatsApp para elegir contacto. El mensaje queda precargado.
 */
export function linkWhatsApp(
  tel: string | null | undefined,
  mensaje: string,
): string {
  const num = normalizarTelefonoWa(tel);
  const base = num ? `https://wa.me/${num}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(mensaje)}`;
}
