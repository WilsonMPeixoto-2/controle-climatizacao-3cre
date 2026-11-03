import { useId } from 'react';
import { ArrowDown, ArrowRight, CalendarRange, ChevronDown, Info, RotateCcw } from 'lucide-react';
import { formatForecastMoneyUnits4 } from '../domain/attendanceForecast.js';
import '../styles/forecast.css';

const METRICS = {
  nominal: { title: 'Referência nominal prevista', short: 'Referência nominal', target: 'referência nominal' },
  additional: { title: 'Acréscimo adicional estimado', short: 'Acréscimo adicional', target: 'acréscimo adicional' }
};
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function monthName(month, short = false) {
  const number = Number(month?.slice(5, 7));
  const name = (short ? MONTHS : MONTH_NAMES)[number - 1];
  return name ? `${name}${short ? '' : ` de ${month.slice(0, 4)}`}` : 'Competência não informada';
}

function hasAmount(value) {
  return value !== null && value !== undefined;
}

function barHeight(value, maximum) {
  if (!hasAmount(value) || value === 0n || maximum === 0n) return 0;
  // A escala usa apenas o quociente limitado; não converte o montante em Number.
  return Math.max(1, Number(value * 10000n / maximum) / 100);
}

export function ForecastMetricValue({ metric, label }) {
  const known = metric?.knownSubtotalUnits4 ?? null;
  const complete = Boolean(metric?.complete && hasAmount(metric.totalUnits4));
  const amount = complete ? metric.totalUnits4 : known;
  const missing = metric?.missingGroupCount ?? 0;
  return (
    <div className="forecast-metric-value">
      {label && <span>{label}</span>}
      <strong className="tabular">{formatForecastMoneyUnits4(amount)}</strong>
      {!complete && hasAmount(known) && <small>Parcela conhecida · {missing} {missing === 1 ? 'grupo pendente' : 'grupos pendentes'}</small>}
      {!hasAmount(known) && missing > 0 && <small>{missing} {missing === 1 ? 'grupo sem valor conhecido' : 'grupos sem valor conhecido'}</small>}
    </div>
  );
}

export default function ForecastOverview({
  schools = [], forecast, connection = { status: 'unconfigured' }, schoolId = '',
  year, plannedMonth = '', measure = 'nominal', onYearChange, onMonthChange,
  onMeasureChange, onInspect
}) {
  const instanceId = useId();
  const metricKey = Object.hasOwn(METRICS, measure) ? measure : 'nominal';
  const selectedMetric = METRICS[metricKey];
  const ready = connection.status === 'ready';
  const summary = forecast?.summary;
  const monthly = forecast?.monthly || [];
  const schoolRows = forecast?.schools || [];
  const schoolNames = new Map(schools.map(school => [String(school.designacao), school.unidade_escolar]));
  const selectedSchoolName = schoolId ? schoolNames.get(String(schoolId)) || `Escola ${schoolId}` : 'Todas as escolas';
  const period = plannedMonth ? monthName(plannedMonth) : `Ano ${year}`;
  const maximum = monthly.reduce((max, bucket) => {
    const value = bucket[metricKey]?.knownSubtotalUnits4;
    return hasAmount(value) && value > max ? value : max;
  }, 0n);
  const inspect = options => onInspect?.({ measure: metricKey, detailFilter: 'all', ...options });

  return (
    <section className="forecast-overview" aria-label="Previsão mensal compartilhada" aria-busy={connection.status === 'connecting'}>
      <header className="forecast-header">
        <div className="forecast-heading">
          <span className="section-eyebrow"><CalendarRange size={16} aria-hidden="true" /> Planejamento por competência</span>
          <h3>Previsão mensal</h3>
          <p>{selectedSchoolName} · {period}</p>
        </div>
        <div className="forecast-controls">
          <div className="form-group forecast-year-control">
            <label htmlFor={`${instanceId}-year`}>Ano da previsão</label>
            <input id={`${instanceId}-year`} className="form-control" type="number" min="1" max="9999" step="1" value={year} onChange={event => onYearChange?.(event.target.value)} />
          </div>
          <div className="form-group forecast-month-control">
            <label htmlFor={`${instanceId}-month`}>Competência prevista</label>
            <input id={`${instanceId}-month`} className="form-control" type="month" value={plannedMonth} onChange={event => onMonthChange?.(event.target.value)} aria-describedby={`${instanceId}-month-hint`} />
            <small id={`${instanceId}-month-hint`}>{plannedMonth ? 'Síntese e escolas desta competência' : 'Síntese de todas as competências do ano'}</small>
          </div>
          <button type="button" className="btn btn-secondary forecast-clear-month" aria-label="Limpar competência prevista" disabled={!plannedMonth} onClick={() => onMonthChange?.('')}>
            <RotateCcw size={16} aria-hidden="true" /><span>Ver ano</span>
          </button>
        </div>
      </header>

      {!ready ? (
        <div className="forecast-state" role={connection.status === 'error' ? 'alert' : 'status'}>
          <Info size={22} aria-hidden="true" />
          <div>
            <strong>{connection.status === 'connecting' ? 'Carregando a previsão compartilhada…'
              : connection.status === 'error' ? 'Não foi possível atualizar a previsão'
                : 'Conecte a base de desenvolvimento para consultar a previsão'}</strong>
            <p>{connection.status === 'connecting' ? 'Aguardando os atendimentos e suas versões atuais.'
              : connection.status === 'error' ? 'Confira a conexão com a base compartilhada e tente novamente.'
                : 'A composição financeira aparecerá quando os atendimentos compartilhados estiverem disponíveis.'}</p>
          </div>
        </div>
      ) : (
        <>
          <section className="forecast-summary" aria-label="Síntese financeira do período">
            {Object.entries(METRICS).map(([key, description]) => {
              const metric = summary?.[key];
              const pendingCount = metric?.incompleteAttendanceCount ?? 0;
              return (
                <article className="forecast-kpi" data-measure={key} key={key}>
                  <button type="button" className="forecast-known-action" disabled={!metric || metric.knownGroupCount === 0} aria-label={`Consultar parcela conhecida da ${key === 'nominal' ? 'referência nominal' : 'acréscimo adicional'}`.replace('da acréscimo', 'do acréscimo')} onClick={() => inspect({ measure: key, detailFilter: 'known' })}>
                    <ForecastMetricValue metric={metric} label={description.title} />
                    <ArrowDown size={20} className="forecast-action-arrow" aria-hidden="true" />
                  </button>
                  <div className="forecast-kpi-context">
                    <span>{metric?.knownGroupCount ?? 0} {metric?.knownGroupCount === 1 ? 'grupo com valor conhecido' : 'grupos com valor conhecido'}</span>
                    {pendingCount > 0 && <button type="button" className="forecast-pending-action" aria-label={`Consultar pendências ${key === 'nominal' ? 'da referência nominal' : 'do acréscimo adicional'}`} onClick={() => inspect({ measure: key, detailFilter: 'pending' })}>
                      <Info size={15} aria-hidden="true" />{pendingCount} {pendingCount === 1 ? 'atendimento com pendência' : 'atendimentos com pendências'}<ArrowRight size={15} aria-hidden="true" />
                    </button>}
                  </div>
                </article>
              );
            })}
          </section>

          <p className="forecast-scope" role="status">
            <strong>{summary?.attendanceCount ?? 0} {(summary?.attendanceCount ?? 0) === 1 ? 'atendimento' : 'atendimentos'}</strong>
            <span>· {period} · Grandezas distintas, sem soma entre nominal e acréscimo.</span>
          </p>

          <div className="forecast-analysis">
            <section className="forecast-evolution" aria-labelledby={`${instanceId}-chart-title`}>
              <div className="forecast-section-heading">
                <div>
                  <h4 id={`${instanceId}-chart-title`}>Evolução por competência</h4>
                  <p>{year} · {selectedSchoolName}</p>
                </div>
                <div className="form-group forecast-measure-control">
                  <label htmlFor={`${instanceId}-measure`}>Grandeza do gráfico</label>
                  <select id={`${instanceId}-measure`} className="form-control" value={metricKey} onChange={event => onMeasureChange?.(event.target.value)}>
                    {Object.entries(METRICS).map(([key, description]) => <option value={key} key={key}>{description.short}</option>)}
                  </select>
                </div>
              </div>
              <div className="forecast-chart-guide">
                <span>{selectedMetric.short} · parcela conhecida em R$</span>
                <strong className="tabular">{formatForecastMoneyUnits4(maximum, { digits: 2 })}</strong>
              </div>
              <div className="forecast-chart-scroll">
                <div className="forecast-chart" role="group" aria-label="Evolução mensal da previsão">
                  {monthly.map(bucket => {
                    const metric = bucket[metricKey];
                    const known = metric?.knownSubtotalUnits4 ?? null;
                    const pending = metric?.missingGroupCount ?? 0;
                    const exactValue = hasAmount(known) ? formatForecastMoneyUnits4(known) : 'sem valor conhecido';
                    const label = `${monthName(bucket.month)}: ${selectedMetric.short.toLocaleLowerCase('pt-BR')}, ${exactValue}, ${bucket.attendanceCount} atendimentos, ${pending} grupos pendentes. Abrir composição`;
                    return (
                      <button type="button" key={bucket.month} data-month={bucket.month} className={`forecast-bar${plannedMonth === bucket.month ? ' is-selected' : ''}${known === 0n ? ' is-zero' : ''}${!hasAmount(known) ? ' is-unknown' : ''}`} aria-label={label} aria-pressed={plannedMonth === bucket.month} onClick={() => inspect({ plannedMonth: bucket.month })}>
                        <span className="forecast-bar-number tabular" aria-hidden="true">{hasAmount(known) ? formatForecastMoneyUnits4(known, { digits: 2 }).replace(/^R\$\s*/, '') : '—'}</span>
                        <span className="forecast-bar-track" aria-hidden="true"><span className="forecast-bar-fill" style={{ height: `${barHeight(known, maximum)}%` }} /></span>
                        <span className="forecast-bar-month" aria-hidden="true">{monthName(bucket.month, true)}</span>
                        <span className="forecast-bar-pending" aria-hidden="true">{pending > 0 ? `${pending} pend.` : bucket.attendanceCount > 0 ? `${bucket.attendanceCount} atend.` : 'sem registros'}</span>
                        <span className="forecast-bar-tooltip" aria-hidden="true"><strong>{monthName(bucket.month)}</strong><span>{exactValue}</span><small>{bucket.attendanceCount} atendimentos · {pending} grupos pendentes</small></span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="forecast-chart-caption">Selecione um mês para consultar sua composição. Valores das barras arredondados; detalhes com quatro casas.</p>
              <details className="forecast-month-table">
                <summary>Ver valores dos meses<ChevronDown size={16} aria-hidden="true" /></summary>
                <div className="forecast-table-scroll" tabIndex={0} role="region" aria-label="Valores mensais da previsão">
                  <table>
                    <thead><tr><th scope="col">Competência</th><th scope="col">{selectedMetric.short} (R$)</th><th scope="col">Pendências</th><th scope="col"><span className="forecast-sr-only">Consultar</span></th></tr></thead>
                    <tbody>{monthly.map(bucket => <tr key={bucket.month}>
                      <th scope="row">{monthName(bucket.month)}</th>
                      <td className="tabular">{formatForecastMoneyUnits4(bucket[metricKey]?.knownSubtotalUnits4 ?? null)}{bucket[metricKey]?.missingGroupCount > 0 ? ' · parcial' : ''}</td>
                      <td>{bucket[metricKey]?.missingGroupCount ?? 0} grupos</td>
                      <td><button type="button" className="forecast-table-action" aria-label={`Consultar composição de ${monthName(bucket.month)}`} onClick={() => inspect({ plannedMonth: bucket.month })}>Consultar<ArrowRight size={15} aria-hidden="true" /></button></td>
                    </tr>)}</tbody>
                  </table>
                </div>
              </details>
            </section>

            <section className="forecast-schools" aria-labelledby={`${instanceId}-schools-title`}>
              <div className="forecast-section-heading">
                <div><h4 id={`${instanceId}-schools-title`}>Composição por escola</h4><p>{period} · valores conhecidos e pendências</p></div>
              </div>
              {schoolRows.length ? (
                <div className="forecast-table-scroll" tabIndex={0} role="region" aria-label="Composição da previsão por escola">
                  <table className="forecast-school-table">
                    <thead><tr><th scope="col">Escola</th><th scope="col">Nominal (R$)</th><th scope="col">Acréscimo (R$)</th></tr></thead>
                    <tbody>{schoolRows.map(bucket => {
                      const name = schoolNames.get(String(bucket.schoolId)) || `Escola ${bucket.schoolId}`;
                      return <tr key={bucket.schoolId} data-school-id={bucket.schoolId}>
                        <th scope="row"><button type="button" className="forecast-school-action" aria-label={`Consultar atendimentos de ${name}`} onClick={() => inspect({ schoolId: bucket.schoolId })}><strong>{name}</strong><span>{bucket.schoolId} · {bucket.attendanceCount} {bucket.attendanceCount === 1 ? 'atendimento' : 'atendimentos'}<ArrowRight size={15} aria-hidden="true" /></span></button></th>
                        {['nominal', 'additional'].map(key => <td key={key}><ForecastMetricValue metric={bucket[key]} /></td>)}
                      </tr>;
                    })}</tbody>
                  </table>
                </div>
              ) : <p className="forecast-empty">Nenhum atendimento neste recorte. Escolha outra competência ou consulte o ano.</p>}
            </section>
          </div>
          <footer className="forecast-footer">Fonte: atendimentos compartilhados, nas versões atuais. Valores de planejamento.</footer>
        </>
      )}
    </section>
  );
}
