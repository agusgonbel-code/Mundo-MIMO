import { cp, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const destination = path.join(root, 'www');
const files = [
  'index.html',
  'app-v70.html',
  'privacy.html',
  'support.html',
  'credits.html',
  'manifest.webmanifest'
];

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });

for (const file of files) {
  await stat(path.join(root, file)).catch(() => {
    throw new Error(`Falta recurso obligatorio para el binario iOS: ${file}`);
  });
  await cp(path.join(root, file), path.join(destination, file));
}

await stat(path.join(root, 'assets')).catch(() => {
  throw new Error('Falta el directorio assets/ requerido por Mundo Mimo.');
});
await cp(path.join(root, 'assets'), path.join(destination, 'assets'), { recursive: true });

console.log('Build móvil de Mundo Mimo listo: producto v70 y assets locales copiados a www/.');
