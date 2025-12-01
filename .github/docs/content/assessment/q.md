<!-- markdownlint-disable -->

# Qeustionário Avaliativo: Microsserviços

## Questão 1

**Pergunta:** Além de rotear requisições, quais duas funcionalidades transversais (que se aplicam a vários serviços) podem ser centralizadas no API Gateway para evitar duplicação de lógica?

**Resposta Correta:** Opção 1 - Rate Limiting (limitação de taxa de requisições por usuário) e Autenticação (validação de tokens JWT).

**Justificativa:**
O API Gateway serve como ponto único de entrada para todas as requisições externas em uma arquitetura de microsserviços. Centralizar funcionalidades transversais (cross-cutting concerns) no Gateway é uma prática recomendada para evitar duplicação de código e garantir consistência. Rate Limiting e Autenticação são exemplos clássicos de preocupações transversais que se aplicam a múltiplos serviços da aplicação.

Implementar essas funcionalidades no API Gateway significa que cada serviço individual não precisa reimplementar a lógica de validação de tokens JWT ou controle de taxa de requisições, reduzindo complexidade, facilitando manutenção e garantindo que políticas de segurança sejam aplicadas uniformemente em toda a aplicação. O Gateway pode validar tokens, aplicar limites de taxa por usuário ou IP, e só então rotear requisições válidas para os serviços apropriados.

**Alternativas Incorretas:**

- **Opção 2:** Geração de relatórios e envio de e-mails transacionais - Estas são funcionalidades de domínio específico que devem residir em serviços dedicados, não são preocupações transversais apropriadas para o Gateway.

- **Opção 3:** Lógica de negócio específica do domínio e regras de validação de formulários - Lógica de negócio deve permanecer nos microsserviços individuais. O Gateway deve ser agnóstico ao domínio e focar apenas em preocupações de infraestrutura.

- **Opção 4:** Conexão com o banco de dados e execução de migrations - O API Gateway não deve acessar bancos de dados diretamente. Esta responsabilidade pertence aos microsserviços individuais que gerenciam seus próprios dados.

---

## Questão 2

**Pergunta:** O que é idempotência no contexto de microsserviços e qual problema ela visa resolver?

**Resposta Correta:** Opção 1 - Idempotência é um princípio que garante que o processamento de uma mesma mensagem (ou requisição) várias vezes produza o mesmo resultado que processá-la uma única vez, resolvendo o problema de operações duplicadas acidentalmente (como criar o mesmo registro duas vezes).

**Justificativa:**
Idempotência é um conceito fundamental em sistemas distribuídos e microsserviços. Em ambientes distribuídos, falhas de rede, timeouts e retentativas são inevitáveis. Sem idempotência, uma mesma operação pode ser executada múltiplas vezes devido a retentativas automáticas, resultando em efeitos colaterais indesejados como registros duplicados, cobranças múltiplas ou estados inconsistentes.

Uma operação idempotente pode ser executada várias vezes sem alterar o resultado além da primeira aplicação. Por exemplo, criar um pedido com ID específico deveria resultar no mesmo pedido, independentemente de quantas vezes a requisição seja processada. Implementar idempotência geralmente envolve técnicas como usar identificadores únicos (idempotency keys), verificar se uma operação já foi executada antes de processá-la novamente, ou usar operações naturalmente idempotentes (como PUT em REST). Isso garante resiliência e confiabilidade em arquiteturas distribuídas.

**Alternativas Incorretas:**

- **Opção 2:** Idempotência é o processo de garantir que todos os serviços estejam usando a mesma versão de uma biblioteca - Isso se refere a gerenciamento de dependências e versionamento, não tem relação com idempotência.

- **Opção 3:** Idempotência refere-se à habilidade de um serviço escalar horizontalmente - Isso descreve escalabilidade horizontal, não idempotência. São conceitos completamente diferentes.

- **Opção 4:** Idempotência é a capacidade de um serviço responder rapidamente a requisições - Isso descreve performance e latência, não tem relação com o conceito de idempotência.

---

## Questão 3

**Pergunta:** Qual é o principal desafio no consumo de dados por parte do cliente (front-end) em uma arquitetura de microsserviços, que o padrão Backend for Frontend (BFF) visa resolver?

**Resposta Correta:** Opção 3 - A necessidade de o front-end fazer múltiplas requisições a diferentes serviços (Orders, Invoices, etc.) e depois ter que combinar (fazer "merge") essas informações por conta própria para montar uma única tela.

**Justificativa:**
O padrão Backend for Frontend (BFF) resolve um dos principais desafios de microsserviços para aplicações cliente. Em uma arquitetura de microsserviços, os dados necessários para renderizar uma única tela frequentemente estão distribuídos entre vários serviços. Sem um BFF, o front-end precisaria fazer múltiplas chamadas HTTP para diferentes serviços, aguardar todas as respostas e então agregar esses dados localmente antes de apresentá-los ao usuário.

O BFF atua como uma camada intermediária especializada que conhece as necessidades específicas de um cliente (web, mobile, etc.) e realiza a orquestração e agregação de dados no backend. Ele faz as múltiplas chamadas aos microsserviços, combina os resultados em um formato otimizado para aquele cliente específico e retorna uma resposta consolidada. Isso reduz o número de requisições do cliente, diminui a latência percebida, reduz o consumo de dados em dispositivos móveis e simplifica significativamente a lógica do front-end, permitindo que cada tipo de cliente tenha uma API otimizada para suas necessidades específicas.

**Alternativas Incorretas:**

- **Opção 1:** A latência causada pela comunicação entre o API Gateway e os serviços internos - Embora o BFF possa ajudar com latência, este não é o problema principal que ele resolve. A latência de comunicação interna é mais uma questão de infraestrutura.

- **Opção 2:** A falta de uma linguagem de consulta padronizada para buscar dados - Isso descreve problemas que GraphQL resolve, não especificamente o padrão BFF. São abordagens complementares mas distintas.

- **Opção 4:** A dificuldade de autenticar o usuário em múltiplos serviços - Autenticação é tipicamente resolvida com tokens JWT e serviços de autenticação centralizados, não é o foco principal do padrão BFF.

---

## Questão 4

**Pergunta:** De acordo com a aula, qual é a regra fundamental sobre persistência de dados em uma arquitetura de microsserviços e qual desafio isso introduz?

**Resposta Correta:** Opção 1 - Cada serviço deve ter seu próprio banco de dados (ou estrutura de persistência), introduzindo o desafio de manter a consistência e, por vezes, a necessidade de duplicar dados entre os serviços.

**Justificativa:**
Um dos princípios fundamentais de microsserviços é o isolamento de dados - cada serviço deve possuir e gerenciar seu próprio banco de dados. Este princípio garante baixo acoplamento entre serviços, permitindo que equipes trabalhem independentemente, escolham a tecnologia de persistência mais adequada para seu domínio específico e escalem seus dados de forma independente. Também permite que serviços evoluam seu schema de dados sem afetar outros serviços.

Entretanto, esta abordagem introduz desafios significativos de consistência de dados. Como não há transações ACID distribuídas simples entre bancos de dados diferentes, manter dados sincronizados entre serviços requer técnicas como event sourcing, sagas, eventual consistency e, às vezes, duplicação estratégica de dados. Por exemplo, um serviço de pedidos pode precisar manter uma cópia do nome do cliente (originalmente no serviço de clientes) para exibir informações básicas sem fazer chamadas síncronas constantes. Este trade-off entre autonomia e consistência é inerente à arquitetura de microsserviços.

**Alternativas Incorretas:**

- **Opção 2:** Apenas um serviço pode ter banco de dados, outros consultam via API - Isso criaria um ponto único de falha e acoplamento excessivo, contrariando os princípios de microsserviços.

- **Opção 3:** Os serviços podem compartilhar bancos de dados com esquemas diferentes - Compartilhar bancos de dados, mesmo com esquemas diferentes, cria acoplamento e viola o princípio de isolamento de dados.

- **Opção 4:** Todos devem usar uma única instância de banco de dados - Isso é arquitetura monolítica, não microsserviços. Viola completamente o princípio de independência entre serviços.

---

## Questão 5

**Pergunta:** Em uma arquitetura de microsserviços, qual é a abordagem recomendada para gerenciar a autenticação dos usuários?

**Resposta Correta:** Opção 3 - Um serviço centralizado e especializado em Autenticação (Auth) é responsável por gerar os tokens (ex: JWT), enquanto os outros serviços apenas validam esses tokens.

**Justificativa:**
A abordagem recomendada para autenticação em microsserviços é ter um serviço de autenticação centralizado e especializado. Este serviço é responsável por verificar credenciais do usuário, gerenciar sessões e emitir tokens de autenticação (tipicamente JWT - JSON Web Tokens). Uma vez autenticado, o usuário recebe um token assinado que contém informações básicas de identidade e permissões.

Os demais microsserviços não precisam reimplementar lógica de autenticação ou manter uma base de usuários/senhas. Eles apenas validam a assinatura do token JWT usando a chave pública do serviço de autenticação, verificam se o token não expirou e extraem as informações necessárias (ID do usuário, roles, etc.). Esta abordagem centraliza a complexidade de autenticação em um único lugar, facilita a implementação de funcionalidades como multi-factor authentication, single sign-on (SSO) e gestão de sessões, enquanto mantém os outros serviços simples e focados em suas responsabilidades de domínio. O token JWT pode ser transmitido facilmente entre serviços, permitindo que o contexto de autenticação seja propagado através de chamadas distribuídas.

**Alternativas Incorretas:**

- **Opção 1:** Autenticação no nível do banco de dados - Bancos de dados verificam credenciais de conexão, não usuários finais da aplicação. Esta abordagem seria inadequada e insegura.

- **Opção 2:** Front-end gera o token de autenticação - Seria extremamente inseguro permitir que o cliente gere seus próprios tokens. O cliente não pode ser confiável para operações de segurança críticas.

- **Opção 4:** Cada serviço tem sua própria lógica de autenticação e chave secreta - Isso causaria duplicação massiva de código, inconsistências de segurança, dificuldade de manutenção e fragmentação da experiência do usuário.

---

## Questão 6

**Pergunta:** Qual é o principal desafio de observabilidade em uma arquitetura de microsserviços em comparação com um monólito, e qual conceito é introduzido para resolvê-lo?

**Resposta Correta:** Opção 1 - O desafio é que uma única ação do usuário pode gerar um fluxo complexo e não linear de requisições (síncronas e assíncronas) entre vários serviços. O conceito para resolver isso é o Tracing Distribuído.

**Justificativa:**
Em um sistema monolítico, rastrear o fluxo de uma requisição é relativamente simples - tudo acontece em um único processo com uma pilha de chamadas linear. Em microsserviços, uma única ação do usuário pode iniciar uma cadeia complexa de eventos: o API Gateway roteia para um serviço, que chama outros serviços sincronamente, que publicam eventos assíncronos, que são consumidos por mais serviços, gerando um grafo de execução distribuído e não-linear através de múltiplos processos, máquinas e até data centers.

O Tracing Distribuído resolve este desafio propagando um identificador único (trace ID) através de toda a cadeia de requisições e eventos. Cada serviço registra suas operações associadas a este trace ID, criando "spans" que representam unidades de trabalho. Ferramentas como Jaeger, Zipkin ou OpenTelemetry coletam esses spans e reconstroem toda a jornada da requisição, permitindo visualizar o fluxo completo, identificar gargalos de performance, detectar falhas em cascata e entender o comportamento do sistema distribuído. Sem tracing distribuído, diagnosticar problemas em microsserviços seria extremamente difícil, exigindo correlação manual de logs dispersos.

**Alternativas Incorretas:**

- **Opção 2:** Comunicação lenta entre serviços, solução gRPC - Embora gRPC possa melhorar performance, não resolve o problema fundamental de observabilidade em sistemas distribuídos.

- **Opção 3:** Dificuldade de fazer deploy, solução API Gateway - API Gateway resolve roteamento e preocupações transversais, não observabilidade. Deploy é resolvido com CI/CD e orquestração.

- **Opção 4:** Alto consumo de memória, solução bancos de dados eficientes - Isso aborda otimização de recursos, não observabilidade. São preocupações completamente distintas.

---

## Questão 7

**Pergunta:** Qual das seguintes afirmações melhor descreve a principal característica da arquitetura de microsserviços, conforme abordado na aula?

**Resposta Correta:** Opção 1 - A arquitetura de microsserviços é principalmente uma arquitetura de infraestrutura, onde os serviços são independentemente implantáveis e podem utilizar tecnologias diferentes.

**Justificativa:**
A principal característica que define microsserviços é ser uma arquitetura de infraestrutura focada na independência de deploy e heterogeneidade tecnológica. Cada microsserviço é uma unidade independente que pode ser desenvolvida, testada, implantada e escalada de forma autônoma, sem afetar outros serviços. Esta independência permite que diferentes equipes trabalhem em paralelo sem conflitos de integração.

A liberdade tecnológica é outra característica fundamental - cada serviço pode usar a linguagem de programação, framework, banco de dados e ferramentas mais adequadas para seu domínio específico. Um serviço de processamento de imagens pode usar Python com bibliotecas especializadas, enquanto um serviço de alta performance pode usar Go ou Rust, e um serviço de relatórios pode usar Java com JasperReports. Esta flexibilidade permite otimização por contexto, adoção gradual de novas tecnologias e atrai talentos especializados. O foco está em como os serviços são organizados, comunicados e implantados na infraestrutura, não em impor padrões de código ou tecnologia.

**Alternativas Incorretas:**

- **Opção 2:** Todos os serviços devem compartilhar o mesmo banco de dados - Esta afirmação contradiz diretamente o princípio fundamental de isolamento de dados em microsserviços.

- **Opção 3:** Impacta na arquitetura do código exigindo mesma linguagem - Microsserviços promovem heterogeneidade tecnológica, não uniformidade. Cada serviço pode usar linguagens diferentes.

- **Opção 4:** Principal vantagem é simplificação da consistência de dados - Na verdade, microsserviços COMPLICAM a consistência de dados. A vantagem está na escalabilidade e autonomia, não em simplificação de consistência.

---

## Questão 8

**Pergunta:** No contexto do Saga Pattern, o que é uma "ação de compensação" (compensating action)?

**Resposta Correta:** Opção 4 - É uma ação que tem como objetivo reverter ou anular os efeitos de uma ação anterior que foi bem-sucedida, caso a transação geral falhe em um passo futuro.

**Justificativa:**
O Saga Pattern é uma solução para gerenciar transações distribuídas em microsserviços, onde não podemos usar transações ACID tradicionais que abrangem múltiplos bancos de dados. Uma saga é uma sequência de transações locais, onde cada transação atualiza um único serviço e publica um evento ou mensagem para acionar a próxima transação na sequência.

Quando uma etapa da saga falha, não podemos simplesmente fazer rollback de uma transação distribuída. Em vez disso, usamos ações de compensação - operações que desfazem ou mitigam os efeitos das transações já concluídas. Por exemplo, em uma saga de pedido: (1) reservar inventário, (2) processar pagamento, (3) criar pedido. Se o passo 3 falhar, precisamos executar compensações: cancelar o pagamento (compensação do passo 2) e liberar o inventário (compensação do passo 1). Importante notar que compensações não são necessariamente operações inversas exatas - podem ser aproximações que mantêm a consistência eventual do sistema. Este padrão permite manter consistência em sistemas distribuídos sem locks distribuídos ou coordenadores centralizados.

**Alternativas Incorretas:**

- **Opção 1:** É a ação principal que executa a lógica de negócio - Isso descreve as transações locais normais da saga, não as ações de compensação.

- **Opção 2:** Envia notificação de sucesso quando saga é concluída - Notificações são efeitos colaterais opcionais, não fazem parte do mecanismo de compensação para lidar com falhas.

- **Opção 3:** Tenta executar novamente uma operação que falhou - Isso descreve retry/tentativa, que é uma estratégia diferente. Compensação desfaz ações já completadas, não reexecuta ações falhadas.
