# Execução Docker e Local

## Visão Geral

Este documento descreve as diferentes estratégias de execução dos microsserviços, explicando as peculiaridades entre ambiente Docker e desenvolvimento local.

## Arquitetura de Execução

O projeto suporta dois modos de execução distintos:

### Modo 1: Desenvolvimento Local (Híbrido)

Infraestrutura em containers Docker e serviços rodando diretamente na máquina host.

**Componentes:**

- **Docker**: PostgreSQL, Kafka, Zookeeper, Redis
- **Host (pnpm dev)**: Auth Service, Orders Service, Inventory Service, Analytics Service

**Vantagens:**

- Debugging facilitado com ferramentas de desenvolvimento
- Hot reload automático durante desenvolvimento
- Logs acessíveis diretamente no terminal
- Menor consumo de recursos

**Configuração:**

```bash
# Subir apenas infraestrutura
docker-compose up -d zookeeper kafka auth-db orders-db inventory-db analytics-db redis

# Executar serviços localmente
pnpm dev
```

### Modo 2: Full Docker

Toda a stack executando em containers Docker.

**Componentes:**

- **Docker**: Todos os serviços de infraestrutura e aplicação

**Vantagens:**

- Ambiente idêntico à produção
- Isolamento completo entre serviços
- Fácil distribuição e replicação

**Configuração:**

```bash
# Subir toda a stack
docker-compose up -d
```

## Resolução de Nomes

### Contexto Docker

Containers na mesma rede Docker resolvem nomes através do DNS interno:

```env
DATABASE_URL=postgresql://postgres:postgres@auth-db:5432/auth
KAFKA_BROKERS=kafka:9092
REDIS_URL=redis://redis:6379
```

Os nomes `auth-db`, `kafka`, `redis` são resolvidos automaticamente pela rede `microservices-net`.

### Contexto Local (Host)

Aplicações rodando fora do Docker não têm acesso ao DNS interno. Utilizam mapeamento de portas:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth
KAFKA_BROKERS=localhost:9092
REDIS_URL=redis://localhost:6379
```

O `docker-compose.yml` expõe as portas para o host através da diretiva `ports`.

## Mapeamento de Portas

### Infraestrutura

| Serviço | Porta Container | Porta Host | Protocolo |
|---------|----------------|------------|-----------|
| auth-db | 5432 | 5432 | PostgreSQL |
| orders-db | 5432 | 5433 | PostgreSQL |
| inventory-db | 5432 | 5434 | PostgreSQL |
| analytics-db | 5432 | 5435 | PostgreSQL |
| kafka | 9092 | 9092 | Kafka |
| redis | 6379 | 6379 | Redis |

### Aplicações

| Serviço | Porta Container | Porta Host | Protocolo |
|---------|----------------|------------|-----------|
| auth-service | 3000 | 3000 | HTTP |
| orders-service | 3001 | 3001 | HTTP |
| inventory-service | 3002 | 3002 | HTTP |
| analytics-service | 3003 | 3003 | HTTP |

## Configuração Dinâmica

Os serviços implementam detecção automática de ambiente através da variável `NODE_ENV`.

### Variável NODE_ENV

```env
# Desenvolvimento local
NODE_ENV=development

# Execução em Docker
NODE_ENV=docker
```

### Lógica de Conexão

```typescript
const isDocker = configService.get('NODE_ENV') === 'docker'
const dbHost = isDocker ? 'auth-db' : 'localhost'
const dbPort = isDocker ? 5432 : configService.get('DB_PORT', 5432)

const dbUrl = configService.get('DATABASE_URL') ||
  `postgresql://postgres:postgres@${dbHost}:${dbPort}/auth`
```

A aplicação ajusta automaticamente:

- Hostname do banco de dados
- Porta de conexão
- URLs de serviços dependentes

### Prioridade de Configuração

1. Variável `DATABASE_URL` explícita (maior prioridade)
2. Construção dinâmica baseada em `NODE_ENV`
3. Valores padrão de fallback

## Networking Docker

### Rede Interna

```yaml
networks:
  microservices-net:
    driver: bridge
```

Todos os containers compartilham a rede `microservices-net`, permitindo comunicação direta através de nomes de serviço.

### DNS Interno

O Docker Engine fornece resolução DNS automática:

- `auth-db` → IP do container PostgreSQL (porta 5432)
- `kafka` → IP do container Kafka (porta 9092)
- `redis` → IP do container Redis (porta 6379)

### Comunicação Host-Container

O host acessa containers através de `localhost` e portas mapeadas:

- `localhost:5432` → `auth-db:5432`
- `localhost:9092` → `kafka:9092`
- `localhost:6379` → `redis:6379`

## Health Checks

Os serviços de infraestrutura implementam health checks para garantir disponibilidade:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

Serviços dependentes aguardam health checks bem-sucedidos:

```yaml
depends_on:
  auth-db:
    condition: service_healthy
```

## Volumes Persistentes

Dados de banco são persistidos em volumes nomeados:

```yaml
volumes:
  auth-db-data:
  orders-db-data:
  inventory-db-data:
  analytics-db-data:
```

Os dados sobrevivem a reinicializações de containers, mas são removidos com `docker-compose down -v`.

## Comandos Úteis

### Gerenciamento de Containers

```bash
# Iniciar serviços
docker-compose up -d

# Parar serviços
docker-compose down

# Ver logs
docker-compose logs -f [service-name]

# Reconstruir imagens
docker-compose build

# Limpar volumes (CUIDADO: remove dados)
docker-compose down -v
```

### Monitoramento

```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Inspecionar rede
docker network inspect f2_n11_microservices_microservices-net
```

## Troubleshooting

### Erro: Cannot connect to database

**Causa**: Serviço tentando conectar ao hostname Docker fora da rede Docker.

**Solução**: Verificar `NODE_ENV=development` no arquivo `.env`.

### Erro: Port already in use

**Causa**: Porta já ocupada por outro processo.

**Solução**: Identificar e encerrar processo ou alterar mapeamento de portas no `docker-compose.yml`.

### Erro: Connection refused

**Causa**: Container não está pronto ou health check falhou.

**Solução**: Aguardar health checks ou verificar logs com `docker-compose logs [service]`.

## Considerações de Segurança

### Desenvolvimento

- Credenciais padrão (`postgres:postgres`) aceitáveis
- Portas expostas para facilitar acesso
- `synchronize: true` para auto-migração de schema

### Produção

- Usar secrets management (HashiCorp Vault, AWS Secrets Manager)
- Restringir exposição de portas
- Desabilitar `synchronize` e usar migrations
- Implementar TLS/SSL para comunicação
- Configurar redes isoladas por função

## Referências

- Docker Compose: Orchestração de containers multi-serviço
- Docker Networks: Comunicação entre containers
- TypeORM: ORM para Node.js com suporte a PostgreSQL
- NestJS ConfigModule: Gerenciamento de variáveis de ambiente
