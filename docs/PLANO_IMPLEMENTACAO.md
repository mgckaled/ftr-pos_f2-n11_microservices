<!-- markdownlint-disable -->

# Plano de Implementação - Projeto Prático de Microsserviços

## Resumo Executivo

Projeto prático didático implementando arquitetura de microsserviços com 4 serviços (Auth, Orders, Inventory, Analytics) focado em demonstrar pragmaticamente os conceitos fundamentais das 10 aulas. Sistema simula plataforma de gerenciamento de pedidos utilizando comunicação síncrona HTTP/REST e assíncrona via Apache Kafka, com ênfase em Saga Pattern para transações distribuídas, autenticação JWT com RS256/JWKS, e persistência distribuída via Database per Service.

## Stack Tecnológica

- Node.js v22 + TypeScript
- NestJS (framework)
- pnpm workspaces (monorepo)
- PostgreSQL (Database per Service - 4 instâncias)
- Apache Kafka + Zookeeper (comunicação assíncrona)
- Redis (cache e idempotência)
- Zod (validação)
- Scalar (documentação OpenAPI)
- Docker Compose (orquestração)

## Escopo Reduzido - Decisões Arquiteturais

### Incluído

- 4 microsserviços: Auth, Orders, Inventory, Analytics
- Saga Pattern com orchestrator
- JWT RS256 + JWKS
- Kafka + HTTP/REST
- Idempotência básica
- CQRS com View Tables
- Docker Compose

### Não Incluído (simplificação)

- Kubernetes
- Kong Gateway
- OpenTelemetry/Jaeger
- gRPC
- Event Sourcing completo
- BFF separado

## Estrutura do Monorepo

```txt
microservices-practical/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── docker-compose.yml
├── .env.example
├── README.md
│
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   └── jwks/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── orders-service/
│   │   ├── src/
│   │   │   ├── orders/
│   │   │   ├── saga/
│   │   │   └── kafka/
│   │   └── package.json
│   │
│   ├── inventory-service/
│   │   ├── src/
│   │   │   ├── inventory/
│   │   │   ├── reservations/
│   │   │   └── kafka/
│   │   └── package.json
│   │
│   └── analytics-service/
│       ├── src/
│       │   ├── analytics/
│       │   ├── projections/
│       │   └── kafka/
│       └── package.json
│
└── packages/
    ├── shared-types/
    ├── common-utils/
    └── validation-schemas/
```

## Microsserviços Detalhados

### 1. Auth Service (Porta 3000)

#### Responsabilidades

- Registro e autenticação de usuários
- Geração de JWT com RS256
- JWKS endpoint para chaves públicas

#### Schema PostgreSQL

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Endpoints

```
POST /auth/register
POST /auth/login
GET /.well-known/jwks.json
```

#### Tecnologias Específicas

- Argon2 (hashing de senhas)
- jsonwebtoken (JWT RS256)
- jwks-rsa (publicação de chaves)

### 2. Orders Service (Porta 3001)

#### Responsabilidades

- Criação e gestão de pedidos
- Orchestrator de Saga Pattern
- Publicação de eventos Kafka
- Coordenação de transações distribuídas

#### Schema PostgreSQL

```sql
CREATE TABLE orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE saga_instances (
  saga_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(order_id),
  saga_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_step INTEGER DEFAULT 0,
  payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE saga_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saga_id UUID NOT NULL REFERENCES saga_instances(saga_id),
  step_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  executed_at TIMESTAMP DEFAULT NOW(),
  error_message TEXT
);

CREATE TABLE processed_events (
  event_id VARCHAR(255) PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT NOW(),
  consumer_name VARCHAR(100) NOT NULL
);
```

#### Endpoints

```
POST /orders
GET /orders/:orderId
GET /orders/user/:userId
DELETE /orders/:orderId
```

#### Eventos Kafka Produzidos

```
orders.created
orders.confirmed
orders.cancelled
```

#### Saga Pattern - CreateOrderSaga

```typescript
CreateOrderSaga {
  steps: [
    {
      name: 'reserve-inventory',
      action: async () => {
        // HTTP POST /inventory/reserve
      },
      compensation: async () => {
        // HTTP POST /inventory/release
      }
    },
    {
      name: 'confirm-order',
      action: async () => {
        // Update order status
        // Publish OrderConfirmed
      },
      compensation: async () => {
        // Update order to CANCELLED
        // Publish OrderCancelled
      }
    }
  ]
}
```

### 3. Inventory Service (Porta 3002)

#### Responsabilidades

- Gerenciamento de estoque
- Reserva temporária de produtos
- Liberação e commit de reservas
- Consumo de eventos de pedidos

#### Schema PostgreSQL

```sql
CREATE TABLE products (
  product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory_reservations (
  reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(product_id),
  quantity INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE processed_events (
  event_id VARCHAR(255) PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT NOW(),
  consumer_name VARCHAR(100) NOT NULL
);
```

#### Endpoints

```
GET /inventory/products
GET /inventory/products/:productId
POST /inventory/reserve
POST /inventory/release
POST /inventory/commit
```

#### Eventos Kafka Consumidos

```
orders.confirmed
orders.cancelled
```

### 4. Analytics Service (Porta 3003)

#### Responsabilidades

- Agregação de dados distribuídos
- View Tables desnormalizadas (CQRS)
- Projeções de eventos
- Queries analíticas

#### Schema PostgreSQL

```sql
CREATE TABLE orders_analytics_view (
  order_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  items_count INTEGER NOT NULL,
  items_detail JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL,
  confirmed_at TIMESTAMP,
  cancelled_at TIMESTAMP
);

CREATE TABLE daily_sales_summary (
  date DATE PRIMARY KEY,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
  avg_order_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE processed_events (
  event_id VARCHAR(255) PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT NOW(),
  consumer_name VARCHAR(100) NOT NULL
);
```

#### Endpoints

```
GET /analytics/orders
GET /analytics/sales-summary
GET /analytics/user-stats/:userId
```

#### Eventos Kafka Consumidos

```
orders.created
orders.confirmed
orders.cancelled
```

## Docker Compose

### Serviços de Infraestrutura

```yaml
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ports:
      - "9092:9092"

  auth-db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"

  orders-db:
    image: postgres:16-alpine
    ports:
      - "5433:5432"

  inventory-db:
    image: postgres:16-alpine
    ports:
      - "5434:5432"

  analytics-db:
    image: postgres:16-alpine
    ports:
      - "5435:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### Serviços de Aplicação

```yaml
  auth-service:
    build: ./services/auth-service
    ports:
      - "3000:3000"
    depends_on:
      - auth-db

  orders-service:
    build: ./services/orders-service
    ports:
      - "3001:3001"
    depends_on:
      - orders-db
      - kafka
      - redis
      - auth-service
      - inventory-service

  inventory-service:
    build: ./services/inventory-service
    ports:
      - "3002:3002"
    depends_on:
      - inventory-db
      - kafka
      - redis
      - auth-service

  analytics-service:
    build: ./services/analytics-service
    ports:
      - "3003:3003"
    depends_on:
      - analytics-db
      - kafka
      - redis
      - auth-service
```

## Fases de Implementação

### Fase 1: Fundação e Infraestrutura (Semanas 1-2)

#### Objetivos

Estabelecer estrutura base do monorepo, configurar infraestrutura com Docker Compose, implementar Auth Service completo.

#### Tarefas

1. Setup do Monorepo
   - Criar estrutura de diretórios
   - Configurar pnpm-workspace.yaml
   - Setup root package.json com scripts
   - Configurar tsconfig.json compartilhado
   - Configurar ESLint e Prettier

2. Infraestrutura Docker
   - Criar docker-compose.yml completo
   - 4 instâncias PostgreSQL
   - Kafka + Zookeeper
   - Redis
   - Testar: `docker-compose up -d`

3. Pacotes Compartilhados
   - @packages/shared-types
   - @packages/common-utils
   - @packages/validation-schemas

4. Auth Service Completo
   - Setup NestJS + TypeORM
   - Gerar chaves RSA (script)
   - Implementar POST /auth/register (Argon2)
   - Implementar POST /auth/login (JWT RS256)
   - Implementar GET /.well-known/jwks.json
   - Configurar Scalar
   - Migrations PostgreSQL
   - Testes unitários

#### Entregáveis

- Monorepo funcional
- Docker Compose operacional
- Auth Service com JWT RS256 e JWKS
- Documentação Scalar: http://localhost:3000/docs

#### Conceitos Abordados

- Aula 1: Arquitetura de microsserviços
- Aula 4: Autenticação JWT RS256 + JWKS

### Fase 2: Orders e Inventory - Comunicação Básica (Semanas 3-4)

#### Objetivos

Implementar Orders Service e Inventory Service com comunicação HTTP e Kafka, sem Saga Pattern ainda.

#### Tarefas

1. Orders Service Base
   - Setup NestJS + TypeORM
   - Migrations (orders, processed_events)
   - Implementar POST /orders (versão simples)
   - Implementar GET /orders/:orderId
   - Implementar GET /orders/user/:userId
   - Configurar JWT Strategy (JWKS)
   - Aplicar JwtAuthGuard

2. Inventory Service Base
   - Setup NestJS + TypeORM
   - Migrations (products, inventory_reservations)
   - Seed com 10 produtos
   - Implementar GET /inventory/products
   - Implementar POST /inventory/reserve
   - Implementar POST /inventory/release
   - Configurar JWT Strategy

3. Kafka Setup
   - Criar tópicos via script
   - Configurar KafkaJS em ambos serviços

4. Integração HTTP Orders → Inventory
   - Orders chama POST /inventory/reserve
   - Fluxo básico de criação de pedido

5. Idempotência Básica
   - Tabela processed_events
   - Verificação antes de processar eventos

#### Entregáveis

- Orders Service operacional
- Inventory Service operacional
- Comunicação HTTP funcionando
- Eventos Kafka publicados/consumidos
- Idempotência básica

#### Conceitos Abordados

- Aula 2: Comunicação HTTP e Kafka
- Aula 3: Database per Service, Soft References
- Aula 7: Idempotência básica

### Fase 3: Saga Pattern e Transações Distribuídas (Semanas 5-6)

#### Objetivos

Refatorar Orders Service para implementar Saga Pattern com orchestrator e compensações automáticas.

#### Tarefas

1. Saga Infrastructure
   - Migrations: saga_instances, saga_step_executions
   - Criar SagaOrchestrator genérico
   - Interface SagaDefinition
   - Implementar executeSaga()
   - Implementar compensate()

2. CreateOrderSaga Implementation
   - Definir CreateOrderSaga com 2 steps
   - Integrar no OrdersService.createOrder()
   - Persistir estado de saga
   - Registrar execução de steps

3. Compensações
   - compensate reserve-inventory
   - compensate confirm-order
   - Publicar OrderCancelled

4. Testes de Falhas
   - Simular estoque indisponível
   - Verificar compensações executadas
   - Simular erro após reserva
   - Verificar liberação de reservas

5. Observabilidade
   - Logs estruturados com correlationId
   - Dashboard de sagas (opcional)

#### Entregáveis

- Saga Pattern com orchestrator
- Transações distribuídas coordenadas
- Compensações automáticas
- Logs com correlationId

#### Conceitos Abordados

- Aula 8: Saga Pattern
- Aula 6: Observabilidade (correlationId)

### Fase 4: Analytics Service e CQRS (Semanas 7-8)

#### Objetivos

Implementar Analytics Service com View Tables desnormalizadas (CQRS).

#### Tarefas

1. Analytics Service Setup
   - Setup NestJS + TypeORM
   - Migrations (view tables)
   - Configurar JWT Strategy
   - Configurar KafkaJS consumer

2. Kafka Consumers
   - Consumer para orders.created
   - Consumer para orders.confirmed
   - Consumer para orders.cancelled
   - Idempotência

3. Projeções Materializadas
   - OrdersAnalyticsProjection
   - handleOrderCreated
   - handleOrderConfirmed
   - handleOrderCancelled
   - Atualizar daily_sales_summary

4. Endpoints REST
   - GET /analytics/orders
   - GET /analytics/sales-summary
   - GET /analytics/user-stats/:userId
   - Cache Redis

5. Soft References
   - Duplicar userEmail, productName
   - Demonstrar trade-off

#### Entregáveis

- Analytics Service operacional
- CQRS demonstrado
- Projeções assíncronas
- Queries sem joins distribuídos

#### Conceitos Abordados

- Aula 10: CQRS com View Tables
- Aula 3: Soft References, duplicação controlada
- Aula 9: Agregação de dados (conceitual)

## Dependências pnpm

### Auth Service

```bash
# Dependencies
pnpm add @nestjs/common @nestjs/core @nestjs/platform-express
pnpm add @nestjs/typeorm typeorm pg
pnpm add @nestjs/passport passport passport-jwt
pnpm add @nestjs/jwt jsonwebtoken jwks-rsa
pnpm add argon2
pnpm add zod
pnpm add class-validator class-transformer
pnpm add @scalar/nestjs-api-reference

# DevDependencies
pnpm add -D @nestjs/cli @nestjs/schematics
pnpm add -D @types/node @types/express @types/passport-jwt
pnpm add -D typescript ts-node
pnpm add -D prettier eslint
```

### Orders, Inventory, Analytics

```bash
# Adicionar ao Auth Service base:
pnpm add kafkajs
pnpm add axios
pnpm add ioredis
pnpm add uuid
```

### Pacotes Compartilhados

```bash
# @packages/shared-types
pnpm add zod
pnpm add -D typescript

# @packages/common-utils
pnpm add winston
pnpm add uuid
pnpm add -D typescript

# @packages/validation-schemas
pnpm add zod
pnpm add -D typescript
```

## Scripts Principais

```json
{
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "format": "pnpm -r format",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  }
}
```

## Conceitos das 10 Aulas Mapeados

### Implementados

- Aula 1: Arquitetura de microsserviços, Database per Service
- Aula 2: Comunicação HTTP/REST e Kafka
- Aula 3: Persistência distribuída, Soft References, duplicação controlada
- Aula 4: Autenticação JWT RS256 + JWKS
- Aula 7: Idempotência básica
- Aula 8: Saga Pattern com orchestrator
- Aula 10: CQRS com View Tables

### Conceituais (não implementados)

- Aula 5: API Gateway (sem Kong)
- Aula 6: Tracing distribuído (apenas correlationId)
- Aula 9: BFF (sem serviço separado)
- Aula 10: Event Sourcing completo (apenas eventos Kafka)

## Fluxo de Criação de Pedido

```
1. Cliente POST /orders (JWT token)
2. Orders Service: cria order (PENDING)
3. Orders Service: inicia CreateOrderSaga
4. Saga Step 1: HTTP POST /inventory/reserve
5. Inventory Service: valida disponibilidade
   - Se OK: cria reservas temporárias
   - Se FALHA: retorna erro
6. Se reserva OK:
   - Saga Step 2: atualiza order (CONFIRMED)
   - Publica OrderConfirmed no Kafka
   - Inventory consome evento e debita estoque
   - Analytics consome evento e atualiza view
7. Se reserva FALHA:
   - Saga executa compensações
   - Atualiza order (CANCELLED)
   - Publica OrderCancelled
```

## Próximos Passos Após Fase 4

1. Documentação final completa
2. Testes de integração
3. Video demonstração
4. Postman Collection
5. Apresentação com slides

## Trade-offs e Justificativas

### Por que NÃO incluir?

- Kubernetes: complexidade vs benefício para projeto didático
- Kong Gateway: adiciona camada desnecessária para 4 serviços
- OpenTelemetry: correlationId suficiente para demonstrar conceito
- gRPC: HTTP/REST mais familiar e simples
- Event Sourcing completo: overhead de implementação alto

### Benefícios do Escopo Reduzido

- Executável em laptop comum (8GB RAM)
- Setup rápido com Docker Compose
- Foco nos conceitos essenciais
- Tempo realista: 4-6 semanas
- Código didático e limpo

## Arquivos Críticos para Referência

- `.github/docs/project/PLANNING.md` - Projeto original com 7 serviços
- `.github/docs/content/a8.md` - Saga Pattern detalhado
- `.github/docs/content/a4.md` - JWT RS256 + JWKS
- `.github/docs/content/a3.md` - Persistência distribuída
- `README.md` - Resumo das 10 aulas
