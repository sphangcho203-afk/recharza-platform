import { randomBytes } from "node:crypto";
import { argon2id, argon2Verify } from "hash-wasm";

type HashOptions = {
  type?: unknown;
  memoryCost?: number;
  timeCost?: number;
  parallelism?: number;
};

const argon2 = {
  argon2id: "argon2id",

  async hash(password: string, options: HashOptions = {}): Promise<string> {
    return argon2id({
      password,
      salt: randomBytes(16),
      parallelism: options.parallelism ?? 1,
      iterations: options.timeCost ?? 2,
      memorySize: options.memoryCost ?? 19456,
      hashLength: 32,
      outputType: "encoded",
    });
  },

  async verify(hash: string, password: string): Promise<boolean> {
    return argon2Verify({ hash, password });
  },
};

export default argon2;
