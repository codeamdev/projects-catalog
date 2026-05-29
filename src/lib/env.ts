const REQUIRED_VARS = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
] as const;

for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    throw new Error(
      `[env] Variable de entorno requerida no definida: ${key}\n` +
      `Copia .env.example a .env y completa el valor.`
    );
  }
}
