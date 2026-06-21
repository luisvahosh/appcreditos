import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Rol } from "@/lib/constantes";

export type SessionUser = {
  id: string;
  rol: Rol;
  name?: string | null;
  email?: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser | undefined) ?? null;
}

/** Exige sesión; redirige a /login si no hay. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Exige uno de los roles indicados; redirige al tablero si no cumple. */
export async function requireRol(...roles: Rol[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.rol)) redirect("/");
  return user;
}

/** Comprueba si un rol tiene alguno de los permisos indicados. */
export function tieneRol(rol: Rol | undefined, ...permitidos: Rol[]): boolean {
  return !!rol && permitidos.includes(rol);
}

/** Puede registrar/editar (ADMIN o COBRADOR). */
export function puedeEscribir(rol: Rol | undefined): boolean {
  return tieneRol(rol, "ADMIN", "COBRADOR");
}

/** Solo administración del sistema. */
export function esAdmin(rol: Rol | undefined): boolean {
  return rol === "ADMIN";
}
