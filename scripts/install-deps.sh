#!/bin/sh
# install-deps.sh — Instala pré-requisitos do OpenMonetis
# Testado apenas em Ubuntu Server 24.04 LTS
# Uso: curl -fsSL https://raw.githubusercontent.com/felipegcoutinho/openmonetis/main/scripts/install-deps.sh -o install-deps.sh
#      sudo sh install-deps.sh

set -e

LOG_FILE="/tmp/openmonetis-install.log"
> "$LOG_FILE"

# Suprimir prompt interativo do corepack ao chamar pnpm/node versioning
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# ── Cores ──────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

ok()   { printf "${GREEN}✔${RESET} %s\n" "$1"; }
warn() { printf "${YELLOW}!${RESET} %s\n" "$1"; }
info() { printf "${CYAN}→${RESET} %s\n" "$1"; }
fail() { printf "${RED}✗${RESET} %s\n" "$1"; exit 1; }

# ── Contador de etapas ─────────────────────────────────────────────────────────
_STEP=0
_TOTAL=5

section() {
  _STEP=$((_STEP + 1))
  printf "\n${BOLD}[%d/%d] %s${RESET}\n" "$_STEP" "$_TOTAL" "$1"
}

# ── Spinner ────────────────────────────────────────────────────────────────────
_spin_pid=""

spinner_start() {
  _spin_label="$1"
  ( i=0
    while true; do
      case $((i % 4)) in
        0) d="   " ;; 1) d=".  " ;; 2) d=".. " ;; *) d="..." ;;
      esac
      printf "\r${CYAN}→${RESET} %s%s" "$_spin_label" "$d"
      i=$((i + 1))
      sleep 0.4
    done
  ) &
  _spin_pid=$!
}

spinner_stop() {
  if [ -n "$_spin_pid" ]; then
    kill "$_spin_pid" 2>/dev/null || true
    wait "$_spin_pid" 2>/dev/null || true
    _spin_pid=""
    printf "\r\033[2K"
  fi
}

# ── Executores silenciosos com spinner ─────────────────────────────────────────

# run_quiet "label" cmd [args...]  — roda comando com spinner, falha mostra log
run_quiet() {
  _rq_label="$1"; shift
  spinner_start "$_rq_label"
  if ! "$@" >> "$LOG_FILE" 2>&1; then
    spinner_stop
    printf "${RED}✗ Falha em: %s${RESET}\n" "$_rq_label"
    printf "  Log completo: %s\n\n" "$LOG_FILE"
    tail -20 "$LOG_FILE"
    exit 1
  fi
  spinner_stop
}

# run_as_user "label" "comando_shell"  — roda comando como $CURRENT_USER com spinner
run_as_user() {
  _ru_label="$1"; shift
  spinner_start "$_ru_label"
  if ! su - "$CURRENT_USER" -c "$*" >> "$LOG_FILE" 2>&1; then
    spinner_stop
    printf "${RED}✗ Falha em: %s${RESET}\n" "$_ru_label"
    printf "  Log completo: %s\n\n" "$LOG_FILE"
    tail -20 "$LOG_FILE"
    exit 1
  fi
  spinner_stop
}

# ── Cleanup no Ctrl+C ──────────────────────────────────────────────────────────
cleanup() {
  spinner_stop
  printf "\n${YELLOW}Instalação interrompida.${RESET} Log em: %s\n" "$LOG_FILE"
  exit 1
}
trap cleanup INT TERM

# ── Tempo total ────────────────────────────────────────────────────────────────
_START=$(date +%s)
elapsed() {
  _secs=$(( $(date +%s) - _START ))
  printf "%dm%ds" $((_secs / 60)) $((_secs % 60))
}

# ── Root check ─────────────────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  fail "Execute como root ou com sudo: sudo sh install-deps.sh"
fi

CURRENT_USER="${SUDO_USER:-$(whoami)}"

printf "\n${BOLD}OpenMonetis — Instalação de Dependências${RESET}\n"
printf "Usuário: ${CYAN}%s${RESET} | Log: %s\n" "$CURRENT_USER" "$LOG_FILE"

# ── [1/5] Dependências base ────────────────────────────────────────────────────
section "Dependências base"
run_quiet "Atualizando lista de pacotes"       apt-get update -qq
run_quiet "Instalando git, curl, ca-certificates" apt-get install -y -qq ca-certificates curl git
ok "git $(git --version | cut -d' ' -f3) · curl · ca-certificates"

# ── [2/5] Docker ───────────────────────────────────────────────────────────────
section "Docker"

if command -v docker > /dev/null 2>&1; then
  ok "Docker já instalado: $(docker --version | cut -d',' -f1)"
else
  info "Adicionando repositório oficial do Docker..."
  install -m 0755 -d /etc/apt/keyrings
  run_quiet "Baixando chave GPG do Docker" \
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  . /etc/os-release
  mkdir -p /etc/apt/sources.list.d
  printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu %s stable\n' \
    "$(dpkg --print-architecture)" "$VERSION_CODENAME" \
    > /etc/apt/sources.list.d/docker.list

  run_quiet "Atualizando lista de pacotes" apt-get update -qq
  run_quiet "Instalando Docker Engine (pode levar alguns minutos)" \
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  systemctl enable docker > /dev/null 2>&1 || true
  systemctl start docker  > /dev/null 2>&1 || true
  ok "Docker $(docker --version | cut -d',' -f1 | cut -d' ' -f3) instalado"
fi

if docker compose version > /dev/null 2>&1; then
  ok "Docker Compose $(docker compose version | cut -d' ' -f4)"
else
  run_quiet "Instalando Docker Compose plugin" \
    sh -c 'mkdir -p /usr/local/lib/docker/cli-plugins && curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose && chmod +x /usr/local/lib/docker/cli-plugins/docker-compose'
  ok "Docker Compose $(docker compose version | cut -d' ' -f4) instalado"
fi

if [ -n "$CURRENT_USER" ] && [ "$CURRENT_USER" != "root" ]; then
  if ! groups "$CURRENT_USER" | grep -q docker; then
    usermod -aG docker "$CURRENT_USER"
    warn "Usuário '$CURRENT_USER' adicionado ao grupo docker — faça logout/login para aplicar"
  else
    ok "Usuário '$CURRENT_USER' já está no grupo docker"
  fi
fi

# ── [3/5] Homebrew ─────────────────────────────────────────────────────────────
section "Homebrew"

if command -v brew > /dev/null 2>&1; then
  ok "Homebrew já instalado: $(brew --version | head -1)"
else
  warn "Esta etapa pode levar de 5 a 10 minutos."
  run_quiet "Instalando dependências de compilação" \
    apt-get install -y -qq build-essential procps file

  if [ -n "$CURRENT_USER" ] && [ "$CURRENT_USER" != "root" ]; then
    run_as_user "Instalando Homebrew" \
      'NONINTERACTIVE=1 bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'

    BREW_PROFILE="/home/$CURRENT_USER/.bashrc"
    BREW_EVAL='eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"'
    grep -qxF "$BREW_EVAL" "$BREW_PROFILE" 2>/dev/null || echo "$BREW_EVAL" >> "$BREW_PROFILE"
    export PATH="/home/linuxbrew/.linuxbrew/bin:$PATH"
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)" 2>/dev/null || true
  else
    fail "Homebrew não pode ser instalado como root. Use sudo com um usuário normal."
  fi

  ok "Homebrew instalado"
fi

# ── [4/5] Node.js 22 ───────────────────────────────────────────────────────────
section "Node.js 22"

NODE_MAJOR=0
if command -v node > /dev/null 2>&1; then
  NODE_MAJOR=$(node -e "process.stdout.write(String(parseInt(process.versions.node)))")
fi

if [ "$NODE_MAJOR" -ge 22 ] 2>/dev/null; then
  ok "Node.js já instalado: $(node --version)"
else
  warn "Node.js via Homebrew pode levar alguns minutos."
  if [ -n "$CURRENT_USER" ] && [ "$CURRENT_USER" != "root" ]; then
    run_as_user "Instalando Node.js 22" \
      'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)" && brew install node@22 && brew link node@22 --force --overwrite'
    export PATH="/home/linuxbrew/.linuxbrew/bin:$PATH"
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)" 2>/dev/null || true
  else
    fail "Node.js via Homebrew não pode ser instalado como root."
  fi
  ok "Node.js $(node --version) instalado"
fi

# ── [5/5] pnpm ─────────────────────────────────────────────────────────────────
section "pnpm"

if command -v pnpm > /dev/null 2>&1; then
  ok "pnpm já instalado: $(pnpm --version)"
else
  if [ -n "$CURRENT_USER" ] && [ "$CURRENT_USER" != "root" ]; then
    run_as_user "Instalando pnpm via corepack" \
      'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)" && corepack enable && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack prepare pnpm@latest --activate'
  else
    run_quiet "Instalando pnpm via corepack" \
      sh -c 'corepack enable && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack prepare pnpm@latest --activate'
  fi
  ok "pnpm instalado"
fi

# ── Resumo ─────────────────────────────────────────────────────────────────────
# Garantir que node/pnpm do brew estejam no PATH para o resumo
export PATH="/home/linuxbrew/.linuxbrew/bin:$PATH"
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)" 2>/dev/null || true

printf "\n${BOLD}Concluído em $(elapsed)${RESET}\n"

ok "git:            $(git --version | cut -d' ' -f3)"
ok "docker:         $(docker --version | cut -d',' -f1 | cut -d' ' -f3)"
ok "docker compose: $(docker compose version | cut -d' ' -f4)"
ok "node:           $(node --version)"
ok "pnpm:           $(pnpm --version)"
