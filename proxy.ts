import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Convención "proxy" de Next 16 (reemplaza a middleware).
export default NextAuth(authConfig).auth;

export const config = {
  // Protege todas las rutas excepto las API (auth propio), assets y estáticos.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
