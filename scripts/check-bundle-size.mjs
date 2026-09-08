import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const vercelStaticDir = path.resolve(rootDir, ".vercel", "output", "static");
const distDir = fs.existsSync(vercelStaticDir) ? vercelStaticDir : path.resolve(rootDir, "dist");

console.log("========================================");
console.log("   BARBEOS Bundle Size & Health Check   ");
console.log("========================================\n");
console.log(`Inspecionando diretório: ${path.relative(rootDir, distDir)}\n`);

if (!fs.existsSync(distDir)) {
  console.error("ERRO: Diretório de saída não encontrado. Execute 'npm run build' primeiro.");
  process.exit(1);
}

function findFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findFiles(fullPath, ext));
    } else if (file.endsWith(ext)) {
      results.push({
        name: path.relative(distDir, fullPath),
        sizeBytes: stat.size,
        sizeKb: (stat.size / 1024).toFixed(2),
      });
    }
  }
  return results;
}

const jsFiles = findFiles(distDir, ".js");
const cssFiles = findFiles(distDir, ".css");

if (jsFiles.length === 0) {
  console.warn("Aviso: Nenhum arquivo JS encontrado em dist/.");
  process.exit(0);
}

// Sort JS files by size descending
jsFiles.sort((a, b) => b.sizeBytes - a.sizeBytes);

console.log(`Encontrados ${jsFiles.length} arquivos JS e ${cssFiles.length} arquivos CSS.\n`);
console.log("--- Top Arquivos JavaScript ---");

let totalJsBytes = 0;
let violations = [];
const CHUNK_BUDGET_KB = 850; // Max allowed single vendor/entry chunk size in KB

for (const file of jsFiles) {
  totalJsBytes += file.sizeBytes;
  const isLarge = file.sizeBytes > CHUNK_BUDGET_KB * 1024;
  const marker = isLarge ? " [EXCEDE BUDGET]" : "";
  console.log(` • ${file.name.padEnd(50)} ${file.sizeKb.padStart(8)} KB${marker}`);

  if (isLarge) {
    violations.push(`${file.name} (${file.sizeKb} KB > limite de ${CHUNK_BUDGET_KB} KB)`);
  }
}

const totalJsKb = (totalJsBytes / 1024).toFixed(2);
console.log(`\nTamanho total de JS: ${totalJsKb} KB`);

if (violations.length > 0) {
  console.error(
    `\nFalha: ${violations.length} arquivo(s) excederam o limite de ${CHUNK_BUDGET_KB} KB:`,
  );
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}

console.log(`\nTodos os chunks estao dentro do limite operacional (< ${CHUNK_BUDGET_KB} KB).`);
console.log("Status: SUCESSO");
process.exit(0);
