import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function crearUsuario(
  nombre: string,
  email: string,
  password: string,
  rol: string,
) {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { nombre, rol },
    create: { nombre, email, passwordHash, rol },
  });
  console.log(`  Usuario ${rol}: ${email} / ${password}`);
}

async function main() {
  console.log("Sembrando datos iniciales...");

  await crearUsuario("Administrador", "admin@creditos.local", "admin123", "ADMIN");
  await crearUsuario("Cobrador Demo", "cobrador@creditos.local", "cobrador123", "COBRADOR");
  await crearUsuario("Consulta Demo", "consulta@creditos.local", "consulta123", "CONSULTA");

  const config = await prisma.configuracionMulta.findFirst({ where: { activa: true } });
  if (!config) {
    await prisma.configuracionMulta.create({
      data: {
        tipo: "PORCENTAJE",
        valor: 0.02, // 2% del saldo pendiente
        aplicaPorDiaMora: false,
        diasGracia: 0,
        activa: true,
      },
    });
    console.log("  Configuración de multa por defecto: 2% del saldo");
  }

  console.log("Listo.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
