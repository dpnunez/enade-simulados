import "dotenv/config";

import { hashPassword } from "better-auth/crypto";

import { Role } from "@prisma-generated-client";
import { prisma } from "@infra/db/prisma";

const USERS = [
  {
    name: "Admin Test",
    email: "admin@enade.local",
    password: "admin123456",
    role: Role.ADMIN,
  },
  {
    name: "Student Test",
    email: "student@enade.local",
    password: "student123456",
    role: Role.STUDENT,
  },
  {
    name: "Teacher Test",
    email: "teacher@enade.local",
    password: "teacher123456",
    role: Role.TEACHER,
  },
] as const;

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("seed-users não deve ser executado em produção.");
  }

  for (const user of USERS) {
    const passwordHash = await hashPassword(user.password);

    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        name: user.name,
        email: user.email,
        emailVerified: true,
        role: user.role,
        accounts: {
          create: {
            providerId: "credential",
            accountId: user.email,
            password: passwordHash,
          },
        },
      },
      update: {
        name: user.name,
        role: user.role,
        emailVerified: true,
        accounts: {
          deleteMany: {
            providerId: "credential",
          },
          create: {
            providerId: "credential",
            accountId: user.email,
            password: passwordHash,
          },
        },
      },
    });
  }

  console.log("Usuários de teste criados/atualizados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
