import {
  LayoutDashboard,
  HandCoins,
  Users,
  Receipt,
  FileBarChart,
  Settings,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import type { Rol } from "@/lib/constantes";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Rol[]; // si se omite, visible para todos
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Tablero", icon: LayoutDashboard },
  { href: "/creditos", label: "Créditos", icon: HandCoins },
  { href: "/deudores", label: "Deudores", icon: Users },
  { href: "/pagos", label: "Pagos", icon: Receipt },
  { href: "/reportes", label: "Reportes", icon: FileBarChart },
  { href: "/configuracion/multas", label: "Configuración", icon: Settings, roles: ["ADMIN"] },
  { href: "/usuarios", label: "Usuarios", icon: UserCog, roles: ["ADMIN"] },
  { href: "/auditoria", label: "Auditoría", icon: ShieldCheck, roles: ["ADMIN"] },
];

export function itemsParaRol(rol: Rol): NavItem[] {
  return NAV_ITEMS.filter((i) => !i.roles || i.roles.includes(rol));
}

export function esActivo(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
