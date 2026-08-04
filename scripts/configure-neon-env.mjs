import fs from "node:fs";
import path from "node:path";

const argument = process.argv.find((item) => item.startsWith("--url="));
const connectionString = (
  argument?.slice("--url=".length) || process.env.NEON_DATABASE_URL || ""
).trim();

if (!connectionString) {
  console.error(
    "Provide the Neon connection through NEON_DATABASE_URL or --url. The value is never printed.",
  );
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(connectionString);
} catch {
  console.error("The supplied Neon connection string is invalid.");
  process.exit(1);
}

if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
  console.error("The connection string must use PostgreSQL.");
  process.exit(1);
}

if (["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) {
  console.error("That connection string still points to local PostgreSQL, not Neon.");
  process.exit(1);
}

const envPath = path.resolve(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  console.error(".env was not found in the current repository.");
  process.exit(1);
}

let contents = fs.readFileSync(envPath, "utf8");
const line = `DATABASE_URL=${connectionString}`;

if (/^DATABASE_URL=.*$/m.test(contents)) {
  contents = contents.replace(/^DATABASE_URL=.*$/m, line);
} else {
  contents = `${contents.trimEnd()}\n${line}\n`;
}

fs.writeFileSync(envPath, contents, { mode: 0o600 });
fs.chmodSync(envPath, 0o600);

console.log(`DATABASE_URL now points to ${parsed.hostname}.`);
console.log("The connection password was not printed.");
