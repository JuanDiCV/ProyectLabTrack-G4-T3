/**
 * Crea backend/.env a partir de .env.example si no existe y genera un JWT_SECRET aleatorio.
 * Evita credenciales hardcodeadas en el código fuente.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

if (fs.existsSync(envPath)) {
  console.log('[env] backend/.env ya existe, no se modifica.');
  process.exit(0);
}

const secret = crypto.randomBytes(48).toString('hex');
const content = fs
  .readFileSync(examplePath, 'utf8')
  .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET="${secret}"`);

fs.writeFileSync(envPath, content, 'utf8');
console.log('[env] backend/.env creado con un JWT_SECRET aleatorio.');
