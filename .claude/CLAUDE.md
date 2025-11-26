# Orientações Gerais / Regras Claude Code

## Contexto do Repositório

Repositório pessoal de registro, referência e suporte para fins de aprendizado, consulta e acompanhamento da disciplina de Fundamentos de Microsserviços (Nível 11), Fase 2 (Estratégia e Inovação), do curso de Pós-Graduação Tech Developer 360, desenvolvido pela Faculdade de Tecnologia Rocketseat (FTR).

## Configurações Atuais (Setup meu Notebook)

- SystemInfo:
  - WindowsVersion: 2009
  - Windows 10 Home Single Language v22H2 (compilação 19045.6575)
  - OsArchitecture: 64 bits
  - CsProcessors: {Intel(R) Core(TM) i5-8265U CPU @1.60GHz}
  - CsTotalPhysicalMemory : 16977367040

- WSL:
  - Versão do WSL: 2.6.1.0
  - Versão do kernel: 6.6.87.2-1
  - Versão do WSLg: 1.0.66
  - Versão do MSRDC: 1.2.6353
  - Versão do Direct3D: 1.611.1-81528511
  - Versão do DXCore: 10.0.26100.1-240331-1435.ge-release
  - Versão do Windows: 10.0.19045.657

- Node v22.16.0 (minha máquina)

- pnpm v10.23.0

- Docker Desktop v4.52.0

## Recomendações para criação de artefatos markdown (`.md`)

- Focar na didática, aprendizado e explicação.
- Usar linguagem culta e formal
- Considerar detalhes do contexto dos resumos das aulas, transcrições e referências recomendadas
- Priorizar elaboração de texto mais dissertativos e extensos, para inclusão de contexto e explicações mais didáticas e elaboradas.
- Limite de linhas: 1000.
- Incluir na primeira linha/topo do artefato: `<!-- markdownlint-disable -->`
- Priorizar exemplos de códigos em `typescript`
- Padrão de tópicos:
    1. Resumo executivo
    2. Introção e Conceitos
    3. Conteúdo em si (maior parte do documento)
    4. Conclusões
    5. Referências Bibliográficas (de fontes relevantes e oficiais)
    6. Apendice (O que achar necessário como complemento + último apêndice: Glossário e Termos Técnicos)

## Recomendações Gerais

- Obedeça a formatação/lint na geração de arquivos markdown (`.md`)
- NÃO USAR emojis em quaisquer documentos `.md` gerados
- commits detalhados, porém não muito extensos.
- após a conclusão uma atividade, escreva um breve texto dentro do chat de no MÁXIMO DUAS LINHAS (objetivo: economizar tokens em mensagens finais)
- não faça nenhum tipo de referências ao Claude Code nos texto de commit. sempre remover. ex: 🤖 Generated with [ClaudeCode](https://claude.com/claude-code) Co-Authored-By: Claude <noreply@anthropic.com>".
