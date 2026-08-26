# VarejoOS

Plataforma SaaS multi-tenant para restaurantes, bares, adegas e varejo.

## Stack

- **Web/PDV:** Next.js 15, React 19 e Tailwind CSS
- **API:** NestJS 11 com REST, OpenAPI e validação
- **Dados:** PostgreSQL 16, Prisma e Row-Level Security (RLS)
- **Assíncrono:** Redis e BullMQ
- **Arquivos:** S3/MinIO para XML, DANFE e anexos
- **Observabilidade:** OpenTelemetry, métricas, logs JSON e health checks

## Estrutura

```text
apps/
  api/       API e regras de negócio
  web/       administração, retaguarda e PDV
packages/
  database/  schema Prisma, migrations e client
  contracts/ contratos compartilhados
docs/        arquitetura e decisões
infra/       ambiente local
```

## Começando

1. Copie `.env.example` para `.env`.
2. Inicie PostgreSQL, Redis e MinIO: `docker compose -f infra/docker-compose.yml up -d`.
3. Execute `corepack pnpm install`.
4. Execute `corepack pnpm db:generate && corepack pnpm db:migrate`.
5. Aplique as políticas: `psql "$DATABASE_URL" -f packages/database/prisma/rls.sql`.
6. Execute `corepack pnpm dev`.

API: `http://localhost:3001/api`  
Painel: `http://localhost:3000`

## Demonstração sem PostgreSQL

Enquanto a infraestrutura local não estiver instalada, a API usa um armazenamento de
demonstração persistente em `storage/demo-data.json`. Ele permite testar login, sessão,
tenant, usuários, filial, produtos, estoque e vendas no PDV.

- E-mail: `admin@demo.com`
- Senha: `Demo@123`

No modo de demonstração, ajustes de estoque criam movimentos imutáveis e cada venda paga
gera um pedido e uma saída de estoque. Os indicadores da página inicial são calculados a
partir dessas operações.

Para evitar conflito com outros projetos locais, execute o painel em `3100` e a API em
`3101`. Esse modo é apenas para desenvolvimento; produção continuará usando PostgreSQL,
RLS, cofre de segredos e tokens/sessões reforçados.

## Regras de isolamento

Toda tabela de negócio contém `tenant_id`. A API obtém o tenant da sessão autenticada,
abre uma transação e define `app.tenant_id`; o PostgreSQL aplica RLS. Nunca se aceita o
tenant enviado pelo corpo da requisição. Operações da plataforma usam uma conexão e uma
permissão administrativa separadas.

Leia [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) antes de implementar novos módulos.
