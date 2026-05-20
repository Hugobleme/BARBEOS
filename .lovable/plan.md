# Etapa 13 — Aurora, assistente de voz com IA

Vou construir o assistente de voz "Aurora" em fases pequenas e testáveis. Cada fase é entregue em uma rodada para reduzir risco e custo de retrabalho.

## Pré-requisito
Preciso da chave **OPENAI_API_KEY** salva nos secrets do Lovable Cloud. Sem ela nenhuma das funções de voz consegue rodar. Vou pedir via formulário seguro logo no início.

## Decisão de arquitetura
- **Stack**: este projeto é TanStack Start, então em vez de Edge Functions Supabase vou usar **server functions / server routes do TanStack** (`createServerFn` / `routes/api/*`). Mesma capacidade, integra melhor com o resto do app e segue a regra da plataforma. Isso não muda nenhum critério funcional do brief.
- Toda chamada à OpenAI fica no servidor, chave nunca vai pro cliente.
- Modelos: Whisper (`whisper-1`), GPT-4o-mini com tools, TTS (`tts-1`, voz `nova`).

## Fases (uma por rodada, com aprovação entre elas)

### Fase 1 — Fundação de dados e secret
- Migration: tabelas `voice_sessions` e `voice_messages` com RLS (dono enxerga as da barbearia, cliente as próprias).
- Coluna `settings.aurora` em `barbershops` (ativo, voz, mensagem de boas-vindas, limite de turnos, gravação on/off, persona extra).
- Pedir `OPENAI_API_KEY`.

### Fase 2 — Backend de voz (3 endpoints)
- `POST /api/voice/transcribe` — recebe áudio webm, chama Whisper, devolve texto.
- `POST /api/voice/chat` — server function: monta system prompt + histórico, chama GPT-4o-mini com **tools** (`listar_servicos`, `listar_profissionais`, `buscar_horarios_disponiveis`, `identificar_cliente`, `criar_agendamento`, `cancelar_agendamento`, `informacoes_barbearia`). Reaproveita as regras já existentes em `agendar.tsx` (conflito, antecedência, no-show, bloqueio).
- `POST /api/voice/synthesize` — recebe texto, devolve mp3 do TTS.
- Persistência de turnos em `voice_messages`, tokens contados, máscara de PII (cartão/CPF) antes de salvar.

### Fase 3 — Frontend (FAB + Drawer)
- Hook `useVoiceRecorder` (MediaRecorder + AnalyserNode + VAD de silêncio 1,5s).
- Hook `useVoiceChat` orquestrando gravar → transcrever → chat → tts → play.
- `<VoiceAssistantDrawer />` com avatar pulsante, balões estilo WhatsApp, badge de estado (Ouvindo/Pensando/Falando), botão circular grande (tap = toggle, hold = push-to-talk), mute do TTS, fallback teclado, encerrar.
- FAB dourado fixo em todas as páginas públicas (montado no `PublicLayout`), pulse animado, respeita safe-area mobile, esconde se Aurora desativada nas settings.
- Modal de permissão de microfone amigável + fallback se negado.
- Onboarding: primeira fala da Aurora se apresentando.

### Fase 4 — Painel admin
- `/admin/aurora`: KPIs (sessões, conversão, duração média, turnos médios, custo estimado), tabela de sessões com filtro, modal de detalhe com transcrição completa, gráfico de sessões/dia.
- Seção em `/admin/configuracoes` para configurar Aurora (ativar, voz, persona, turnos máx, gravação, boas-vindas).

### Fase 5 — Polimento
- Rate limit por IP/sessão (10/h, 60s por gravação, 8min por sessão).
- Botão "apagar minha conversa".
- Aviso de privacidade na primeira abertura.
- README curto sobre `OPENAI_API_KEY`.
- Seed: ativar Aurora na demo + 5 sessões de exemplo.

## Detalhes técnicos relevantes
- Streaming: chat completion com `stream: true`, TTS disparado por frase assim que chega do LLM (latência alvo < 2,5s).
- VAD: RMS do AnalyserNode, threshold ajustável.
- Áudio: `webm;codecs=opus` na captura, `audio/mpeg` no retorno do TTS.
- Tools rodam com client admin do Supabase dentro do server, sempre filtrando por `barbershop_id` da sessão.
- Auditoria: `audit_logs` recebe entrada quando Aurora cria agendamento.

## O que vou fazer agora se você aprovar
1. Pedir o secret `OPENAI_API_KEY`.
2. Rodar a migration da Fase 1.
3. Voltar para confirmar antes de seguir pra Fase 2.
