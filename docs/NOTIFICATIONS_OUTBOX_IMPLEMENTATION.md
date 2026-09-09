# 📦 Implementação da Base da Outbox Transacional — BARBEOS

Este documento detalha a implementação técnica da infraestrutura de outbox de notificações transacionais realizada no **BARBEOS** em conformidade com as diretrizes do [docs/NOTIFICATIONS_DESIGN.md](./NOTIFICATIONS_DESIGN.md).

---

## 1. Schema da Tabela `public.notification_outbox`

Criada na migração `supabase/migrations/20260909183000_add_notification_outbox.sql`:

| Coluna | Tipo | Modificadores | Descrição |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador único do evento na fila |
| `barbershop_id` | `uuid` | `NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE` | Isolamento multi-tenant obrigatório |
| `appointment_id` | `uuid` | `NULL REFERENCES appointments(id) ON DELETE CASCADE` | Vínculo relacional com o agendamento |
| `event_type` | `text` | `NOT NULL` (`CHECK constraint`) | Tipo canônico do evento |
| `channel` | `text` | `NOT NULL` (`CHECK constraint`) | Canal lógico (`email`, `whatsapp`, `sms`) |
| `status` | `text` | `NOT NULL DEFAULT 'pending'` (`CHECK constraint`) | Estado da entrega (`pending`, `processing`, `sent`, `failed`, `cancelled`, `dead_letter`) |
| `idempotency_key` | `text` | `NOT NULL UNIQUE` | Chave única estrita de idempotência |
| `scheduled_for` | `timestamptz` | `NOT NULL DEFAULT now()` | Timestamp previsto para o envio |
| `attempt_count` | `integer` | `NOT NULL DEFAULT 0 CHECK (attempt_count >= 0)` | Número de tentativas de despacho realizadas |
| `last_attempt_at` | `timestamptz` | `NULL` | Timestamp da última tentativa |
| `delivered_at` | `timestamptz` | `NULL` | Timestamp de confirmação de entrega |
| `failed_at` | `timestamptz` | `NULL` | Timestamp em que transitou para falha |
| `cancelled_at` | `timestamptz` | `NULL` | Timestamp em que foi cancelado |
| `failure_code` | `text` | `NULL` | Código operacional seguro de erro sanitizado |
| `provider_message_id` | `text` | `NULL` | ID retornado pelo gateway externo |
| `metadata` | `jsonb` | `NOT NULL DEFAULT '{}'::jsonb` | Metadados operacionais não identificáveis (sem PII) |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Data de enfileiramento |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Data da última alteração de estado |

### Índices Criados:
- `idx_notification_outbox_queue`: `(status, scheduled_for) WHERE status IN ('pending', 'failed')` (parcial para varredura ágil do despachante).
- `idx_notification_outbox_shop_created`: `(barbershop_id, created_at DESC)` (para auditoria do proprietário).
- `idx_notification_outbox_appointment_id`: `(appointment_id)` (para consulta operacional no detalhe do agendamento).

---

## 2. Tipos de Eventos Implementados

- **`appointment.created` (IMPLEMENTADO AGORA):**
  - Integrado de forma atômica e transacional na RPC `public.create_public_booking`.
  - O evento só é gravado se a reserva for comitada com sucesso no banco.
  - Conflitos de concorrência (`BOOKING_SLOT_TAKEN`) sofrem rollback completo e nunca gravam outbox.
- **`appointment.cancelled` (IMPLEMENTADO AGORA):**
  - Acionado pelo trigger `trg_appointments_cancellation` quando o `status` do agendamento é alterado para `'cancelled'`.
  - Idempotente: atualizações redundantes não duplicam o evento graças à restrição `UNIQUE (idempotency_key)`.

---

## 3. Tipos de Eventos Postergados (Deferred)

- **`appointment.confirmed` (DEFER — transition path unclear):**
  - Atualmente a agenda transiciona agendamentos diretamente para `in_progress` ao iniciar atendimento. A distinção entre pré-confirmação manual do dono e início do atendimento físico requer alinhamento de produto.
- **`appointment.rescheduled` (DEFER — requires product decision):**
  - Remarcação de agendamentos no momento atual sobrescreve datas sem auditoria prévia. Será implementada juntamente com o fluxo seguro de remarcação pelo cliente.
- **`appointment.reminder_due` (DEFER — requires worker/scheduler):**
  - O cálculo dinâmico de 24h e 2h antes depende da implantação da rotina periódica (scheduler/cron) que fará a varredura das janelas de envio.
- **`appointment.completed` (DEFER — requires provider/consent model):**
  - Envio de pesquisa de satisfação e pós-venda será integrado após o modelo formal de consentimento do cliente.
- **`appointment.no_show` (DEFER — requires product decision):**
  - Notificação de falta depende de política comercial definida por cada estabelecimento.

---

## 4. Modelo de Row Level Security (RLS)

A tabela `public.notification_outbox` possui RLS ativado com política de privilégio mínimo:
- **`anon`:** Acesso 100% negado (sem SELECT, INSERT, UPDATE ou DELETE).
- **Clientes Autenticados:** Acesso direto 100% negado.
- **Profissionais e Recepcionistas:** Sem acesso direto de leitura ou mutação.
- **Proprietários (`owner`):** Acesso exclusivamente de `SELECT` para os registros da sua própria barbearia ativa (`barbershop_members.role = 'owner'`).
- **Mutações (INSERT / UPDATE):** Restritas estritamente à função `public.enqueue_notification_event` executada em modo `SECURITY DEFINER` e futuros despachantes de fila autenticados via service role no servidor.

---

## 5. Estratégia de Idempotência

Formato canônico padronizado:
```text
idempotency_key = <appointment_id | barbershop_id> + ":" + <event_type> + ":" + <channel> + ":" + <delivery_bucket>
```
*Exemplo:* `00000000-0000-0000-0000-000000000002:appointment.created:whatsapp:creation`
- Re-execuções da mesma operação acionam a cláusula `ON CONFLICT (idempotency_key) DO UPDATE SET updated_at = now()`, retornando o registro existente (`is_new = false`) e evitando duplicidade física de eventos na fila.

---

## 6. Controles de Integridade de Tenant (Cross-Tenant Rejection)

Na função `public.enqueue_notification_event`, a integridade entre o estabelecimento e o agendamento é verificada no banco:
```sql
SELECT barbershop_id INTO v_appt_shop_id FROM public.appointments WHERE id = p_appointment_id;
IF v_appt_shop_id != p_barbershop_id THEN
    RAISE EXCEPTION 'OUTBOX_CROSS_TENANT_REJECTED';
END IF;
```
Qualquer tentativa de associar um agendamento a um `barbershop_id` divergente é abortada imediatamente.

---

## 7. Comportamento Sem Provedor (No-Provider Behavior)

A classe `DisabledNotificationProvider` (`src/services/notification-provider.ts`) implementa a interface padrão do provedor:
- `isConfigured(): false`
- `send():` Retorna `{ ok: false, retryable: false, failureCode: "PROVIDER_DISABLED_NOT_CONFIGURED" }`
- **Garantia:** Não executa requisições de rede, não possui SDKs ou credenciais ativas e não bloqueia transações de agendamento na web.

---

## 8. Regras de Metadados Seguros (Zero PII)

O campo `metadata` armazena exclusivamente:
- `event_version`: versão do contrato (ex: `'1.0.0'`)
- `delivery_bucket`: agrupador de entrega (ex: `'creation'`, `'cancellation'`)
- `source_op`: operação originária (ex: `'create_public_booking'`)
- `template_key`: identificador lógico do template de mensagem

> [!CAUTION]
> **Proibição Estrita de Dados Pessoais:**  
> Nomes, telefones, e-mails, observações de clientes, valores de carteira, dados de pagamento ou corpos de mensagens **NUNCA** são persistidos no outbox ou emitidos nos logs.

---

## 9. Integração Futura com Workers / Despachantes

1. O despachante em background executará periodicamente no servidor (Vercel Cron / Supabase Worker):
   ```sql
   SELECT id, barbershop_id, appointment_id, event_type, channel
   FROM public.notification_outbox
   WHERE status IN ('pending', 'failed')
     AND scheduled_for <= now()
     AND attempt_count < 3
   ORDER BY scheduled_for ASC
   LIMIT 20
   FOR UPDATE SKIP LOCKED;
   ```
2. O worker resolve os dados de contato do cliente no momento da execução, monta a mensagem em memória e chama o conector externo aprovado.

---

## 10. Estratégia de Testes

- Testes de migração e RLS via asserções estruturais do DDL.
- Testes unitários cobrindo o provedor desabilitado, chamada RPC de outbox, proteção contra duplicações e minimização de PII em `tests/unit/notification-outbox.test.ts`.
- Testes de regressão cobrindo o agendamento atômico, observabilidade e rotas do sistema.

---

## 11. Plano de Rollback

Caso seja necessário desativar ou reverter a outbox:
1. Os tratamentos de exceção (`BEGIN ... EXCEPTION WHEN OTHERS THEN RAISE WARNING ... END;`) em `create_public_booking` e nos triggers garantem que falhas no outbox nunca interrompam as reservas dos clientes.
2. Para reverter o banco de dados:
   ```sql
   DROP TRIGGER IF EXISTS trg_appointments_cancellation ON public.appointments;
   DROP FUNCTION IF EXISTS public.tg_appointments_enqueue_cancellation();
   DROP FUNCTION IF EXISTS public.enqueue_notification_event(uuid, uuid, text, text, timestamptz, text, jsonb);
   DROP TABLE IF EXISTS public.notification_outbox;
   ```

---

## 12. Declaração Formal de Conformidade

- **Nenhuma mensagem real de WhatsApp, e-mail ou SMS foi enviada.**
- **Nenhum registro ou dado fictício de notificação foi gravado em produção.**
- **Nenhum provedor externo foi conectado.**
