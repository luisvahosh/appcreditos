"use client";

import { LogOut } from "lucide-react";
import { cerrarSesion } from "@/app/(panel)/sesion-actions";

export function LogoutButton() {
  return (
    <form action={cerrarSesion}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        <LogOut className="h-4 w-4" />
        Salir
      </button>
    </form>
  );
}
