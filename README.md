# Cripto-Conversor

 [![CI](https://github.com/Murilo-Carazato/cripto-conversor/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Murilo-Carazato/cripto-conversor/actions/workflows/ci.yml)
 [![Project 19](https://img.shields.io/badge/Project-Kanban-blue?logo=github)](https://github.com/users/Murilo-Carazato/projects/19)
 [![Issues](https://img.shields.io/github/issues/Murilo-Carazato/cripto-conversor)](https://github.com/Murilo-Carazato/cripto-conversor/issues)
 [![Last Commit](https://img.shields.io/github/last-commit/Murilo-Carazato/cripto-conversor)](https://github.com/Murilo-Carazato/cripto-conversor/commits/main)

 Conversor de criptomoedas (MVP) com monorepo (`apps/api`, `apps/web`).

 ## Stack
 - Backend: Node.js + TypeScript (build para JS), Express, Prisma (MySQL), Zod
 - Frontend: React + TypeScript, MUI, TanStack Query
 - DevOps: Docker Compose, GitHub Actions (CI), GitHub Projects

 ## Como rodar (Docker)
 1. Crie o `.env` na raiz a partir de `.env.example`.
 2. Suba banco e Adminer:
    ```bash
    docker compose up -d db adminer
    ```
 3. Adminer: http://localhost:8080 (Servidor: `db`, Usuário: `app`, Senha: `app`, Base: `cripto`).
 4. API: veja seção "Backend (Dia 2)" para rodar via Docker.

 ## Variáveis de ambiente
 Crie `.env` na raiz (baseado em `.env.example`):
 ```env
 # Porta da API (opcional)
 API_PORT=3333
 # URL do MySQL (padrão do docker-compose)
 DATABASE_URL="mysql://app:app@db:3306/cripto"
 ```

 ## Estrutura
 ```
 apps/
   api/   # backend (a adicionar)
   web/   # frontend (a adicionar)
 .github/
   workflows/ci.yml
   issues.json
   ruleset.json
 scripts/
   create_labels.sh
   create_issues.sh
   add_issues_to_project.sh
 ```

 ## Kanban
 - Project: Iterative Development
 - Issues criadas via `/.github/issues.json` e scripts em `scripts/`.

 ## Backend (Dia 2)
- Rodar local (dev):
  ```bash
  pnpm -C apps/api install
  pnpm -C apps/api dev
  ```
 - Healthcheck: `GET http://localhost:3001/health`
 - Docs Swagger: `http://localhost:3001/docs`
 - Prisma (DB):
   ```bash
   pnpm -C apps/api prisma:generate
   pnpm -C apps/api prisma:migrate
   pnpm -C apps/api prisma:studio
   ```
  - Rodar via Docker (sem Node local):
    ```bash
    docker compose up -d api
    # logs (Ctrl+C para sair)
    docker compose logs -f api
    ```