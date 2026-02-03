import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  // We'll allow it to be undefined for now to prevent build errors before the user provides it
  console.warn('TURSO_DATABASE_URL or TURSO_AUTH_TOKEN is not set');
}

export const db = createClient({
  url: url || '',
  authToken: authToken || '',
});
