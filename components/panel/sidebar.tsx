"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  LayoutDashboard,
  HandCoins,
  Users,
  Receipt,
  FileBarChart,
  Settings,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Rol } from "@/lib/constantes";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Rol[]; // si se omite, visible para todos
};

const ITEMS: Item[] = [
  { href: "/", label: "Tablero", icon: LayoutDashboard },
  { href: "/creditos", label: "Créditos", icon: HandCoins },
  { href: "/deudores", label: "Deudores", icon: Users },
  { href: "/pagos", label: "Pagos", icon: Receipt },
  { href: "/reportes", label: "Reportes", icon: FileBarChart },
  { href: "/configuracion/multas", label: "Configuración", icon: Settings, roles: ["ADMIN"] },
  { href: "/usuarios", label: "Usuarios", icon: UserCog, roles: ["ADMIN"] },
  { href: "/auditoria", label: "Auditoría", icon: ShieldCheck, roles: ["ADMIN"] },
];

export function Sidebar({ rol }: { rol: Rol }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Banknote className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">Créditos</p>
          <p className="text-xs text-slate-500">Administración</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {ITEMS.filter((i) => !i.roles || i.roles.includes(rol)).map((item) => {
          const activo =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activo
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
