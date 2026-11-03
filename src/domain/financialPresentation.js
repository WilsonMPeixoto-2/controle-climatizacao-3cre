import { matchesSchool } from '../lib/logic.js';
import { consultContractReference, parseCapacityBtu } from './financialReference.js';

// Contexto consultivo somente: não usa status, quantidade de aparelhos ou preços.
export function getTicketReferenceContext(ticket = {}) {
  const demand = String(ticket.tipo_demanda || '').trim().toLocaleLowerCase('pt-BR');
  const maintenance = ['manutenção corretiva', 'manutenção preventiva'].includes(demand);
  const existingBtu = parseCapacityBtu(ticket.btu_existente);
  const intendedBtu = parseCapacityBtu(ticket.btu_pretendido);
  const btu = existingBtu ?? intendedBtu;
  return {
    maintenance,
    existingBtu,
    intendedBtu,
    capacitySource: existingBtu !== null ? 'BTU existente' : intendedBtu !== null ? 'BTU pretendido' : null,
    capacityNote: existingBtu !== null
      ? 'O aparelho a manter e seu enquadramento exigem confirmação; a capacidade pretendida não substitui a existente.'
      : intendedBtu !== null
        ? 'Só há BTU pretendido informado. Confirme a capacidade do aparelho a manter.'
        : 'Capacidade não confirmada. O chamado pode seguir sem referência financeira.',
    reference: consultContractReference({ type: ticket.tipo_aparelho, btu })
  };
}

// Segue a data de abertura usada na aplicação, preservando o dia civil do registro.
// Datas ausentes/inválidas ficam identificadas, nunca atribuídas ao mês corrente.
export function ticketOpeningDate(ticket) {
  const value = ticket.criado_em || ticket.data_solicitacao;
  const match = typeof value === 'string' && value.match(/^(\d{4}-\d{2}-\d{2})(?:T|$)/);
  if (!match) return null;
  const parsed = new Date(`${match[1]}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === match[1]
    ? match[1] : null;
}

export function getOperationalSlice(tickets, { school = null, month = '' } = {}) {
  const schoolTickets = tickets.filter(ticket => !school || matchesSchool(ticket, school));
  return {
    tickets: schoolTickets.filter(ticket => !month || ticketOpeningDate(ticket)?.slice(0, 7) === month),
    undatedCount: schoolTickets.filter(ticket => !ticketOpeningDate(ticket)).length
  };
}
