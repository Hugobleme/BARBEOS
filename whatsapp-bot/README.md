# 🤖 BarberOS — WhatsApp Bot Inteligente

Bot de WhatsApp desenvolvido com **Node.js**, **@whiskeysockets/baileys** (leve, rápido e sem necessidade de Puppeteer/Chromium) e integração direta em tempo real com o banco de dados **Supabase** do BarberOS.

---

## ⚡ Funcionalidades

1. **📅 Agendamento Interativo (Fluxo Passo a Passo):**
   - Coleta o nome do cliente.
   - Apresenta o catálogo de serviços com durações e preços em BRL consultados diretamente do banco.
   - Permite escolher o barbeiro/profissional ou "Qualquer disponível".
   - Reconhecimento inteligente de datas e horários (ex: *"Hoje 16:00"*, *"Amanhã 10:30"*, *"25/08 15:00"*).
   - Confirmação de agendamento e inserção instantânea nas tabelas `appointments` e `appointment_services`.

2. **📋 Consulta de Status (`/status`):**
   - Lista os próximos agendamentos ativos do cliente com base no número de telefone.

3. **❌ Cancelamento de Agendamento (`/cancelar`):**
   - Localiza o agendamento futuro do cliente e atualiza o status para `cancelled`.

4. **💈 Catálogo de Serviços (`/servicos`):**
   - Exibe a lista completa de serviços, descrições e valores atualizados.

5. **🔔 Notificações em Tempo Real (Supabase Realtime):**
   - Quando um agendamento é criado pela Web (`/agendar`) ou pelo Admin PDV, o bot envia automaticamente uma mensagem de confirmação no WhatsApp do cliente.

6. **⏰ Lembretes Automáticos de 24 Horas (Cron):**
   - Rotina periódica que identifica agendamentos do dia seguinte e envia um lembrete amigável para reduzir o no-show (faltas).

---

## 🚀 Como Instalar e Rodar Localmente

### 1. Pré-requisitos
- Node.js 18+ ou 20+
- Um smartphone com WhatsApp ativo para escanear o QR Code

### 2. Passo a Passo

```bash
# 1. Entre na pasta do bot
cd whatsapp-bot

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
```

Abra o arquivo `.env` e preencha suas credenciais do Supabase:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-chave-service-role-ou-anon-key
BARBERSHOP_ID=id-da-barbearia-opcional
```

```bash
# 4. Inicie o bot
npm start
```

### 3. Conexão via QR Code
Ao iniciar, o terminal exibirá um **QR Code**.
1. Abra o WhatsApp no seu celular.
2. Vá em **Configurações / Opções** > **Aparelhos Conectados** > **Conectar um Aparelho**.
3. Aponte a câmera para o terminal.
4. A sessão será salva automaticamente na pasta `auth_info_baileys/` para não precisar reconectar sempre.

---

## 💬 Comandos Disponíveis no WhatsApp

| Comando | Descrição |
| :--- | :--- |
| `menu` ou `oi` | Exibe o menu principal de autoatendimento |
| `1` ou `/agendar` | Inicia o agendamento interativo passo a passo |
| `2` ou `/status` | Consulta os agendamentos marcados para o número |
| `3` ou `/cancelar` | Cancela o próximo agendamento ativo |
| `4` ou `/servicos` | Lista serviços e tabela de preços |
| `5` ou `/ajuda` | Mostra horário de atendimento e localização |

---

## 🌐 Deploy em Produção (Hospedagem 24/7)

Como o Baileys mantém uma conexão WebSocket persistente com os servidores do WhatsApp, ele deve ser hospedado em um serviço com suporte a processos contínuos (não em funções serverless que dormem).

### Opções Recomendadas:

1. **VPS (Ubuntu / Debian com PM2):**
   ```bash
   npm install -g pm2
   pm2 start index.js --name "barberos-whatsapp-bot"
   pm2 startup
   pm2 save
   ```

2. **Railway / Render:**
   - Crie um novo **Web Service** ou **Worker**.
   - Defina o comando de inicialização: `npm start`.
   - Adicione as variáveis de ambiente (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`).
   - Conecte o volume persistente para manter a pasta `auth_info_baileys/`.

3. **Docker:**
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   CMD ["npm", "start"]
   ```

---

## 🔒 Segurança e Boas Práticas
- **Nunca comite a pasta `auth_info_baileys/` ou o arquivo `.env` no Git.** (Ambos já estão listados no `.gitignore`).
- Utilize números exclusivos para atendimento da barbearia.
