import { matchesSchool } from '../lib/logic.js';
import { ticketOpeningDate } from './financialPresentation.js';

/**
 * Série de aberturas de chamados, exclusivamente para navegação operacional.
 * Não representa competência de manutenção, serviços executados ou faturamento.
 */
export function getOpeningTrend(tickets = [], { school = null, selectedMonth = '', periods = 6 } = {}) {
  const rows = (Array.isArray(tickets) ? tickets : [])
    .filter(ticket => !school || matchesSchool(ticket, school))
    .map(ticketOpeningDate)
    .filter(Boolean);
  if (!rows.length && !selectedMonth) return [];
  const lastFromData = rows.reduce((last, day) => day.slice(0, 7) > last ? day.slice(0, 7) : last, '');
  const lastMonth = selectedMonth || lastFromData;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(lastMonth)) return [];
  const [year, month] = lastMonth.split('-').map(Number);
  const n = Math.min(12, Math.max(1, Number(periods) || 6));
  const counts = rows.reduce((map, day) => {
    const key = day.slice(0, 7);
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map());

  return Array.from({ length: n }, (_, index) => {
    const date = new Date(Date.UTC(year, month - n + index, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    return {
      month: key,
      label: new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }).format(date).replace('.', ''),
      year: date.getUTCFullYear(),
      count: counts.get(key) || 0,
      selected: selectedMonth === key
    };
  });
}
