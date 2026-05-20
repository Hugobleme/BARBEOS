# BarberOS — Roadmap de Incrementos (pós-Aurora)

Aurora pausada. Vamos entregar os incrementos em etapas pequenas e testáveis. Cada etapa = 1 rodada, com aprovação antes da próxima.

## Ordem sugerida (do maior impacto/menor risco pro mais complexo)

### Etapa 1 — Fidelidade & Retenção (base de pontos + carteira)
- Tabela `loyalty_points` (saldo por cliente/barbearia) e `loyalty_transactions` (ganho/resgate).
- Regra configurável: X pontos por R$ gasto (em settings da barbearia).
- Crédito automático ao concluir agendamento/venda PDV.
- Tela admin: configurar regra + ver saldo do cliente.
- Tela cliente (`/minha-conta`): saldo, extrato, como usar.

### Etapa 2 — Cashback / Carteira de créditos
- Tabela `wallet_balances` + `wallet_transactions`.
- % de cashback configurável; gera crédito ao concluir serviço.
- Uso como forma de pagamento no PDV e no agendamento.
- Extrato no app do cliente.

### Etapa 3 — Aniversariantes + Cupons inteligentes
- Job diário: gera cupom de aniversário automático.
- Detecção de inativos (45+ dias sem agendar) → cupom "saudades".
- Painel: ver cupons gerados, taxa de uso.
- (Notificação fica pra Etapa 6 quando ligarmos push/email.)

### Etapa 4 — Indique e Ganhe
- Código único por cliente (slug curto).
- Tabela `referrals` rastreia indicação → primeiro agendamento do indicado.
- Crédito automático na carteira de quem indicou + desconto no indicado.
- Tela "Indicar amigos" no `/minha-conta` com link compartilhável.

### Etapa 5 — Lista de Espera
- Tabela `waitlist_entries` (cliente, serviço, profissional opcional, janela desejada).
- Botão "Entrar na lista" quando horário tá cheio.
- Trigger: ao cancelar/liberar slot, notificar próximo da fila.
- Painel admin pra gerenciar fila.

### Etapa 6 — Push Notifications (PWA)
- Web Push (VAPID) com Service Worker já que o PWA está instalável.
- Tabela `push_subscriptions`.
- Disparos: confirmação de agendamento, lembrete 24h/1h, vaga liberada, cupom novo, pontos creditados.
- Preferências de notificação no `/minha-conta`.

### Etapa 7 — Check-in por QR Code
- QR code único por agendamento.
- Cliente abre `/checkin/$token` → marca chegada → agenda mostra "Cliente chegou".
- Badge na agenda do profissional.

### Etapa 8 — Reagendamento self-service
- Link no email/push do lembrete → fluxo de remarcar em 1 clique.
- Reaproveita as regras de antecedência/conflito já existentes.

### Etapa 9 — Dashboard de Insights
- KPIs novos: previsão de faturamento do mês, horários ociosos, melhor dia/profissional.
- Sugestões automáticas ("terças 14h estão 80% vazias — criar promoção?").
- Ranking expandido de profissionais (retenção, ticket médio, nota).

### Etapa 10 — Metas & Gamificação
- Tabela `goals` (mensal por profissional ou barbearia).
- Barra de progresso na home admin.
- Bônus de comissão automático ao bater meta.

### Etapa 11 — Pagamento Online (sinal antifurão)
- Integração Stripe (já temos conector) — sinal de X% no agendamento.
- Política: se cliente cancela <12h ou no-show, sinal é retido.
- Crédito do sinal abatido no PDV ao concluir o serviço.

### Etapa 12 — Estoque inteligente
- Alerta de mínimo configurável por produto.
- Sugestão de recompra baseada no consumo médio.
- Notificação no painel quando estoque cruza o limite.

### Etapa 13 — Google Calendar Sync (profissionais)
- OAuth Google por profissional.
- Sincroniza agendamentos como eventos; bloqueios do Google viram folgas.

### Etapa 14 — Franquia: painel consolidado
- Comparativo entre unidades (faturamento, ticket, retenção).
- Cálculo automático de royalties por unidade.
- Transferência de cliente entre unidades mantendo histórico.

---

## Como vamos trabalhar
- Eu entrego a etapa, você testa, aprova, seguimos pra próxima.
- Se quiser pular alguma ou mudar a ordem, é só falar.
- Posso também agrupar 2 etapas pequenas numa rodada se você preferir velocidade.

## Próximo passo se aprovar
Começo pela **Etapa 1 — Fidelidade & Retenção** (migration + telas admin/cliente + crédito automático ao concluir agendamento).
