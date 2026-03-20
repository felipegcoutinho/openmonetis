#!/usr/bin/env node

/**
 * OpenMonetis Setup Script
 * Uso: node setup.mjs
 */

import { createInterface } from "readline";
import { execSync } from "child_process";
import { writeFileSync, existsSync } from "fs";
import { randomBytes } from "crypto";
import { resolve, join } from "path";

// ─── Cores e símbolos ────────────────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const sym = {
  ok: `${c.green}✔${c.reset}`,
  fail: `${c.red}✗${c.reset}`,
  warn: `${c.yellow}!${c.reset}`,
  arrow: `${c.cyan}→${c.reset}`,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function section(label) {
  console.log(`\n${c.dim}── ${label} ${"─".repeat(Math.max(0, 48 - label.length))}${c.reset}`);
}

function runSilent(cmd) {
  try {
    return execSync(cmd, { stdio: "pipe" }).toString().trim();
  } catch {
    return null;
  }
}

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "pipe", ...opts });
}

function spinner(text) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r${c.cyan}${frames[i++ % frames.length]}${c.reset} ${text}`);
  }, 80);
  return {
    stop: (msg) => { clearInterval(id); process.stdout.write(`\r${sym.ok} ${msg}\n`); },
    fail: (msg) => { clearInterval(id); process.stdout.write(`\r${sym.fail} ${msg}\n`); },
  };
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function askDefault(question, defaultValue) {
  const answer = await ask(`${question} [${c.dim}${defaultValue}${c.reset}]: `);
  return answer.trim() || defaultValue;
}

async function askYesNo(question) {
  const answer = await ask(`${question} ${c.dim}[s/N]${c.reset}: `);
  return answer.trim().toLowerCase() === "s";
}

function abort(msg) {
  console.log(`\n${sym.fail} ${msg}\n`);
  rl.close();
  process.exit(1);
}

// ─── Header ──────────────────────────────────────────────────────────────────

console.log(`
${c.bold}${c.cyan}  OpenMonetis — Setup${c.reset}
  ${c.dim}Gestão financeira self-hosted${c.reset}
`);

// ─── ETAPA 1: Verificações do sistema ────────────────────────────────────────

section("Verificando sistema");

// Node
const nodeMajor = parseInt(process.versions.node.split(".")[0]);
if (nodeMajor < 22) {
  console.log(`${sym.fail} Node.js ${process.versions.node} — requer 22+`);
  console.log(`   ${sym.arrow} https://nodejs.org`);
  process.exit(1);
}
console.log(`${sym.ok} Node.js ${process.versions.node}`);

// pnpm
let pnpmVersion = runSilent("pnpm --version");
if (!pnpmVersion) {
  process.stdout.write(`${sym.warn} pnpm não encontrado — instalando... `);
  try {
    run("npm install -g pnpm");
    pnpmVersion = runSilent("pnpm --version");
    process.stdout.write(`${sym.ok}\n`);
    console.log(`${sym.ok} pnpm ${pnpmVersion}`);
  } catch {
    console.log(`\n${sym.fail} Falha ao instalar pnpm`);
    console.log(`   ${sym.arrow} npm install -g pnpm`);
    process.exit(1);
  }
} else {
  console.log(`${sym.ok} pnpm ${pnpmVersion}`);
}

// Git
if (!runSilent("git --version")) {
  console.log(`${sym.fail} Git não encontrado`);
  console.log(`   ${sym.arrow} https://git-scm.com`);
  process.exit(1);
}
console.log(`${sym.ok} Git disponível`);

// Docker
const dockerAvailable = !!runSilent("docker --version");
if (dockerAvailable) {
  console.log(`${sym.ok} Docker disponível`);
} else {
  console.log(`${sym.warn} Docker não encontrado — banco local indisponível`);
}

// ─── ETAPA 2: Banco de dados ──────────────────────────────────────────────────

section("Banco de dados");

let databaseUrl;
let useLocalDocker = false;

if (dockerAvailable) {
  console.log(`  [1] PostgreSQL local via Docker  ${c.dim}(recomendado)${c.reset}`);
  console.log(`  [2] URL remota  ${c.dim}(Supabase, Neon, Railway...)${c.reset}\n`);
  const dbChoice = await ask(`Escolha [1]: `);

  if (dbChoice.trim() === "2") {
    databaseUrl = await ask(`DATABASE_URL: `);
    if (!databaseUrl.match(/^postgre(s|sql):\/\//)) {
      abort("URL inválida — deve começar com postgresql:// ou postgres://");
    }
  } else {
    useLocalDocker = true;
    databaseUrl =
      "postgresql://openmonetis:openmonetis_dev_password@localhost:5432/openmonetis_db";
    console.log(`${sym.ok} Banco local selecionado`);
  }
} else {
  console.log(`  ${c.dim}Insira a URL de um banco remoto (Supabase, Neon, Railway...)${c.reset}\n`);
  databaseUrl = await ask(`DATABASE_URL: `);
  if (!databaseUrl.match(/^postgre(s|sql):\/\//)) {
    abort("URL inválida — deve começar com postgresql:// ou postgres://");
  }
}

// ─── ETAPA 3: Autenticação ────────────────────────────────────────────────────

section("Autenticação");

const authSecret = randomBytes(32).toString("base64");
const betterAuthUrl = await askDefault("URL da aplicação", "http://localhost:3000");

console.log(`${sym.ok} BETTER_AUTH_SECRET gerado`);
console.log(`${sym.ok} BETTER_AUTH_URL: ${betterAuthUrl}`);

// ─── ETAPA 4: Opcionais ───────────────────────────────────────────────────────

section("Opcionais");
console.log(`  ${c.dim}Deixe em branco e configure depois editando o .env${c.reset}\n`);

// Google OAuth
let googleClientId = "";
let googleClientSecret = "";
if (await askYesNo("  Google OAuth (login social)?")) {
  googleClientId = await ask("  GOOGLE_CLIENT_ID: ");
  googleClientSecret = await ask("  GOOGLE_CLIENT_SECRET: ");
}

// Resend
let resendApiKey = "";
let resendFromEmail = "";
if (await askYesNo("  E-mail via Resend (notificações e convites)?")) {
  resendApiKey = await ask("  RESEND_API_KEY: ");
  resendFromEmail = await ask(`  RESEND_FROM_EMAIL [OpenMonetis <noreply@seudominio.com>]: `);
  if (!resendFromEmail.trim()) resendFromEmail = "OpenMonetis <noreply@seudominio.com>";
}

// AI
let anthropicKey = "";
let openaiKey = "";
let googleAiKey = "";
let openrouterKey = "";
if (await askYesNo("  Insights com IA (Claude, GPT, Gemini, OpenRouter)?")) {
  console.log(`  ${c.dim}Deixe em branco o que não for usar${c.reset}`);
  anthropicKey = await ask("  ANTHROPIC_API_KEY: ");
  openaiKey = await ask("  OPENAI_API_KEY: ");
  googleAiKey = await ask("  GOOGLE_GENERATIVE_AI_API_KEY: ");
  openrouterKey = await ask("  OPENROUTER_API_KEY: ");
}

// Domínio público
let publicDomain = "";
if (await askYesNo("  Domínio público separado para a landing page?")) {
  publicDomain = await ask("  PUBLIC_DOMAIN (ex: openmonetis.com): ");
}

rl.close();

// ─── ETAPA 5: Confirmar e executar ────────────────────────────────────────────

const targetDir = resolve("openmonetis");

section("Instalação");
console.log(`
  ${sym.arrow} Clonar repositório em ./openmonetis
  ${sym.arrow} Gerar .env
  ${sym.arrow} pnpm install${useLocalDocker ? `\n  ${sym.arrow} Subir banco PostgreSQL (Docker)\n  ${sym.arrow} Habilitar extensões` : ""}
  ${sym.arrow} pnpm db:push
`);

if (existsSync(targetDir)) {
  abort("A pasta ./openmonetis já existe. Remova-a e tente novamente.");
}

// Clonar
let s = spinner("Clonando repositório...");
try {
  run("git clone https://github.com/felipegcoutinho/openmonetis.git openmonetis");
  s.stop("Repositório clonado");
} catch {
  s.fail("Falha ao clonar repositório");
  process.exit(1);
}

// Gerar .env
const val = (v, fallback = "") => v?.trim() || fallback;
const opt = (key, value) => (value?.trim() ? `${key}=${value}` : `# ${key}=`);

const envContent = [
  `# Gerado por setup.mjs em ${new Date().toISOString()}`,
  "",
  "# === Database ===",
  `DATABASE_URL=${databaseUrl}`,
  "",
  "# === Better Auth ===",
  `BETTER_AUTH_SECRET=${authSecret}`,
  `BETTER_AUTH_URL=${betterAuthUrl}`,
  "",
  "# === Portas ===",
  "APP_PORT=3000",
  "DB_PORT=5432",
  "",
  "# === PostgreSQL (Docker local) ===",
  "POSTGRES_USER=openmonetis",
  "POSTGRES_PASSWORD=openmonetis_dev_password",
  "POSTGRES_DB=openmonetis_db",
  "",
  "# === Multi-domínio ===",
  opt("PUBLIC_DOMAIN", publicDomain),
  "",
  "# === Google OAuth ===",
  opt("GOOGLE_CLIENT_ID", googleClientId),
  opt("GOOGLE_CLIENT_SECRET", googleClientSecret),
  "",
  "# === Email (Resend) ===",
  opt("RESEND_API_KEY", resendApiKey),
  resendFromEmail ? `RESEND_FROM_EMAIL="${resendFromEmail}"` : "# RESEND_FROM_EMAIL=",
  "",
  "# === AI Providers ===",
  opt("ANTHROPIC_API_KEY", anthropicKey),
  opt("OPENAI_API_KEY", openaiKey),
  opt("GOOGLE_GENERATIVE_AI_API_KEY", googleAiKey),
  opt("OPENROUTER_API_KEY", openrouterKey),
].join("\n");

writeFileSync(join(targetDir, ".env"), envContent);
console.log(`${sym.ok} .env gerado`);

// pnpm install
s = spinner("Instalando dependências...");
try {
  run("pnpm install", { cwd: targetDir });
  s.stop("Dependências instaladas");
} catch {
  s.fail("Falha ao instalar dependências");
  process.exit(1);
}

// Docker local
if (useLocalDocker) {
  s = spinner("Subindo banco PostgreSQL...");
  try {
    run("pnpm docker:up:db", { cwd: targetDir });
    s.stop("Banco iniciado");
  } catch {
    s.fail("Falha ao iniciar o banco");
    process.exit(1);
  }

  // Aguardar postgres ficar pronto
  s = spinner("Aguardando PostgreSQL ficar pronto...");
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      run("docker compose exec -T db pg_isready -U openmonetis", { cwd: targetDir });
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  if (!ready) {
    s.fail("PostgreSQL não respondeu a tempo");
    process.exit(1);
  }
  s.stop("PostgreSQL pronto");

  // Extensões
  s = spinner("Habilitando extensões do banco...");
  try {
    run("pnpm db:enableExtensions", { cwd: targetDir });
    s.stop("Extensões habilitadas");
  } catch {
    s.fail("Falha ao habilitar extensões");
    process.exit(1);
  }
}

// db:push
s = spinner("Aplicando schema no banco...");
try {
  run("pnpm db:push", { cwd: targetDir });
  s.stop("Schema aplicado");
} catch {
  s.fail("Falha ao aplicar schema");
  process.exit(1);
}

// ─── Finalização ──────────────────────────────────────────────────────────────

console.log(`
${c.green}${c.bold}  ✔ OpenMonetis instalado com sucesso!${c.reset}

  ${c.bold}Para iniciar:${c.reset}
    cd openmonetis
    pnpm dev${
      useLocalDocker
        ? `          ${c.dim}→ desenvolvimento${c.reset}\n    pnpm docker:up    ${c.dim}→ produção local (app + banco)${c.reset}`
        : `          ${c.dim}→ desenvolvimento${c.reset}`
    }

  ${c.bold}Acesse:${c.reset}  ${betterAuthUrl}
  ${c.bold}Docs:${c.reset}    https://github.com/felipegcoutinho/openmonetis
`);
