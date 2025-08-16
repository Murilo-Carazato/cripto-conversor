Como mudar o banco daqui pra frente
Segue o fluxo recomendado usando Prisma + Docker Compose (rodando no host).

1) Edite o schema
Arquivo: 
apps/api/prisma/schema.prisma
Ex.: adicionar campo, índice, relação, @map para renomear coluna, etc.
2) Gere e aplique uma nova migration (dev)
Opcional: parar a API para evitar concorrência:
bash
docker compose stop api
Criar e aplicar migration + atualizar o DB:
bash
docker compose run --rm api pnpm exec prisma migrate dev -n <nome_da_mudanca>
Verificar status:
bash
docker compose run --rm api pnpm exec prisma migrate status
(Opcional) Gerar client explicitamente:
bash
docker compose run --rm api pnpm exec prisma generate
Subir API e ver logs:
bash
docker compose up -d api
docker compose logs -f api
3) Commitar
Sempre commite:
apps/api/prisma/schema.prisma
apps/api/prisma/migrations/**
Observação: o serviço 
api
 no 
docker-compose.yml
 já roda pnpm prisma:migrate:deploy ao iniciar. Então, em outros ambientes, só de subir a API as migrations pendentes são aplicadas.
Quando há dados existentes ou FKs (evitar quebras)
Padrão seguro (duas fases):
Crie coluna/tabela novas como opcionais/sem FK.
Faça backfill (via SQL no arquivo da migration).
Torne obrigatório/adicione FK depois.
Gerar migration sem aplicar, para editar o SQL:
bash
docker compose run --rm api pnpm exec prisma migrate dev --create-only -n <nome>
Edite o SQL: apps/api/prisma/migrations/<timestamp>_<nome>/migration.sql
Ordem segura típica:
CREATE TABLE/ADD COLUMN
Backfill (ex.: INSERT ... SELECT DISTINCT ...)
ADD FOREIGN KEY / SET NOT NULL
Aplique:
bash
docker compose run --rm api pnpm exec prisma migrate deploy
Se a migration falhar no meio
Corrija o problema (ex.: backfill) e marque como aplicada:
bash
docker compose run --rm api pnpm exec prisma migrate resolve --applied <pasta_da_migration>
Então rode migrate deploy ou suba a API.
Alterações destrutivas (dropar/renomear)
Renomear coluna/tabela: use @map (campo) ou @@map (tabela) para manter coluna/mesa antiga no DB e mudar só o nome no Prisma; depois uma migration para materializar a mudança se necessário.
Tornar campo obrigatório: primeiro crie como opcional com default, faça backfill, depois torne obrigatório em nova migration.
Reset completo (apenas DEV):
bash
docker compose run --rm api pnpm exec prisma migrate reset --force
Isso DROPPA e recria o DB com todas as migrations. Não use em prod.
Dicas finais
.env na raiz já está correto para o Compose.
Adminer em http://localhost:8080 ajuda a conferir tabelas/constraints.
Evite prisma db push em time/prod; prefira sempre migrations.