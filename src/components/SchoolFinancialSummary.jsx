import { CalendarClock, Wallet } from 'lucide-react';
import { formatDateBrazilian } from '../lib/logic.js';
import { readVisitDrafts } from '../domain/schoolVisitPlan.js';

export default function SchoolFinancialSummary({ school, onOpenFinance }) {
  let visits = [];
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
      <p><strong>Valores financeiros: não informados.</strong> Nenhum valor é presumido a partir dos registros de manutenção.</p>
      <p className="finance-hint">Informações financeiras ainda não registradas para esta escola. O total de aparelhos do cadastro é agregado; não determina valor contratual.</p>
    </section>
  );
}
