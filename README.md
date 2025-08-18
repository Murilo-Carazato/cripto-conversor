# Cripto-Conversor

 [![CI](https://github.com/Murilo-Carazato/cripto-conversor/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Murilo-Carazato/cripto-conversor/actions/workflows/ci.yml)
 [![Project 19](https://img.shields.io/badge/Project-Kanban-blue?logo=github)](https://github.com/users/Murilo-Carazato/projects/19)
 [![Issues](https://img.shields.io/github/issues/Murilo-Carazato/cripto-conversor)](https://github.com/Murilo-Carazato/cripto-conversor/issues)
 [![Last Commit](https://img.shields.io/github/last-commit/Murilo-Carazato/cripto-conversor)](https://github.com/Murilo-Carazato/cripto-conversor/commits/main)

 Conversor de criptomoedas (MVP) com monorepo (`apps/api`, `apps/web`).

 ## Stack
 - Backend: Node.js + TypeScript (Express), Prisma (MySQL), Zod
 - Frontend: React + TypeScript, Vite, MUI, TanStack Query
 - DevOps: Docker Compose, Dev Container (VS Code)

 ## Arquitetura
 - `apps/api`: API REST com autenticação, catálogo de criptos (CoinGecko) e conversão.
 - `apps/web`: frontend React consumindo a API.

 ## Como rodar (Docker)
 1. Copie o `.env` de exemplo e ajuste se necessário:
    ```bash
    cp .env.example .env
    ```
 2. Suba os serviços:
    ```bash
    docker compose up -d
    ```
 3. Acesse:
    - Frontend: http://localhost:5173
    - API Health: http://localhost:3001/health
    - Swagger: http://localhost:3001/docs
    - Adminer: http://localhost:8080

 > Dica (WSL): clone o repo dentro do filesystem do WSL (ex.: `~/projects/cripto-conversor`) e evite `/mnt/*` para melhor desempenho de I/O.

 > Mudou o `.env`? Recrie os serviços para aplicar as variáveis:
 > ```bash
 > docker compose up -d --force-recreate --no-deps api
 > docker compose up -d --force-recreate --no-deps web
 > ```

 ## Como rodar (sem Docker)
 Requer Node 20+ e pnpm.
 ```bash
 pnpm -w install
 # API
 pnpm -C apps/api dev
 # Web
 pnpm -C apps/web dev
 ```

 ## Variáveis de ambiente
 Edite o arquivo `.env` na raiz. Exemplo em `/.env.example`.
 - Backend
   - `API_PORT` (default 3001)
   - `DATABASE_URL` (ex.: `mysql://app:app@db:3306/cripto`)
   - `SHADOW_DATABASE_URL` (opcional, melhora diffs)
   - `JWT_SECRET`, `JWT_EXPIRES_IN`
   - `COINGECKO_BASE` (default: `https://api.coingecko.com/api/v3`)
   - `CORS_ORIGIN` (ex.: `http://localhost:5173,http://127.0.0.1:5173`)
 - Frontend
   - `VITE_API_URL` (ex.: `http://localhost:3001`)

 ## API Docs (Swagger)
 - Abrir em: `http://localhost:3001/docs`
 - Autenticação: Bearer token (rotas protegidas como `/me`, `/favorites`, `/cryptos/sync`).
 - Rotas principais:
   - `POST /auth/register`, `POST /auth/login`, `GET /me`
   - `GET /convert`
   - `GET /cryptos`, `POST /cryptos/sync`
   - `GET /favorites`, `POST /favorites`, `DELETE /favorites/{cryptoId}`
   - `GET /history`

 ## Troubleshooting
 - Use `docker compose ps` e `docker compose logs -f api|web` para diagnosticar.
 - Em WSL, evite `/mnt/*`; prefira `~/projects/...`.
 - Builds lentos? `.dockerignore` otimizados na raiz e em `apps/*` reduzem o contexto.

 ## Kanban
 - Project: Iterative Development
 - Issues criadas via `/.github/issues.json` e scripts em `scripts/`.
