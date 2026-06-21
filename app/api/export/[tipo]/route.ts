import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { excelCreditos, excelPagos } from "@/lib/reportes/excel";
import { pdfCartera } from "@/lib/reportes/pdf";

export const dynamic = "force-dynamic";

const XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function archivo(buf: Buffer, contentType: string, nombre: string) {
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tipo: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { tipo } = await params;
  const fecha = new Date().toISOString().slice(0, 10);

  switch (tipo) {
    case "creditos":
      return archivo(await excelCreditos(), XLSX, `creditos_${fecha}.xlsx`);
    case "pagos":
      return archivo(await excelPagos(), XLSX, `pagos_${fecha}.xlsx`);
    case "cartera":
      return archivo(await pdfCartera(), "application/pdf", `cartera_${fecha}.pdf`);
    default:
      return NextResponse.json({ error: "Tipo no válido" }, { status: 404 });
  }
}
