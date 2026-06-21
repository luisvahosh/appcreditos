import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { formatFecha } from "@/lib/format";
import {
  ESTADO_CREDITO_LABEL,
  METODO_INTERES_LABEL,
  type EstadoCredito,
  type MetodoInteres,
} from "@/lib/constantes";

function encabezado(ws: ExcelJS.Worksheet) {
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };
}

export async function excelCreditos(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Créditos");
  ws.columns = [
    { header: "Deudor", key: "deudor", width: 28 },
    { header: "Documento", key: "doc", width: 16 },
    { header: "Valor prestado", key: "prestado", width: 16 },
    { header: "Método", key: "metodo", width: 26 },
    { header: "Tasa %", key: "tasa", width: 10 },
    { header: "Saldo capital", key: "capital", width: 16 },
    { header: "Interés pend.", key: "interes", width: 14 },
    { header: "Multa", key: "multa", width: 12 },
    { header: "Total pendiente", key: "total", width: 16 },
    { header: "Desembolso", key: "desembolso", width: 14 },
    { header: "Vencimiento", key: "vencimiento", width: 14 },
    { header: "Estado", key: "estado", width: 14 },
  ];
  encabezado(ws);

  const creditos = await prisma.credito.findMany({
    orderBy: { createdAt: "desc" },
    include: { deudor: true },
  });

  for (const c of creditos) {
    ws.addRow({
      deudor: c.deudor.nombre,
      doc: c.deudor.documento ?? "",
      prestado: c.valorPrestado,
      metodo: METODO_INTERES_LABEL[c.metodoInteres as MetodoInteres],
      tasa: Math.round(c.tasaInteres * 10000) / 100,
      capital: c.saldoCapital,
      interes: c.saldoInteres,
      multa: c.multaAcumulada,
      total: c.saldoCapital + c.saldoInteres + c.multaAcumulada,
      desembolso: formatFecha(c.fechaDesembolso),
      vencimiento: formatFecha(c.fechaVencimiento),
      estado: ESTADO_CREDITO_LABEL[c.estado as EstadoCredito] ?? c.estado,
    });
  }

  ["prestado", "capital", "interes", "multa", "total"].forEach((k) => {
    ws.getColumn(k).numFmt = '"$"#,##0';
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function excelPagos(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Pagos");
  ws.columns = [
    { header: "Fecha", key: "fecha", width: 14 },
    { header: "Deudor", key: "deudor", width: 28 },
    { header: "Abono", key: "abono", width: 16 },
    { header: "Capital", key: "capital", width: 14 },
    { header: "Interés", key: "interes", width: 14 },
    { header: "Multa", key: "multa", width: 12 },
    { header: "Registró", key: "registro", width: 24 },
    { header: "Nota", key: "nota", width: 30 },
  ];
  encabezado(ws);

  const pagos = await prisma.pago.findMany({
    orderBy: { fechaPago: "desc" },
    include: { credito: { include: { deudor: true } }, registradoPor: true },
  });

  for (const p of pagos) {
    ws.addRow({
      fecha: formatFecha(p.fechaPago),
      deudor: p.credito.deudor.nombre,
      abono: p.valorAbono,
      capital: p.aplicadoCapital,
      interes: p.aplicadoInteres,
      multa: p.aplicadoMulta,
      registro: p.registradoPor?.nombre ?? "",
      nota: p.nota ?? "",
    });
  }

  ["abono", "capital", "interes", "multa"].forEach((k) => {
    ws.getColumn(k).numFmt = '"$"#,##0';
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
