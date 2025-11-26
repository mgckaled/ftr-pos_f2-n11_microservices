<!-- markdownlint-disable -->
# Planejamento do Projeto Prático de Microsserviços

## Resumo Executivo

Este documento apresenta planejamento completo de projeto prático didático para aplicação dos conceitos fundamentais de arquitetura de microsserviços abordados ao longo das dez aulas da disciplina. O sistema proposto implementa plataforma de gerenciamento de pedidos e-commerce denominada **MicroCommerce**, arquitetada como ecossistema distribuído compondo cinco microsserviços independentes comunicando-se através de protocolos síncronos gRPC e assíncronos Apache Kafka, coordenados por API Gateway Kong para roteamento centralizado e políticas transversais de autenticação JWT com JWKS, rate limiting e observabilidade distribuída através de OpenTelemetry com Jaeger para tracing end-to-end. Stack tecnológica fundamenta-se em Node.js v22 com TypeScript, framework NestJS fornecendo arquitetura modular enterprise-grade, validação tipada através de Zod schemas, gerenciamento de dependências via pnpm workspaces para monorepo, PostgreSQL como banco transacional implementando Database per Service, Redis para caching distribuído e deduplicação idempotente, e Scalar como interface moderna de documentação OpenAPI substituindo Swagger tradicional. Projeto demonstra pragmaticamente padrões arquiteturais avançados incluindo Saga Pattern para transações distribuídas com compensações, Event Sourcing para auditoria imutável de mudanças de estado, CQRS com View Tables desnormalizadas para agregação performática, Backend for Frontend customizado para diferentes tipos de cliente, idempotência mediante Idempotency Keys prevenindo duplicação de operações críticas, e resiliência através de Circuit Breaker, retry policies e degradação graciosa. Estrutura modular do projeto facilita compreensão incremental dos conceitos, permitindo implementação faseada começando por comunicação básica entre serviços e progressivamente adicionando complexidade mediante padrões sofisticados de coordenação distribuída e observabilidade abrangente.

## Introdução e Conceitos Fundamentais

### Contexto e Motivação

Arquitetura de microsserviços representa mudança paradigmática em relação a monolitos tradicionais, decompondo aplicações em serviços independentemente implantáveis modelados em torno de domínios de negócio específicos. Enquanto monolitos encapsulam toda funcionalidade em processo único compartilhando banco de dados centralizado, microsserviços distribuem responsabilidades através de múltiplos processos autônomos possuindo controle exclusivo sobre armazenamento de dados e comunicando-se exclusivamente através de protocolos de rede bem definidos. Esta separação física introduz complexidades operacionais substanciais incluindo latência de rede, falhas parciais, consistência eventual e debugging distribuído, porém oferece vantagens estratégicas como escalabilidade granular direcionada a serviços sob carga específica, heterogeneidade tecnológica permitindo escolha de linguagens e bancos de dados otimizados por contexto, isolamento de falhas prevenindo cascata de indisponibilidade, e desenvolvimento paralelo eficiente em organizações grandes com centenas de desenvolvedores.

Projeto prático proposto materializa conceitos teóricos mediante sistema tangível demonstrando desafios reais e soluções pragmáticas. Domínio de e-commerce selecionado por familiaridade conceitual e riqueza de interações distribuídas envolvendo transações financeiras, gestão de inventário, processamento assíncrono de pedidos e notificações, fornecendo contexto apropriado para aplicação de padrões avançados como Saga Pattern coordenando criação de pedido através de múltiplos serviços com compensações automáticas mediante falhas, Event Sourcing registrando imutavelmente todas mudanças de estado para auditoria e capacidade de reconstrução temporal, e CQRS separando modelos de escrita transacionais de leitura desnormalizadas otimizadas para agregações complexas.

### Objetivos de Aprendizado

Projeto estrutura-se para cobrir objetivos pedagógicos específicos alinhados ao conteúdo das aulas:

1. **Comunicação entre Microsserviços**: Implementação prática de comunicação síncrona através de gRPC para operações críticas exigindo validação imediata como verificação de inventário antes de criação de pedido, e comunicação assíncrona mediante Apache Kafka para eventos de negócio propagando mudanças de estado através do sistema incluindo OrderCreated, PaymentProcessed e OrderShipped, utilizando KafkaJS com contratos de mensagens tipados através de Zod schemas garantindo type safety end-to-end.

2. **Persistência Distribuída**: Aplicação rigorosa do princípio Database per Service onde Orders Service utiliza PostgreSQL com schema transacional normalizado, Inventory Service mantém controle exclusivo sobre tabela de produtos com constraints de integridade, e Analytics Service emprega banco otimizado para agregações temporais como ClickHouse ou TimescaleDB, demonstrando duplicação controlada de dados através de Soft References e sincronização via eventos assíncronos.

3. **Autenticação e Autorização**: Centralização de responsabilidade de autenticação em Auth Service especializado gerando JSON Web Tokens assinados com algoritmo assimétrico RS256 onde chave privada exclusivamente no Auth Service produz assinaturas validadas por chave pública distribuída através de JSON Web Key Set endpoint `/.well-known/jwks.json`, integrado com API Gateway Kong validando tokens mediante plugin JWT automaticamente antes de encaminhar requisições a serviços downstream.

4. **API Gateway e Roteamento**: Configuração declarativa de Kong Gateway através de arquivos YAML definindo Services representando backends upstream, Routes mapeando padrões de URL como `/api/orders/*` e `/api/inventory/*` a serviços apropriados, e Plugins implementando políticas transversais incluindo autenticação JWT com JWKS, rate limiting baseado em consumidor autenticado limitando 100 requisições por minuto, request transformer injetando header `X-User-ID` extraído de claims JWT, e correlation-id propagando identificador único rastreando requisições end-to-end.

5. **Observabilidade Distribuída**: Instrumentação abrangente através de OpenTelemetry SDK com auto-instrumentação Node.js capturando automaticamente spans para HTTP, gRPC, Kafka, PostgreSQL e Redis sem modificações no código de aplicação, exportando traces via protocolo OTLP para Jaeger em desenvolvimento local, propagação de contexto através de W3C Trace Context em headers HTTP e metadados de mensagens Kafka, correlação entre logs estruturados Winston e traces mediante injeção automática de Trace ID, e dashboards Grafana consolidando métricas Prometheus, logs Loki e traces Tempo.

6. **Transações Distribuídas**: Implementação de Saga Pattern coordenando criação de pedido através de sequência de transações locais onde Orders Service cria registro de pedido publicando evento OrderCreated, Inventory Service consome evento reservando produtos mediante débito de quantidade disponível, Payment Service processa pagamento emitindo PaymentProcessed, e Shipping Service agenda envio, com orchestrator central rastreando estado de execução e desencadeando compensações automáticas mediante falhas através de operações semânticas inversas como OrderCanceled, InventoryRestored e PaymentRefunded.

7. **Event Sourcing e CQRS**: Separação arquitetural onde comandos como CreateOrder modificam Event Store append-only armazenando eventos imutáveis sequenciais incluindo OrderCreated, OrderConfirmed e OrderShipped, permitindo reconstrução completa de estado de agregado mediante replay de eventos, enquanto projeções assíncronas consomem eventos via Kafka atualizando View Tables desnormalizadas como OrdersWithDetailsView consolidando informações de pedidos, clientes, produtos e envios em estrutura única consultável eliminando joins distribuídos.

8. **Backend for Frontend**: Implementação de BFF layer especializado posicionado entre clientes e microsserviços de domínio, assumindo responsabilidade exclusiva de orquestração executando múltiplas requisições paralelas gRPC a Orders Service, Inventory Service e Shipping Service, consolidando respostas heterogêneas mediante joins lógicos em memória, e transformando dados em payloads customizados otimizados para Mobile BFF retornando estruturas minimalistas e Web BFF fornecendo dados abrangentes incluindo metadados para interfaces ricas.

9. **Idempotência**: Garantia de que operações executadas múltiplas vezes com parâmetros idênticos produzem resultado equivalente à execução única, implementada através de Idempotency Keys ou Event IDs acompanhando cada mensagem Kafka, com consumidores consultando tabela ProcessedEvents em PostgreSQL antes de executar lógica de negócio, descartando silenciosamente mensagens duplicadas cujos identificadores já constam como processados, prevenindo inflação artificial de métricas analíticas e cobranças financeiras duplicadas.

10. **Resiliência e Degradação Graciosa**: Estratégias de tolerância a falhas incluindo Circuit Breaker bloqueando temporariamente requisições a serviços consistentemente falhando baseando-se em thresholds configuráveis de taxa de erro e latência, retry policies com exponential backoff distinguindo falhas temporárias recuperáveis de permanentes que desencadeiam cascatas de compensações, timeouts adequados prevenindo acumulação de requisições aguardando indefinidamente, e degradação graciosa retornando dados parciais mediante indisponibilidade de serviços não-críticos.

## Arquitetura do Sistema MicroCommerce

### Visão Geral da Arquitetura

Sistema MicroCommerce estrutura-se como ecossistema distribuído compondo cinco microsserviços de domínio independentes, um API Gateway centralizado, um serviço de autenticação, e um Backend for Frontend especializado, todos comunicando-se através de protocolos síncronos gRPC para operações críticas exigindo validação imediata e assíncronos Apache Kafka para eventos de negócio propagando mudanças de estado. Arquitetura implementa rigorosamente princípio Database per Service onde cada microsserviço possui controle exclusivo sobre armazenamento de dados, conectando-se a instâncias PostgreSQL isoladas ou tecnologias heterogêneas otimizadas para necessidades específicas.

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway (Kong)                       │
│  - Roteamento centralizado                                       │
│  - Autenticação JWT + JWKS                                       │
│  - Rate Limiting                                                 │
│  - Correlation ID                                                │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─────────────┬──────────────┬──────────────┬─────────
             │             │              │              │
    ┌────────▼───────┐ ┌──▼──────────┐ ┌─▼─────────┐ ┌─▼──────────┐
    │  Auth Service  │ │Orders Service│ │  Inventory │ │  Payment   │
    │  - JWT RS256   │ │  - PostgreSQL│ │   Service  │ │  Service   │
    │  - JWKS        │ │  - Saga Orch │ │- PostgreSQL│ │- PostgreSQL│
    │  - User Mgmt   │ │  - Event Src │ │- gRPC      │ │- Kafka     │
    └────────┬───────┘ └──┬───────────┘ └─┬──────────┘ └─┬──────────┘
             │            │                │               │
             │            │                └───────┬───────┘
             │            │                        │
        ┌────▼────────────▼────────────────────────▼──────────────┐
        │           Apache Kafka (Event Bus)                       │
        │  - OrderCreated                                          │
        │  - PaymentProcessed                                      │
        │  - InventoryReserved                                     │
        │  - OrderShipped                                          │
        └──────────────┬───────────────────────────────────────────┘
                       │
            ┌──────────▼──────────┬──────────────────────┐
            │                     │                       │
     ┌──────▼──────────┐  ┌──────▼────────┐   ┌─────────▼────────┐
     │ Shipping Service│  │Analytics Service│   │   BFF Service    │
     │  - PostgreSQL   │  │  - ClickHouse   │   │ - gRPC Clients   │
     │  - Kafka        │  │  - View Tables  │   │ - GraphQL API    │
     │  - gRPC         │  │  - CQRS Reads   │   │ - Aggregation    │
     └─────────────────┘  └─────────────────┘   └──────────────────┘

     ┌──────────────────────────────────────────────────────────────┐
     │            Observability Stack                                │
     │  - OpenTelemetry Collector                                    │
     │  - Jaeger (Traces)                                            │
     │  - Prometheus (Metrics)                                       │
     │  - Grafana (Dashboards)                                       │
     └──────────────────────────────────────────────────────────────┘
```

### Microsserviços e Responsabilidades

#### 1. Auth Service (Serviço de Autenticação)

**Responsabilidade**: Centralização de autenticação e autorização emitindo JSON Web Tokens assinados criptograficamente.

**Tecnologias**:
- NestJS framework
- PostgreSQL para armazenamento de usuários
- Argon2 para hashing de senhas
- jsonwebtoken com algoritmo RS256
- jwks-rsa para publicação de chaves públicas

**Funcionalidades Principais**:
1. Registro de novos usuários com validação Zod de email, senha forte e metadata
2. Autenticação via credenciais retornando Access Token JWT de curta duração (15 minutos)
3. Refresh Token stateful de longa duração (7 dias) armazenado em PostgreSQL
4. Endpoint JWKS `/.well-known/jwks.json` publicando chaves públicas RSA
5. Rotação automática de chaves mediante schedule configurável
6. Validação de claims incluindo exp, iat, iss, aud e sub

**Database Schema**:
```typescript
// PostgreSQL Schema
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

**Endpoints REST**:
```typescript
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /.well-known/jwks.json
```

#### 2. Orders Service (Serviço de Pedidos)

**Responsabilidade**: Gerenciamento do ciclo de vida completo de pedidos incluindo criação, confirmação, cancelamento e rastreamento de estado, atuando como orchestrator de Saga Pattern coordenando transações distribuídas.

**Tecnologias**:
- NestJS com módulos específicos para agregados e sagas
- PostgreSQL para Event Store e tabelas transacionais
- KafkaJS para publicação e consumo de eventos
- gRPC client para comunicação com Inventory e Payment
- Redis para caching de pedidos frequentemente acessados

**Funcionalidades Principais**:
1. Criação de pedidos validando payload através de Zod schema
2. Event Sourcing armazenando eventos imutáveis em Event Store
3. Saga Orchestrator coordenando reserva de inventário, processamento de pagamento e agendamento de envio
4. Compensações automáticas mediante falhas através de transações semânticas inversas
5. Snapshots periódicos de agregados para otimização de reconstrução
6. Projeções materializadas atualizando View Tables para queries
7. Idempotência mediante Idempotency Keys em tabela ProcessedEvents

**Database Schema**:
```typescript
// PostgreSQL Schema
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  metadata JSONB,
  sequence_number INTEGER NOT NULL,
  occurred_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (aggregate_id, sequence_number),
  INDEX idx_aggregate_id (aggregate_id),
  INDEX idx_occurred_at (occurred_at)
);

CREATE TABLE snapshots (
  aggregate_id UUID PRIMARY KEY,
  aggregate_type VARCHAR(50) NOT NULL,
  state JSONB NOT NULL,
  last_sequence_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE saga_instances (
  saga_id UUID PRIMARY KEY,
  saga_type VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  current_step INTEGER NOT NULL,
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
  compensated_at TIMESTAMP
);

CREATE TABLE processed_events (
  event_id UUID PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT NOW(),
  consumer_name VARCHAR(100) NOT NULL,
  INDEX idx_processed_at (processed_at)
);

CREATE TABLE orders_view (
  order_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);
```

**Eventos Publicados**:
```typescript
- OrderCreated
- OrderConfirmed
- OrderCanceled
- OrderShipped
- PaymentRequested
- InventoryReserveRequested
```

**gRPC Service Definition**:
```protobuf
syntax = "proto3";

package orders;

service OrdersService {
  rpc CreateOrder (CreateOrderRequest) returns (CreateOrderResponse);
  rpc GetOrder (GetOrderRequest) returns (GetOrderResponse);
  rpc CancelOrder (CancelOrderRequest) returns (CancelOrderResponse);
}

message CreateOrderRequest {
  string user_id = 1;
  repeated OrderItem items = 2;
}

message OrderItem {
  string product_id = 1;
  int32 quantity = 2;
}

message CreateOrderResponse {
  string order_id = 1;
  string status = 2;
}
```

#### 3. Inventory Service (Serviço de Inventário)

**Responsabilidade**: Controle exclusivo sobre estoque de produtos incluindo consulta de disponibilidade, reserva temporária durante processamento de pedido e débito definitivo após confirmação de pagamento.

**Tecnologias**:
- NestJS com módulos específicos para gestão de produtos
- PostgreSQL com constraints de integridade para quantidades
- KafkaJS para consumo de eventos de reserva
- gRPC server expondo operações de inventário
- Redis para caching de produtos populares

**Funcionalidades Principais**:
1. Consulta de disponibilidade de produtos via gRPC
2. Reserva temporária de quantidade mediante OrderCreated com timeout de 15 minutos
3. Débito definitivo após PaymentProcessed
4. Liberação automática de reservas expiradas mediante job scheduled
5. Compensação restaurando quantidade mediante OrderCanceled
6. Idempotência mediante verificação de event_id em processar mensagens Kafka

**Database Schema**:
```typescript
// PostgreSQL Schema
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
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_order_id (order_id),
  INDEX idx_expires_at (expires_at)
);
```

**gRPC Service Definition**:
```protobuf
syntax = "proto3";

package inventory;

service InventoryService {
  rpc CheckAvailability (CheckAvailabilityRequest) returns (CheckAvailabilityResponse);
  rpc ReserveProducts (ReserveProductsRequest) returns (ReserveProductsResponse);
  rpc CommitReservation (CommitReservationRequest) returns (CommitReservationResponse);
  rpc ReleaseReservation (ReleaseReservationRequest) returns (ReleaseReservationResponse);
}

message CheckAvailabilityRequest {
  repeated ProductQuantity products = 1;
}

message ProductQuantity {
  string product_id = 1;
  int32 quantity = 2;
}

message CheckAvailabilityResponse {
  bool available = 1;
  repeated UnavailableProduct unavailable_products = 2;
}

message UnavailableProduct {
  string product_id = 1;
  int32 requested_quantity = 2;
  int32 available_quantity = 3;
}
```

#### 4. Payment Service (Serviço de Pagamento)

**Responsabilidade**: Processamento de transações financeiras simulando integração com gateway de pagamento externo, gerenciamento de estado de pagamentos e emissão de eventos de confirmação ou falha.

**Tecnologias**:
- NestJS com módulos específicos para transações
- PostgreSQL para armazenamento de pagamentos
- KafkaJS para consumo de PaymentRequested e publicação de PaymentProcessed
- Idempotência mediante Idempotency Keys

**Funcionalidades Principais**:
1. Consumo de eventos PaymentRequested do tópico Kafka
2. Validação de dados de pagamento através de Zod schema
3. Processamento simulado com delay aleatório e taxa de falha configurável
4. Publicação de PaymentProcessed ou PaymentFailed
5. Idempotência prevenindo processamento duplicado mediante tabela processed_payments
6. Reconciliação periódica de pagamentos pendentes

**Database Schema**:
```typescript
// PostgreSQL Schema
CREATE TABLE payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50),
  gateway_transaction_id VARCHAR(255),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_order_id (order_id),
  INDEX idx_status (status)
);

CREATE TABLE processed_payments (
  event_id UUID PRIMARY KEY,
  payment_id UUID NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW()
);
```

**Eventos Consumidos**:
```typescript
- PaymentRequested
```

**Eventos Publicados**:
```typescript
- PaymentProcessed
- PaymentFailed
```

#### 5. Shipping Service (Serviço de Envio)

**Responsabilidade**: Gerenciamento de logística de envio incluindo agendamento, rastreamento e atualização de status de entrega.

**Tecnologias**:
- NestJS com módulos específicos para envios
- PostgreSQL para armazenamento de shipments
- KafkaJS para consumo de OrderConfirmed e publicação de OrderShipped
- gRPC server expondo consulta de status de envio

**Funcionalidades Principais**:
1. Consumo de eventos OrderConfirmed agendando envio
2. Geração de código de rastreamento único
3. Simulação de progressão de status mediante job scheduled
4. Publicação de OrderShipped e OrderDelivered
5. Consulta de status via gRPC

**Database Schema**:
```typescript
// PostgreSQL Schema
CREATE TABLE shipments (
  shipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE NOT NULL,
  tracking_code VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  estimated_delivery_date DATE,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_order_id (order_id),
  INDEX idx_tracking_code (tracking_code)
);

CREATE TABLE shipment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(shipment_id),
  status VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  occurred_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. Analytics Service (Serviço de Analítica)

**Responsabilidade**: Agregação de dados distribuídos construindo View Tables desnormalizadas otimizadas para consultas analíticas implementando lado de leitura de CQRS.

**Tecnologias**:
- NestJS com módulos específicos para projeções
- ClickHouse ou TimescaleDB para agregações temporais performáticas
- KafkaJS consumindo todos eventos de domínio
- gRPC server expondo queries analíticas

**Funcionalidades Principais**:
1. Consumo de eventos de múltiplos serviços via Kafka
2. Projeções materializadas atualizando View Tables desnormalizadas
3. Agregações pré-computadas como total de vendas por período
4. Consultas analíticas performáticas sem joins distribuídos
5. Idempotência mediante tabela processed_events compartilhada

**Database Schema**:
```typescript
// ClickHouse Schema
CREATE TABLE orders_analytics (
  order_id UUID,
  user_id UUID,
  user_email String,
  total_amount Decimal(10, 2),
  status String,
  payment_status String,
  shipping_status String,
  created_at DateTime,
  confirmed_at DateTime,
  delivered_at DateTime
) ENGINE = MergeTree()
ORDER BY (created_at, order_id);

CREATE TABLE sales_by_day (
  date Date,
  total_orders UInt32,
  total_revenue Decimal(10, 2),
  avg_order_value Decimal(10, 2)
) ENGINE = SummingMergeTree()
ORDER BY date;
```

#### 7. BFF Service (Backend for Frontend)

**Responsabilidade**: Agregação e composição de dados de múltiplos microsserviços customizando payloads para diferentes tipos de cliente.

**Tecnologias**:
- NestJS com GraphQL Apollo Server
- gRPC clients para comunicação com serviços de domínio
- DataLoader para otimização de N+1 queries
- Redis para caching de agregações

**Funcionalidades Principais**:
1. Endpoints GraphQL permitindo clientes especificarem campos necessários
2. Resolvers executando requisições paralelas via gRPC
3. Agregação lógica em memória consolidando respostas
4. Transformação de payloads customizada por plataforma
5. Degradação graciosa retornando dados parciais mediante falhas
6. Circuit Breaker protegendo contra serviços indisponíveis

**GraphQL Schema**:
```graphql
type Order {
  id: ID!
  userId: ID!
  status: OrderStatus!
  totalAmount: Float!
  items: [OrderItem!]!
  payment: Payment
  shipping: Shipping
  createdAt: DateTime!
}

type OrderItem {
  productId: ID!
  productName: String!
  quantity: Int!
  price: Float!
}

type Payment {
  status: PaymentStatus!
  processedAt: DateTime
}

type Shipping {
  trackingCode: String
  status: ShippingStatus!
  estimatedDeliveryDate: Date
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELED
}

type Query {
  order(id: ID!): Order
  orders(userId: ID!): [Order!]!
  orderSummary(id: ID!): OrderSummary!
}

type Mutation {
  createOrder(input: CreateOrderInput!): Order!
  cancelOrder(orderId: ID!): Order!
}
```

### Infraestrutura e Componentes Compartilhados

#### API Gateway (Kong)

**Configuração Declarativa**:
```yaml
_format_version: "3.0"

services:
  - name: auth-service
    url: http://auth-service:3000
    routes:
      - name: auth-routes
        paths:
          - /api/auth
        strip_path: true

  - name: orders-service
    url: http://orders-service:3001
    routes:
      - name: orders-routes
        paths:
          - /api/orders
        strip_path: true
    plugins:
      - name: jwt
        config:
          uri_param_names:
            - jwt
          claims_to_verify:
            - exp
      - name: rate-limiting
        config:
          minute: 100
          policy: redis
          redis_host: redis
          redis_port: 6379

  - name: bff-service
    url: http://bff-service:3005
    routes:
      - name: graphql-routes
        paths:
          - /graphql
        strip_path: false

plugins:
  - name: correlation-id
    config:
      header_name: X-Correlation-ID
      generator: uuid

  - name: prometheus
    config:
      per_consumer: true
```

#### Apache Kafka

**Tópicos Principais**:
```
- orders.created
- orders.confirmed
- orders.canceled
- orders.shipped
- payments.requested
- payments.processed
- payments.failed
- inventory.reserved
- inventory.released
- shipping.scheduled
- shipping.updated
```

**Configuração Producer**:
```typescript
const kafka = new Kafka({
  clientId: 'orders-service',
  brokers: ['kafka:9092'],
});

const producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 5,
  transactionalId: 'orders-producer',
});
```

**Configuração Consumer**:
```typescript
const consumer = kafka.consumer({
  groupId: 'payment-service-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

await consumer.subscribe({
  topics: ['payments.requested'],
  fromBeginning: false,
});
```

#### PostgreSQL

**Configuração por Serviço**:
```
- auth-db: PostgreSQL 16
- orders-db: PostgreSQL 16 com Event Store
- inventory-db: PostgreSQL 16
- payment-db: PostgreSQL 16
- shipping-db: PostgreSQL 16
```

#### Redis

**Uso**:
- Caching distribuído de dados frequentemente acessados
- Deduplicação de mensagens Kafka mediante SET NX
- Rate limiting storage para Kong
- Session storage para Refresh Tokens

#### OpenTelemetry Stack

**Componentes**:
```
- OpenTelemetry Collector (gateway mode)
- Jaeger (tracing backend)
- Prometheus (metrics)
- Grafana (dashboards)
- Loki (logs)
```

## Stack Tecnológica Detalhada

### Runtime e Linguagem

**Node.js v22.16.0**:
- Versão LTS mais recente com performance otimizada
- Suporte nativo a ESM modules
- Melhorias substanciais em garbage collection

**TypeScript 5.x**:
- Type safety end-to-end
- Interfaces e tipos para contratos entre serviços
- Strict mode habilitado para máxima segurança

### Framework Backend

**NestJS**:
- Arquitetura modular inspirada em Angular
- Dependency Injection nativo
- Suporte first-class para microsserviços
- Decorators facilitando definição de controllers e providers
- CLI poderoso para scaffolding de módulos

**Módulos NestJS Utilizados**:
```typescript
@nestjs/microservices - Comunicação entre serviços
@nestjs/graphql - GraphQL Apollo Server
@nestjs/typeorm - ORM para PostgreSQL
@nestjs/kafka - Integração com Apache Kafka
@nestjs/bull - Job queues para tarefas assíncronas
@nestjs/schedule - Cron jobs para tarefas periódicas
@nestjs/config - Gestão de variáveis de ambiente
```

### Validação e Schemas

**Zod**:
- Schema validation TypeScript-first
- Type inference automática
- Composição e transformação de schemas
- Error messages customizáveis

**Exemplo de Schema**:
```typescript
import { z } from 'zod';

export const CreateOrderSchema = z.object({
  userId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zipCode: z.string().regex(/^\d{5}-\d{3}$/),
  }),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
```

### Gerenciamento de Dependências

**pnpm v10.23.0**:
- Monorepo workspaces para organização
- Instalação rápida mediante hard links
- Resolução determinística de dependências
- Economia substancial de espaço em disco

**Estrutura de Workspaces**:
```json
{
  "name": "microcommerce",
  "private": true,
  "workspaces": [
    "services/*",
    "packages/*"
  ]
}
```

### Documentação de API

**Scalar**:
- Interface moderna substituindo Swagger UI
- Renderização performática de especificações OpenAPI
- Integração com NestJS mediante decorators
- Suporte a múltiplas especificações para diferentes serviços

**Configuração NestJS**:
```typescript
import { NestFactory } from '@nestjs/core';
import { ScalarModule, ScalarOptions } from '@scalar/nestjs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config: ScalarOptions = {
    title: 'MicroCommerce API',
    description: 'API documentation for MicroCommerce platform',
    version: '1.0',
    tags: ['orders', 'inventory', 'payments'],
  };

  ScalarModule.setup('/docs', app, config);

  await app.listen(3000);
}
bootstrap();
```

### Bancos de Dados

**PostgreSQL 16**:
- Banco transacional ACID completo
- JSONB para armazenamento de eventos flexível
- Constraints de integridade referencial
- Índices otimizados para queries frequentes

**ClickHouse** (Analytics Service):
- Banco colunar otimizado para agregações
- Compressão eficiente de dados temporais
- Queries analíticas em latência de milissegundos
- MergeTree engine para ordenação customizada

**Redis 7**:
- Caching in-memory de alta performance
- Suporte a estruturas de dados avançadas
- Pub/Sub para notificações real-time
- Persistence configurável mediante RDB snapshots

### Message Broker

**Apache Kafka 3.6**:
- Plataforma de streaming distribuída
- Particionamento para paralelização horizontal
- Retenção configurável de mensagens
- Exactly-once semantics com transactional producer
- Consumer Groups para load balancing

**KafkaJS**:
- Cliente Node.js nativo para Kafka
- Suporte a transactional producer
- Auto-commit e manual commit de offsets
- Integração com OpenTelemetry para tracing

### Comunicação Síncrona

**gRPC com Protocol Buffers**:
- Serialização binária eficiente
- Contratos fortemente tipados via .proto files
- HTTP/2 multiplexing
- Streaming bidirecional
- Code generation automático para TypeScript

**@grpc/grpc-js**:
- Implementação pura JavaScript de gRPC
- Melhor compatibilidade com Node.js moderno
- Suporte a interceptors para observabilidade

**Exemplo de Definição .proto**:
```protobuf
syntax = "proto3";

package inventory;

service InventoryService {
  rpc CheckAvailability (CheckAvailabilityRequest) returns (CheckAvailabilityResponse);
}

message CheckAvailabilityRequest {
  repeated ProductQuantity products = 1;
}

message ProductQuantity {
  string product_id = 1;
  int32 quantity = 2;
}

message CheckAvailabilityResponse {
  bool available = 1;
}
```

### Observabilidade

**OpenTelemetry**:
- Framework vendor-neutral unificado
- Auto-instrumentação Node.js sem modificação de código
- Propagação de contexto via W3C Trace Context
- Exportação via OTLP para múltiplos backends

**Jaeger**:
- Backend de tracing distribuído
- UI web para visualização de traces
- Busca por Trace ID, Service e Operation
- Flame graphs para análise de latência

**Prometheus**:
- Sistema de métricas time-series
- Scraping automático de endpoints /metrics
- PromQL para queries complexas
- Alerting mediante Alertmanager

**Grafana**:
- Dashboards customizáveis
- Integração com Prometheus, Jaeger e Loki
- Correlação automática entre traces, logs e métricas
- Alerting visual

### Autenticação

**jsonwebtoken**:
- Geração e validação de JWT
- Algoritmos simétricos (HS256) e assimétricos (RS256)
- Claims customizados

**jwks-rsa**:
- Cliente para consumo de JWKS endpoints
- Cache inteligente de chaves públicas
- Rotação automática mediante kid desconhecido

**Argon2**:
- Algoritmo de hashing resistente a força bruta
- Vencedor do Password Hashing Competition
- Configuração de custo computacional

### Resilência

**opossum** (Circuit Breaker):
- Implementação do padrão Circuit Breaker
- Estados Open, Half-Open e Closed
- Thresholds configuráveis de taxa de erro
- Fallback functions para degradação graciosa

### Containerização

**Docker**:
- Imagens oficiais Node.js Alpine para tamanho reduzido
- Multi-stage builds otimizando layers
- Docker Compose para orquestração local
- Health checks para validação de disponibilidade

**Dockerfile Exemplo**:
```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

## Estrutura de Diretórios do Monorepo

```
microcommerce/
├── package.json                 # Root package.json com workspaces
├── pnpm-workspace.yaml          # Configuração de workspaces pnpm
├── tsconfig.json                # TypeScript config compartilhado
├── docker-compose.yml           # Orquestração completa do sistema
├── .env.example                 # Exemplo de variáveis de ambiente
│
├── services/                    # Microsserviços individuais
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── dto/
│   │   │   ├── users/
│   │   │   │   ├── users.service.ts
│   │   │   │   └── entities/
│   │   │   └── jwks/
│   │   │       └── jwks.controller.ts
│   │   ├── test/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── orders-service/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── orders/
│   │   │   │   ├── orders.controller.ts
│   │   │   │   ├── orders.service.ts
│   │   │   │   ├── aggregates/
│   │   │   │   │   └── order.aggregate.ts
│   │   │   │   └── dto/
│   │   │   ├── sagas/
│   │   │   │   ├── saga-orchestrator.ts
│   │   │   │   └── create-order.saga.ts
│   │   │   ├── events/
│   │   │   │   └── order.events.ts
│   │   │   ├── event-store/
│   │   │   │   ├── event-store.service.ts
│   │   │   │   └── snapshot.service.ts
│   │   │   └── projections/
│   │   │       └── orders-view.projection.ts
│   │   ├── proto/
│   │   │   └── orders.proto
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── inventory-service/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── inventory/
│   │   │   │   ├── inventory.controller.ts
│   │   │   │   ├── inventory.service.ts
│   │   │   │   └── entities/
│   │   │   ├── reservations/
│   │   │   │   └── reservations.service.ts
│   │   │   └── consumers/
│   │   │       └── order-events.consumer.ts
│   │   ├── proto/
│   │   │   └── inventory.proto
│   │   └── package.json
│   │
│   ├── payment-service/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── payments/
│   │   │   │   ├── payments.service.ts
│   │   │   │   └── entities/
│   │   │   └── consumers/
│   │   │       └── payment-requested.consumer.ts
│   │   └── package.json
│   │
│   ├── shipping-service/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── shipping/
│   │   │   │   ├── shipping.service.ts
│   │   │   │   └── entities/
│   │   │   └── consumers/
│   │   │       └── order-confirmed.consumer.ts
│   │   ├── proto/
│   │   │   └── shipping.proto
│   │   └── package.json
│   │
│   ├── analytics-service/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── analytics/
│   │   │   │   ├── analytics.controller.ts
│   │   │   │   └── analytics.service.ts
│   │   │   ├── projections/
│   │   │   │   ├── orders-analytics.projection.ts
│   │   │   │   └── sales-summary.projection.ts
│   │   │   └── consumers/
│   │   │       └── domain-events.consumer.ts
│   │   ├── proto/
│   │   │   └── analytics.proto
│   │   └── package.json
│   │
│   └── bff-service/
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── graphql/
│       │   │   ├── schema.graphql
│       │   │   ├── resolvers/
│       │   │   │   ├── order.resolver.ts
│       │   │   │   └── query.resolver.ts
│       │   │   └── dataloaders/
│       │   │       └── order.dataloader.ts
│       │   └── clients/
│       │       ├── orders.client.ts
│       │       ├── inventory.client.ts
│       │       └── shipping.client.ts
│       └── package.json
│
├── packages/                    # Pacotes compartilhados
│   ├── shared-types/
│   │   ├── src/
│   │   │   ├── events/
│   │   │   │   └── index.ts
│   │   │   └── dto/
│   │   │       └── index.ts
│   │   └── package.json
│   │
│   ├── common-utils/
│   │   ├── src/
│   │   │   ├── logger/
│   │   │   ├── tracing/
│   │   │   └── idempotency/
│   │   └── package.json
│   │
│   └── validation-schemas/
│       ├── src/
│       │   ├── orders.schemas.ts
│       │   ├── auth.schemas.ts
│       │   └── inventory.schemas.ts
│       └── package.json
│
├── infrastructure/              # Configurações de infraestrutura
│   ├── kong/
│   │   └── kong.yml
│   ├── kafka/
│   │   └── topics.sh
│   ├── postgres/
│   │   └── init-scripts/
│   └── observability/
│       ├── otel-collector-config.yml
│       ├── prometheus.yml
│       └── grafana/
│           └── dashboards/
│
├── proto/                       # Definições Protocol Buffers compartilhadas
│   ├── common.proto
│   └── google/
│
└── scripts/                     # Scripts utilitários
    ├── generate-proto.sh
    ├── seed-database.sh
    └── start-dev.sh
```

## Implementação Faseada

### Fase 1: Fundação (Semana 1-2)

**Objetivo**: Estabelecer infraestrutura básica e comunicação entre serviços.

**Tarefas**:
1. Configurar monorepo com pnpm workspaces
2. Criar estrutura base de microsserviços com NestJS
3. Configurar PostgreSQL por serviço com Docker Compose
4. Implementar Auth Service com JWT RS256 e JWKS
5. Configurar Kong Gateway com roteamento básico
6. Implementar Orders Service simples sem Event Sourcing
7. Implementar Inventory Service com gRPC
8. Estabelecer comunicação gRPC entre Orders e Inventory
9. Configurar Apache Kafka com tópicos principais
10. Criar pacote shared-types com interfaces comuns

**Entregáveis**:
- Repositório estruturado funcionando localmente
- Autenticação JWT operacional
- Comunicação gRPC demonstrada
- Kafka conectado aos serviços

### Fase 2: Event-Driven Architecture (Semana 3-4)

**Objetivo**: Implementar comunicação assíncrona e Event Sourcing.

**Tarefas**:
1. Refatorar Orders Service para Event Sourcing completo
2. Implementar Event Store com PostgreSQL
3. Criar agregado Order com métodos handleCommand e applyEvent
4. Configurar produtores Kafka idempotentes
5. Implementar consumidores Kafka em Payment Service
6. Implementar consumidores Kafka em Shipping Service
7. Criar projeções materializadas em Orders Service
8. Implementar idempotência com tabela processed_events
9. Adicionar snapshots de agregados
10. Validar fluxo end-to-end de criação de pedido

**Entregáveis**:
- Event Store funcional com replay
- Comunicação assíncrona via Kafka operacional
- Idempotência demonstrada com mensagens duplicadas
- Snapshots otimizando reconstrução de agregados

### Fase 3: Saga Pattern e Transações Distribuídas (Semana 5-6)

**Objetivo**: Coordenar transações distribuídas com compensações.

**Tarefas**:
1. Implementar Saga Orchestrator em Orders Service
2. Definir workflow de CreateOrderSaga com etapas
3. Criar tabelas saga_instances e saga_step_executions
4. Implementar rastreamento de estado de saga
5. Definir compensating transactions para cada etapa
6. Implementar tratamento de falhas e retry policies
7. Adicionar timeout detection para etapas travadas
8. Testar cenários de falha em Payment Service
9. Validar compensações restaurando inventário
10. Adicionar logging estruturado de sagas

**Entregáveis**:
- Saga coordenando criação de pedido completa
- Compensações automáticas funcionando
- Resiliência demonstrada com injeção de falhas

### Fase 4: CQRS e Analytics (Semana 7-8)

**Objetivo**: Separar modelos de leitura e escrita com agregações.

**Tarefas**:
1. Configurar ClickHouse para Analytics Service
2. Criar schema de tabelas analíticas
3. Implementar projeções consumindo eventos de todos serviços
4. Construir OrdersAnalyticsView desnormalizada
5. Criar agregações pré-computadas como SalesByDay
6. Implementar gRPC server em Analytics Service
7. Criar queries analíticas complexas
8. Adicionar caching Redis de resultados
9. Implementar BFF Service com GraphQL
10. Criar resolvers agregando dados de múltiplos serviços

**Entregáveis**:
- Analytics Service com View Tables operacionais
- Queries analíticas performáticas sem joins distribuídos
- BFF agregando dados via GraphQL

### Fase 5: Observabilidade Distribuída (Semana 9-10)

**Objetivo**: Implementar tracing, métricas e logs correlacionados.

**Tarefas**:
1. Configurar OpenTelemetry SDK em todos serviços
2. Habilitar auto-instrumentação Node.js
3. Configurar OpenTelemetry Collector
4. Configurar Jaeger como backend de tracing
5. Implementar propagação de contexto via W3C Trace Context
6. Adicionar Trace ID em logs estruturados Winston
7. Configurar Prometheus scraping de métricas
8. Criar dashboards Grafana customizados
9. Implementar Correlation ID via Kong plugin
10. Adicionar custom spans para operações de negócio

**Entregáveis**:
- Traces end-to-end visualizados em Jaeger
- Logs correlacionados com traces
- Dashboards Grafana mostrando métricas de sistema
- Correlation IDs propagados através de toda stack

### Fase 6: Resiliência e Documentação (Semana 11-12)

**Objetivo**: Adicionar resiliência e documentação completa.

**Tarefas**:
1. Implementar Circuit Breaker em BFF Service
2. Adicionar retry policies com exponential backoff
3. Implementar degradação graciosa retornando dados parciais
4. Configurar rate limiting avançado no Kong
5. Adicionar health checks em todos serviços
6. Configurar Scalar para documentação OpenAPI
7. Gerar documentação de cada serviço
8. Criar diagramas de arquitetura
9. Escrever README detalhado com instruções setup
10. Criar guia de troubleshooting

**Entregáveis**:
- Resiliência demonstrada com chaos engineering
- Documentação OpenAPI via Scalar completa
- README com instruções setup claras
- Guias de troubleshooting

## Padrões de Código e Boas Práticas

### Estrutura de Controllers

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderSchema, CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() dto: unknown) {
    // Validação com Zod
    const validatedDto = CreateOrderSchema.parse(dto);

    return this.ordersService.createOrder(validatedDto);
  }
}
```

### Estrutura de Services

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventStoreService } from '../event-store/event-store.service';
import { OrderAggregate } from './aggregates/order.aggregate';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private eventStore: EventStoreService,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<{ orderId: string }> {
    const orderId = uuidv4();
    const aggregate = new OrderAggregate(orderId);

    // Command handling
    const events = aggregate.createOrder(dto);

    // Persist events
    await this.eventStore.saveEvents(orderId, events);

    return { orderId };
  }
}
```

### Estrutura de Agregados

```typescript
export class OrderAggregate {
  private orderId: string;
  private userId: string;
  private items: OrderItem[];
  private status: OrderStatus;
  private version: number = 0;

  constructor(orderId: string) {
    this.orderId = orderId;
  }

  // Command: cria eventos
  createOrder(dto: CreateOrderDto): DomainEvent[] {
    // Validações de negócio
    if (dto.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    const event: OrderCreatedEvent = {
      type: 'OrderCreated',
      aggregateId: this.orderId,
      payload: {
        userId: dto.userId,
        items: dto.items,
        totalAmount: this.calculateTotal(dto.items),
        createdAt: new Date(),
      },
      metadata: {
        version: this.version + 1,
      },
    };

    // Aplica evento localmente
    this.applyEvent(event);

    return [event];
  }

  // Apply: reconstrói estado (sem validações)
  applyEvent(event: DomainEvent): void {
    switch (event.type) {
      case 'OrderCreated':
        this.userId = event.payload.userId;
        this.items = event.payload.items;
        this.status = OrderStatus.PENDING;
        this.version++;
        break;
      // Outros eventos...
    }
  }

  private calculateTotal(items: OrderItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
```

### Estrutura de Kafka Producers

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private producer: Producer;

  constructor(private configService: ConfigService) {
    const kafka = new Kafka({
      clientId: this.configService.get('KAFKA_CLIENT_ID'),
      brokers: this.configService.get('KAFKA_BROKERS').split(','),
    });

    this.producer = kafka.producer({
      idempotent: true,
      transactionalId: `${this.configService.get('KAFKA_CLIENT_ID')}-tx`,
    });
  }

  async onModuleInit() {
    await this.producer.connect();
  }

  async publishEvent(topic: string, event: DomainEvent): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        {
          key: event.aggregateId,
          value: JSON.stringify(event),
          headers: {
            'event-type': event.type,
            'event-id': event.metadata.eventId,
            'correlation-id': event.metadata.correlationId || '',
          },
        },
      ],
    });
  }
}
```

### Estrutura de Kafka Consumers

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';

@Injectable()
export class PaymentRequestedConsumer implements OnModuleInit {
  private consumer: Consumer;

  constructor(
    private configService: ConfigService,
    private paymentsService: PaymentsService,
  ) {
    const kafka = new Kafka({
      clientId: this.configService.get('KAFKA_CLIENT_ID'),
      brokers: this.configService.get('KAFKA_BROKERS').split(','),
    });

    this.consumer = kafka.consumer({
      groupId: 'payment-service-group',
    });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: ['payments.requested'],
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    const event = JSON.parse(message.value.toString());
    const eventId = message.headers['event-id']?.toString();

    // Idempotência
    const alreadyProcessed = await this.paymentsService.isEventProcessed(eventId);
    if (alreadyProcessed) {
      console.log(`Event ${eventId} already processed, skipping`);
      return;
    }

    try {
      await this.paymentsService.processPayment(event);
      await this.paymentsService.markEventAsProcessed(eventId);
    } catch (error) {
      console.error('Error processing payment:', error);
      // Não commita offset, permitindo retry
      throw error;
    }
  }
}
```

### Estrutura de gRPC Services

```typescript
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import {
  CheckAvailabilityRequest,
  CheckAvailabilityResponse,
} from './interfaces/inventory.interface';

@Controller()
export class InventoryGrpcController {
  constructor(private readonly inventoryService: InventoryService) {}

  @GrpcMethod('InventoryService', 'CheckAvailability')
  async checkAvailability(
    data: CheckAvailabilityRequest,
  ): Promise<CheckAvailabilityResponse> {
    const available = await this.inventoryService.checkAvailability(
      data.products,
    );

    return {
      available,
      unavailableProducts: available ? [] : data.products,
    };
  }
}
```

### Validação com Zod

```typescript
import { z } from 'zod';

// Schema base reutilizável
export const AddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zipCode: z.string().regex(/^\d{5}-\d{3}$/, 'Invalid ZIP code format'),
});

export const OrderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
});

export const CreateOrderSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  items: z.array(OrderItemSchema).min(1, 'Order must have at least one item'),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema.optional(),
});

// Type inference automática
export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Address = z.infer<typeof AddressSchema>;
```

### OpenTelemetry Instrumentation

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'orders-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});
```

## Configuração de Ambiente

### Docker Compose Completo

```yaml
version: '3.8'

services:
  # API Gateway
  kong:
    image: kong:3.4-alpine
    environment:
      KONG_DATABASE: 'off'
      KONG_DECLARATIVE_CONFIG: /kong/declarative/kong.yml
      KONG_PROXY_LISTEN: 0.0.0.0:8000
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    volumes:
      - ./infrastructure/kong:/kong/declarative
    ports:
      - "8000:8000"
      - "8001:8001"
    networks:
      - microcommerce

  # Message Broker
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    networks:
      - microcommerce

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports:
      - "9092:9092"
    networks:
      - microcommerce

  # Databases
  auth-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: auth
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - auth-db-data:/var/lib/postgresql/data
    networks:
      - microcommerce

  orders-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - orders-db-data:/var/lib/postgresql/data
    networks:
      - microcommerce

  inventory-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: inventory
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5434:5432"
    volumes:
      - inventory-db-data:/var/lib/postgresql/data
    networks:
      - microcommerce

  payment-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: payment
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5435:5432"
    volumes:
      - payment-db-data:/var/lib/postgresql/data
    networks:
      - microcommerce

  shipping-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: shipping
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5436:5432"
    volumes:
      - shipping-db-data:/var/lib/postgresql/data
    networks:
      - microcommerce

  # Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - microcommerce

  # Analytics Database
  clickhouse:
    image: clickhouse/clickhouse-server:23.8-alpine
    environment:
      CLICKHOUSE_DB: analytics
      CLICKHOUSE_USER: default
      CLICKHOUSE_PASSWORD: clickhouse
    ports:
      - "8123:8123"
      - "9000:9000"
    volumes:
      - clickhouse-data:/var/lib/clickhouse
    networks:
      - microcommerce

  # Observability Stack
  jaeger:
    image: jaegertracing/all-in-one:1.50
    ports:
      - "16686:16686"
      - "4318:4318"
    environment:
      COLLECTOR_OTLP_ENABLED: true
    networks:
      - microcommerce

  prometheus:
    image: prom/prometheus:v2.47.0
    volumes:
      - ./infrastructure/observability/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    networks:
      - microcommerce

  grafana:
    image: grafana/grafana:10.1.0
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./infrastructure/observability/grafana:/etc/grafana/provisioning
    networks:
      - microcommerce

  # Services
  auth-service:
    build:
      context: .
      dockerfile: services/auth-service/Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:postgres@auth-db:5432/auth
      JWT_SECRET: your-secret-key
      REDIS_URL: redis://redis:6379
    ports:
      - "3000:3000"
    depends_on:
      - auth-db
      - redis
    networks:
      - microcommerce

  orders-service:
    build:
      context: .
      dockerfile: services/orders-service/Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:postgres@orders-db:5432/orders
      KAFKA_BROKERS: kafka:9092
      REDIS_URL: redis://redis:6379
      OTEL_EXPORTER_OTLP_ENDPOINT: http://jaeger:4318
    ports:
      - "3002:3000"
    depends_on:
      - orders-db
      - kafka
      - redis
    networks:
      - microcommerce

  inventory-service:
    build:
      context: .
      dockerfile: services/inventory-service/Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:postgres@inventory-db:5432/inventory
      KAFKA_BROKERS: kafka:9092
    ports:
      - "3003:3000"
    depends_on:
      - inventory-db
      - kafka
    networks:
      - microcommerce

  payment-service:
    build:
      context: .
      dockerfile: services/payment-service/Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:postgres@payment-db:5432/payment
      KAFKA_BROKERS: kafka:9092
    depends_on:
      - payment-db
      - kafka
    networks:
      - microcommerce

  shipping-service:
    build:
      context: .
      dockerfile: services/shipping-service/Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:postgres@shipping-db:5432/shipping
      KAFKA_BROKERS: kafka:9092
    depends_on:
      - shipping-db
      - kafka
    networks:
      - microcommerce

  analytics-service:
    build:
      context: .
      dockerfile: services/analytics-service/Dockerfile
    environment:
      CLICKHOUSE_URL: http://clickhouse:8123
      KAFKA_BROKERS: kafka:9092
    ports:
      - "3004:3000"
    depends_on:
      - clickhouse
      - kafka
    networks:
      - microcommerce

  bff-service:
    build:
      context: .
      dockerfile: services/bff-service/Dockerfile
    environment:
      ORDERS_SERVICE_URL: orders-service:3000
      INVENTORY_SERVICE_URL: inventory-service:3000
      SHIPPING_SERVICE_URL: shipping-service:3000
      REDIS_URL: redis://redis:6379
    ports:
      - "3005:3000"
    depends_on:
      - orders-service
      - inventory-service
      - shipping-service
    networks:
      - microcommerce

networks:
  microcommerce:
    driver: bridge

volumes:
  auth-db-data:
  orders-db-data:
  inventory-db-data:
  payment-db-data:
  shipping-db-data:
  clickhouse-data:
  grafana-data:
```

## Conclusões

Projeto MicroCommerce representa implementação prática abrangente de arquitetura de microsserviços integrando conceitos fundamentais apresentados nas dez aulas da disciplina. Sistema demonstra pragmaticamente desafios e soluções de sistemas distribuídos incluindo comunicação síncrona via gRPC e assíncrona mediante Apache Kafka, persistência distribuída com Database per Service, coordenação de transações através de Saga Pattern com compensações automáticas, separação de responsabilidades mediante CQRS e Event Sourcing, agregação performática via Backend for Frontend, garantias de idempotência prevenindo duplicação de operações críticas, observabilidade distribuída proporcionando visibilidade end-to-end através de OpenTelemetry e Jaeger, e resiliência mediante Circuit Breaker e degradação graciosa.

Stack tecnológica selecionada balanceia maturidade com modernidade, utilizando NestJS como framework enterprise-grade fornecendo arquitetura modular e dependency injection nativo, TypeScript garantindo type safety end-to-end, Zod schemas oferecendo validação declarativa com inferência automática de tipos, pnpm workspaces organizando monorepo eficientemente, PostgreSQL como banco transacional robusto, Apache Kafka como plataforma de streaming distribuída, gRPC proporcionando comunicação binária performática, e Scalar modernizando documentação OpenAPI. Estrutura faseada de implementação permite compreensão incremental começando por fundamentos de comunicação entre serviços e progressivamente adicionando complexidade mediante padrões sofisticados de coordenação distribuída, fornecendo caminho pedagógico claro para absorção gradual de conceitos avançados.

Trade-offs inerentes a microsserviços manifestam-se claramente através de complexidade operacional substancial exigindo orquestração de múltiplos bancos de dados, gerenciamento de message broker, configuração de API Gateway, e instrumentação abrangente para observabilidade, porém benefícios de escalabilidade granular, isolamento de falhas, heterogeneidade tecnológica e desenvolvimento paralelo justificam investimento em organizações com domínios de negócio bem definidos e maturidade em DevOps. Projeto não apenas implementa padrões técnicos mas também demonstra princípios arquiteturais fundamentais como separação de responsabilidades mediante bounded contexts, acoplamento fraco através de comunicação baseada em eventos, consistência eventual aceitando temporalidade na propagação de mudanças, e resiliência mediante redundância e tolerância a falhas parciais.

Valor pedagógico do projeto reside em materialização tangível de conceitos abstratos frequentemente compreendidos superficialmente quando apresentados exclusivamente através de diagramas e teoria, permitindo experimentação prática com debugging distribuído, análise de traces percorrendo múltiplos serviços, injeção de falhas validando resiliência, e observação de compensações automáticas restaurando consistência mediante falhas parciais. Estrutura modular facilita extensões futuras incluindo integração com service mesh como Istio para comunicação service-to-service mTLS, adoção de Kubernetes para orquestração em produção, implementação de API versioning para evolução de contratos sem breaking changes, e exploração de padrões avançados como Circuit Breaker adaptativo aprendendo dinamicamente thresholds baseando-se em comportamento histórico.

## Referências Bibliográficas

1. Richardson, C. (2018). *Microservices Patterns: With examples in Java*. Manning Publications. Obra fundamental apresentando padrões arquiteturais essenciais incluindo Database per Service, Saga Pattern, API Gateway e CQRS com exemplos práticos.

2. Newman, S. (2021). *Building Microservices: Designing Fine-Grained Systems* (2nd ed.). O'Reilly Media. Guia abrangente cobrindo decomposição de monolitos, comunicação entre serviços, gestão de dados distribuídos e deployment.

3. Kleppmann, M. (2017). *Designing Data-Intensive Applications*. O'Reilly Media. Fundamentos de sistemas distribuídos incluindo replicação, particionamento, transações distribuídas e consistência.

4. Vernon, V. (2013). *Implementing Domain-Driven Design*. Addison-Wesley Professional. Apresentação detalhada de agregados, eventos de domínio, bounded contexts e Event Sourcing.

5. Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley. Padrões fundamentais aplicáveis em microsserviços incluindo Command, Observer e Strategy.

6. NestJS Documentation. (2024). *NestJS - A progressive Node.js framework*. https://docs.nestjs.com/. Documentação oficial do framework NestJS cobrindo módulos, providers, controllers, microservices e GraphQL.

7. Apache Kafka Documentation. (2024). *Apache Kafka - A distributed streaming platform*. https://kafka.apache.org/documentation/. Documentação oficial do Apache Kafka incluindo produtores, consumidores, exactly-once semantics e Kafka Streams.

8. OpenTelemetry Documentation. (2024). *OpenTelemetry - Cloud Native Computing Foundation*. https://opentelemetry.io/docs/. Especificação e documentação de OpenTelemetry para observabilidade distribuída.

9. Kong Inc. (2024). *Kong Gateway Documentation*. https://docs.konghq.com/. Documentação oficial do Kong Gateway incluindo plugins, roteamento e autenticação.

10. Zod Documentation. (2024). *Zod - TypeScript-first schema validation*. https://zod.dev/. Documentação oficial da biblioteca Zod para validação tipada.

## Apêndice A: Comandos Úteis

### Inicialização do Projeto

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/microcommerce.git
cd microcommerce

# Instalar dependências com pnpm
pnpm install

# Iniciar infraestrutura com Docker Compose
docker-compose up -d

# Aguardar serviços ficarem healthy
docker-compose ps

# Executar migrations de bancos de dados
pnpm run migrate:all

# Seed de dados iniciais
pnpm run seed:all

# Iniciar todos serviços em modo desenvolvimento
pnpm run dev
```

### Gerenciamento de Serviços

```bash
# Iniciar serviço específico
pnpm --filter auth-service dev

# Build de todos serviços
pnpm run build

# Executar testes
pnpm run test

# Executar testes com coverage
pnpm run test:cov

# Lint de código
pnpm run lint

# Format de código
pnpm run format
```

### Kafka

```bash
# Criar tópicos
docker-compose exec kafka kafka-topics \
  --create --topic orders.created \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

# Listar tópicos
docker-compose exec kafka kafka-topics \
  --list --bootstrap-server localhost:9092

# Consumir mensagens de tópico
docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic orders.created \
  --from-beginning
```

### gRPC

```bash
# Gerar código TypeScript de arquivos .proto
pnpm run proto:generate

# Testar endpoint gRPC com grpcurl
grpcurl -plaintext \
  -d '{"products": [{"product_id": "123", "quantity": 2}]}' \
  localhost:50051 \
  inventory.InventoryService/CheckAvailability
```

### Banco de Dados

```bash
# Conectar ao PostgreSQL de serviço específico
docker-compose exec auth-db psql -U postgres -d auth

# Executar query
docker-compose exec auth-db psql -U postgres -d auth \
  -c "SELECT * FROM users LIMIT 10;"

# Dump de banco de dados
docker-compose exec auth-db pg_dump -U postgres auth > backup.sql

# Restore de banco de dados
docker-compose exec -T auth-db psql -U postgres auth < backup.sql
```

### Observabilidade

```bash
# Visualizar traces no Jaeger
open http://localhost:16686

# Visualizar métricas no Prometheus
open http://localhost:9090

# Visualizar dashboards no Grafana
open http://localhost:3001

# Consultar logs de serviço específico
docker-compose logs -f orders-service
```

## Apêndice B: Troubleshooting Comum

### Kafka Broker Indisponível

**Sintoma**: Erro `KafkaJSBrokerNotFound: Cannot find broker in cluster`

**Solução**:
```bash
# Reiniciar Kafka e Zookeeper
docker-compose restart zookeeper kafka

# Aguardar 30 segundos
sleep 30

# Verificar logs
docker-compose logs kafka
```

### PostgreSQL Connection Refused

**Sintoma**: Erro `connect ECONNREFUSED 127.0.0.1:5432`

**Solução**:
```bash
# Verificar se container está rodando
docker-compose ps auth-db

# Reiniciar container
docker-compose restart auth-db

# Verificar variáveis de ambiente no serviço
docker-compose exec auth-service env | grep DATABASE_URL
```

### gRPC Deadline Exceeded

**Sintoma**: Erro `DEADLINE_EXCEEDED: Deadline exceeded`

**Solução**:
```typescript
// Aumentar deadline em cliente gRPC
const client = new InventoryServiceClient(
  'inventory-service:50051',
  credentials.createInsecure(),
  {
    'grpc.max_receive_message_length': -1,
    'grpc.max_send_message_length': -1,
  }
);

// Timeout de 5 segundos
const deadline = new Date();
deadline.setSeconds(deadline.getSeconds() + 5);

client.checkAvailability(request, { deadline }, callback);
```

### OpenTelemetry Traces Não Aparecem

**Sintoma**: Traces não visualizados em Jaeger

**Solução**:
```bash
# Verificar se Jaeger está acessível
curl http://localhost:16686

# Verificar exportação em serviço
docker-compose logs orders-service | grep -i otel

# Validar configuração de endpoint
docker-compose exec orders-service env | grep OTEL_EXPORTER_OTLP_ENDPOINT

# Reiniciar serviço com logging debug
OTEL_LOG_LEVEL=debug pnpm --filter orders-service dev
```

## Glossário e Termos Técnicos

**Aggregate**: Padrão Domain-Driven Design representando cluster de objetos de domínio tratados como unidade única para mudanças de estado, garantindo consistência transacional mediante raiz do agregado.

**Apache Kafka**: Plataforma de streaming distribuída fornecendo message broker baseado em log commit distribuído com retenção configurável e particionamento para paralelização.

**API Gateway**: Padrão arquitetural implementando ponto de entrada único centralizado para sistema de microsserviços, assumindo responsabilidade de roteamento, autenticação, rate limiting e políticas transversais.

**Backend for Frontend (BFF)**: Padrão arquitetural onde camada intermediária especializada agrega dados de múltiplos microsserviços customizando payloads para diferentes tipos de cliente como mobile e web.

**Circuit Breaker**: Padrão de resiliência protegendo sistema contra falhas em cascata bloqueando temporariamente requisições a serviços consistentemente falhando baseando-se em thresholds configuráveis.

**ClickHouse**: Banco de dados colunar orientado para agregações analíticas performáticas em grandes volumes de dados temporais com compressão eficiente.

**Compensating Transaction**: Operação semântica inversa de transação original capaz de desfazer efeitos lógicos mediante falha em transação distribuída, utilizada em Saga Pattern.

**CQRS (Command Query Responsibility Segregation)**: Padrão arquitetural separando modelos de escrita modificando estado transacional de leitura consultando projeções desnormalizadas otimizadas.

**Database per Service**: Princípio arquitetural estabelecendo que cada microsserviço deve possuir controle exclusivo sobre armazenamento de dados, comunicando-se com outros serviços exclusivamente através de APIs.

**Event Sourcing**: Padrão de persistência armazenando sequência imutável de eventos representando mudanças de estado ao invés de sobrescrever estado atual, permitindo reconstrução temporal e auditoria completa.

**Event Store**: Banco de dados otimizado para armazenamento append-only de eventos imutáveis com ordenação determinística mediante números de sequência incrementais.

**gRPC**: Framework de Remote Procedure Call desenvolvido pelo Google utilizando HTTP/2 e Protocol Buffers para serialização binária eficiente com contratos fortemente tipados.

**GraphQL**: Linguagem de query permitindo clientes especificarem exatamente campos necessários eliminando over-fetching e under-fetching comum em REST APIs.

**Idempotency Key**: Identificador único acompanhando operação garantindo que execuções múltiplas com parâmetros idênticos produzem resultado equivalente à execução única.

**Jaeger**: Sistema de tracing distribuído open-source desenvolvido pela Uber implementando especificação OpenTracing para visualização de requisições end-to-end.

**JSON Web Key Set (JWKS)**: Especificação RFC 7517 publicando chaves públicas criptográficas através de endpoint JSON permitindo validação distribuída de JWT sem compartilhamento de segredos.

**JSON Web Token (JWT)**: Padrão RFC 7519 representando claims transferidos entre partes como objeto JSON assinado criptograficamente garantindo integridade.

**Kafka Consumer Group**: Conjunto de consumidores compartilhando carga de processamento de tópico mediante atribuição exclusiva de partições a cada membro do grupo.

**Kong Gateway**: API Gateway open-source baseado em Nginx oferecendo plugins para autenticação, rate limiting, transformação de requisições e observabilidade.

**NestJS**: Framework progressivo Node.js inspirado em Angular fornecendo arquitetura modular com dependency injection, decorators e suporte first-class para microsserviços.

**OpenTelemetry**: Framework vendor-neutral unificado para observabilidade fornecendo APIs e SDKs padronizados para traces, métricas e logs com auto-instrumentação.

**Orchestration**: Modelo de coordenação de Saga Pattern onde serviço central gerencia workflow completo através de comandos diretos enviados a cada participante mantendo estado de execução.

**Projection**: Representação materializada derivada de eventos armazenados em Event Store, construindo View Tables desnormalizadas otimizadas para queries específicas em arquitetura CQRS.

**Protocol Buffers (Protobuf)**: Formato de serialização binária desenvolvido pelo Google oferecendo schemas fortemente tipados com code generation para múltiplas linguagens.

**Redis**: Armazenamento de estruturas de dados in-memory open-source utilizado como cache distribuído, message broker e banco de dados com persistence opcional.

**Saga Pattern**: Padrão coordenando transações distribuídas como sequência de transações locais com compensating transactions permitindo reversão mediante falhas sem coordenação two-phase commit bloqueante.

**Scalar**: Interface moderna de documentação OpenAPI substituindo Swagger UI com renderização performática e design contemporâneo.

**Snapshot**: Serialização periódica de estado completo de agregado em Event Sourcing permitindo reconstrução começar a partir de snapshot mais recente aplicando apenas eventos subsequentes.

**Soft Reference**: Identificador referenciando entidade em serviço externo sem constraint de integridade do banco de dados, permitindo acoplamento fraco em arquitetura distribuída.

**W3C Trace Context**: Especificação padronizando propagação de contexto de rastreamento através de headers HTTP incluindo `traceparent` e `tracestate` para correlação distribuída.

**Zod**: Biblioteca TypeScript-first para declaração e validação de schemas com inferência automática de tipos estáticos a partir de schemas runtime.
