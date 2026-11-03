import { matchesSchool } from '../lib/logic.js';
import { isClosed } from './statuses.js';
import { ticketOpeningDate } from './financialPresentation.js';

/**
 * Conferência da INFORMAÇÃO OPERACIONAL existente.
 *
 * Não deriva execução contratual, medição, atesto ou ausência de atendimento
 * de um chamado. "Sem conclusão registrada" refere-se exclusivamente
 * aos status dos chamados disponibilizados pelo aplicativo.
 *
 * A data de abertura não equivale à competência da manutenção.
 */
export function getSchoolRecordReview(schools = [], tickets = [], { month = '', schoolId = '' } = {}) {
  const knownSchools = Array.isArray(schools) ? schools : [];
  const knownTickets = Array.isArray(tickets) ? tickets : [];
  const periodTickets = knownTickets.filter(ticket =>
    !month || ticketOpeningDate(ticket)?.slice(0, 7) === month
  );
  const visibleSchools = knownSchools.filter(school =>
    !schoolId || String(school.designacao) === String(schoolId)
  );

  const schoolRecords = visibleSchools.map(school => {
    const records = periodTickets.filter(ticket => matchesSchool(ticket, school));
    const withoutConclusion = records.filter(ticket => !isClosed(ticket.status_atual));
    const withConclusion = records.filter(ticket => isClosed(ticket.status_atual));
    const recordedDates = records.map(ticketOpeningDate).filter(Boolean);
    const lastOpening = recordedDates.length ? recordedDates.sort().at(-1) : null;

    // Os estados descrevem PRESENÇA DE REGISTROS, não realidade da execução.
    const category = records.length === 0
      ? 'no_request'
      : withoutConclusion.length > 0
        ? 'to_review'
        : 'with_conclusion';

    return {
      school,
      category,
      requests: records.length,
      withoutConclusion: withoutConclusion.length,
      withConclusion: withConclusion.length,
      lastOpening,
      // O mês pode excluir registros sem data; a informação permanece consultável no dossiê.
      undatedRecords: knownTickets.filter(ticket =>
        matchesSchool(ticket, school) && !ticketOpeningDate(ticket)
      ).length
    };
  });

  const count = category => schoolRecords.filter(row => row.category === category).length;
  const unmatchedRecords = periodTickets.filter(ticket =>
    !knownSchools.some(school => matchesSchool(ticket, school))
  ).length;

  return {
    schools: schoolRecords,
    total: schoolRecords.length,
    toReview: count('to_review'),
    withConclusion: count('with_conclusion'),
    noRequest: count('no_request'),
    unmatchedRecords,
    period: month || null,
    // Informação de atendimento contratual NÃO existe nesta fonte.
    attendanceConfirmed: null
  };
}
