import { Wallet, CalendarDays, ClipboardList, Receipt, Landmark, RotateCcw, FolderOpen } from 'lucide-react';
import { getOperationalSlice, ticketOpeningDate } from '../domain/financialPresentation.js';
import { formatDateBrazilian } from '../lib/logic.js';
import SchoolRecordReview from './SchoolRecordReview.jsx';

const groups = [
  { title: 'Previsão', Icon: CalendarDays, text: 'Estimativas e programação financeira ainda não registradas.', scope: 'Sem valores por escola ou competência' },
  { title: 'Apuração informada', Icon: ClipboardList, text: 'Valores apurados pelo responsável ainda não registrados.', scope: 'Independente do status dos chamados' },
  { title: 'Faturamento e pagamentos', Icon: Receipt, text: 'Notas fiscais e pagamentos ainda não registrados.', scope: 'Sem faturamento ou pagamento presumido' },
  { title: 'Limites e empenhos', Icon: Landmark, text: 'Referências contratuais e empenhos ainda não informados.', scope: 'Âmbito global · não filtrado por escola ou mês' }
];

export default function FinancialOverviewPage({ schools, tickets, filters, onFiltersChange, onOpenTicket, onOpenSchool, onOpenSchoolRequests }) {
  const school = schools.find(item => String(item.designacao) === filters.schoolId) || null;
  const slice = getOperationalSlice(tickets, { school, month: filters.month });
  const recent = [...slice.tickets].sort((a, b) => (ticketOpeningDate(b) || '').localeCompare(ticketOpeningDate(a) || '')).slice(0, 5);
  const monthLabel = filters.month ? `${filters.month.slice(5)}/${filters.month.slice(0, 4)}` : 'Todos os períodos';
  return (
    <section className="finance-page" aria-labelledby="finance-title">
      <div className="section-header">
        <div className="section-heading">
          <span className="section-eyebrow"><Wallet aria-hidden="true" />Consulta de gestão</span>
          <h2 className="section-title" id="finance-title">Gestão Financeira</h2>
          <p className="section-subtitle">Referências e informações financeiras, com o contexto das solicitações existentes.</p>
        </div>
      </div>

      <div className="surface-card finance-filters">
        <div className="form-group">
          <label htmlFor="finance-school">Escola</label>
          <select id="finance-school" className="form-control" value={filters.schoolId} onChange={event => onFiltersChange({ ...filters, schoolId: event.target.value })}>
            <option value="">Todas as escolas</option>
            {schools.map(item => <option key={item.designacao} value={String(item.designacao)}>{item.designacao} · {item.unidade_escolar}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="finance-month">Mês de abertura</label>
          <input id="finance-month" type="month" className="form-control" value={filters.month} aria-describedby="finance-filter-scope" onChange={event => onFiltersChange({ ...filters, month: event.target.value })} />
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => onFiltersChange({ schoolId: '', month: '' })}><RotateCcw size={16} aria-hidden="true" />Limpar filtros</button>
        <p id="finance-filter-scope" className="finance-hint">Os filtros recortam as solicitações históricas pela data de abertura; não definem competência de serviço ou de pagamento.</p>
      </div>

      <div className="finance-metrics">
        {groups.map(({ title, Icon, text, scope }) => (
          <article className="stat-card" key={title}>
            <div className="stat-header"><h3>{title}</h3><Icon size={20} aria-hidden="true" /></div>
            <p className="finance-missing">Não informado</p>
            <p className="stat-description">{text}</p>
            <p className="finance-metric-scope">{scope}</p>
          </article>
        ))}
      </div>

      <div className="surface-card empty-state finance-empty">
        <Wallet aria-hidden="true" />
        <h3 className="empty-state-title">Informações financeiras ainda não registradas</h3>
        <p className="empty-state-hint">As solicitações continuam disponíveis para acompanhamento. Nenhum valor é calculado a partir do total de aparelhos ou do status de atendimento.</p>
      </div>

      <SchoolRecordReview
        schools={schools}
        tickets={tickets}
        month={filters.month}
        schoolId={filters.schoolId}
        onOpenSchool={onOpenSchool}
        onOpenSchoolRequests={onOpenSchoolRequests}
      />

      <section className="dashboard-section finance-history" aria-labelledby="finance-history-title">
        <div className="section-header">
          <div className="section-heading">
            <h3 id="finance-history-title">Solicitações históricas no recorte</h3>
            <p className="section-subtitle">Contexto operacional · não representa cobrança ou medição.</p>
          </div>
          <span className="finance-count tabular" aria-label={`${slice.tickets.length} solicitações no recorte`}>{slice.tickets.length}</span>
        </div>
        <p className="finance-selection" role="status">{school ? school.unidade_escolar : 'Todas as escolas'} · {monthLabel}</p>
        {slice.undatedCount > 0 && <p className="finance-hint">{slice.undatedCount} solicitação(ões) sem data de abertura válida{filters.month ? ' fora deste recorte mensal' : ' incluída(s) na consulta sem período'}.</p>}
        {recent.length ? (
          <>
            <p className="finance-hint">Até cinco solicitações mais recentes deste recorte.</p>
            <ul className="finance-ticket-list">
              {recent.map(ticket => (
                <li key={ticket.id_chamado}>
                  <div>
                    <strong>{ticket.id_chamado}</strong>
                    <p>{ticket.unidade_escolar}</p>
                    <p className="finance-hint">{ticket.tipo_demanda || 'Demanda não informada'} · {ticketOpeningDate(ticket) ? formatDateBrazilian(ticketOpeningDate(ticket)) : 'Data não informada'}</p>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" aria-label={`Abrir ficha ${ticket.id_chamado}`} onClick={() => onOpenTicket(ticket)}><FolderOpen size={16} aria-hidden="true" />Abrir ficha</button>
                </li>
              ))}
            </ul>
          </>
        ) : <p className="finance-no-tickets">Nenhuma solicitação neste recorte. Você pode escolher outra escola ou limpar os filtros.</p>}
      </section>
    </section>
  );
}
