// scripts/removeUseHook.js
const fs = require('fs');
const path = require('path');

const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);
const root = process.cwd();

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue;
      walk(p, files);
    } else {
      if (exts.has(path.extname(p))) files.push(p);
    }
  }
  return files;
}

function fixContent(src) {
  let c = src;

  // IMPORTS desde react - elimina el token 'use' (con/sin alias), soporta multilínea
  const importPattern = /import\s*{\s*([^}]*)\s*}\s*from\s*['"]react['"]/gms;
  c = c.replace(importPattern, (_, inside) => {
    const names = inside.split(',').map(s => s.trim()).filter(Boolean);
    const filtered = names.filter(n => !/^use(\s+as\s+\w+)?$/i.test(n));
    if (filtered.length === 0) return `import React from 'react'`;
    return `import { ${filtered.join(', ')} } from 'react'`;
  });

  // RE-EXPORTS desde react - quita 'use'; si queda vacío, elimina la línea
  const exportPattern = /export\s*{\s*([^}]*)\s*}\s*from\s*['"]react['"]\s*;?/gms;
  c = c.replace(exportPattern, (_, inside) => {
    const names = inside.split(',').map(s => s.trim()).filter(Boolean);
    const filtered = names.filter(n => !/^use(\s+as\s+\w+)?$/i.test(n));
    if (filtered.length === 0) return '';
    return `export { ${filtered.join(', ')} } from 'react'`;
  });

  return c;
}

const files = walk(root);
let changed = 0;

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const fixed = fixContent(src);
  if (fixed !== src) {
    fs.writeFileSync(file, fixed, 'utf8');
    changed++;
  }
}

console.log(`[prebuild] Limpieza de '{ use }' completada. Archivos modificados: ${changed}`);
