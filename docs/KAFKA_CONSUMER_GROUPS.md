# Kafka Consumer Groups e Rebalanceamento

## Visão Geral

Este documento explica o comportamento de consumer groups do Apache Kafka, especialmente os logs de rebalanceamento e reconexão que aparecem durante a execução dos microsserviços.

## Consumer Groups

### Conceito

Um consumer group é um conjunto de consumidores que trabalham juntos para processar mensagens de um ou mais tópicos Kafka. Cada partição de um tópico é atribuída a exatamente um consumidor dentro do grupo.

### Identificação

Cada consumer group possui um ID único. No projeto:

- `inventory-service-group`: Consumidores do serviço de inventário
- `analytics-orders-created-consumer`: Consumidor de eventos de criação de pedidos
- `analytics-orders-confirmed-consumer`: Consumidor de eventos de confirmação de pedidos
- `analytics-orders-cancelled-consumer`: Consumidor de eventos de cancelamento de pedidos

## Rebalanceamento de Grupos

### Definição

Rebalanceamento é o processo pelo qual o Kafka redistribui partições entre os consumidores de um grupo quando ocorrem mudanças na composição do grupo.

### Gatilhos de Rebalanceamento

1. **Novo consumidor ingressa no grupo**
2. **Consumidor deixa o grupo** (shutdown gracioso ou falha)
3. **Timeout de heartbeat** (consumidor considerado morto)
4. **Mudanças nas partições do tópico**
5. **Reconfiguração de subscrição**

### Processo de Rebalanceamento

```
1. Consumidor detecta necessidade de rebalanceamento
2. Todos os consumidores param de processar mensagens
3. Coordenador do grupo reatribui partições
4. Consumidores retomam processamento com novas atribuições
```

## Logs Comuns e Seus Significados

### The group is rebalancing, so a rejoin is needed

**Categoria:** Informativo

**Causa:**
- Um novo consumidor entrou no grupo
- Um consumidor existente saiu do grupo
- Timeout de heartbeat detectado

**Ação do Kafka:**
- Pausar consumo de mensagens
- Redistribuir partições entre membros ativos
- Retomar consumo após conclusão

**Impacto:** Latência temporária no processamento de mensagens durante rebalanceamento.

**Exemplo de Log:**

```json
{
  "level": "WARN",
  "timestamp": "2025-11-27T22:02:19.825Z",
  "logger": "kafkajs",
  "message": "[Runner] The group is rebalancing, re-joining",
  "groupId": "inventory-service-group",
  "memberId": "inventory-service-5abc092d-3001-4c1c-9912-197d4c9fb7d9",
  "error": "The group is rebalancing, so a rejoin is needed"
}
```

### The coordinator is not aware of this member

**Categoria:** Erro recuperável

**Causa:**
- Heartbeat timeout expirou
- Coordenador do grupo reiniciou
- Conexão de rede instável
- Período de inatividade prolongado

**Ação do Kafka:**
- Consumidor automaticamente se reconecta
- Participa de novo rebalanceamento
- Recebe nova atribuição de partições

**Impacto:** Reconexão automática sem intervenção manual.

**Exemplo de Log:**

```json
{
  "level": "ERROR",
  "timestamp": "2025-11-27T22:29:20.013Z",
  "logger": "kafkajs",
  "message": "[Connection] Response Heartbeat(key: 12, version: 3)",
  "broker": "localhost:9092",
  "clientId": "inventory-service",
  "error": "The coordinator is not aware of this member",
  "correlationId": 213
}
```

### Consumer has joined the group

**Categoria:** Informativo

**Significado:**
- Consumidor concluiu processo de entrada no grupo
- Partições foram atribuídas
- Processamento pode iniciar/retomar

**Informações Relevantes:**
- `isLeader`: Indica se este consumidor é o líder do grupo
- `memberAssignment`: Partições atribuídas a este consumidor
- `groupProtocol`: Algoritmo de distribuição usado (RoundRobinAssigner, RangeAssigner)

**Exemplo de Log:**

```json
{
  "level": "INFO",
  "timestamp": "2025-11-27T22:29:23.071Z",
  "logger": "kafkajs",
  "message": "[ConsumerGroup] Consumer has joined the group",
  "groupId": "inventory-service-group",
  "memberId": "inventory-service-2748444f-3e6a-4c91-b90d-08b2b5180dd2",
  "leaderId": "inventory-service-2748444f-3e6a-4c91-b90d-08b2b5180dd2",
  "isLeader": true,
  "memberAssignment": {"orders.cancelled": [0]},
  "groupProtocol": "RoundRobinAssigner",
  "duration": 3053
}
```

## Configurações de Timeout

### session.timeout.ms

**Padrão:** 10000 (10 segundos)

**Descrição:** Tempo máximo sem heartbeat antes do consumidor ser considerado morto.

**Impacto:**
- Valores baixos: Detecção rápida de falhas, mais rebalanceamentos
- Valores altos: Detecção lenta de falhas, menos rebalanceamentos

### heartbeat.interval.ms

**Padrão:** 3000 (3 segundos)

**Descrição:** Intervalo entre heartbeats enviados ao coordenador.

**Recomendação:** Deve ser menor que `session.timeout.ms / 3`.

### max.poll.interval.ms

**Padrão:** 300000 (5 minutos)

**Descrição:** Tempo máximo entre chamadas de poll() antes do consumidor ser considerado travado.

**Uso:** Proteção contra consumidores lentos que param de processar mensagens.

## Padrões de Consumer Group no Projeto

### Inventory Service

**Group ID:** `inventory-service-group`

**Tópicos Subscritos:**
- `orders.confirmed`
- `orders.cancelled`

**Observação:** Múltiplos consumidores no mesmo grupo compartilham partições.

### Analytics Service

**Grupos Distintos por Tópico:**

1. `analytics-orders-created-consumer` → `orders.created`
2. `analytics-orders-confirmed-consumer` → `orders.confirmed`
3. `analytics-orders-cancelled-consumer` → `orders.cancelled`

**Vantagem:** Isolamento de consumidores permite processamento independente.

## Comportamento em Desenvolvimento vs Produção

### Desenvolvimento Local

**Características:**
- Reinicializações frequentes de serviços
- Rebalanceamentos mais comuns
- Logs visíveis no console
- Conexões podem ficar ociosas

**Expectativa:** Logs de rebalanceamento são normais e esperados.

### Produção

**Características:**
- Serviços estáveis com menos reinicializações
- Rebalanceamentos menos frequentes
- Monitoramento via agregação de logs
- Conexões ativas constantemente

**Expectativa:** Rebalanceamentos ocasionais durante deploys ou falhas.

## Estratégias de Particionamento

### RoundRobinAssigner

**Funcionamento:** Distribui partições uniformemente entre consumidores em ordem circular.

**Vantagens:**
- Distribuição equilibrada de carga
- Simples de entender

**Desvantagens:**
- Pode causar rebalanceamento completo

### RangeAssigner

**Funcionamento:** Atribui partições consecutivas a cada consumidor.

**Vantagens:**
- Menos movimentação durante rebalanceamento
- Localidade de dados preservada

**Desvantagens:**
- Distribuição pode ser desigual

### StickyAssigner

**Funcionamento:** Minimiza movimentação de partições durante rebalanceamento.

**Vantagens:**
- Melhor para consumidores com estado
- Reduz overhead de rebalanceamento

## Idempotência e Processamento

### Garantias do Kafka

**At-least-once:** Mensagens podem ser processadas mais de uma vez após rebalanceamento.

**Exactly-once:** Requer configuração adicional (transações e processamento idempotente).

### Implementação no Projeto

```typescript
// Tabela processed_events garante idempotência
@Entity()
export class ProcessedEvent {
  @PrimaryColumn('uuid')
  event_id: string

  @Column()
  event_type: string

  @Column()
  consumer_name: string

  @CreateDateColumn()
  processed_at: Date
}
```

**Estratégia:**
- Cada evento possui ID único
- Antes de processar, verificar se event_id já existe
- Se existir, ignorar processamento (mensagem duplicada)
- Se não existir, processar e registrar event_id

## Monitoramento e Observabilidade

### Métricas Importantes

1. **Rebalance Rate:** Frequência de rebalanceamentos
2. **Consumer Lag:** Atraso no processamento de mensagens
3. **Heartbeat Response Time:** Latência de comunicação com coordenador
4. **Partition Assignment:** Distribuição de partições por consumidor

### Logs Críticos vs Informativos

**Informativos (podem ser ignorados):**
- `Consumer has joined the group`
- `The group is rebalancing`

**Atenção (investigar se frequentes):**
- `The coordinator is not aware of this member`

**Críticos (requerem ação imediata):**
- `Connection permanently failed`
- `Group authorization failed`

## Troubleshooting

### Rebalanceamentos Excessivos

**Sintomas:** Logs de rebalanceamento a cada poucos segundos.

**Causas Possíveis:**
- Processamento muito lento (excede `max.poll.interval.ms`)
- Network instável
- Coordenador reiniciando frequentemente

**Soluções:**
- Aumentar `max.poll.interval.ms`
- Otimizar processamento de mensagens
- Verificar conectividade de rede

### Consumidor Não Recebe Mensagens

**Sintomas:** Mensagens publicadas mas não consumidas.

**Causas Possíveis:**
- Partições não atribuídas ao consumidor
- Consumer group com múltiplos consumidores
- Offset já avançado além das mensagens

**Soluções:**
- Verificar `memberAssignment` nos logs
- Confirmar número de partições vs número de consumidores
- Reset de offset se necessário

### Duplicação de Mensagens

**Sintomas:** Mesma mensagem processada múltiplas vezes.

**Causas Possíveis:**
- Rebalanceamento durante processamento
- Falha antes de commit de offset
- Configuração `at-least-once`

**Soluções:**
- Implementar processamento idempotente
- Usar tabela de eventos processados
- Considerar transações Kafka para `exactly-once`

## Referências

- Apache Kafka Documentation: Consumer Groups
- KafkaJS Documentation: Consumer API
- Confluent: Understanding Rebalance Protocol
- Martin Kleppmann: Designing Data-Intensive Applications

## Comandos Úteis

### Listar Consumer Groups

```bash
docker exec f2_n11_microservices-kafka-1 kafka-consumer-groups \
  --bootstrap-server localhost:9092 --list
```

### Descrever Consumer Group

```bash
docker exec f2_n11_microservices-kafka-1 kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --group inventory-service-group \
  --describe
```

### Resetar Offset de Consumer Group

```bash
docker exec f2_n11_microservices-kafka-1 kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --group inventory-service-group \
  --topic orders.confirmed \
  --reset-offsets --to-earliest \
  --execute
```

### Listar Tópicos

```bash
docker exec f2_n11_microservices-kafka-1 kafka-topics \
  --bootstrap-server localhost:9092 --list
```
