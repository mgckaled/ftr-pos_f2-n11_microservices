# Solucao: Erro docker-credential-desktop no Windows

## Problema Encontrado

Durante a tentativa de build das imagens Docker, o seguinte erro ocorria:

```bash
failed to solve: error getting credentials - err: exec: "docker-credential-desktop": executable file not found in %PATH%, out: ``
```

## Causa Raiz

O arquivo `~/.docker/config.json` estava configurado com:

```json
{
  "credsStore": "desktop"
}
```

Essa configuracao aponta para o executavel `docker-credential-desktop.exe`, que nao estava disponivel no PATH do sistema. Isso e comum em instalacoes do Docker Desktop no Windows/WSL2 quando ha problemas de configuracao de credenciais.

## Solucoes Tentadas

### 1. Link Simbolico (WSL2)

Tentativa de criar um link simbolico do executavel do Windows para o WSL:

```bash
sudo ln -sf "/mnt/c/Program Files/Docker/Docker/resources/bin/docker-credential-desktop.exe" /usr/local/bin/docker-credential-desktop
```

**Resultado**: Nao funcionou porque o Docker Desktop roda no Windows, nao no WSL.

### 2. Remocao do credsStore (Solucao Aplicada)

Backup do arquivo original e remocao da propriedade `credsStore`:

```bash
cp ~/.docker/config.json ~/.docker/config.json.backup.20251127_222707
```

Novo `config.json` sem `credsStore`:

```json
{
  "auths": {},
  "currentContext": "desktop-linux",
  "plugins": {
    "-x-cli-hints": {
      "enabled": "true"
    },
    "debug": {
      "hooks": "exec"
    },
    "scout": {
      "hooks": "pull,buildx build"
    }
  },
  "features": {
    "hooks": "true"
  }
}
```

**Resultado**: Funcionou perfeitamente!

## Problema Adicional: Build do API Gateway

Apos resolver o erro de credenciais, surgiu um novo problema durante o build do API Gateway:

```bash
Error: Cannot find module '/app/services/api-gateway/node_modules/typescript/bin/tsc'
```

### Causa

O TypeScript estava instalado no workspace raiz (`/app/node_modules`), mas o comando `tsc` no script de build procurava localmente em `/app/services/api-gateway/node_modules`.

### Solucao Aplicada no Dockerfile

Alterado de:

```dockerfile
WORKDIR /app/services/api-gateway
RUN pnpm build
```

Para:

```dockerfile
WORKDIR /app/services/api-gateway
RUN ../../node_modules/.bin/tsc
```

Essa alteracao aponta diretamente para o executavel do TypeScript no workspace raiz.

### Alteracao no package.json

Alterado o script de build de `tsc` para `npx tsc`:

```json
{
  "scripts": {
    "build": "npx tsc"
  }
}
```

## Impacto nas Imagens e Containers Existentes

A remocao do `credsStore` **NAO afeta**:

- Imagens Docker existentes
- Containers em execucao
- Volumes
- Networks

A mudanca apenas altera como as credenciais de login do Docker Registry sao armazenadas. Em vez de usar o helper do Docker Desktop, as credenciais serao armazenadas diretamente no `config.json` (base64).

## Resultado Final

- API Gateway buildado com sucesso
- Container rodando na porta 4000
- Documentacao Scalar disponivel em <http://localhost:4000/reference>
- Todos os proxies funcionando corretamente

## Comandos para Restauracao (se necessario)

Caso deseje restaurar a configuracao original:

```bash
cp ~/.docker/config.json.backup.20251127_222707 ~/.docker/config.json
```

## Referencias

- Stack Overflow: exec docker-credential-desktop.exe executable file not found in PATH
- Docker Community Forums: docker-credential-desktop.exe executable file not found using wsl2
- Spark By Examples: How to Solve docker-credential-desktop executable file not found in PATH
