// scripts/strip-use-from-react.js
// Elimina cualquier importación de `use` desde 'react' (incluye alias, espacios, etc.)
// Funciona en .js, .jsx, .ts, .tsx y omite node_modules y build.

const fs = require("fs");
const path = require("path");

const exts = new Set([".js", ".jsx", ".ts", ".tsx"]);
const root = process.cwd();

let changed = 0;
let hits = [];

function shouldSkip(p) {
  return p.includes(`${path.sep}node_modules${path.sep}`) ||
         p.includes(`${path.sep}build${path.sep}`) ||
         p.includes(`${path.sep}dist${path.sep}`);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (shouldSkip(p)) continue;
    if (entry.isDirectory()) walk(p);
    else if (exts.has(path.extname(p))) processFile(p);
  }
}

function processFile(file) {
  let src = fs.readFileSync(file, "utf8");
  let orig = src;

  // Busca líneas de import que traen algo desde 'react'
  // Captura default + named: import React, { use, useState } from 'react';
  // o solo named: import {use as u} from "react";
  src = src.replace(
    /import\s+([^;'"]*?)from\s*['"]react['"]\s*;?/g,
    (full, clause) => {
      // clause puede ser: React, { use, useState }
      // o solo { use } etc.
      // Separamos default y named
      let defaultPart = "";
      let namedPart = "";

      // ¿Hay named?
      const namedMatch = clause.match(/\{([\s\S]*?)\}/);
      if (namedMatch) {
        namedPart = namedMatch[1]; // contenido dentro de {}
        // quita el bloque {..} de clause para ver si queda default
        defaultPart = clause.replace(namedMatch[0], "").trim().replace(/,$/, "").trim();
      } else {
        // No había {}
        defaultPart = clause.trim().replace(/,$/, "").trim();
      }

      // Procesa namedPart para quitar cualquier specifier que sea `use` o `use as X`
      let keptNamed = [];
      if (namedPart) {
        const specs = namedPart.split(",").map(s => s.trim()).filter(Boolean);
        for (const s of specs) {
          // Coincide con: use   |   use as algo
          if (/^use(\s+as\s+\w+)?$/i.test(s)) {
            hits.push(file);
            continue; // descarta
          }
          keptNamed.push(s);
        }
      }

      // Reconstruye el import
      let rebuilt = "import ";
      if (defaultPart && keptNamed.length > 0) {
        rebuilt += `${defaultPart}, { ${keptNamed.join(", ")} } from 'react';`;
      } else if (defaultPart && keptNamed.length === 0) {
        rebuilt += `${defaultPart} from 'react';`;
      } else if (!defaultPart && keptNamed.length > 0) {
        rebuilt += `{ ${keptNamed.join(", ")} } from 'react';`;
      } else {
        // Si no queda nada (solo existía { use }), deja un import mínimo o elimina.
        // CRA/React 18 no requiere import React para JSX, pero es seguro dejarlo vacío:
        // return ""; // si prefieres eliminar por completo
        rebuilt += `React from 'react';`; // opción segura
      }

      return rebuilt;
    }
  );

  if (src !== orig) {
    fs.writeFileSync(file, src, "utf8");
    changed++;
  }
}

walk(root);

console.log(`[prebuild] Limpieza de 'use' completada. Archivos modificados: ${changed}`);
if (hits.length) {
  console.log("[prebuild] Coincidencias encontradas en:");
  const uniq = [...new Set(hits)];
  for (const f of uniq) console.log(" -", path.relative(root, f));
}
