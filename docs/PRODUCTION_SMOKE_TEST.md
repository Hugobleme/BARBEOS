# 🔎 Guia Prático de Smoke Test em Produção — BARBEOS

Este guia foi elaborado para que qualquer responsável técnico ou proprietário da barbearia possa validar de forma rápida, segura e **não-destrutiva** se uma nova versão implantada no BARBEOS está funcionando perfeitamente em produção.

---

## 🛡️ Regras Gerais de Segurança (Invioláveis)

Para garantir a total integridade da base de dados e a privacidade dos usuários:

1. **Utilize sempre Janela Anônima / Privada:**
   Abra uma nova janela anônima no navegador para evitar interferência de cookies ou caches antigos.
2. **Proibição de Ações Destrutivas com Dados Reais:**
   Nunca edite, exclua ou sobrescreva clientes, agendamentos ou lançamentos financeiros reais.
3. **Nunca crie Agendamentos Finais em Produção:**
   No fluxo público de agendamento, navegue por todos os passos até a tela de confirmação, mas **NUNCA clique no botão final de confirmação** em barbearias ativas de clientes reais (a menos que seja uma barbearia de homologação/teste aprovada).
4. **Registro Seguro de Diagnósticos (Zero PII):**
   Ao documentar qualquer problema, anote apenas: **rota acessada**, **data/hora**, **código/mensagem de erro segura** e **hash do commit**. Jamais registre nomes, telefones, e-mails de clientes ou senhas.
5. **Captura de Tela Segura:**
   Se for necessário tirar um print (screenshot) de uma falha, oculte previamente qualquer dado pessoal de clientes ou valores sensíveis de faturamento.
6. **Nunca compartilhe Segredos ou Tokens:**
   Jamais envie tokens JWT, conteúdo de `localStorage`, chaves de API ou strings de conexão do Supabase em mensagens ou chamados.

---

## 1. Verificações de Rotas Públicas (Sem Autenticação)

Abra o navegador em janela anônima e teste as seguintes páginas públicas:

| Rota | O que verificar | Comportamento Esperado |
|---|---|---|
| `/` | Página Inicial | Carrega sem erros, banner principal e links de navegação visíveis, sem tela preta ou fallback de erro. |
| `/barbearias` | Diretório de Unidades | Lista de barbearias ou campo de busca visível, imagens e cards carregando normalmente. |
| `/servicos` | Catálogo de Serviços | Lista de serviços oferecidos com preços e durações formatados em BRL. |
| `/profissionais` | Equipe de Profissionais | Lista dos barbeiros/equipe exibindo fotos e nomes sem falhas. |
| `/login` | Página de Autenticação | Formulário com campos de e-mail, senha e botão "Entrar" visíveis e clicáveis. |
| `/agendar?barbershop=<slug>` | Agendamento Online | Tela de agendamento da barbearia selecionada carrega normalmente (detalhado abaixo). |

### 🔍 Passo a Passo Seguro no Agendamento Público:
Sem finalizar o agendamento no banco de dados, certifique-se de que:
1. Os dados da barbearia (nome, logo, endereço) carregam.
2. Os serviços ativos são listados e podem ser selecionados.
3. A lista de profissionais ativos aparece para escolha (ou opção "Qualquer profissional").
4. O calendário de datas permite escolher um dia útil aberto.
5. Os horários disponíveis (slots) aparecem conforme a grade configurada.
6. Horários de intervalo (almoço) ou horários fora de expediente **não** estão disponíveis para clique.
7. A tela de resumo/confirmação prévia exibe o serviço, barbeiro, data e valor corretos.
8. **Pare aqui:** Não clique no botão de confirmação de agendamento em produção.
9. Em nenhum momento é exibida a tela global *"Ops, algo não saiu como o esperado"*.

---

## 2. Verificações do Painel Administrativo (Autenticado como Proprietário)

Faça login com a conta de proprietário da barbearia e teste cada módulo administrativo:

| Módulo | Rota | O que verificar |
|---|---|---|
| **Dashboard** | `/admin` | Visão geral do painel, métricas principais e menu lateral navegáveis sem travar. |
| **Serviços** | `/admin/servicos` | Lista de serviços cadastrados, botões de ação e valores sem falha de renderização. |
| **Profissionais** | `/admin/profissionais` | Listagem da equipe com especialidades e status ativo visíveis. |
| **Horários** | `/admin/horarios` | Grade de horários de funcionamento da barbearia carregada corretamente. |
| **Agenda** | `/admin/agenda` | Calendário semanal/diário de agendamentos exibido com horários corretos. |
| **PDV / Balcão** | `/admin/pdv` | Ponto de venda abre normalmente, sem mensagens de erro sobre `shopId` ou `Label`. |
| **Caixa** | `/admin/caixa` | Status de abertura/fechamento do caixa visível sem travar a interface. |
| **Clientes** | `/admin/clientes` | Tabela ou lista de clientes cadastrados renderiza sem expor senhas. |

### 📌 Critérios de Sucesso para cada Rota Admin:
- A página carrega com resposta rápida (sem spinners infinitos).
- Nenhum erro visual ou tela branca ocorre.
- Nenhum ícone faltando ou quebrado.
- Ao pressionar a tecla `F5` (atualização direta da página), o painel recarrega mantendo a sessão e sem cair em tela de erro.

---

## 3. Verificação de Horários e Disponibilidade (Sem Escrita)

Sem modificar as configurações ativas da barbearia:
1. Em `/admin/horarios`, confirme que os horários de funcionamento diários (ex.: 09:00 às 19:00) estão visíveis.
2. Em `/admin/profissionais`, abra a visualização da grade de horários de um profissional e confirme que a jornada e os intervalos estão configurados.
3. No agendamento público (`/agendar`), confirme que os horários disponíveis refletem essa mesma janela e bloqueiam os intervalos cadastrados.

---

## 4. Verificação Segura do PDV (Ponto de Venda)

O PDV é um módulo financeiro crítico. Verifique apenas seu estado de visualização:
1. Acesse `/admin/pdv`.
2. Certifique-se de que o cabeçalho exibe o status atual do caixa (aberto ou fechado).
3. Verifique se os seletores de serviços/produtos e cliente estão visíveis.
4. Confirme que não ocorrem erros no console como `shopId is not defined` ou `Label is not defined`.
5. **Atenção:** Não finalize nenhuma venda, não efetue sangria ou suprimento desnecessário durante o smoke test de rotina.

---

## 5. Verificação do PWA (Progressive Web App)

O PWA permite que os clientes utilizem o BARBEOS como um aplicativo instalado:
1. No navegador (Chrome / Safari / Edge), verifique se o site carrega de forma limpa.
2. Caso o prompt de instalação apareça, confirme que ele pode ser fechado ou aceito sem travar a navegação.
3. Verifique se a aplicação não entra em loop contínuo de recarregamento (`refresh loop`).
4. Ao recarregar a página com cache, a tela não deve ficar em branco.

---

## 6. Verificação de Usabilidade Mobile e Acessibilidade (Viewport 390px)

Abra as Ferramentas do Desenvolvedor (`F12`) e alterne para o modo responsivo (ex.: iPhone 12/13/14/15 ou largura de 390px):

1. **Sem Rolagem Horizontal Indesejada:**
   A página não deve apresentar barra de rolagem horizontal descontrolada (`scrollWidth` maior que a tela).
2. **Menu e Navegação:**
   O menu mobile (hambúrguer ou barra inferior) deve abrir, permitir navegação e fechar suavemente.
3. **Botões e Toque:**
   Botões de ação primária (como "Agendar horário", "Continuar", "Entrar") devem estar totalmente visíveis e acessíveis sem ficarem encobertos pelo teclado ou rodapés.
4. **Navegação por Teclado:**
   No desktop, ao pressionar a tecla `Tab`, o foco visual deve ser claramente perceptível nos botões e campos de entrada.

---

## 📝 Tabela Modelo de Registro de Smoke Test

Preencha a tabela abaixo ao concluir a verificação de cada nova versão:

| Área | Rota Testada | Resultado (Aprovado / Reprovado) | Código / Mensagem Segura (se houver) | Referência da Captura (Sem PII) | Ação Tomada |
|---|---|---|---|---|---|
| Público | `/` | Aprovado | N/A | N/A | Nenhuma |
| Público | `/barbearias` | Aprovado | N/A | N/A | Nenhuma |
| Público | `/servicos` | Aprovado | N/A | N/A | Nenhuma |
| Público | `/profissionais` | Aprovado | N/A | N/A | Nenhuma |
| Público | `/login` | Aprovado | N/A | N/A | Nenhuma |
| Público | `/agendar` | Aprovado | N/A | N/A | Nenhuma |
| Admin | `/admin` | Aprovado | N/A | N/A | Nenhuma |
| Admin | `/admin/servicos` | Aprovado | N/A | N/A | Nenhuma |
| Admin | `/admin/profissionais` | Aprovado | N/A | N/A | Nenhuma |
| Admin | `/admin/horarios` | Aprovado | N/A | N/A | Nenhuma |
| Admin | `/admin/agenda` | Aprovado | N/A | N/A | Nenhuma |
| Admin | `/admin/pdv` | Aprovado | N/A | N/A | Nenhuma |
| Admin | `/admin/caixa` | Aprovado | N/A | N/A | Nenhuma |
| Admin | `/admin/clientes` | Aprovado | N/A | N/A | Nenhuma |
| PWA | Ciclo de Vida | Aprovado | N/A | N/A | Nenhuma |
| Mobile | 390px Viewport | Aprovado | N/A | N/A | Nenhuma |

---

## ⚡ O que fazer se uma verificação falhar?

1. **Se for um problema crítico (P0/P1):**
   - Interrompa imediatamente o teste.
   - Consulte os critérios de rollback no [RELEASE_RUNBOOK.md](./RELEASE_RUNBOOK.md).
   - Acione o [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) para executar a contenção.
2. **Se for um problema menor (P2):**
   - Registre na tabela de smoke test e abra uma issue para correção planejada.
