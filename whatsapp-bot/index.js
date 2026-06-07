require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { createClient } = require("@supabase/supabase-js");
const cron = require("node-cron");

// Inicializa Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Inicializa Cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  console.log("Escaneie o QR Code abaixo com o seu WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ Bot de WhatsApp conectado com sucesso!");
  iniciarBot();
});

client.on("auth_failure", (msg) => {
  console.error("Falha na autenticação:", msg);
});

client.initialize();

// Lógica principal do Bot
function iniciarBot() {
  console.log("Iniciando escuta de novos agendamentos...");

  // 1. Escutar Novos Agendamentos em Tempo Real
  supabase
    .channel("custom-insert-channel")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "appointments" },
      async (payload) => {
        const agendamento = payload.new;
        console.log("Novo agendamento recebido!", agendamento.id);

        try {
          // Buscar dados do cliente
          const { data: customer } = await supabase
            .from("customers")
            .select("full_name, phone")
            .eq("id", agendamento.customer_id)
            .single();

          if (!customer || !customer.phone) return;

          // Formatar número para o padrão do whatsapp-web.js (55 + DDD + Numero + @c.us)
          const phone = formatPhone(customer.phone);
          const dataFormatada = new Date(agendamento.scheduled_start).toLocaleString("pt-BR");

          const mensagem = `Olá, ${customer.full_name.split(" ")[0]}! ✂️\nSeu agendamento foi confirmado para *${dataFormatada}*.\n\nQualquer dúvida, é só nos chamar!`;

          await client.sendMessage(phone, mensagem);
          console.log(`Mensagem de confirmação enviada para ${customer.full_name} (${phone})`);
        } catch (err) {
          console.error("Erro ao enviar confirmação:", err);
        }
      }
    )
    .subscribe();

  // 2. Cron Job para Lembretes (roda a cada 15 minutos)
  cron.schedule("*/15 * * * *", async () => {
    console.log("Executando varredura de lembretes (2 horas antes)...");
    const agora = new Date();
    const daquiA2Horas = new Date(agora.getTime() + 2 * 60 * 60 * 1000);
    const daquiA2HorasE15Min = new Date(agora.getTime() + 2.25 * 60 * 60 * 1000);

    const { data: agendamentos, error } = await supabase
      .from("appointments")
      .select("*, customers(full_name, phone)")
      .eq("status", "scheduled")
      .gte("scheduled_start", daquiA2Horas.toISOString())
      .lt("scheduled_start", daquiA2HorasE15Min.toISOString());

    if (error || !agendamentos) return;

    for (const appt of agendamentos) {
      if (!appt.customers || !appt.customers.phone) continue;

      const phone = formatPhone(appt.customers.phone);
      const mensagem = `⚠️ *Lembrete BarberOS*\n\nOlá, ${appt.customers.full_name.split(" ")[0]}!\nPassando para lembrar que seu horário é daqui a 2 horas. Te esperamos lá! 💈`;

      try {
        await client.sendMessage(phone, mensagem);
        console.log(`Lembrete enviado para ${appt.customers.full_name}`);
      } catch (err) {
        console.error("Erro ao enviar lembrete:", err);
      }
    }
  });
}

function formatPhone(phone) {
  // Limpa tudo que não for número
  let cleaned = phone.replace(/\D/g, "");
  // Se começar com 0, remove (ex: 011 -> 11)
  if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
  // Adiciona o DDI do Brasil se não tiver
  if (cleaned.length <= 11) cleaned = "55" + cleaned;
  return `${cleaned}@c.us`;
}
