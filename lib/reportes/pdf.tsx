import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { formatCOP, formatFecha } from "@/lib/format";
import { ESTADO_CREDITO_LABEL, type EstadoCredito } from "@/lib/constantes";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, color: "#0f172a" },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#64748b", marginBottom: 14 },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, gap: 8 },
  kpi: {
    width: "31%",
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  kpiLabel: { fontSize: 8, color: "#64748b" },
  kpiValue: { fontSize: 12, fontWeight: "bold", marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 6 },
  tr: {
    flexDirection: "row",
    borderBottom: "1px solid #e2e8f0",
    paddingVertical: 4,
  },
  th: { fontWeight: "bold", backgroundColor: "#f1f5f9" },
  cDeudor: { width: "34%" },
  cNum: { width: "22%", textAlign: "right" },
  cEstado: { width: "22%" },
});

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

export async function pdfCartera(): Promise<Buffer> {
  const hoy = new Date();
  const [prestado, recaudado, saldo, multas, activos, enMora, vencidos, creditos] =
    await Promise.all([
      prisma.credito.aggregate({ _sum: { valorPrestado: true } }),
      prisma.pago.aggregate({ _sum: { valorAbono: true } }),
      prisma.credito.aggregate({ _sum: { saldoCapital: true, saldoInteres: true } }),
      prisma.credito.aggregate({ _sum: { multaAcumulada: true } }),
      prisma.credito.count({ where: { estado: "ACTIVO" } }),
      prisma.credito.count({ where: { estado: "EN_MORA" } }),
      prisma.credito.count({
        where: { estado: { not: "CANCELADO" }, fechaVencimiento: { lt: hoy } },
      }),
      prisma.credito.findMany({
        where: { estado: { not: "CANCELADO" } },
        orderBy: { fechaVencimiento: "asc" },
        include: { deudor: true },
        take: 40,
      }),
    ]);

  const saldoPendiente =
    (saldo._sum.saldoCapital ?? 0) + (saldo._sum.saldoInteres ?? 0);

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Reporte de cartera</Text>
        <Text style={styles.subtitle}>Generado el {formatFecha(hoy)}</Text>

        <View style={styles.kpiRow}>
          <Kpi label="Total prestado" value={formatCOP(prestado._sum.valorPrestado ?? 0)} />
          <Kpi label="Total recaudado" value={formatCOP(recaudado._sum.valorAbono ?? 0)} />
          <Kpi label="Saldo por cobrar" value={formatCOP(saldoPendiente)} />
          <Kpi label="Multas acumuladas" value={formatCOP(multas._sum.multaAcumulada ?? 0)} />
          <Kpi label="Créditos activos" value={String(activos)} />
          <Kpi label="En mora" value={String(enMora)} />
          <Kpi label="Vencidos" value={String(vencidos)} />
        </View>

        <Text style={styles.sectionTitle}>Créditos vigentes</Text>
        <View style={[styles.tr, styles.th]}>
          <Text style={styles.cDeudor}>Deudor</Text>
          <Text style={styles.cNum}>Saldo</Text>
          <Text style={styles.cNum}>Vence</Text>
          <Text style={styles.cEstado}>Estado</Text>
        </View>
        {creditos.map((c) => (
          <View key={c.id} style={styles.tr}>
            <Text style={styles.cDeudor}>{c.deudor.nombre}</Text>
            <Text style={styles.cNum}>
              {formatCOP(c.saldoCapital + c.saldoInteres + c.multaAcumulada)}
            </Text>
            <Text style={styles.cNum}>{formatFecha(c.fechaVencimiento)}</Text>
            <Text style={styles.cEstado}>
              {ESTADO_CREDITO_LABEL[c.estado as EstadoCredito] ?? c.estado}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
