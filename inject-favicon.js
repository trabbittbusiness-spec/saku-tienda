#!/usr/bin/env node
/**
 * inject-favicon.js
 * Inyecta el favicon y título en todos los HTMLs generados por expo export.
 * Ejecutar después de: npx expo export
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const faviconSrc = path.join(__dirname, 'assets/images/logo_saku_cl.png');
const faviconDest = path.join(distDir, 'favicon.png');

// 1. Copiar el favicon al dist (como .png Y como .ico — los navegadores priorizan favicon.ico)
if (fs.existsSync(faviconSrc)) {
  fs.copyFileSync(faviconSrc, faviconDest);
  fs.copyFileSync(faviconSrc, path.join(distDir, 'favicon.ico')); // sobreescribir el .ico por defecto de Expo
  console.log('✅ favicon.png + favicon.ico copiados a dist/');
}

// 2. Reemplazar en todos los HTMLs
const faviconTags = `<link rel="icon" type="image/png" href="/favicon.png"/><link rel="shortcut icon" type="image/png" href="/favicon.png"/><link rel="apple-touch-icon" href="/favicon.png"/><title>Tienda Saku</title>`;

let count = 0;
function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('<title data-rh="true"></title>')) {
        content = content.replace('<title data-rh="true"></title>', faviconTags);
        fs.writeFileSync(fullPath, content, 'utf8');
        count++;
      }
    }
  }
}

walkDir(distDir);
console.log(`✅ Favicon + título inyectado en ${count} archivos HTML`);

// 3. Eliminar el tag favicon.ico que Expo inyecta automáticamente
let removedCount = 0;
function removeExpoFavicon(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeExpoFavicon(fullPath);
    } else if (entry.name.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      // Eliminar el link tag de favicon.ico que Expo agrega al final
      const before = content;
      content = content.replace(/<link rel="icon" href="\/favicon\.ico"\s*\/>/g, '');
      content = content.replace(/<link rel="icon" href="\/favicon\.ico"\s*>/g, '');
      if (content !== before) {
        fs.writeFileSync(fullPath, content, 'utf8');
        removedCount++;
      }
    }
  }
}
removeExpoFavicon(distDir);
console.log(`✅ Tag favicon.ico de Expo eliminado de ${removedCount} archivos HTML`);
