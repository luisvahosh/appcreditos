import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { pdfEstadoCuenta } from "@/lib/reportes/pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const buf = await pdfEstadoCuenta(id);
  if (!buf) {
    return NextResponse.json({ error: "Deudor no encontrado" }, { status: 404 });
  }
  const fecha = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="estado_cuenta_${fecha}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
