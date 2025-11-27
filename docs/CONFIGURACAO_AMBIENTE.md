# Configuração de Ambiente

## Visão Geral

Este documento descreve o processo de configuração das variáveis de ambiente necessárias para execução da aplicação de microsserviços.

## Estrutura de Arquivos de Ambiente

O projeto utiliza arquivos `.env` em dois níveis:

- **Raiz do projeto**: Arquivo `.env` centralizador com todas as variáveis de ambiente
- **Serviços individuais**: Cada microsserviço possui seu próprio arquivo `.env` local

## Geração de Chaves JWT

As chaves RSA para assinatura de tokens JWT devem ser geradas antes da execução dos serviços de autenticação.

### Processo Automatizado

Execute o script de geração de chaves a partir da raiz do projeto:

```bash
node scripts/generate-jwt-keys.js
```

### Resultado da Execução

O script realiza as seguintes operações:

1. Gera um par de chaves RSA de 2048 bits
2. Exibe as chaves no console
3. Cria automaticamente o arquivo `services/auth-service/.env` com as chaves formatadas

## Configuração dos Arquivos de Ambiente

### 1. Arquivo da Raiz

Copie o arquivo `.env.example` da raiz para `.env`:

```bash
cp .env.example .env
```

Atualize as variáveis `JWT_PRIVATE_KEY` e `JWT_PUBLIC_KEY` com as chaves geradas pelo script.

### 2. Serviços Individuais

#### Auth Service

O arquivo `.env` é gerado automaticamente pelo script. Não são necessárias alterações manuais.

#### Orders Service

```bash
cp services/orders-service/.env.example services/orders-service/.env
```

#### Inventory Service

```bash
cp services/inventory-service/.env.example services/inventory-service/.env
```

#### Analytics Service

```bash
cp services/analytics-service/.env.example services/analytics-service/.env
```

## Validação de Tokens JWT

Os serviços Orders e Inventory utilizam o padrão JWKS (JSON Web Key Set) para validação de tokens. A configuração `AUTH_JWKS_URI` aponta para o endpoint do Auth Service que expõe a chave pública.

## Variáveis de Ambiente por Serviço

### Auth Service

- `PORT`: Porta de execução (padrão: 3000)
- `DATABASE_URL`: String de conexão PostgreSQL
- `JWT_PRIVATE_KEY`: Chave privada RSA para assinatura de tokens
- `JWT_PUBLIC_KEY`: Chave pública RSA para validação de tokens

### Orders Service

- `PORT`: Porta de execução (padrão: 3001)
- `DATABASE_URL`: String de conexão PostgreSQL
- `KAFKA_BROKERS`: Endereços dos brokers Kafka
- `REDIS_URL`: URL de conexão Redis
- `AUTH_JWKS_URI`: URI do endpoint JWKS do Auth Service
- `INVENTORY_SERVICE_URL`: URL do serviço de inventário

### Inventory Service

- `PORT`: Porta de execução (padrão: 3002)
- `DATABASE_URL`: String de conexão PostgreSQL
- `KAFKA_BROKERS`: Endereços dos brokers Kafka
- `REDIS_URL`: URL de conexão Redis
- `AUTH_JWKS_URI`: URI do endpoint JWKS do Auth Service

### Analytics Service

- `PORT`: Porta de execução (padrão: 3004)
- `DATABASE_URL`: String de conexão PostgreSQL
- `KAFKA_BROKERS`: Endereços dos brokers Kafka

## Considerações de Segurança

- Arquivos `.env` não devem ser versionados no Git
- As chaves JWT geradas são sensíveis e devem ser mantidas em sigilo
- Em ambiente de produção, utilize gerenciadores de secrets apropriados
- Mantenha credenciais de banco de dados e serviços em local seguro
