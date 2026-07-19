export class RuntimeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeConfigurationError";
  }
}

export function requireEnvironmentVariable(
  name: string,
  options: { minLength?: number } = {},
) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new RuntimeConfigurationError(
      `${name} is required before this service can run.`,
    );
  }

  if (options.minLength && value.length < options.minLength) {
    throw new RuntimeConfigurationError(
      `${name} must contain at least ${options.minLength} characters.`,
    );
  }

  return value;
}
