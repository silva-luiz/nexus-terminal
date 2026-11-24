// Gera THIRD_PARTY_LICENSES.md com as licenças das dependências que vão no app.
// Uso: pnpm licenses:generate
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

// No Windows o pnpm é um .cmd e precisa de shell; o cargo não (e o "|" do formato quebraria no cmd).
const run = (cmd, args, shell = false) =>
  execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, shell });

// Dependências JavaScript de produção.
const npmByLicense = JSON.parse(run("pnpm", ["licenses", "list", "--prod", "--json"], process.platform === "win32"));
const npm = Object.values(npmByLicense)
  .flat()
  .flatMap((pkg) => pkg.versions.map((version) => ({ name: pkg.name, version, license: pkg.license })));

// Crates Rust compilados no executável do Windows.
const tree = run("cargo", [
  "tree",
  "--manifest-path",
  "src-tauri/Cargo.toml",
  "-e",
  "normal",
  "--prefix",
  "none",
  "--target",
  "x86_64-pc-windows-msvc",
  "--format",
  "{p}|{l}",
]);
const crates = new Map();
for (const line of tree.split(/\r?\n/)) {
  const match = /^(\S+) v(\S+)(?: \([^)]*\))?(?: \(\*\))?\|(.*)$/.exec(line.trim());
  if (!match || match[1] === "nexus-terminal") continue;
  crates.set(`${match[1]}@${match[2]}`, { name: match[1], version: match[2], license: match[3] || "?" });
}

const table = (rows) =>
  ["| Pacote | Versão | Licença |", "|---|---|---|"]
    .concat(
      rows
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((r) => `| ${r.name} | ${r.version} | ${r.license.replace(/\|/g, "/")} |`),
    )
    .join("\n");

const summary = (rows) => {
  const counts = {};
  for (const r of rows) counts[r.license] = (counts[r.license] ?? 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([license, n]) => `- ${license}: ${n}`)
    .join("\n");
};

const md = `# Licenças de terceiros

Arquivo gerado por \`scripts/third-party-licenses.mjs\` (\`pnpm licenses:generate\`). Não edite à mão.
Paletas de cores dos temas: ver \`THIRD_PARTY_NOTICES.md\`.

## Dependências JavaScript (${npm.length})

${summary(npm)}

${table(npm)}

## Crates Rust (${crates.size})

${summary([...crates.values()])}

${table([...crates.values()])}
`;

writeFileSync("THIRD_PARTY_LICENSES.md", md);
console.log(`THIRD_PARTY_LICENSES.md: ${npm.length} pacotes npm, ${crates.size} crates`);
