import type { DefaultSession } from "next-auth";
import type { Rol } from "@/lib/constantes";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: Rol;
    } & DefaultSession["user"];
  }

  interface User {
    rol?: Rol;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    rol?: Rol;
  }
}
