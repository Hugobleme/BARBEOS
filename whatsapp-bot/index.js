const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const { createClient } = require("@supabase/supabase-js");
const qrcode = require("qrcode-terminal");
const cron = require("node-cron");
const pino = require("pino");
require("dotenv").config();

// 1. Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERRO: SUPABASE_URL e SUPABASE_SERVICE_KEY devem ser configurados no arquivo .env");
}

const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseKey || "placeholder");

// 2. Estado de conversação em memória para cada número
const userSessions = new Map();

// Helper para formatar moeda
function formatBRL(amount) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(amount) || 0);
}

// Helper para formatar telefone para o WhatsApp JID
function formatJid(phone) {
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
  if (cleaned.length <= 11) cleaned = "55" + cleaned;
  return `${cleaned}@s.whatsapp.net`;
}

// Helper para extrair telefone limpo do JID
function cleanPhoneFromJid(jid) {
  return jid.replace(/@.*$/, "").replace(/^55/, "");
}

// 3. Inicialização do Bot com Baileys
async function startBot() {
  console.log("🚀 Iniciando BarberOS WhatsApp Bot...");

  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: ["BarberOS Bot", "Chrome", "1.0.0"],
  });

  // Atualização de credenciais de autenticação
  sock.ev.on("creds.update", saveCreds);

  // Monitoramento de Conexão e QR Code
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 ========================================================");
      console.log("📲 ESCANEIE O QR CODE ABAIXO NO SEU WHATSAPP:");
      console.log("   (WhatsApp > Aparelhos Conectados > Conectar Aparelho)");
      console.log("========================================================\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("⚠️ Conexão encerrada. Reconectando:", shouldReconnect);
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === "open") {
      console.log("\n✅ ========================================================");
      console.log("💈 BarberOS WhatsApp Bot CONECTADO COM SUCESSO!");
      console.log("========================================================\n");
      setupRealtimeAndCron(sock);
    }
  });

  // Processamento de Mensagens Recebidas
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const from = msg.key.remoteJid;
      // Ignorar grupos
      if (from.endsWith("@g.us")) continue;

      const text = (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.buttonsResponseMessage?.selectedButtonId ||
        msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        ""
      ).trim();

      if (!text) continue;

      try {
        await handleIncomingMessage(sock, from, text, msg);
      } catch (err) {
        console.error(`Erro ao processar mensagem de ${from}:`, err);
        await sock.sendMessage(from, {
          text: "Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente ou digite *menu*.",
        });
      }
    }
  });
}

// 4. Fluxo Conversacional e Comandos
async function handleIncomingMessage(sock, from, text, msg) {
  const normalized = text.toLowerCase();
  const session = userSessions.get(from) || { step: null };

  // Comandos globais que cancelam o fluxo atual
  if (normalized === "cancelar" || normalized === "/cancelar" || normalized === "0") {
    if (session.step) {
      userSessions.delete(from);
      await sock.sendMessage(from, {
        text: "❌ Atendimento cancelado. Quando precisar, digite *menu* para ver as opções!",
      });
      return;
    }
  }

  if (normalized === "menu" || normalized === "/menu" || normalized === "inicio" || normalized === "oi" || normalized === "olá" || normalized === "ola") {
    userSessions.delete(from);
    return sendMainMenu(sock, from);
  }

  // Máquina de Estados de Agendamento Interativo
  if (session.step === "AWAITING_NAME") {
    session.customerName = text.trim();
    session.step = "AWAITING_SERVICE";
    userSessions.set(from, session);

    const { data: services } = await supabase
      .from("services")
      .select("id, name, price, duration_min")
      .eq("active", true)
      .order("price", { ascending: true })
      .limit(8);

    session.servicesList = services || [];

    if (!services || services.length === 0) {
      userSessions.delete(from);
      return sock.sendMessage(from, {
        text: "No momento não há serviços disponíveis no catálogo. Por favor, tente mais tarde!",
      });
    }

    let servicesMsg = `Perfeito, *${session.customerName}*! 👍\nQual serviço você deseja agendar?\n\n`;
    services.forEach((s, idx) => {
      servicesMsg += `*${idx + 1}.* ${s.name} — ${formatBRL(s.price)} (${s.duration_min || 30} min)\n`;
    });
    servicesMsg += `\n_Digite o número do serviço desejado (ou 0 para cancelar):_`;

    return sock.sendMessage(from, { text: servicesMsg });
  }

  if (session.step === "AWAITING_SERVICE") {
    const choice = parseInt(text, 10);
    const services = session.servicesList || [];

    if (isNaN(choice) || choice < 1 || choice > services.length) {
      return sock.sendMessage(from, {
        text: `Por favor, digite um número válido entre *1 e ${services.length}* (ou digite *0* para cancelar):`,
      });
    }

    const selectedService = services[choice - 1];
    session.selectedService = selectedService;
    session.step = "AWAITING_PROFESSIONAL";
    userSessions.set(from, session);

    const { data: pros } = await supabase
      .from("professionals")
      .select("id, display_name")
      .eq("active", true)
      .limit(6);

    session.prosList = pros || [];

    let prosMsg = `Você escolheu: *${selectedService.name}* (${formatBRL(selectedService.price)})\n\nCom qual profissional você prefere ser atendido?\n\n*1.* 💈 Qualquer profissional disponível\n`;
    (pros || []).forEach((p, idx) => {
      prosMsg += `*${idx + 2}.* ✂️ ${p.display_name}\n`;
    });
    prosMsg += `\n_Digite o número da opção desejada:_`;

    return sock.sendMessage(from, { text: prosMsg });
  }

  if (session.step === "AWAITING_PROFESSIONAL") {
    const choice = parseInt(text, 10);
    const pros = session.prosList || [];

    if (isNaN(choice) || choice < 1 || choice > pros.length + 1) {
      return sock.sendMessage(from, {
        text: `Opção inválida. Digite um número de *1 a ${pros.length + 1}*:`,
      });
    }

    if (choice === 1) {
      session.selectedPro = pros[0] || null; // Qualquer ou primeiro
    } else {
      session.selectedPro = pros[choice - 2];
    }

    session.step = "AWAITING_DATETIME";
    userSessions.set(from, session);

    return sock.sendMessage(from, {
      text: `📅 Para qual dia e horário você prefere?\n\nExemplos de formato:\n• *Hoje 16:00*\n• *Amanhã 10:30*\n• *25/08 15:00*\n\n_Envie sua data e hora:_`,
    });
  }

  if (session.step === "AWAITING_DATETIME") {
    const parsedDate = parseUserDate(text);
    if (!parsedDate || isNaN(parsedDate.getTime()) || parsedDate < new Date()) {
      return sock.sendMessage(from, {
        text: `⚠️ Data ou horário inválido (ou já passou).\n\nPor favor, envie no formato:\n*DD/MM HH:MM* ou *Amanhã 15:00*`,
      });
    }

    session.scheduledStart = parsedDate;
    session.step = "CONFIRMING_BOOKING";
    userSessions.set(from, session);

    const dataFormatada = parsedDate.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const summaryMsg = `📋 *CONFIRMAÇÃO DO AGENDAMENTO*\n\n` +
      `👤 *Cliente:* ${session.customerName}\n` +
      `✂️ *Serviço:* ${session.selectedService.name}\n` +
      `💰 *Valor:* ${formatBRL(session.selectedService.price)}\n` +
      `💈 *Barbeiro:* ${session.selectedPro?.display_name || "Disponibilidade da casa"}\n` +
      `🗓️ *Horário:* ${dataFormatada}\n\n` +
      `Deseja confirmar?\n*1.* ✅ Sim, confirmar agendamento\n*2.* ❌ Não, cancelar`;

    return sock.sendMessage(from, { text: summaryMsg });
  }

  if (session.step === "CONFIRMING_BOOKING") {
    if (normalized === "1" || normalized === "sim" || normalized === "s") {
      return executeBookingCreation(sock, from, session);
    } else {
      userSessions.delete(from);
      return sock.sendMessage(from, {
        text: "Agendamento cancelado. Digite *menu* para iniciar novamente.",
      });
    }
  }

  // Processamento de Comandos do Menu Principal
  if (normalized === "1" || normalized === "/agendar") {
    session.step = "AWAITING_NAME";
    session.userPhone = cleanPhoneFromJid(from);
    userSessions.set(from, session);

    return sock.sendMessage(from, {
      text: "💈 *Novo Agendamento*\n\nPor favor, digite o seu *Nome Completo* para iniciarmos:",
    });
  }

  if (normalized === "2" || normalized === "/status") {
    return handleCheckStatus(sock, from);
  }

  if (normalized === "3" || normalized === "/cancelar_agendamento") {
    return handleCancelFlow(sock, from);
  }

  if (normalized === "4" || normalized === "/servicos") {
    return handleListServices(sock, from);
  }

  if (normalized === "5" || normalized === "/ajuda") {
    return sock.sendMessage(from, {
      text: `💈 *BarberOS — Informações & Atendimento*\n\n` +
        `📍 *Endereço:* Unidades credenciadas no Brasil\n` +
        `⏰ *Funcionamento:* Seg a Sáb das 09h às 20h\n` +
        `🌐 *Agende Online:* https://barberos.vercel.app\n\n` +
        `Para voltar ao menu, digite *menu*.`,
    });
  }

  // Resposta padrão
  return sendMainMenu(sock, from);
}

// 5. Finalizar Criação de Agendamento no Supabase
async function executeBookingCreation(sock, from, session) {
  try {
    const rawPhone = cleanPhoneFromJid(from);
    const shopId = process.env.BARBERSHOP_ID;

    // Obter barbearia padrão se não configurada
    let targetShopId = shopId;
    if (!targetShopId) {
      const { data: shops } = await supabase.from("barbershops").select("id").limit(1);
      targetShopId = shops?.[0]?.id;
    }

    if (!targetShopId) {
      throw new Error("Nenhuma barbearia cadastrada no banco de dados.");
    }

    // 1. Cadastrar / buscar cliente
    let customerId;
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("barbershop_id", targetShopId)
      .ilike("phone", `%${rawPhone.slice(-8)}%`)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCust, error: custErr } = await supabase
        .from("customers")
        .insert({
          barbershop_id: targetShopId,
          full_name: session.customerName,
          phone: rawPhone,
        })
        .select("id")
        .single();
      if (custErr) throw custErr;
      customerId = newCust.id;
    }

    // 2. Calcular horário de término
    const start = session.scheduledStart;
    const durationMin = session.selectedService.duration_min || 30;
    const end = new Date(start.getTime() + durationMin * 60 * 1000);

    // 3. Inserir Agendamento
    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .insert({
        barbershop_id: targetShopId,
        customer_id: customerId,
        professional_id: session.selectedPro?.id || null,
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        status: "scheduled",
        source: "whatsapp",
        total_amount: session.selectedService.price,
      })
      .select("id")
      .single();

    if (apptErr) throw apptErr;

    // 4. Inserir Serviço do Agendamento
    await supabase.from("appointment_services").insert({
      appointment_id: appt.id,
      service_id: session.selectedService.id,
      price_snapshot: session.selectedService.price,
      duration_snapshot: durationMin,
    });

    userSessions.delete(from);

    const dataFormatada = start.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    await sock.sendMessage(from, {
      text: `🎉 *Agendamento Confirmado com Sucesso!*\n\n` +
        `✂️ *Serviço:* ${session.selectedService.name}\n` +
        `🗓️ *Data:* ${dataFormatada}\n` +
        `💈 *Profissional:* ${session.selectedPro?.display_name || "A definir"}\n` +
        `💰 *Valor:* ${formatBRL(session.selectedService.price)}\n\n` +
        `Te esperamos! Enviaremos um lembrete antes do horário. Caso precise remarcar ou cancelar, digite *menu*.`,
    });
  } catch (err) {
    console.error("Erro ao criar agendamento via WhatsApp:", err);
    userSessions.delete(from);
    await sock.sendMessage(from, {
      text: `⚠️ Desculpe, ocorreu um erro ao confirmar o agendamento: ${err.message || "Tente novamente mais tarde."}`,
    });
  }
}

// 6. Consultar Status do Agendamento
async function handleCheckStatus(sock, from) {
  const rawPhone = cleanPhoneFromJid(from);

  const { data: customer } = await supabase
    .from("customers")
    .select("id, full_name")
    .ilike("phone", `%${rawPhone.slice(-8)}%`)
    .maybeSingle();

  if (!customer) {
    return sock.sendMessage(from, {
      text: "Nenhum agendamento encontrado para este número de telefone. Para agendar, digite *1*.",
    });
  }

  const now = new Date().toISOString();
  const { data: appts } = await supabase
    .from("appointments")
    .select("id, scheduled_start, status, total_amount, professional:professionals(display_name)")
    .eq("customer_id", customer.id)
    .gte("scheduled_start", now)
    .in("status", ["scheduled", "in_progress"])
    .order("scheduled_start", { ascending: true });

  if (!appts || appts.length === 0) {
    return sock.sendMessage(from, {
      text: `Olá, *${customer.full_name.split(" ")[0]}*! Você não possui agendamentos futuros no momento.\n\nPara agendar um horário, digite *1*.`,
    });
  }

  let msg = `📅 *Seus Próximos Agendamentos (${customer.full_name.split(" ")[0]}):*\n\n`;
  appts.forEach((a, idx) => {
    const dataStr = new Date(a.scheduled_start).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    msg += `*${idx + 1}.* ${dataStr} com ${a.professional?.display_name || "Profissional"} (${formatBRL(a.total_amount)})\n`;
  });
  msg += `\nPara cancelar algum horário, digite *3*.`;

  return sock.sendMessage(from, { text: msg });
}

// 7. Cancelar Agendamento Ativo
async function handleCancelFlow(sock, from) {
  const rawPhone = cleanPhoneFromJid(from);

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .ilike("phone", `%${rawPhone.slice(-8)}%`)
    .maybeSingle();

  if (!customer) {
    return sock.sendMessage(from, {
      text: "Você não possui agendamentos ativos para cancelar.",
    });
  }

  const now = new Date().toISOString();
  const { data: appt } = await supabase
    .from("appointments")
    .select("id, scheduled_start")
    .eq("customer_id", customer.id)
    .gte("scheduled_start", now)
    .eq("status", "scheduled")
    .order("scheduled_start", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!appt) {
    return sock.sendMessage(from, {
      text: "Nenhum agendamento futuro encontrado para cancelamento.",
    });
  }

  await supabase.from("appointments").update({ status: "cancelled" }).eq("id", appt.id);

  const dataStr = new Date(appt.scheduled_start).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return sock.sendMessage(from, {
    text: `❌ Seu agendamento de *${dataStr}* foi cancelado com sucesso.\n\nQuando quiser remarcar, basta digitar *menu*.`,
  });
}

// 8. Listar Catálogo de Serviços
async function handleListServices(sock, from) {
  const { data: services } = await supabase
    .from("services")
    .select("name, price, duration_min, description")
    .eq("active", true)
    .order("price", { ascending: true });

  if (!services || services.length === 0) {
    return sock.sendMessage(from, {
      text: "Catálogo de serviços indisponível no momento.",
    });
  }

  let msg = `💈 *CATÁLOGO DE SERVIÇOS & VALORES*\n\n`;
  services.forEach((s) => {
    msg += `• *${s.name}* — ${formatBRL(s.price)} (${s.duration_min || 30} min)\n`;
    if (s.description) msg += `  _${s.description}_\n`;
  });
  msg += `\nPara agendar qualquer um desses serviços, digite *1*.`;

  return sock.sendMessage(from, { text: msg });
}

// 9. Menu Principal
async function sendMainMenu(sock, from) {
  const menuText =
    `👋 *Olá! Bem-vindo ao assistente virtual da BarberOS.*\n\n` +
    `Como posso te ajudar hoje? Digite o número da opção desejada:\n\n` +
    `*1.* 📅 Agendar Novo Horário\n` +
    `*2.* 📋 Meus Agendamentos (Status)\n` +
    `*3.* ❌ Cancelar Agendamento\n` +
    `*4.* 💈 Ver Serviços e Preços\n` +
    `*5.* 📍 Informações e Localização\n\n` +
    `_Ou envie sua mensagem diretamente!_`;

  return sock.sendMessage(from, { text: menuText });
}

// 10. Funções Auxiliares: Parse de Datas
function parseUserDate(input) {
  const text = input.toLowerCase().trim();
  const now = new Date();

  // Caso: "hoje 15:00" ou "hoje às 15:00"
  if (text.includes("hoje")) {
    const timeMatch = text.match(/(\d{1,2})[:h](\d{2})?/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const d = new Date(now);
      d.setHours(hours, mins, 0, 0);
      return d;
    }
  }

  // Caso: "amanha 10:00" ou "amanhã às 14:30"
  if (text.includes("amanha") || text.includes("amanhã")) {
    const timeMatch = text.match(/(\d{1,2})[:h](\d{2})?/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(hours, mins, 0, 0);
      return d;
    }
  }

  // Caso: "25/08 16:00" ou "25/08/2026 16:00"
  const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(?:às\s+)?(\d{1,2})[:h](\d{2})?/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : now.getFullYear();
    const hours = parseInt(dateMatch[4], 10);
    const mins = dateMatch[5] ? parseInt(dateMatch[5], 10) : 0;

    return new Date(year < 100 ? 2000 + year : year, month, day, hours, mins, 0, 0);
  }

  return null;
}

// 11. Realtime do Supabase e Agendador de Lembretes (Cron)
function setupRealtimeAndCron(sock) {
  console.log("📡 Conectando canal Realtime do Supabase e Agendador Cron...");

  // A. Notificações Instantâneas de Novos Agendamentos Criados na Web/Admin
  supabase
    .channel("whatsapp-new-appointments")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "appointments" },
      async (payload) => {
        const appt = payload.new;
        if (!appt || appt.source === "whatsapp") return; // Evita loop se foi criado pelo bot

        try {
          const { data: customer } = await supabase
            .from("customers")
            .select("full_name, phone")
            .eq("id", appt.customer_id)
            .single();

          if (!customer || !customer.phone) return;

          const jid = formatJid(customer.phone);
          const dataStr = new Date(appt.scheduled_start).toLocaleString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });

          const msg = `💈 *Agendamento Confirmado no BarberOS!*\n\n` +
            `Olá, *${customer.full_name.split(" ")[0]}*! Seu agendamento para *${dataStr}* foi confirmado no sistema.\n\n` +
            `Qualquer dúvida ou alteração, responda esta mensagem!`;

          await sock.sendMessage(jid, { text: msg });
          console.log(`✅ Notificação de confirmação enviada para ${customer.full_name} (${jid})`);
        } catch (err) {
          console.error("Erro ao enviar confirmação Realtime:", err);
        }
      }
    )
    .subscribe();

  // B. Cron Job para Lembretes Automáticos de 24 Horas (roda a cada 30 minutos)
  cron.schedule("*/30 * * * *", async () => {
    console.log("⏰ Verificando agendamentos para envio de lembretes automáticos...");
    const now = new Date();
    const in24hStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
    const in24hEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, scheduled_start, customers(full_name, phone), professional:professionals(display_name)")
      .eq("status", "scheduled")
      .gte("scheduled_start", in24hStart.toISOString())
      .lte("scheduled_start", in24hEnd.toISOString());

    if (!appointments || appointments.length === 0) return;

    for (const a of appointments) {
      if (!a.customers || !a.customers.phone) continue;

      const jid = formatJid(a.customers.phone);
      const dataStr = new Date(a.scheduled_start).toLocaleString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const lembreteMsg = `💈 *Lembrete BarberOS*\n\n` +
        `Olá, *${a.customers.full_name.split(" ")[0]}*!\n` +
        `Lembramos que seu horário é *amanhã às ${dataStr}* com *${a.professional?.display_name || "seu barbeiro"}*.\n\n` +
        `Te esperamos lá! Para cancelar ou remarcar, responda *menu*.`;

      try {
        await sock.sendMessage(jid, { text: lembreteMsg });
        console.log(`🔔 Lembrete 24h enviado para ${a.customers.full_name} (${jid})`);
      } catch (err) {
        console.error("Erro ao enviar lembrete de 24h:", err);
      }
    }
  });
}

// Iniciar Bot
startBot().catch(console.error);
