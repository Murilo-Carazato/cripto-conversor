#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/create_issues.sh
#   (Opcional) REPO="<owner>/<repo>" ./scripts/create_issues.sh
# Requires:
#   - GitHub CLI authenticated: gh auth login
# Notes:
#   - No external parsers needed. This script issues gh commands directly.

# Default repository if not provided via env var
: "${REPO:=Murilo-Carazato/cripto-conversor}"

create_issue() {
  local title="$1"
  local body="$2"
  shift 2
  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body "$body" \
    "$@"
}

# Infra
create_issue \
  "Infra: Docker Compose (db, adminer, api, web)" \
  "Configurar docker-compose com MySQL, Adminer, serviços api e web (dev). Ajustar portas e healthcheck." \
  --label infra

create_issue \
  "Infra: Variáveis de ambiente (.env/.env.example)" \
  "Criar .env.example e validar env no backend com Zod." \
  --label infra

create_issue \
  "Monorepo: pnpm workspaces" \
  "pnpm-workspace.yaml com apps/api e apps/web. Scripts na raiz." \
  --label infra

# Backend
create_issue \
  "Backend: Bootstrap TS→JS" \
  "Express + TypeScript (build para dist JS), ESLint/Prettier, scripts dev/build/start." \
  --label backend

create_issue \
  "Backend: Prisma (MySQL) + Migrations" \
  "Configurar Prisma com MySQL, models User/Favorite/ConversionHistory, migrate e seeds." \
  --label backend --label db

create_issue \
  "Backend: Auth (signup/login + JWT)" \
  "Rotas /auth/signup e /auth/login, hashing de senha, JWT, middlewares de auth." \
  --label backend --label auth

create_issue \
  "Backend: CoinGecko integração" \
  "Cliente HTTP para buscar taxas BTC/ETH→BRL/USD, cache in-memory (TTL curto)." \
  --label backend --label api

create_issue \
  "Backend: Conversão (/convert)" \
  "POST /convert com validação Zod: {coin, amount}. Retorna {brl, usd, rate} e persiste histórico." \
  --label backend --label feature

create_issue \
  "Backend: Histórico (/history)" \
  "GET /history do usuário logado. Paginação simples." \
  --label backend --label feature

create_issue \
  "Backend: Favoritos (/favorites)" \
  "POST/DELETE /favorites/:coinId e GET /favorites. Persistir por usuário." \
  --label backend --label feature

create_issue \
  "Backend: Lista de moedas (/coins)" \
  "GET /coins para dropdown (marcando favoritos do usuário)." \
  --label backend --label feature

create_issue \
  "Backend: Swagger (/docs)" \
  "Documentar API com swagger-ui-express + swagger-jsdoc." \
  --label backend --label docs

# Frontend
create_issue \
  "Frontend: Bootstrap Vite TS + MUI" \
  "Criar projeto React TS, MUI, tema básico, QueryClientProvider." \
  --label frontend --label ui

create_issue \
  "Frontend: Autenticação (UI)" \
  "Tela login/cadastro simples, armazenar token (localStorage). Guard de rota privada." \
  --label frontend --label auth

create_issue \
  "Frontend: Conversão (Form + Resultado)" \
  "Dropdown coin, input amount, botão converter; mostrar BRL/USD; validação Zod; loading/toasts." \
  --label frontend --label feature

create_issue \
  "Frontend: Histórico" \
  "Listar histórico do usuário; estados loading/empty/error." \
  --label frontend --label feature

create_issue \
  "Frontend: Favoritos" \
  "Favoritar/desfavoritar direto no dropdown; seção de favoritos." \
  --label frontend --label feature

# Qualidade
create_issue \
  "Qualidade: Testes Backend (Jest + Supertest)" \
  "Integração das rotas principais: auth, convert, history." \
  --label quality --label tests

create_issue \
  "Qualidade: Testes Frontend (Vitest + RTL)" \
  "Testar formulário de conversão, estados e toasts." \
  --label quality --label tests

# CI/CD e Docs
create_issue \
  "CI: GitHub Actions" \
  "Workflow instalando deps, subindo MySQL service, rodando prisma migrate e testes." \
  --label devops --label ci

create_issue \
  "Docs: README de excelência" \
  "Arquitetura, como rodar local e Docker, envs, endpoints e link /docs, prints/GIF." \
  --label docs

create_issue \
  "Deploy: Web + API + DB" \
  "Web (Vercel/Netlify), API (Render/Railway), DB (PlanetScale). Ajustar envs." \
  --label devops --label deploy

echo "✅ Issues criadas em $REPO"
