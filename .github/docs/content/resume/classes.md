# Resumo Aulas - Fundamentos de Microsserviços

## 1. Microsserviços: Prós e Contras

Nessa aula, vamos explorar os fundamentos dos microserviços, desmistificando conceitos e abordando mitos, vantagens e desvantagens dessa arquitetura. Microserviços são mais sobre infraestrutura do que sobre código, permitindo que serviços funcionem de forma independente. Discutiremos como modelar serviços em torno de domínios de negócios e a importância do Domain Driven Design. Também falaremos sobre escalabilidade, desenvolvimento paralelo e os desafios que surgem, como a consistência de dados e a complexidade na comunicação entre serviços.

## 2. Comunicação em Microsserviços

Nesta aula, discutimos a comunicação entre microserviços, utilizando um projeto prático que deixei no GitHub. Abordamos a importância da independência dos serviços e como protocolos de comunicação, como HTTP e gRPC, são utilizados. Exploramos a comunicação assíncrona com ferramentas como Kafka e RabbitMQ, que permitem que serviços publiquem e assinem mensagens, garantindo que mesmo que um serviço esteja fora do ar, as informações não sejam perdidas. Mostrei também como tipar mensagens usando TypeScript para garantir a integridade dos dados.

## 3. Persistência em Microsserviços

Na aula de hoje, discutimos a persistência de dados em microserviços, um desafio crucial. Cada serviço deve ter seu próprio banco de dados, o que pode levar à duplicação de dados. Expliquei como, ao emitir um pedido, precisamos de informações do cliente para gerar uma nota fiscal, mas não é necessário duplicar todos os dados. Abordei a importância de referências entre serviços e como usamos eventos para manter a integridade dos dados. Também deixei materiais adicionais na pasta "docs" para aprofundar o tema.

## 4. Autenticação em Microsserviços

Na aula de hoje, discutimos a autenticação em microserviços, abordando a necessidade de um serviço dedicado para gerar e validar tokens, como o JWT. Expliquei a diferença entre chaves simétricas e assimétricas, destacando a importância de usar uma chave privada para criar tokens e uma chave pública para validação. Para evitar a repetição de chaves em múltiplos serviços, sugeri a implementação de um endpoint que fornece a chave pública. Também mencionei o fluxo de autorização e a validação de tokens em serviços como Shortener e Analytics.

## 5. Fundamento API Gateway

Na aula de hoje, exploramos o conceito de API Gateway, essencial para gerenciar a comunicação entre o front-end e múltiplos microsserviços. Em vez de o front-end fazer requisições individuais para cada serviço, ele se comunica apenas com o API Gateway, que redireciona as chamadas para os serviços corretos. Também discutimos como o API Gateway pode implementar funcionalidades como rate limiting e autenticação, simplificando a validação de usuários. Utilizamos o Kong como exemplo de implementação e configuramos rotas para os serviços de autenticação, encurtamento de URLs e analytics.

## 6. Tracing Distribuído

Nesta aula, discutimos a importância da observabilidade em sistemas de microserviços. Diferente de um monolito, onde as requisições seguem um fluxo linear, nos microserviços, as chamadas podem ser assíncronas e complexas. Abordei o conceito de tracing distribuído, onde uma requisição é identificada por um ID único que a acompanha por todos os serviços. Mostrei como usar o OpenTelemetry para instrumentação automática em Node.js, permitindo rastrear operações sem modificar o código. Também mencionei ferramentas como Jaeger e Grafana para visualização dos traces.

## 7. Idempotência

Nesta aula, discutimos o conceito de idempotência, essencial para quem trabalha com back-end. Expliquei como, ao criar uma URL encurtada, um evento é enviado ao Kafka e processado pelo sistema de Analytics. Abordei a importância de evitar reprocessamentos desnecessários, utilizando um ID único para cada evento, que garante que, se uma mensagem for recebida novamente, não será processada outra vez. Esse conceito é crucial em sistemas distribuídos e é um dos fundamentos que você deve dominar ao avançar em microserviços.

## 8. Saga Pattern

Hoje, falamos sobre o Saga Pattern, um conceito essencial em microserviços. Ele ajuda a gerenciar transações complexas, onde uma falha em um serviço pode exigir um rollback em outros. Usamos o exemplo de um e-commerce, onde a criação de um pedido pode falhar ao emitir uma nota fiscal. O Saga permite orquestrar essas operações, garantindo que, se algo der errado, as ações anteriores sejam revertidas. Mostrei como implementar isso usando um orquestrador para gerenciar os passos e compensações necessárias.

## 9. Backend for Frontend

Na aula de hoje, explorei como os microserviços se comunicam e como os dados são consumidos. Abordei o desafio de combinar informações de diferentes serviços, como pedidos e faturas, e a complexidade que isso traz ao front-end. Introduzi o conceito de Backend for Frontend (BFF), que é uma solução para otimizar essa comunicação, criando um serviço que centraliza as requisições e formata os dados conforme a necessidade do front-end. Na próxima aula, vou apresentar outra abordagem para resolver esse problema.

## 10. CQRS e Event Sourcing

Nesta aula, exploramos o padrão CQRS (Command Query Responsibility Segregation) e como ele ajuda a gerenciar dados em microserviços. Discutimos a separação das responsabilidades de comandos (operações de escrita) e consultas (leitura). Mostrei como usar View Tables para otimizar a leitura de dados e introduzi o conceito de Event Sourcing, onde armazenamos eventos em vez de estados finais. Essa abordagem, quando combinada com CQRS, melhora a performance e a estrutura do sistema.
