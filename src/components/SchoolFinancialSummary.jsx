import { useEffect, useReducer } from 'react';
import { CalendarClock, Wallet } from 'lucide-react';
import { formatDateBrazilian } from '../lib/logic.js';
import { readVisitDrafts, VISIT_DRAFT_KEY } from '../domain/schoolVisitPlan.js';
import { VISIT_DRAFT_UPDATED_EVENT } from '../domain/visitDraftStorage.js';
import { calculateAttendance, formatMoneyUnits4 } from '../domain/attendanceEstimate.js';

export default function SchoolFinancialSummary({
  school, onOpenFinance, attendanceRecords = [], attendanceConnection, onEstimate, onOpenAttendance
}) {
  const [, refreshDraft] = useReducer(version => version + 1, 0);
  useEffect(() => {
    const onStorage = event => {
      if (event.key === VISIT_DRAFT_KEY || event.key === null) refreshDraft();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(VISIT_DRAFT_UPDATED_EVENT, refreshDraft);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(VISIT_DRAFT_UPDATED_EVENT, refreshDraft);
    };
  }, []);
  let visits = [];
  const estimates = attendanceRecords.filter(record => record.schoolId === String(school.designacao));
  let draftUnreadable = false;
  try {
    visits = readVisitDrafts(window.localStorage)
      .filter(item => item.schoolId === String(school.designacao))
      .sort((a, b) => b.plannedDate.localeCompare(a.plannedDate));
  } catch {
    draftUnreadable = true;
  }
  return (
    <section className="surface-card finance-school-summary" aria-label="Contexto financeiro da escola">
      <div className="section-header">
        <div className="section-heading">
          <h3><Wallet size={18} aria-hidden="true" />Informações financeiras da unidade</h3>
          <p>{school.unidade_escolar} · {school.designacao}</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm no-print" onClick={onOpenFinance}>Consultar Gestão Financeira</button>
      </div>
      {visits.length > 0 && (
        <div className="finance-school-program-mini" aria-label="Programação deste navegador">
          <div className="finance-school-program-title">
            <CalendarClock size={18} aria-hidden="true" />
            <strong>{visits.length} {visits.length === 1 ? 'visita programada' : 'visitas programadas'}</strong>
            <span>Rascunho somente neste dispositivo</span>
          </div>
          <ul>
            {visits.slice(0, 3).map(visit => (
              <li key={visit.id}>
                <span>{formatDateBrazilian(visit.plannedDate)} · {visit.kind === 'preventiva' ? 'Preventiva' : visit.kind === 'corretiva' ? 'Corretiva' : 'Outra atividade'}</span>
                <small>{visit.reportedDate ? 'Execução informada' : 'Execução não informada'}</small>
              </li>
            ))}
          </ul>
          {visits.length > 3 && <p className="finance-hint">Outras {visits.length - 3} visitas disponíveis na Gestão Financeira.</p>}
        </div>
      )}
      {draftUnreadable && <p className="finance-hint">O rascunho local não pôde ser lido neste navegador.</p>}
      <section className="school-attendance-estimates" aria-label="Estimativas de atendimento da escola">
        <div className="section-header">
          <h4>Estimativas de atendimento</h4>
          {onEstimate && <button type="button" className="btn btn-secondary btn-sm no-print" onClick={onEstimate}>Estimar atendimento</button>}
        </div>
        {estimates.length ? <ul className="finance-ticket-list">
          {estimates.map(record => {
            const estimate = calculateAttendance(record);
            return <li key={record.id}>
              <div>
                <strong>{record.plannedMonth.slice(5)}/{record.plannedMonth.slice(0, 4)} · {estimate.complete
                  ? formatMoneyUnits4(estimate.totalUnits4)
                  : estimate.knownSubtotalUnits4 === null ? 'Referência não informada' : `${formatMoneyUnits4(estimate.knownSubtotalUnits4)} · parcial`}</strong>
                <p className="finance-hint">{record.items.length} {record.items.length === 1 ? 'grupo' : 'grupos'} · {estimate.lines.every(line => line.amountNature === 'incremento_adicional') ? 'acréscimo estimado' : 'estimativa consultiva'} · revisão {record.revision}{estimate.coveragePendingCount > 0 ? ' · cobertura pendente' : ''}</p>
              </div>
              {onOpenAttendance && <button type="button" className="btn btn-secondary btn-sm no-print" onClick={() => onOpenAttendance(record)}>Abrir composição</button>}
            </li>;
          })}
        </ul> : <p className="finance-hint">{attendanceConnection?.status === 'ready'
          ? 'Nenhuma estimativa compartilhada para esta escola.' : 'As estimativas compartilhadas dependem da base de desenvolvimento conectada.'}</p>}
      </section>
      <p><strong>{estimates.length ? 'Apuração e pagamentos: não informados.' : 'Valores financeiros: não informados.'}</strong> Nenhum valor é presumido a partir dos registros de manutenção.</p>
      <p className="finance-hint">{!estimates.length && 'Informações financeiras ainda não registradas para esta escola. '}O total de aparelhos do cadastro é agregado; não determina valor contratual.</p>
    </section>
  );
}
