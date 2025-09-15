import { prisma } from "../src/client";

async function main() {
  const count = await prisma.cause.count();
  if (count === 0) {
    await prisma.cause.createMany({
      data: [
        { name: "Dana" },
        { name: "Building Fund" }
      ]
    });
    console.log("Seeded default causes");
  } else {
    console.log("Causes already seeded");
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
