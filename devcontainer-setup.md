# Guia: Rodar projeto 100% em containers (Docker)

Este guia documenta como rodar o **cripto-conversor** completamente em containers, sem instalar Node.js, pnpm ou outras dependências no host. Ideal para replicar o ambiente em qualquer máquina.

## Opções

### Linux com Dev Container (No windows não é recomendado, pois é necessário configurações adicionais do WSL no docker desktop)
- **Docker + Docker Compose** instalado no host (computador que criará os containers)
- **IDE**: VS Code ou qualquer IDE que suporte Dev Containers
- **Git** para clonar o repo

### Linux ou Windows(WSL) com Docker Compose
- **Docker + Docker Compose** instalado no host (computador que criará os containers; no caso do windows é via WSL)
- **Git** para clonar o repo
- **WSL** (Windows Subsystem for Linux) para Windows

> Dica (WSL): clone o repositório dentro do filesystem do WSL (por exemplo, `~/projects/cripto-conversor`) e evite caminhos em `/mnt/*` para melhor desempenho de I/O.

## Setup inicial

### 1. Clonar o repositório
```bash
git clone https://github.com/Murilo-Carazato/cripto-conversor.git
cd cripto-conversor
```

### 2. Criar arquivo .env
Copie `.env.example` para `.env` e ajuste se necessário:

```bash
cp .env.example .env
```

> Mudou o `.env`? Recrie os serviços para aplicar as variáveis:
> ```bash
> docker compose up -d --force-recreate --no-deps api
> docker compose up -d --force-recreate --no-deps web
> ```

### Abrir no Dev Container
1. Com o projeto aberto no VS Code
2. **Ctrl+Shift+P** → "Dev Containers: Reopen in Container"
3. Aguarde o build e instalação das dependências

O Dev Container vai:
- Construir a imagem de desenvolvimento (`.devcontainer/Dockerfile`)
- Subir todos os serviços: `db`, `adminer`, `api`, `web`
- Instalar dependências automaticamente
- Instalar ferramentas de desenvolvimento (pnpm, prisma, gh CLI, etc.)
- Configurar extensões do VS Code (Prisma, ESLint, etc.)

## Acessos

Após tudo subir:
- **Frontend**: http://localhost:5173
- **API Health**: http://localhost:3001/health
- **API Docs (Swagger)**: http://localhost:3001/docs
- **Adminer** (DB admin): http://localhost:8080
  - Servidor: `db`
  - Usuário: `app`
  - Senha: `app`
  - Base de dados: `cripto`

## Comandos úteis

### No WSL2/Linux

```bash
# Ver status dos serviços
docker compose ps

# Logs em tempo real
docker compose logs -f api
docker compose logs -f web

# Parar todos os serviços
docker compose down

# Rebuild (se mudar Dockerfiles)
docker compose build --no-cache

# Rebuild dev container
docker compose -f .devcontainer/docker-compose.devcontainer.yml -f docker-compose.yml up -d --build dev

# Subir todos os serviços
docker compose up -d

# Executar comandos dentro dos containers
docker compose exec api pnpm prisma:studio
docker compose exec api pnpm prisma:migrate

docker compose exec api pnpm test
docker compose exec web pnpm test
```

### Dentro do Dev Container (VS Code)

```bash
# Prisma Studio (interface do banco)
pnpm -C apps/api prisma:studio

# Reinstalar dependências (se necessário)
pnpm -C apps/api install
pnpm -C apps/web install

# Migrations do Prisma
pnpm -C apps/api prisma:migrate

# Verificar erros de compilação
pnpm -C apps/api exec tsc -p tsconfig.json --noEmit; pnpm -C apps/web exec tsc -p tsconfig.json --noEmit
```

## Benefícios desta abordagem

✅ **Ambiente isolado**: Nada instalado no host  
✅ **Reprodutível**: Mesmo ambiente em qualquer máquina  
✅ **Completo**: DB, API, frontend e ferramentas de dev instaladas no container
✅ **Integrado**: VS Code com extensões pré-configuradas  
✅ **Persistente**: Dados do banco mantidos entre sessões  
