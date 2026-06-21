import type { NextAuthConfig } from "next-auth";
import type { Rol } from "@/lib/constantes";

// Configuración compartida y segura para el edge runtime (sin acceso a BD).
// El proveedor de credenciales (usa Prisma/bcrypt) se agrega en auth.ts.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLogin = nextUrl.pathname.startsWith("/login");
      if (isLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.rol = (user.rol ?? "CONSULTA") as Rol;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? "";
        session.user.rol = (token.rol as Rol) ?? "CONSULTA";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
