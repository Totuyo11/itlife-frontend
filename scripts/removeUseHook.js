/**
 * Limpieza automática de imports inválidos de React.
 * Busca variantes de "" o "".
 */
const fs = require("fs");
const path = require("path");

const targetDir = path.resolve(__dirname, "..");

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !fullPath.includes("node_modules")) {
      results = results.concat(walk(fullPath));
    } else if (/\.(js|jsx|ts|tsx)$/.test(fullPath)) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(targetDir);
let modifiedCount = 0;

files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");
  const fixed = content.replace(
    /import\s*\{\s*use\s*\}\s*from\s*['"]react['"];?/g,
    ""
  );
  if (fixed !== content) {
    fs.writeFileSync(file, fixed, "utf8");
    console.log(`[✔] Limpiado: ${file}`);
    modifiedCount++;
  }
});

console.log(
  `[prebuild] Limpieza completada. Archivos modificados: ${modifiedCount}`
);
