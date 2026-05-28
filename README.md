# To-Do List API

API REST completa para uma plataforma de gerenciamento de tarefas, construída com Node.js, TypeScript, Express, Prisma ORM e SQLite.

## Domínio

**Plataforma de Tarefas (To-do)** — sistema colaborativo de gerenciamento de projetos e tarefas, com suporte a múltiplos usuários, projetos, etiquetas e colaboradores.

## Entidades

| Entidade | Descrição |
|---|---|
| **User** | Usuário do sistema (roles: USER, ADMIN) |
| **Project** | Projeto que agrupa tarefas, com dono e colaboradores |
| **Task** | Tarefa vinculada a um projeto (status: PENDING, IN_PROGRESS, DONE) |
| **Label** | Etiqueta colorida que pode ser aplicada a tarefas |
| **ProjectCollaborator** | Relação N:N entre usuários e projetos |
| **TaskLabel** | Relação N:N entre tarefas e etiquetas |

## Stack

- **Runtime**: Node.js 20+ com TypeScript (ES Modules)
- **Framework**: Express.js
- **ORM**: Prisma 5 com SQLite (better-sqlite3)
- **Banco de dados**: SQLite
- **Autenticação**: JWT (jsonwebtoken) + bcrypt
- **Validação**: Zod
- **Testes**: Vitest + Supertest

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env

# 3. Executar migrations e criar o banco
npx prisma migrate dev

# 4. Iniciar o servidor
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.

## Variáveis de Ambiente

Veja o arquivo `.env.example`:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="troque-por-uma-chave-secreta-forte"
JWT_EXPIRES_IN="7d"
PORT=3000
```

## Rotas da API

### Autenticação

```
POST /auth/register  — Criar conta (retorna token)
POST /auth/login     — Login (retorna token)
GET  /auth/me        — Dados do usuário autenticado
```

### Usuários

```
GET    /users        — Listar todos (ADMIN)
GET    /users/:id    — Buscar por ID (autenticado)
PUT    /users/:id    — Atualizar (próprio perfil ou ADMIN)
DELETE /users/:id    — Deletar (ADMIN)
```

### Projetos

```
POST   /projects                          — Criar projeto
GET    /projects                          — Listar meus projetos
GET    /projects/:id                      — Buscar projeto (com tarefas)
PUT    /projects/:id                      — Atualizar (dono)
DELETE /projects/:id                      — Deletar (dono, soft delete)
POST   /projects/:id/collaborators        — Adicionar colaborador (dono)
DELETE /projects/:id/collaborators/:uid   — Remover colaborador (dono)
```

### Tarefas

```
POST   /projects/:projectId/tasks   — Criar tarefa no projeto
GET    /projects/:projectId/tasks   — Listar tarefas do projeto
GET    /tasks/:id                   — Buscar tarefa (com labels)
PUT    /tasks/:id                   — Atualizar (criador ou dono do projeto)
DELETE /tasks/:id                   — Deletar (criador ou dono do projeto, soft delete)
POST   /tasks/:id/labels            — Adicionar etiqueta à tarefa
DELETE /tasks/:id/labels/:labelId   — Remover etiqueta da tarefa
```

### Etiquetas

```
POST   /labels     — Criar etiqueta (ADMIN)
GET    /labels     — Listar etiquetas (autenticado)
GET    /labels/:id — Buscar etiqueta
PUT    /labels/:id — Atualizar (ADMIN)
DELETE /labels/:id — Deletar (ADMIN)
```

## Exemplos de Requisições

### Registrar usuário

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João Silva","email":"joao@email.com","password":"senha123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@email.com","password":"senha123"}'
```

### Criar projeto (com token)

```bash
curl -X POST http://localhost:3000/projects \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Meu Projeto","description":"Descrição do projeto"}'
```

### Criar tarefa

```bash
curl -X POST http://localhost:3000/projects/PROJECT_ID/tasks \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Implementar feature X","status":"PENDING"}'
```

## Rodando os Testes

```bash
# Rodar todos os testes
npm test

# Rodar com cobertura
npm run test:coverage

# Modo watch (desenvolvimento)
npm run test:watch
```

### Resultados

**87 testes** (29 unitários + 58 integração) — todos passando.

```
 ✓ tests/integration/tasks.test.ts    (12 tests)
 ✓ tests/integration/projects.test.ts (12 tests)
 ✓ tests/integration/labels.test.ts   (14 tests)
 ✓ tests/integration/users.test.ts    (10 tests)
 ✓ tests/integration/auth.test.ts     (10 tests)
 ✓ tests/unit/auth.test.ts            (10 tests)
 ✓ tests/unit/schemas.test.ts         (19 tests)

 Test Files  7 passed (7)
       Tests 87 passed (87)
```

### Relatório de Cobertura (`npm run test:coverage`)

```
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
All files          |   82.71 |    73.87 |     100 |   82.71 |
 src               |   87.87 |      100 |     100 |   87.87 |
  app.ts           |   87.87 |      100 |     100 |   87.87 |
 src/lib           |     100 |    66.66 |     100 |     100 |
  auth.ts          |     100 |    66.66 |     100 |     100 |
  prisma.ts        |     100 |      100 |     100 |     100 |
 src/middlewares   |   95.16 |    93.33 |     100 |   95.16 |
  authenticate.ts  |     100 |      100 |     100 |     100 |
  authorize.ts     |   82.35 |    83.33 |     100 |   82.35 |
  validate.ts      |     100 |      100 |     100 |     100 |
 src/routes        |   78.59 |    70.78 |     100 |   78.59 |
  auth.ts          |   95.08 |     87.5 |     100 |   95.08 |
  labels.ts        |   96.47 |    91.66 |     100 |   96.47 |
  projects.ts      |   77.77 |    68.18 |     100 |   77.77 |
  tasks.ts         |   66.66 |    59.37 |     100 |   66.66 |
  users.ts         |   86.74 |    73.33 |     100 |   86.74 |
 src/schemas       |     100 |      100 |     100 |     100 |
  auth.schema.ts   |     100 |      100 |     100 |     100 |
  label.schema.ts  |     100 |      100 |     100 |     100 |
  project.schema.ts|     100 |      100 |     100 |     100 |
  task.schema.ts   |     100 |      100 |     100 |     100 |
  user.schema.ts   |     100 |      100 |     100 |     100 |
-------------------|---------|----------|---------|---------|
```

Mínimo exigido: **70% linhas e funções** ✓  
Resultado: **82.71% linhas** | **100% funções**

## Regras de Autorização

| Operação | Regra |
|---|---|
| `GET /users` | ADMIN only |
| `DELETE /users/:id` | ADMIN only |
| `POST /labels` | ADMIN only |
| `PUT/DELETE /labels/:id` | ADMIN only |
| `PUT/DELETE /projects/:id` | Dono do projeto |
| `POST /projects/:id/collaborators` | Dono do projeto |
| `PUT/DELETE /tasks/:id` | Criador da tarefa ou dono do projeto |

## Pontos Extras Implementados

- **Soft delete** em projetos e tarefas (`deletedAt`)
- **Filtro por status** em `GET /projects/:projectId/tasks?status=PENDING`
- **Colaboradores em projetos** (gerenciamento completo)
- **Etiquetas em tarefas** (relação N:N)
