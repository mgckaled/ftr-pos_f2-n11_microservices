# Plano de Implementação: API Gateway

## Objetivo

Criar um API Gateway na porta 4000 que centraliza o acesso aos 4 microsserviços existentes, agregando documentação e implementando tratamento básico de erros.

## Decisões de Arquitetura

### Roteamento
Proxy HTTP simples usando http-proxy-middleware

### Autenticação
Pass-through - gateway não valida JWT, serviços continuam validando independentemente

### Documentação
Scalar UI centralizada apenas no gateway com OpenAPI spec manual

### Error Handling
Tratamento de erros críticos: 401/403 (auth) e 502 (bad gateway)

## Estrutura do Serviço

```
services/api-gateway/
├── src/
│   ├── main.ts                          # Bootstrap + proxies
│   ├── app.module.ts                    # Módulo raiz
│   ├── filters/
│   │   └── http-exception.filter.ts     # Error handler
│   └── config/
│       └── proxy.config.ts              # URLs dos serviços
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env.example
```

## Configuração de Proxies

O gateway irá rotear requisições baseado em prefixos:

- `/auth/*` → Auth Service (porta 3000)
- `/orders/*` → Orders Service (porta 3001)
- `/inventory/*` → Inventory Service (porta 3002)
- `/analytics/*` → Analytics Service (porta 3004)

## Headers Forwardados

- `Authorization`: Token JWT para autenticação
- `x-correlation-id`: Rastreamento de requisições
- `Content-Type`: Tipo de conteúdo
- `Accept`: Formato de resposta aceito

## Tratamento de Erros

### Bad Gateway (502)
Retornado quando:
- Serviço backend está fora do ar (ECONNREFUSED)
- Timeout de conexão (ETIMEDOUT)
- Serviço não encontrado (ENOTFOUND)

### Auth Errors (401/403)
Capturados e logados, mas repassados do backend sem modificação

## Documentação Agregada

OpenAPI spec manual no endpoint `/api-docs` com Scalar UI incluindo:
- Todos endpoints de Auth Service
- Todos endpoints de Orders Service
- Todos endpoints de Inventory Service
- Todos endpoints de Analytics Service

## Dependências Novas

- `http-proxy-middleware: ^3.0.0`
- `@types/http-proxy: ^1.17.15`

## Modificações em Arquivos Existentes

### pnpm-workspace.yaml
Adicionar http-proxy-middleware e @types/http-proxy ao catalog

### docker-compose.yml
Adicionar serviço api-gateway com dependências dos 4 serviços

## Ordem de Implementação

1. Atualizar pnpm-workspace.yaml
2. Criar estrutura de diretórios
3. Criar arquivos de configuração
4. Implementar código fonte
5. Criar Dockerfile
6. Atualizar docker-compose.yml
7. Instalar dependências
8. Testar localmente
9. Testar no Docker

## Configuração Dinâmica

Assim como os outros serviços, o gateway usará NODE_ENV para determinar URLs:
- `development`: localhost com portas específicas
- `docker`: nomes de containers na rede interna

## Endpoints do Gateway

- `GET /api-docs` - Documentação Scalar UI
- `POST /auth/register` - Proxy para auth-service
- `POST /auth/login` - Proxy para auth-service
- `POST /orders` - Proxy para orders-service
- `GET /orders/:id` - Proxy para orders-service
- `GET /inventory/products` - Proxy para inventory-service
- `POST /inventory/reserve` - Proxy para inventory-service
- `GET /analytics/daily-summary` - Proxy para analytics-service

## Portas Utilizadas

- 3000: Auth Service
- 3001: Orders Service
- 3002: Inventory Service
- 3004: Analytics Service
- **4000: API Gateway** (novo)

## Observações Importantes

- Gateway não adiciona lógica de negócio
- Não valida payloads (validação nos serviços)
- Não transforma requests/responses
- Logging de todas requisições proxied
- Preserva prefixos de rota originais
