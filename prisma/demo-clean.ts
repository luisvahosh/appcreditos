import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Borra ÚNICAMENTE los datos de demostración (deudores con documento "DEMO-...").
// Los créditos eliminan en cascada sus cuotas y pagos. Usuarios y configuración
// NO se tocan.
async function main() {
  console.log("Borrando datos de demostración...");

  const demos = await prisma.deudor.findMany({
    where: { documento: { startsWith: "DEMO-" } },
    select: { id: true, nombre: true },
  });

  if (demos.length === 0) {
    console.log("No hay datos de demostración para borrar.");
    await prisma.$disconnect();
    return;
  }

  const ids = demos.map((d) => d.id);

  // Borra créditos (cascada: cuotas y pagos) y luego los deudores.
  const cred = await prisma.credito.deleteMany({ where: { deudorId: { in: ids } } });
  const deu = await prisma.deudor.deleteMany({ where: { id: { in: ids } } });

  console.log(`  Créditos borrados: ${cred.count}`);
  console.log(`  Deudores borrados: ${deu.count}`);
  console.log("Listo. Datos de demostración eliminados.");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
