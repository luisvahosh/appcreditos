import { formatCOP, formatFecha } from "../format";

export interface DatosMensajeCobro {
  nombreDeudor: string;
  saldoPendiente: number; // capital + interés pendiente (sin multa)
  fechaDesembolso: Date;
  fechaVencimiento: Date;
  diasMora: number;
  multa: number;
  totalPagar: number;
}

/**
 * Genera el texto del mensaje de cobro para enviar al deudor.
 * Reproduce el formato del ejemplo del requerimiento.
 */
export function generarMensajeCobro(d: DatosMensajeCobro): string {
  const partes: string[] = [];

  partes.push(
    `Señor(a) ${d.nombreDeudor}, le informamos que presenta un saldo pendiente de ${formatCOP(
      d.saldoPendiente,
    )} correspondiente al crédito otorgado el ${formatFecha(d.fechaDesembolso)}.`,
  );

  if (d.diasMora > 0) {
    const diaTxt = d.diasMora === 1 ? "día" : "días";
    if (d.multa > 0) {
      partes.push(
        `Su cuota venció el ${formatFecha(
          d.fechaVencimiento,
        )} y actualmente registra ${d.diasMora} ${diaTxt} de mora, generando una multa de ${formatCOP(
          d.multa,
        )}.`,
      );
    } else {
      partes.push(
        `Su cuota venció el ${formatFecha(d.fechaVencimiento)} y actualmente registra ${
          d.diasMora
        } ${diaTxt} de mora.`,
      );
    }
  } else {
    partes.push(`Su próxima cuota vence el ${formatFecha(d.fechaVencimiento)}.`);
  }

  partes.push(`El valor total a cancelar es de ${formatCOP(d.totalPagar)}.`);

  return partes.join(" ");
}
