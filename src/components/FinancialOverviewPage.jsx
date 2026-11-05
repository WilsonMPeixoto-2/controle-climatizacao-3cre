import { useMemo, useRef, useState } from 'react';
import {
  ArrowRight, BarChart3, CalendarDays, ChevronDown, ClipboardList, FolderOpen,
  Landmark, Receipt, RotateCcw, Wallet, Activity, CheckCircle2
} from 'lucide-react';
import { getOperationalSlice, ticketOpeningDate } from '../domain/financialPresentation.js';
import { getSchoolRecordReview } from '../domain/schoolRecordReview.js';
import { buildMonthlyForecast, currentForecastMonth } from '../domain/monthlyForecast.js';
import { getOpeningTrend } from '../domain/operationalPulse.js';
import { formatDateBrazilian } from '../lib/logic.js';
import SchoolRecordReview from './SchoolRecordReview.jsx';
import VisitPlanningBoard from './VisitPlanningBoard.jsx';
import AttendanceEstimates from './AttendanceEstimates.jsx';
import MonthlyForecast from './MonthlyForecast.jsx';
import HistoricCorrectionsPanel from './HistoricCorrectionsPanel.jsx';
import '../styles/finance-workspace.css';

const groups = [
  { title: 'Apuração informada', Icon: ClipboardList, text: 'Valores apurados pelo responsável.', scope: 'Independente do status dos chamados' },
  { title: 'Faturamento e pagamentos', Icon: Receipt, text: 'Notas fiscais e pagamentos.', scope: 'Sem cobrança presumida' },
  { title: 'Limites e empenhos', Icon: Landmark, text: 'Referências contratuais e empenhos.', scope: 'Âmbito global · não filtrado por escola ou mês' }
];

function FinanceTicketConsultation({
  schools, tickets, filters, onFiltersChange, onOpenTicket, onOpenSchool, onOpenSchoolRequests
}) {
  const reviewRef = useRef(null);
  const school = schools.find(item => String(item.designacao) === filters.schoolId) || null;
  const slice = getOperationalSlice(tickets, { school, month: filters.month });
  const overview = getSchoolRecordReview(schools, tickets, filters);
  const withoutConclusion = overview.schools.reduce((sum, row) => sum + row.withoutConclusion, 0);
  const series = getOpeningTrend(tickets, { school, selectedMonth: filters.month });
  const maxCount = Math.max(1, ...series.map(item => item.count));
  const chartTotal = series.reduce((total, item) => total + item.count, 0);
  const undatedAcrossSchool = getOperationalSlice(tickets, { school }).undatedCount;
  const recent = [...slice.tickets]
    .sort((a, b) => (ticketOpeningDate(b) || '').localeCompare(ticketOpeningDate(a) || ''))
    .slice(0, 5);
  const monthLabel = filters.month ? `${filters.month.slice(5)}/${filters.month.slice(0, 4)}` : 'Todos os períodos';
  const clearTicketMonth = () => onFiltersChange({ ...filters, month: '' });
  const jumpToReview = () => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className='finance-ticket-consultation'>
        <section className="finance-operations" aria-label="Consulta de chamados">
          <header className="finance-operations-heading">
            <h3>Chamados e solicitações</h3>
            <p>Consulta complementar aos registros de manutenção, sem alterar a competência das visitas.</p>
          </header>
          <div className="surface-card finance-filters finance-ticket-filters" aria-label="Filtrar chamados por abertura">
            <div className="form-group">
              <label htmlFor="finance-month">Mês de abertura dos chamados</label>
              <input id="finance-month" type="month" className="form-control" value={filters.month} aria-describedby="finance-filter-scope" onChange={event => onFiltersChange({ ...filters, month: event.target.value })} />
            </div>
            <button type="button" className="btn btn-secondary" onClick={clearTicketMonth} disabled={!filters.month}><RotateCcw size={16} aria-hidden="true" />Limpar mês</button>
            <p id="finance-filter-scope" className="finance-hint">Este filtro controla somente os chamados, não o planejamento nem os pagamentos.</p>
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
                <span className="finance-trend-total tabular">{chartTotal} <small>nas barras</small></span>
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
              <p className="finance-trend-caption">{school ? school.unidade_escolar : 'Todas as escolas'} · Seis meses de abertura{undatedAcrossSchool ? ` · ${undatedAcrossSchool} sem data, fora do gráfico` : ''}</p>
            </div>
          </section>
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
              <span><strong>Registros financeiros</strong><small>3 áreas ainda não informadas</small></span>
              <ChevronDown className="finance-availability-chevron" size={18} aria-hidden="true" />
            </summary>
            <div className="finance-availability-content">
              <p className="finance-hint">Consulte as estimativas na aba Visão financeira.</p>
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
    </div>
  );
}

const tabs = [
  { id: 'overview', label: 'Visão financeira', Icon: BarChart3 },
  { id: 'attendances', label: 'Atendimentos', Icon: ClipboardList }
];

export default function FinancialOverviewPage({
  schools, tickets, filters, onFiltersChange, onOpenTicket, onOpenSchool, onOpenSchoolRequests,
  attendances, attendanceContext, onAttendanceContextConsumed, onStartAttendance
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [month, setMonth] = useState(currentForecastMonth);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const tabRefs = useRef({});
  const resultsRef = useRef(null);
  const currentTab = attendanceContext ? 'attendances' : activeTab;
  const ready = attendances.connection?.status === 'ready';
  const forecast = useMemo(() => buildMonthlyForecast(ready ? attendances.records : [], {
    schoolId: filters.schoolId, selectedMonth: month || currentForecastMonth()
  }), [attendances.records, filters.schoolId, month, ready]);
  const latestMonth = forecast.recordedMonths.at(-1);

  function explore({ month: period, schoolId, status: nextStatus = 'all' }) {
    setMonth(period);
    setStatus(nextStatus);
    setSearch('');
    if (schoolId !== undefined) onFiltersChange({ ...filters, schoolId });
    setActiveTab('attendances');
    requestAnimationFrame(() => resultsRef.current?.focus());
  }

  function selectTabByKey(event, index) {
    const target = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    setActiveTab(tabs[target].id);
    tabRefs.current[tabs[target].id]?.focus();
  }

  function consumeContext() {
    const record = attendances.records.find(item => item.id === attendanceContext?.attendanceId);
    const contextMonth = record?.plannedMonth || attendanceContext?.plannedDate?.slice(0, 7);
    if (contextMonth) setMonth(contextMonth);
    setActiveTab('attendances');
    setStatus('all');
    setSearch('');
    onAttendanceContextConsumed();
  }

  return (
    <section className="finance-page finance-workspace" aria-labelledby="finance-title">
      <header className="finance-heading">
        <h2 className="section-title" id="finance-title">Gestão Financeira</h2>
      </header>
      <div className="finance-tab-list" role="tablist" aria-label="Gestão Financeira">
        {tabs.map(({ id, label, Icon }, index) => (
          <button key={id} id={'finance-tab-' + id} role="tab" type="button"
            ref={element => { tabRefs.current[id] = element; }}
            aria-controls={'finance-panel-' + id} aria-selected={currentTab === id}
            tabIndex={currentTab === id ? 0 : -1} onClick={() => setActiveTab(id)}
            onKeyDown={event => selectTabByKey(event, index)}>
            <Icon size={18} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      <div className="surface-card finance-scope" aria-label="Filtros das estimativas financeiras">
        <div className="form-group">
          <label htmlFor="forecast-month">Competência</label>
          <input id="forecast-month" className="form-control" type="month" value={month}
            onChange={event => setMonth(event.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="finance-school">Escola</label>
          <select id="finance-school" className="form-control" value={filters.schoolId}
            onChange={event => onFiltersChange({ ...filters, schoolId: event.target.value })}>
            <option value="">Todas as escolas</option>
            {schools.map(school => <option key={school.designacao} value={String(school.designacao)}>{school.designacao} · {school.unidade_escolar}</option>)}
          </select>
        </div>
        <div className="finance-scope-actions">
          {latestMonth && latestMonth !== month && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMonth(latestMonth)}>Última com registros</button>}
          {(filters.schoolId || month !== currentForecastMonth()) && <button type="button" className="btn btn-secondary btn-sm"
            onClick={() => {
              setMonth(currentForecastMonth());
              setStatus('all');
              setSearch('');
              onFiltersChange({ ...filters, schoolId: '' });
            }}><RotateCcw size={15} aria-hidden="true" /> Limpar filtros</button>}
        </div>
      </div>

      <div id="finance-panel-overview" role="tabpanel" aria-labelledby="finance-tab-overview" hidden={currentTab !== 'overview'}>
        <MonthlyForecast forecast={forecast} schools={schools} connection={attendances.connection} onExplore={explore} />
      </div>

      <div id="finance-panel-attendances" role="tabpanel" aria-labelledby="finance-tab-attendances" hidden={currentTab !== 'attendances'}>
        <AttendanceEstimates schools={schools} tickets={tickets} records={attendances.records}
          rows={forecast.selected.records} selectedSchoolId={filters.schoolId} month={forecast.selectedMonth}
          status={status} onStatusChange={setStatus} search={search} onSearchChange={setSearch} headingRef={resultsRef}
          connection={attendances.connection} onSave={attendances.onSave} loadRevisions={attendances.loadRevisions}
          context={attendanceContext} onContextConsumed={consumeContext}
          onSaved={content => {
            setMonth(content.plannedMonth);
            setStatus('all');
            setSearch('');
            if (filters.schoolId && filters.schoolId !== content.schoolId) {
              onFiltersChange({ ...filters, schoolId: content.schoolId });
            }
          }} />

        <div className="finance-related" aria-label="Consultas complementares">
          <details className="surface-card finance-related-section">
            <summary><CalendarDays size={18} aria-hidden="true" /> Programação de visitas <small>Rascunho neste navegador</small><ChevronDown size={16} aria-hidden="true" /></summary>
            <VisitPlanningBoard schools={schools} selectedSchoolId={filters.schoolId} onOpenSchool={onOpenSchool}
              onEstimate={visit => onStartAttendance({
                schoolId: visit.schoolId, visitId: visit.id, plannedDate: visit.plannedDate,
                cycle: visit.cycle, serviceKind: visit.kind, quantity: visit.equipmentCount
              })} />
          </details>
          <details className="surface-card finance-related-section">
            <summary><FolderOpen size={18} aria-hidden="true" /> Histórico de corretivas <ChevronDown size={16} aria-hidden="true" /></summary>
            <HistoricCorrectionsPanel schools={schools} selectedSchoolId={filters.schoolId} onOpenSchool={onOpenSchool} />
          </details>
          <details className="surface-card finance-related-section">
            <summary><ClipboardList size={18} aria-hidden="true" /> Chamados e conferência por escola <ChevronDown size={16} aria-hidden="true" /></summary>
            <FinanceTicketConsultation schools={schools} tickets={tickets} filters={filters} onFiltersChange={onFiltersChange}
              onOpenTicket={onOpenTicket} onOpenSchool={onOpenSchool} onOpenSchoolRequests={onOpenSchoolRequests} />
          </details>
        </div>
      </div>
    </section>
  );
}
