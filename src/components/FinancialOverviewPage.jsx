import { useRef } from 'react';
import {
  ArrowRight, CalendarDays, ChevronDown, ClipboardList, FolderOpen,
  Landmark, Receipt, RotateCcw, Wallet, Activity, CheckCircle2
} from 'lucide-react';
import { getOperationalSlice, ticketOpeningDate } from '../domain/financialPresentation.js';
import { getSchoolRecordReview } from '../domain/schoolRecordReview.js';
import { getOpeningTrend } from '../domain/operationalPulse.js';
import { formatDateBrazilian } from '../lib/logic.js';
import SchoolRecordReview from './SchoolRecordReview.jsx';

const groups = [
  { title: 'Previsão', Icon: CalendarDays, text: 'Estimativas e programação.', scope: 'Por escola e período' },
  { title: 'Apuração informada', Icon: ClipboardList, text: 'Valores apurados pelo responsável.', scope: 'Independente do status dos chamados' },
  { title: 'Faturamento e pagamentos', Icon: Receipt, text: 'Notas fiscais e pagamentos.', scope: 'Sem cobrança presumida' },
  { title: 'Limites e empenhos', Icon: Landmark, text: 'Referências contratuais e empenhos.', scope: 'Âmbito global · não filtrado por escola ou mês' }
];

export default function FinancialOverviewPage({
  schools, tickets, filters, onFiltersChange, onOpenTicket, onOpenSchool, onOpenSchoolRequests
}) {
  const reviewRef = useRef(null);
  const school = schools.find(item => String(item.designacao) === filters.schoolId) || null;
  const slice = getOperationalSlice(tickets, { school, month: filters.month });
  const overview = getSchoolRecordReview(schools, tickets, filters);
  const withoutConclusion = overview.schools.reduce((sum, row) => sum + row.withoutConclusion, 0);
  const series = getOpeningTrend(tickets, { school, selectedMonth: filters.month });
  const maxCount = Math.max(1, ...series.map(item => item.count));
  const recent = [...slice.tickets]
    .sort((a, b) => (ticketOpeningDate(b) || '').localeCompare(ticketOpeningDate(a) || ''))
    .slice(0, 5);
  const monthLabel = filters.month ? `${filters.month.slice(5)}/${filters.month.slice(0, 4)}` : 'Todos os períodos';
  const clearFilters = () => onFiltersChange({ schoolId: '', month: '' });
  const jumpToReview = () => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <section className="finance-page" aria-labelledby="finance-title">
      <header className="finance-heading">
        <div>
          <span className="section-eyebrow"><Wallet aria-hidden="true" /> Gestão integrada</span>
          <h2 className="section-title" id="finance-title">Gestão Financeira</h2>
          <p className="section-subtitle">Uma visão dos registros operacionais, com acesso direto às escolas e solicitações.</p>
        </div>
        <span className="finance-source-label">Dados do GOP Clima <span aria-hidden="true">·</span> consulta</span>
      </header>

      <div className="surface-card finance-filters" aria-label="Filtrar registros por escola e abertura">
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
        <button type="button" className="btn btn-secondary" onClick={clearFilters}><RotateCcw size={16} aria-hidden="true" />Limpar filtros</button>
        <p id="finance-filter-scope" className="finance-hint">Período de abertura dos chamados, não competência de serviço ou pagamento.</p>
      </div>

      <section className="finance-intelligence" aria-label="Síntese operacional do período">
        <div className="finance-insight">
          <span className="finance-insight-label"><Activity size={16} aria-hidden="true" /> Atenção aos registros</span>
          <div className="finance-insight-main">
            <strong className="finance-insight-count tabular">{overview.toReview}</strong>
            <div className="finance-insight-heading">
              <h3>{overview.toReview === 1 ? 'escola com chamados a conferir' : 'escolas com chamados a conferir'}</h3>
              <p>{overview.toReview > 0
                ? `${withoutConclusion} ${withoutConclusion === 1 ? 'chamado sem conclusão registrada' : 'chamados sem conclusão registrada'} neste recorte.`
                : 'Nenhum chamado sem conclusão nas escolas deste recorte.'}</p>
            </div>
          </div>
          <div className="finance-insight-footer">
            <span><CheckCircle2 size={16} aria-hidden="true" /> {overview.withConclusion} {overview.withConclusion === 1 ? 'escola só com chamados concluídos' : 'escolas só com chamados concluídos'}</span>
            <button className="finance-insight-action" type="button" onClick={jumpToReview}>
              Examinar escolas <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
          <span className="finance-insight-disclaimer">Situação dos chamados no sistema, não confirmação de atendimento contratual.</span>
        </div>

        <div className="finance-trend">
          <div className="finance-trend-header">
            <div>
              <h3>Aberturas ao longo do tempo</h3>
              <p>Selecione um mês para investigar os registros.</p>
            </div>
            <span className="finance-trend-total tabular">{slice.tickets.length} <small>no recorte</small></span>
          </div>
          {series.length ? (
            <div className="finance-trend-columns" role="group" aria-label="Evolução mensal interativa">
              {series.map(item => (
                <button
                  type="button"
                  key={item.month}
                  aria-pressed={filters.month === item.month}
                  aria-label={`${item.count} ${item.count === 1 ? 'chamado aberto' : 'chamados abertos'} em ${item.label} de ${item.year}${filters.month === item.month ? ', mês selecionado, ativar para limpar' : ', ativar filtro'}`}
                  title={`${item.label}/${item.year}: ${item.count} ${item.count === 1 ? 'abertura' : 'aberturas'}`}
                  className={`finance-trend-column ${filters.month === item.month ? 'is-selected' : ''}`}
                  onClick={() => onFiltersChange({ ...filters, month: filters.month === item.month ? '' : item.month })}
                >
                  <span className="finance-trend-number tabular">{item.count}</span>
                  <span className="finance-trend-bar-track">
                    <span className="finance-trend-bar" style={{ height: `${item.count ? Math.max(10, (item.count / maxCount) * 100) : 3}%` }} />
                  </span>
                  <span className="finance-trend-month">{item.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="finance-trend-empty">Sem datas válidas de abertura para construir a tendência.</div>
          )}
          <p className="finance-trend-caption">{school ? school.unidade_escolar : 'Todas as escolas'} · Abertura dos chamados</p>
        </div>
      </section>

      <div className="finance-workbench">
        <div className="finance-workbench-primary" ref={reviewRef}>
          <SchoolRecordReview
            schools={schools}
            tickets={tickets}
            month={filters.month}
            schoolId={filters.schoolId}
            onOpenSchool={onOpenSchool}
            onOpenSchoolRequests={onOpenSchoolRequests}
          />
        </div>

        <div className="finance-workbench-secondary">
          <section className="surface-card finance-history" aria-labelledby="finance-history-title">
            <div className="finance-history-header">
              <div>
                <h3 id="finance-history-title">Solicitações recentes</h3>
                <p>{school ? school.unidade_escolar : 'Todas as escolas'} · {monthLabel}</p>
              </div>
              <span className="finance-count tabular" aria-label={`${slice.tickets.length} solicitações no recorte`}>{slice.tickets.length}</span>
            </div>
            {slice.undatedCount > 0 && (
              <p className="finance-history-note finance-hint">
                {slice.undatedCount} solicitação(ões) sem data de abertura válida{filters.month ? ' fora deste recorte mensal' : ' incluída(s) na consulta sem período'}.
              </p>
            )}
            {recent.length ? (
              <ul className="finance-ticket-list">
                {recent.map(ticket => (
                  <li key={ticket.id_chamado}>
                    <div>
                      <strong>{ticket.id_chamado}</strong>
                      <p>{ticket.unidade_escolar}</p>
                      <p className="finance-hint">{ticket.tipo_demanda || 'Demanda não informada'} · {ticketOpeningDate(ticket) ? formatDateBrazilian(ticketOpeningDate(ticket)) : 'Data não informada'}</p>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" aria-label={`Abrir ficha ${ticket.id_chamado}`} onClick={() => onOpenTicket(ticket)}>
                      <FolderOpen size={16} aria-hidden="true" /><span>Abrir ficha</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="finance-no-tickets">Nenhuma solicitação neste recorte. Você pode escolher outra escola ou limpar os filtros.</p>}
          </section>

          <details className="surface-card finance-availability">
            <summary>
              <span className="finance-availability-icon"><Wallet size={19} aria-hidden="true" /></span>
              <span><strong>Registros financeiros</strong><small>4 grupos ainda não informados</small></span>
              <ChevronDown className="finance-availability-chevron" size={18} aria-hidden="true" />
            </summary>
            <div className="finance-availability-content">
              <p className="finance-hint">Não há valores financeiros registrados nesta etapa. Nada é presumido a partir dos chamados.</p>
              <div className="finance-metrics">
                {groups.map(({ title, Icon, text, scope }) => (
                  <article className="finance-metric" key={title}>
                    <div className="stat-header"><h3>{title}</h3><Icon size={18} aria-hidden="true" /></div>
                    <p className="finance-missing">Não informado</p>
                    <p className="stat-description">{text}</p>
                    <p className="finance-metric-scope">{scope}</p>
                  </article>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
