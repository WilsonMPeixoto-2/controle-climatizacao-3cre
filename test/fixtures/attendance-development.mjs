// Dados sintéticos de desenvolvimento; nenhum preço ou resultado contratual real.
export const attendanceSchools = [
  { designacao: '900001', unidade_escolar: 'Unidade de teste econômico A — Educação Integral', bairro: 'Teste', aparelhos_total: 25 },
  { designacao: '900002', unidade_escolar: 'Unidade de teste econômico B', bairro: 'Teste', aparelhos_total: 40 }
];
export const attendanceTickets = [
  { id_chamado: 'GOP-AR-2026-9001', ...attendanceSchools[0], tipo_demanda: 'Manutenção Corretiva', tipo_aparelho: 'Split', btu_existente: '12000', btu_pretendido: '18000', local_demanda: 'Sala sintética A', criado_em: '2026-10-01', status_atual: '1 - Recebido — em triagem', setor_responsavel: 'GOP', prioridade: 'Média' },
  { id_chamado: 'GOP-AR-2026-9002', ...attendanceSchools[0], tipo_demanda: 'Manutenção Preventiva', local_demanda: 'Sala sintética B', criado_em: '2026-10-10', status_atual: '10 - Concluído', setor_responsavel: 'GOP', prioridade: 'Média' },
  { id_chamado: 'GOP-AR-2026-9003', ...attendanceSchools[1], tipo_demanda: 'Manutenção Preventiva', local_demanda: 'Sala sintética C', criado_em: '2026-10-15', status_atual: '1 - Recebido — em triagem', setor_responsavel: 'GOP', prioridade: 'Média' }
];
