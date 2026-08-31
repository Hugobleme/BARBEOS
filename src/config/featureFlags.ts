/**
 * Feature Flags Configuration
 * 
 * ATENÇão SEGURANÇA: 
 * Ocultar um módulo no frontend via Feature Flags Não substitui a necessidade 
 * de Row Level Security (RLS) no banco de dados. 
 * Ocultar no frontend é apenas uma redução da superfície de UX (User Experience). 
 * Hackers ainda podem fazer requisições diretas para a API. A trava de segurança
 * real DEVE estar sempre no Supabase (RLS).
 */

export const featureFlags = {
  // Módulos extras (Fora do MVP) - Desativados por padrão
  caixa: import.meta.env.VITE_FF_CAIXA === 'true' || false,
  pdv: import.meta.env.VITE_FF_PDV === 'true' || false,
  comissoes: import.meta.env.VITE_FF_COMISSOES === 'true' || false,
  fidelidade: import.meta.env.VITE_FF_FIDELIDADE === 'true' || false,
  franquia: import.meta.env.VITE_FF_FRANQUIA === 'true' || false,
  carteira: import.meta.env.VITE_FF_CARTEIRA === 'true' || false,
  cupons: import.meta.env.VITE_FF_CUPONS === 'true' || false,
  pacotes: import.meta.env.VITE_FF_PACOTES === 'true' || false,
  avaliacoes: import.meta.env.VITE_FF_AVALIACOES === 'true' || false,
  aurora: import.meta.env.VITE_FF_AURORA === 'true' || false,

  // MVP (Sempre Ativos)
  agendamento: true,
  servicos: true,
  estoque: true,
  equipe: true,
  dashboard: true,
};
