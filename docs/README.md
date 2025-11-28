<!-- markdownlint-disable -->

# Distributed Order Platform - Documentação Técnica

## Visão Geral

Projeto prático implementando arquitetura de microsserviços distribuída com quatro serviços de domínio independentes coordenados por API Gateway centralizado. Sistema demonstra padrões fundamentais de sistemas distribuídos aplicados a plataforma de gerenciamento de pedidos, incluindo Saga Pattern para transações distribuídas, autenticação JWT com JWKS, CQRS com View Tables, idempotência e comunicação assíncrona via Apache Kafka.

## Stack Tecnológica

### Runtime e Linguagem
- Node.js v22.16.0
- TypeScript 5.9.3
- pnpm 10.23.0 (workspaces + catalogs)

### Framework e Bibliotecas
- NestJS 11.1.9 (framework modular enterprise-grade)
- TypeORM 0.3.27 (ORM para PostgreSQL)
- Zod 4.1.13 (validação tipada)
- Argon2 0.44.0 (hashing de senhas)
- Winston 3.18.3 (logging estruturado)

### Infraestrutura
- PostgreSQL 16 Alpine (4 instâncias isoladas)
- Apache Kafka 3.6 + Zookeeper (comunicação assíncrona)
- Redis 7 Alpine (cache e idempotência)
- Docker Compose (orquestração local)

### Comunicação
- HTTP/REST (comunicação síncrona)
- Apache Kafka via KafkaJS (eventos assíncronos)
- Scalar (documentação OpenAPI moderna)

## Arquitetura de Serviços

### 1. Auth Service (Porta 3000)

**Responsabilidades:**
- Registro de usuários com hashing Argon2
- Autenticação mediante credenciais
- Geração de JWT assinados com RS256
- Publicação de chaves públicas via JWKS

**Tecnologias Específicas:**
- jsonwebtoken (geração e assinatura)
- jwks-rsa (publicação de chaves)
- Passport JWT Strategy

**Endpoints:**
- `POST /auth/register` - Registro de novo usuário
- `POST /auth/login` - Autenticação e geração de token
- `GET /.well-known/jwks.json` - Chaves públicas JWKS

**Banco de Dados:**
- PostgreSQL na porta 5432 (auth-db)
- Tabela users com email único e password_hash

### 2. Orders Service (Porta 3001)

**Responsabilidades:**
- Criação e gerenciamento de pedidos
- Orchestrator de Saga Pattern
- Coordenação de transações distribuídas
- Compensações automáticas mediante falhas

**Tecnologias Específicas:**
- Saga Orchestrator customizado
- KafkaJS Producer idempotente
- Redis para deduplicação

**Endpoints:**
- `POST /orders` - Criar novo pedido (autenticado)
- `GET /orders/:orderId` - Consultar pedido específico
- `GET /orders/user/:userId` - Listar pedidos do usuário
- `DELETE /orders/:orderId` - Cancelar pedido

**Banco de Dados:**
- PostgreSQL na porta 5433 (orders-db)
- Tabelas: orders, saga_instances, saga_step_executions, processed_events

**Eventos Kafka Produzidos:**
- `orders.created` - Pedido criado com status PENDING
- `orders.confirmed` - Pedido confirmado após reserva de inventário
- `orders.cancelled` - Pedido cancelado por falha ou requisição

**Saga Pattern - CreateOrderSaga:**
```typescript
CreateOrderSaga {
  steps: [
    {
      name: 'reserve-inventory',
      action: () => POST /inventory/reserve,
      compensation: () => POST /inventory/release
    },
    {
      name: 'confirm-order',
      action: () => UPDATE orders SET status='CONFIRMED',
      compensation: () => UPDATE orders SET status='CANCELLED'
    }
  ]
}
```

### 3. Inventory Service (Porta 3002)

**Responsabilidades:**
- Gerenciamento de estoque de produtos
- Reservas temporárias durante processamento de pedido
- Commit de reservas após confirmação
- Liberação de reservas mediante cancelamento

**Tecnologias Específicas:**
- KafkaJS Consumer
- Job scheduling para expiração de reservas

**Endpoints:**
- `GET /inventory/products` - Listar produtos disponíveis
- `GET /inventory/products/:productId` - Consultar produto específico
- `POST /inventory/reserve` - Reservar produtos temporariamente
- `POST /inventory/release` - Liberar reserva específica
- `POST /inventory/commit` - Efetivar reserva permanentemente

**Banco de Dados:**
- PostgreSQL na porta 5434 (inventory-db)
- Tabelas: products, inventory_reservations, processed_events

**Eventos Kafka Consumidos:**
- `orders.confirmed` - Debita estoque definitivamente
- `orders.cancelled` - Libera reservas associadas

### 4. Analytics Service (Porta 3003)

**Responsabilidades:**
- Agregação de dados distribuídos (CQRS)
- View Tables desnormalizadas
- Projeções materializadas de eventos
- Queries analíticas sem joins distribuídos

**Tecnologias Específicas:**
- KafkaJS Consumer com múltiplos grupos
- Redis para cache de agregações

**Endpoints:**
- `GET /analytics/orders` - Listar pedidos agregados com detalhes
- `GET /analytics/sales-summary` - Resumo de vendas por período
- `GET /analytics/user-stats/:userId` - Estatísticas de usuário

**Banco de Dados:**
- PostgreSQL na porta 5435 (analytics-db)
- Tabelas: orders_analytics_view, daily_sales_summary, processed_events

**Eventos Kafka Consumidos:**
- `orders.created` - Insere registro inicial na view
- `orders.confirmed` - Atualiza status e métricas de vendas
- `orders.cancelled` - Atualiza status sem contabilizar vendas

**Padrão CQRS:**
- Write Model: Orders Service com tabela orders normalizada
- Read Model: Analytics Service com orders_analytics_view desnormalizada
- Sincronização: Eventos Kafka propagando mudanças de estado

### 5. API Gateway (Porta 4000)

**Responsabilidades:**
- Ponto de entrada único centralizado
- Proxy HTTP para microsserviços
- Documentação Scalar agregada
- Tratamento de erros críticos (502, 401, 403)

**Tecnologias Específicas:**
- http-proxy-middleware 3.0.0
- NestJS Exception Filters

**Roteamento:**
- `/auth/*` → Auth Service (porta 3000)
- `/orders/*` → Orders Service (porta 3001)
- `/inventory/*` → Inventory Service (porta 3002)
- `/analytics/*` → Analytics Service (porta 3003)

**Documentação:**
- `GET /reference` - Scalar UI com OpenAPI spec agregada

## Padrões Arquiteturais Implementados

### Database per Service

Cada microsserviço possui controle exclusivo sobre armazenamento de dados mediante instância PostgreSQL isolada, garantindo autonomia operacional completa e permitindo escolha de tecnologias heterogêneas otimizadas por contexto.

### Saga Pattern (Orchestration)

Orders Service atua como orchestrator coordenando transações distribuídas através de sequência de etapas com ações e compensações semânticas. Cada saga rastreia estado de execução em tabela saga_instances, registrando sucesso ou falha de steps em saga_step_executions. Mediante falhas, compensações são executadas em ordem reversa restaurando consistência do sistema.

### CQRS (Command Query Responsibility Segregation)

Separação entre modelos de escrita e leitura onde Orders Service mantém dados transacionais normalizados processando comandos, enquanto Analytics Service consome eventos Kafka atualizando View Tables desnormalizadas otimizadas para consultas agregadas sem joins distribuídos.

### Idempotência

Garantia de processamento único mediante tabela processed_events em cada serviço consumidor Kafka. Antes de processar mensagem, verifica-se existência de event_id único. Se presente, descarta-se silenciosamente mensagem duplicada. Se ausente, processa-se e registra-se event_id prevenindo duplicação de operações críticas.

### Soft References

Referências entre entidades de serviços distintos sem constraints de integridade relacional. Analytics Service armazena user_email duplicado ao invés de foreign key para users, aceitando consistência eventual mediante sincronização por eventos.

### Autenticação JWT com JWKS

Auth Service gera tokens JWT assinados com algoritmo assimétrico RS256 utilizando chave privada protegida. Serviços consumidores validam tokens consultando endpoint JWKS que expõe chave pública, eliminando necessidade de compartilhamento de segredos e simplificando rotação de chaves.

### Observabilidade com Correlation IDs

Headers X-Correlation-ID propagados através de requisições HTTP e metadados de mensagens Kafka rastreando fluxo end-to-end em sistema distribuído. Logs estruturados via Winston injetam correlation_id facilitando debugging de transações distribuídas.

## Fluxo de Criação de Pedido

```
1. Cliente autentica via POST /auth/login obtendo JWT
2. Cliente envia POST /orders com Authorization: Bearer <token>
3. Orders Service valida JWT via JWKS
4. Orders Service cria order com status PENDING
5. Orders Service inicia CreateOrderSaga
6. Saga Step 1: HTTP POST /inventory/reserve
   - Inventory Service valida disponibilidade de produtos
   - Se OK: cria reservas temporárias com expires_at
   - Se FALHA: retorna erro 400
7. Se reserva bem-sucedida:
   - Saga Step 2: atualiza order para CONFIRMED
   - Publica evento orders.confirmed no Kafka
   - Inventory Consumer consome evento e debita estoque definitivamente
   - Analytics Consumer consome evento e atualiza orders_analytics_view
8. Se reserva falhou:
   - Saga executa compensações em ordem reversa
   - Atualiza order para CANCELLED
   - Publica evento orders.cancelled
   - Retorna erro 400 ao cliente
```

## Comandos Importantes

### Setup Inicial

```bash
# Clonar repositório
git clone <repository-url>
cd f2_n11_microservices

# Instalar dependências
pnpm install

# Gerar chaves JWT RSA
node scripts/generate-jwt-keys.js

# Copiar arquivos de ambiente
cp .env.example .env
```

### Desenvolvimento Local (Híbrido)

```bash
# Subir apenas infraestrutura
docker-compose up -d zookeeper kafka auth-db orders-db inventory-db analytics-db redis

# Executar serviços localmente com hot reload
pnpm dev

# Logs de serviços específicos
docker-compose logs -f kafka
```

### Full Docker

```bash
# Build e iniciar toda a stack
docker-compose up -d --build

# Ver logs de todos serviços
docker-compose logs -f

# Ver status dos containers
docker-compose ps

# Parar todos serviços
docker-compose down

# Remover volumes (CUIDADO: remove dados)
docker-compose down -v
```

### Gerenciamento de Dependências

```bash
# Instalar nova dependência em serviço específico
pnpm --filter auth-service add <package>

# Atualizar dependência no catalog
# 1. Editar pnpm-workspace.yaml
# 2. Executar:
pnpm install

# Verificar versões instaladas
pnpm list --depth=0
```

### Kafka

```bash
# Listar consumer groups
docker exec f2_n11_microservices-kafka-1 kafka-consumer-groups \
  --bootstrap-server localhost:9092 --list

# Descrever consumer group específico
docker exec f2_n11_microservices-kafka-1 kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --group inventory-service-group \
  --describe

# Listar tópicos
docker exec f2_n11_microservices-kafka-1 kafka-topics \
  --bootstrap-server localhost:9092 --list

# Consumir mensagens de tópico
docker exec f2_n11_microservices-kafka-1 kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic orders.created \
  --from-beginning
```

### PostgreSQL

```bash
# Conectar ao banco de dados
docker exec -it f2_n11_microservices-auth-db-1 psql -U postgres -d auth

# Executar query direta
docker exec f2_n11_microservices-orders-db-1 psql -U postgres -d orders \
  -c "SELECT * FROM orders LIMIT 10;"

# Backup de banco de dados
docker exec f2_n11_microservices-auth-db-1 pg_dump -U postgres auth > backup.sql
```

## Utilizando a API

### 1. Registro de Usuário

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "SenhaSegura123!",
    "name": "João Silva"
  }'
```

**Resposta:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@example.com",
  "name": "João Silva",
  "created_at": "2025-11-28T00:00:00.000Z"
}
```

### 2. Login e Obtenção de Token

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "SenhaSegura123!"
  }'
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Consultar Produtos Disponíveis

```bash
TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:4000/inventory/products \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta:**
```json
[
  {
    "product_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Notebook Dell XPS 15",
    "price": 8999.90,
    "available_quantity": 50
  }
]
```

### 4. Criar Pedido

```bash
curl -X POST http://localhost:4000/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product_id": "123e4567-e89b-12d3-a456-426614174000",
        "quantity": 2
      }
    ]
  }'
```

**Resposta (Sucesso):**
```json
{
  "order_id": "789e0123-e45b-67d8-a901-234567890123",
  "status": "CONFIRMED",
  "total_amount": 17999.80,
  "created_at": "2025-11-28T00:05:00.000Z"
}
```

**Resposta (Falha - Estoque Insuficiente):**
```json
{
  "statusCode": 400,
  "message": "Insufficient inventory for product 123e4567-e89b-12d3-a456-426614174000",
  "error": "Bad Request"
}
```

### 5. Consultar Pedido Específico

```bash
curl -X GET http://localhost:4000/orders/789e0123-e45b-67d8-a901-234567890123 \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta:**
```json
{
  "order_id": "789e0123-e45b-67d8-a901-234567890123",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "CONFIRMED",
  "total_amount": 17999.80,
  "items": [
    {
      "product_id": "123e4567-e89b-12d3-a456-426614174000",
      "quantity": 2,
      "unit_price": 8999.90
    }
  ],
  "created_at": "2025-11-28T00:05:00.000Z"
}
```

### 6. Consultar Dados Analíticos

```bash
curl -X GET http://localhost:4000/analytics/sales-summary \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta:**
```json
[
  {
    "date": "2025-11-28",
    "total_orders": 15,
    "total_revenue": 145000.50,
    "avg_order_value": 9666.70
  }
]
```

## Documentação Interativa

### Scalar UI

Acesse a documentação interativa completa com todas as APIs:

```
http://localhost:4000/reference
```

Interface moderna substituindo Swagger UI com:
- Exploração de todos endpoints agregados
- Schemas de request/response com validação Zod
- Try-it-out com autenticação JWT integrada
- Exemplos de código em múltiplas linguagens

## Estrutura de Portas

| Serviço | Porta | URL Local |
|---------|-------|-----------|
| API Gateway | 4000 | http://localhost:4000 |
| Auth Service | 3000 | http://localhost:3000 |
| Orders Service | 3001 | http://localhost:3001 |
| Inventory Service | 3002 | http://localhost:3002 |
| Analytics Service | 3003 | http://localhost:3003 |
| Auth DB (PostgreSQL) | 5432 | localhost:5432 |
| Orders DB (PostgreSQL) | 5433 | localhost:5433 |
| Inventory DB (PostgreSQL) | 5434 | localhost:5434 |
| Analytics DB (PostgreSQL) | 5435 | localhost:5435 |
| Kafka | 9092 | localhost:9092 |
| Redis | 6379 | localhost:6379 |

## Tópicos Kafka

| Tópico | Produtores | Consumidores | Payload |
|--------|------------|--------------|---------|
| orders.created | Orders Service | Analytics Service | OrderCreatedEvent |
| orders.confirmed | Orders Service | Inventory Service, Analytics Service | OrderConfirmedEvent |
| orders.cancelled | Orders Service | Inventory Service, Analytics Service | OrderCancelledEvent |

## Documentos Complementares

Para informações detalhadas sobre aspectos específicos do projeto, consulte:

### Planejamento e Implementação
- [PLANO_IMPLEMENTACAO.md](./PLANO_IMPLEMENTACAO.md) - Plano completo de implementação com 4 fases, schemas detalhados, decisões arquiteturais e trade-offs
- [PLANO_API_GATEWAY.md](./PLANO_API_GATEWAY.md) - Implementação específica do API Gateway com configuração de proxies e documentação agregada

### Configuração e Execução
- [CONFIGURACAO_AMBIENTE.md](./CONFIGURACAO_AMBIENTE.md) - Configuração de variáveis de ambiente, geração de chaves JWT e estrutura de arquivos .env
- [EXECUCAO_DOCKER_LOCAL.md](./EXECUCAO_DOCKER_LOCAL.md) - Estratégias de execução híbrida e full Docker, resolução de nomes, networking e health checks

### Kafka e Mensageria
- [KAFKA_CONSUMER_GROUPS.md](./KAFKA_CONSUMER_GROUPS.md) - Consumer groups, rebalanceamento, logs comuns, configurações de timeout e troubleshooting

### Gerenciamento de Dependências
- [CATALOGS-PNPM.md](./CATALOGS-PNPM.md) - Recurso Catalogs do pnpm 9.5 para gerenciamento centralizado de versões em monorepo

### Troubleshooting
- [SOLUCAO_DOCKER_CREDENTIAL_DESKTOP.md](./SOLUCAO_DOCKER_CREDENTIAL_DESKTOP.md) - Solução para erro docker-credential-desktop no Windows/WSL2 e build do API Gateway

## Referências Técnicas

### Documentação Oficial
- [NestJS Documentation](https://docs.nestjs.com/) - Framework backend modular
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/) - Plataforma de streaming distribuída
- [TypeORM Documentation](https://typeorm.io/) - ORM para TypeScript e JavaScript
- [pnpm Documentation](https://pnpm.io/) - Gerenciador de pacotes eficiente
- [Zod Documentation](https://zod.dev/) - Schema validation TypeScript-first

### Padrões e Arquitetura
- Richardson, C. (2018). Microservices Patterns - Saga Pattern, Database per Service, CQRS
- Newman, S. (2021). Building Microservices (2nd ed.) - Decomposição, comunicação e deployment
- Kleppmann, M. (2017). Designing Data-Intensive Applications - Sistemas distribuídos e consistência

### Especificações
- [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519) - JSON Web Token (JWT)
- [RFC 7517](https://datatracker.ietf.org/doc/html/rfc7517) - JSON Web Key (JWK)
- [OpenAPI Specification](https://swagger.io/specification/) - API documentation standard
