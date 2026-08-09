import nextEnv from "@next/env";
import { getPrisma } from "../lib/prisma";
import argon2 from "../lib/argon2-wasm";
const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd(), false);

const email = process.env.STAFF_EMAIL ?? "";
const password = process.env.STAFF_PASSWORD ?? "";

if (!email) {
  throw new Error("STAFF_EMAIL environment variable is required.");
}

if (password.length < 8) {
  throw new Error("Password must contain at least 8 characters.");
}

const prisma = await getPrisma();

try {
  let customer = await prisma.customer.findUnique({
    where: { email },
  });

  if (customer) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        role: customer.role === "CUSTOMER" ? "STAFF" : customer.role,
        accessStatus: "ACTIVE",
        emailVerifiedAt: customer.emailVerifiedAt ?? new Date(),
      },
    });
  } else {
    customer = await prisma.customer.create({
      data: {
        email,
        role: "STAFF",
        accessStatus: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
  }

  const passwordHash = await argon2.hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.staffCredential.upsert({
    where: {
      customerId: customer.id,
    },
    update: {
      passwordHash,
      passwordVersion: {
        increment: 1,
      },
      mustChangePassword: false,
      failedLoginCount: 0,
      lockedUntil: null,
      lastFailedLoginAt: null,
      passwordChangedAt: new Date(),
    },
    create: {
      customerId: customer.id,
      passwordHash,
      mustChangePassword: false,
    },
  });

  const saved = await prisma.staffCredential.findUnique({
    where: {
      customerId: customer.id,
    },
  });

  if (!saved || !(await argon2.verify(saved.passwordHash, password))) {
    throw new Error("Stored password verification failed.");
  }

  console.log(`✅ Staff password configured for ${email}`);
  console.log("✅ Stored Argon2id hash verified");
} finally {
  await prisma.$disconnect?.();
}
