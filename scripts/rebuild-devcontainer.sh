#!/usr/bin/env bash
set -euo pipefail

# Rebuild do Dev Container a partir do HOST (fora do container)
# Uso:
#   scripts/rebuild-devcontainer.sh [-y|--yes] [-v|--verbose]
#
# O que faz:
# - dá down no docker-compose do projeto (app + devcontainer)
# - remove imagens do devcontainer (vsc-<pasta>-*) para forçar rebuild
# - instrui a reabrir a pasta com "Open Folder in Container" no Windsurf

AUTO_YES="false"
VERBOSE="false"

usage() {
  cat <<'EOF'
Uso: scripts/rebuild-devcontainer.sh [opções]

Opções:
  -y, --yes       Pula a confirmação interativa
  -v, --verbose   Log mais detalhado
  -h, --help      Mostra esta ajuda

Execute este script no HOST (fora do container).
Após a execução, no Windsurf use: "Open Folder in Container" para reconstruir o devcontainer.
EOF
}

log() { echo -e "$*"; }
vecho() { [[ "$VERBOSE" == "true" ]] && log "$@" || true; }

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    -y|--yes) AUTO_YES="true"; shift ;;
    -v|--verbose) VERBOSE="true"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) log "Argumento desconhecido: $1"; usage; exit 2 ;;
  esac
done

# Checagens básicas
if ! command -v docker >/dev/null 2>&1; then
  log "Erro: 'docker' não encontrado no PATH. Rode este script no HOST."; exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  log "Erro: 'docker compose' (plugin) não está disponível."; exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_BASENAME="$(basename "$PROJECT_DIR")"
COMPOSE_MAIN="$PROJECT_DIR/docker-compose.yml"
COMPOSE_DEV="$PROJECT_DIR/.devcontainer/docker-compose.devcontainer.yml"

log "Projeto: $PROJECT_BASENAME"
log "Diretório: $PROJECT_DIR"

if [[ "$AUTO_YES" != "true" ]]; then
  read -r -p "Isto vai PARAR containers e REMOVER a imagem do devcontainer. Continuar? [y/N] " ans
  case "$ans" in
    [yY]|[yY][eE][sS]) ;;
    *) log "Abortado pelo usuário."; exit 0 ;;
  esac
fi

# Derruba os serviços (app + devcontainer) se os arquivos compose existirem
if [[ -f "$COMPOSE_MAIN" && -f "$COMPOSE_DEV" ]]; then
  log "→ Parando serviços com docker compose down..."
  docker compose -f "$COMPOSE_MAIN" -f "$COMPOSE_DEV" down
else
  log "Aviso: arquivos de compose não encontrados; pulando 'down'."
fi

# Remove imagens do devcontainer (padrão VS Code/Windsurf: vsc-<folder>-<hash>-uid)
vecho "Buscando imagens a remover (vsc-$PROJECT_BASENAME-* ou $PROJECT_BASENAME-dev)..."
IMAGES_TO_REMOVE=$(docker images --format '{{.Repository}} {{.ID}}' \
  | grep -E "^vsc-${PROJECT_BASENAME}-|^${PROJECT_BASENAME}-dev$" \
  | awk '{print $2}' | tr '\n' ' ')

if [[ -n "${IMAGES_TO_REMOVE// /}" ]]; then
  log "→ Removendo imagens do devcontainer: $IMAGES_TO_REMOVE"
  docker rmi -f $IMAGES_TO_REMOVE || true
else
  log "Nenhuma imagem 'vsc-${PROJECT_BASENAME}-*' ou '${PROJECT_BASENAME}-dev' encontrada."
fi

log ""
log "✅ Rebuild preparado."
log "Agora, no Windsurf, use: Open Folder in Container para reconstruir o devcontainer."
log "Dica: você pode rodar novamente com '-y' para pular a confirmação."
