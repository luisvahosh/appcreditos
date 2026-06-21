import { NextRequest, NextResponse } from "next/server";
import { recalcularCartera } from "@/lib/jobs/actualizarEstados";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const token =
    req.nextUrl.searchParams.get("token") ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  const secret = process.env.CRON_SECRET;

  let autorizado = !!secret && token === secret;
  if (!autorizado) {
    const user = await getSessionUser();
    autorizado = user?.rol === "ADMIN";
  }
  if (!autorizado) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resultado = await recalcularCartera();
  return NextResponse.json({
    ok: true,
    ...resultado,
    fecha: new Date().toISOString(),
  });
}

export const GET = handler;
export const POST = handler;
