import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

const FORMAT = "scrypt-v1";
const KEY_LENGTH = 64;
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

export const CUSTOMER_PASSWORD_MIN_LENGTH = 10;
export const CUSTOMER_PASSWORD_MAX_LENGTH = 128;

function deriveKey(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derived) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derived);
    });
  });
}

export function validateCustomerPassword(value: unknown) {
  if (typeof value !== "string") {
    return { ok: false as const, message: "Enter a password." };
  }

  if (value.length < CUSTOMER_PASSWORD_MIN_LENGTH) {
    return {
      ok: false as const,
      message: `Use at least ${CUSTOMER_PASSWORD_MIN_LENGTH} characters.`,
    };
  }

  if (value.length > CUSTOMER_PASSWORD_MAX_LENGTH) {
    return {
      ok: false as const,
      message: `Use no more than ${CUSTOMER_PASSWORD_MAX_LENGTH} characters.`,
    };
  }

  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return {
      ok: false as const,
      message: "Use an uppercase letter, a lowercase letter, and a number.",
    };
  }

  return { ok: true as const, password: value };
}

export async function hashCustomerPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await deriveKey(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: 64 * 1024 * 1024,
  });

  return [
    FORMAT,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

export async function verifyCustomerPassword(password: string, encoded: string) {
  const [format, cost, blockSize, parallelization, saltValue, hashValue] =
    encoded.split("$");

  if (
    format !== FORMAT ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !saltValue ||
    !hashValue
  ) {
    return false;
  }

  const parsedCost = Number(cost);
  const parsedBlockSize = Number(blockSize);
  const parsedParallelization = Number(parallelization);

  if (
    parsedCost !== COST ||
    parsedBlockSize !== BLOCK_SIZE ||
    parsedParallelization !== PARALLELIZATION
  ) {
    return false;
  }

  try {
    const salt = Buffer.from(saltValue, "base64url");
    const expected = Buffer.from(hashValue, "base64url");
    const actual = await deriveKey(password, salt, expected.length, {
      N: parsedCost,
      r: parsedBlockSize,
      p: parsedParallelization,
      maxmem: 64 * 1024 * 1024,
    });

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
