import { cp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const destination = path.join(root, 'www');
const requiredFiles = [
  'v2/app-v200.html',
  'v2/runtime-v200.js',
  'v2/runtime-v430-extension.js',
  'v2/core/content-depth-v500.js',
  'v2/core/worlds-v510.js',
  'v2/core/parent-zone-v520.js',
  'privacy.html',
  'support.html',
  'credits.html',
  'manifest.webmanifest'
];

for (const file of requiredFiles) {
  await stat(path.join(root, file)).catch(() => {
    throw new Error(`Falta recurso obligatorio para el binario iOS V2: ${file}`);
  });
}

await stat(path.join(root, 'v2')).catch(() => {
  throw new Error('Falta el directorio v2/ requerido por Mundo Mimo 2.');
});
await stat(path.join(root, 'assets')).catch(() => {
  throw new Error('Falta el directorio assets/ requerido por Mundo Mimo.');
});

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });

const nativeEntry = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#7057e8">
  <title>Mundo Mimo 2</title>
  <script>location.replace('./v2/app-v200.html')</script>
</head>
<body style="margin:0;background:#7057e8;color:#fff;font-family:system-ui;display:grid;place-items:center;min-height:100vh">
  <b>Abriendo Mundo Mimo 2…</b>
</body>
</html>`;

await writeFile(path.join(destination, 'index.html'), nativeEntry, 'utf8');
await cp(path.join(root, 'v2'), path.join(destination, 'v2'), { recursive: true });
await cp(path.join(root, 'assets'), path.join(destination, 'assets'), { recursive: true });

for (const file of ['privacy.html', 'support.html', 'credits.html', 'manifest.webmanifest']) {
  await cp(path.join(root, file), path.join(destination, file));
}

console.log('Build móvil listo: Mundo Mimo 2 V430 + profundidad V500 + mundos V510 + zona familiar V520 empaquetados en www/.');
