<!-- markdownlint-disable -->

# `pnpm` Catalogs - Gerenciamento Centralizado de Dependências

## Introdução

A partir da versão 9.5, o pnpm introduziu o recurso **Catalogs**, que centraliza o gerenciamento de versões de dependências em monorepos. Este documento explica como funciona este recurso e como foi implementado neste projeto.

## Conceito

Catalogs resolve um problema comum em monorepos: manter versões consistentes de dependências compartilhadas entre múltiplos pacotes. Antes dos catalogs, cada `package.json` precisava declarar explicitamente a versão de cada dependência, levando a:

- Duplicação de código
- Inconsistências de versão
- Conflitos de merge frequentes
- Dificuldade em upgrades de dependências

## Como Funciona

### 1. Definição do Catalog

As versões são definidas centralmente no arquivo `pnpm-workspace.yaml`:

```yaml
packages:
  - 'services/*'
  - 'packages/*'

catalog:
  '@nestjs/common': ^11.1.9
  '@nestjs/core': ^11.1.9
  typescript: ^5.9.3
  zod: ^4.1.13
```

### 2. Referência nos Package.json

Os pacotes referenciam o catalog usando o protocolo `catalog:`:

```json
{
  "dependencies": {
    "@nestjs/common": "catalog:",
    "@nestjs/core": "catalog:",
    "zod": "catalog:"
  }
}
```

### 3. Resolução Automática

Durante a instalação, o pnpm:
1. Lê as entradas do catalog em `pnpm-workspace.yaml`
2. Substitui `catalog:` pela versão definida no catalog
3. Instala as dependências normalmente
4. Cria hard links para o store global

### 4. Comportamento em Publicação

Ao executar `pnpm publish` ou `pnpm pack`, o protocolo `catalog:` é automaticamente substituído pela versão real, permitindo a publicação no registry.

## Implementação neste Projeto

### Estrutura do Catalog

O catalog foi organizado em categorias para facilitar a manutenção:

```yaml
catalog:
  # NestJS Core
  '@nestjs/common': ^11.1.9
  '@nestjs/core': ^11.1.9
  '@nestjs/config': ^4.0.2

  # Database
  typeorm: ^0.3.27
  pg: ^8.16.3

  # Auth
  passport: ^0.7.0
  jwks-rsa: ^3.2.0
  argon2: ^0.44.0

  # Utilities
  winston: ^3.18.3
  zod: ^4.1.13
```

### Uso em Services

Exemplo do `auth-service/package.json`:

```json
{
  "name": "@services/auth-service",
  "dependencies": {
    "@nestjs/common": "catalog:",
    "@nestjs/core": "catalog:",
    "@packages/common-utils": "workspace:*",
    "typeorm": "catalog:",
    "argon2": "catalog:"
  }
}
```

Note a combinação de dois protocolos:
- `catalog:` para dependências externas (npm registry)
- `workspace:*` para pacotes internos do monorepo

## Vantagens

### 1. Single Source of Truth

Todas as versões são definidas em um único local (`pnpm-workspace.yaml`), eliminando inconsistências.

### 2. Redução de Conflitos de Merge

Ao atualizar uma dependência, apenas o `pnpm-workspace.yaml` é modificado. Os `package.json` permanecem inalterados, evitando conflitos em pull requests.

### 3. Upgrades Simplificados

Atualizar uma dependência em todo o monorepo requer alterar apenas uma linha:

```diff
catalog:
-  zod: ^4.1.13
+  zod: ^4.2.0
```

### 4. Economia de Espaço

O pnpm já usa hard links para economizar espaço. Com catalogs, garante-se que todos os pacotes usem exatamente a mesma versão, maximizando a deduplicação.

### 5. Prevenção de Versões Duplicadas

Sem catalogs, é fácil ter `zod@4.1.13` em um service e `zod@4.1.10` em outro. Catalogs previnem isso automaticamente.

## Diferenças com Outros Protocolos

### workspace: vs catalog:

```json
{
  "dependencies": {
    "@packages/common-utils": "workspace:*",
    "@nestjs/common": "catalog:"
  }
}
```

- `workspace:*`: Para pacotes internos do monorepo (em `packages/`)
- `catalog:`: Para dependências externas (npm registry)

### Versões Fixas vs Catalog

```json
{
  "dependencies": {
    "lodash": "4.17.21",
    "zod": "catalog:"
  }
}
```

- Versão fixa: Hardcoded no `package.json`
- Catalog: Versão gerenciada centralmente

## Boas Práticas

### 1. Versões Consistentes

Sempre use as versões que o pnpm já resolveu no `package.json` da raiz ao criar o catalog:

```bash
# Verificar versões instaladas
cat package.json | grep "@nestjs/common"
```

### 2. Organização por Categoria

Agrupe dependências relacionadas no catalog:

```yaml
catalog:
  # NestJS Core
  '@nestjs/common': ^11.1.9

  # Database
  typeorm: ^0.3.27
```

### 3. Comentários Descritivos

Use comentários para documentar o propósito de cada seção do catalog.

### 4. Não Instalar Manualmente

Evite comandos como `pnpm add package@1.0.0` que podem criar inconsistências. Sempre atualize primeiro o catalog, depois execute `pnpm install`.

## Comandos Úteis

### Instalar Dependências

```bash
pnpm install
```

### Atualizar Dependência no Catalog

1. Edite `pnpm-workspace.yaml`:
```yaml
catalog:
  zod: ^4.2.0  # Versão atualizada
```

2. Execute:
```bash
pnpm install
```

### Verificar Versões Instaladas

```bash
pnpm list --depth=0
```

### Adicionar Nova Dependência ao Catalog

1. Adicione ao `pnpm-workspace.yaml`:
```yaml
catalog:
  axios: ^1.7.9
```

2. Adicione aos `package.json` dos services que precisam:
```json
{
  "dependencies": {
    "axios": "catalog:"
  }
}
```

3. Execute `pnpm install`

## Estrutura Resultante

Após `pnpm install`, a estrutura de `node_modules` é:

```
f2_n11_microservices/
├── node_modules/
│   └── .pnpm/  (hard links para ~/.pnpm-store)
├── services/
│   ├── auth-service/
│   │   └── node_modules/  (symlinks)
│   ├── orders-service/
│   │   └── node_modules/  (symlinks)
│   ├── inventory-service/
│   │   └── node_modules/  (symlinks)
│   └── analytics-service/
│       └── node_modules/  (symlinks)
```

Cada `node_modules` nos services contém apenas symlinks, economizando 70-90% de espaço em disco.

## Referências

- [pnpm Catalogs Documentation](https://pnpm.io/catalogs)
- [pnpm 9.5 Release Notes](https://github.com/pnpm/pnpm/releases/tag/v9.5.0)
- [pnpm Workspaces](https://pnpm.io/workspaces)
