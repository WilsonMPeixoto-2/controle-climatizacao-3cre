import { useMemo, useState } from 'react';
import { ArrowUpRight, BarChart3, Info, Layers3 } from 'lucide-react';
import { buildSchoolForecast } from '../domain/monthlyForecast.js';
import { buildCoverageComposition } from '../domain/financialVisualInsights.js';
import { formatMoneyUnits4 } from '../domain/attendanceEstimate.js';
import '../styles/monthly-forecast.css';

const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

function monthLabel(month) {
  return monthFormat.format(new Date(month + '-15T00:00:00Z'));
}

function amount(value, overflow) {
  if (overflow) return 'Limite de precisão excedido';
  return value === null ? 'Não informado' : formatMoneyUnits4(value);
}

function periodValue(period, nature) {
  return amount(period[nature + 'Units4'], period.overflowByNature[nature]);
}

export default function MonthlyForecast({ forecast, schools, connection, onExplore }) {
  const [ranking, setRanking] = useState('additional');
  const { selected, months, invalidMonthRecordCount } = forecast;
  const schoolsById = new Map(schools.map(school => [String(school.designacao), school.unidade_escolar]));
  const schoolTotals = useMemo(() => buildSchoolForecast(selected), [selected]);
  const composition = useMemo(() => buildCoverageComposition(selected), [selected]);
  const ranked = schoolTotals
    .filter(school => school[ranking + 'Units4'] > 0 ||
      (ranking === 'pending' && school.coveragePendingCount > 0) || school.overflowByNature[ranking])
    .sort((a, b) => Number(b.overflowByNature[ranking]) - Number(a.overflowByNature[ranking]) ||
      (b[ranking + 'Units4'] ?? -1) - (a[ranking + 'Units4'] ?? -1) ||
      a.schoolId.localeCompare(b.schoolId));
  const peak = Math.max(1, ...months.flatMap(item => [item.nominalUnits4 ?? 0, item.additionalUnits4 ?? 0]));
  const rankingPeak = Math.max(1, ...ranked.map(school => school[ranking + 'Units4'] ?? 0));
  const visibleSeries = months.some(item => item.recordCount > 0);

  return (
    <section className="monthly-forecast surface-card" aria-labelledby="forecast-title">
      <header className="forecast-header">
        <div className="forecast-heading">
          <span className="forecast-kicker">Inteligência financeira · Estimativas</span>
          <h3 id="forecast-title">Previsão mensal por competência</h3>
          <p>{monthLabel(selected.month)} · {selected.recordCount} {selected.recordCount === 1 ? 'atendimento' : 'atendimentos'} · {selected.schoolCount} {selected.schoolCount === 1 ? 'escola' : 'escolas'}</p>
        </div>
        {connection?.status === 'ready' && <button className="btn btn-secondary btn-sm" type="button"
          onClick={() => onExplore({ month: selected.month })}>
          Ver atendimentos <ArrowUpRight size={16} aria-hidden="true" />
        </button>}
      </header>

      {connection?.status !== 'ready' ? (
        <p className="forecast-unavailable" role="status">
          <Info size={18} aria-hidden="true" />
          {connection?.status === 'connecting' ? 'Conectando ao Firestore financeiro…' : 'Conexão financeira indisponível.'}
        </p>
      ) : (
        <>
          <div className="forecast-totals" aria-label={'Síntese de ' + monthLabel(selected.month)}>
            <button type="button" className="forecast-kpi is-nominal" onClick={() => onExplore({ month: selected.month })}>
              <span>Referência nominal <ArrowUpRight size={15} aria-hidden="true" /></span>
              <strong className="tabular">{periodValue(selected, 'nominal')}</strong>
              <small>Inclui serviços cobertos e adicionais</small>
            </button>
            <button type="button" className="forecast-kpi is-additional" onClick={() => onExplore({ month: selected.month, status: 'additional' })}>
              <span>Acréscimo informado <ArrowUpRight size={15} aria-hidden="true" /></span>
              <strong className="tabular">{periodValue(selected, 'additional')}</strong>
              <small>Com referência de cobertura</small>
            </button>
            <button type="button" className="forecast-kpi is-pending" onClick={() => onExplore({ month: selected.month, status: 'pending' })}>
              <span>Cobertura a confirmar <ArrowUpRight size={15} aria-hidden="true" /></span>
              <strong className="tabular">{periodValue(selected, 'pending')}</strong>
              <small>{selected.coveragePendingCount} {selected.coveragePendingCount === 1 ? 'grupo para conferir' : 'grupos para conferir'}</small>
            </button>
          </div>

          <div className="forecast-charts">
            <section className="forecast-trend" aria-labelledby="forecast-trend-title">
              <div className="forecast-chart-heading">
                <h4 id="forecast-trend-title"><BarChart3 size={18} aria-hidden="true" /> Evolução das estimativas</h4>
                <div className="forecast-legend" aria-label="Legenda das barras">
                  <span><i className="forecast-dot is-nominal" /> Referência nominal</span>
                  <span><i className="forecast-dot is-additional" /> Acréscimo</span>
                </div>
              </div>
              <div className="forecast-months" role="group" aria-label="Competências da previsão interativa">
                {months.map(item => {
                  const description = monthLabel(item.month) + ' · ' + item.recordCount +
                    ' atendimento(s) · Referência nominal: ' + periodValue(item, 'nominal') +
                    ' · Acréscimo: ' + periodValue(item, 'additional');
                  return (
                    <button type="button" className="forecast-month" key={item.month}
                      aria-current={selected.month === item.month ? 'date' : undefined}
                      aria-label={'Ver atendimentos de ' + description} title={description}
                      onClick={() => onExplore({ month: item.month })}>
                      <span className="forecast-bar-track" aria-hidden="true">
                        {['nominal', 'additional'].map(nature => {
                          const value = item[nature + 'Units4'];
                          return <span key={nature} className={'forecast-bar is-' + nature}
                            style={{ height: value === null || item.recordCount === 0 ? 0 : value === 0 ? '2px' : (value / peak) * 100 + '%' }} />;
                        })}
                      </span>
                      <span className="forecast-month-label">{item.month.slice(5)}/{item.month.slice(2, 4)}</span>
                    </button>
                  );
                })}
              </div>
              {!visibleSeries && <p className="forecast-empty">Nenhuma estimativa nas seis competências exibidas.</p>}
            </section>

            <section className="forecast-ranking" aria-labelledby="forecast-ranking-title">
              <div className="forecast-chart-heading">
                <h4 id="forecast-ranking-title">Por escola</h4>
                <select className="form-control" aria-label="Indicador por escola" value={ranking} onChange={event => setRanking(event.target.value)}>
                  <option value="nominal">Referência nominal</option>
                  <option value="additional">Acréscimo</option>
                  <option value="pending">Cobertura a confirmar</option>
                </select>
              </div>
              {ranked.length ? (
                <ul className="forecast-school-list">
                  {ranked.slice(0, 5).map(school => (
                    <li key={school.schoolId}>
                      <button type="button" onClick={() => onExplore({ month: selected.month, schoolId: school.schoolId, status: ranking === 'nominal' ? 'all' : ranking })}>
                        <span>{schoolsById.get(school.schoolId) || 'Escola ' + school.schoolId}</span>
                        <strong className="tabular">{periodValue(school, ranking)}</strong>
                        <span className="forecast-school-track" aria-hidden="true">
                          <span className={'forecast-school-bar is-' + ranking}
                            style={{ width: ((school[ranking + 'Units4'] ?? 0) / rankingPeak) * 100 + '%' }} />
                        </span>
                        {ranking === 'pending' && <small>{school.coveragePendingCount} {school.coveragePendingCount === 1 ? 'grupo' : 'grupos'}</small>}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <p className="forecast-empty">{ranking === 'nominal' ? 'Nenhuma escola com referência nominal positiva neste recorte.' : ranking === 'additional' ? 'Nenhuma escola com acréscimo positivo neste recorte.' : 'Nenhuma escola com cobertura a confirmar neste recorte.'}</p>}
              {ranked.length > 5 && <p className="forecast-empty">5 de {ranked.length} escolas exibidas.</p>}
            </section>
          </div>

          <section className="forecast-composition" aria-labelledby="forecast-composition-title">
            <div className="forecast-composition-intro">
              <span className="forecast-kicker">Análise do período selecionado</span>
              <h4 id="forecast-composition-title"><Layers3 size={19} aria-hidden="true" /> Composição da referência nominal</h4>
              <p>Distribuição por cobertura informada. As parcelas abaixo já integram a referência nominal; não devem ser somadas novamente.</p>
            </div>
            {composition ? (
              <div className="forecast-composition-content">
                <div className="forecast-donut" aria-label={'Distribuição da referência nominal: ' + composition.segments.map(part => part.label + ' ' + part.percent + '%').join(', ')}>
                  <svg viewBox="0 0 100 100" role="img" aria-label="Gráfico circular da composição por cobertura">
                    <circle className="forecast-donut-track" cx="50" cy="50" r="37" fill="none" strokeWidth="12" />
                    {composition.segments.reduce((parts, part) => {
                      const previous = parts.length ? parts.at(-1).offset + parts.at(-1).fraction : 0;
                      const fraction = part.units4 / composition.totalUnits4;
                      parts.push({ ...part, offset: previous, fraction });
                      return parts;
                    }, []).filter(part => part.units4 > 0).map(part => (
                      <circle key={part.key} className={'forecast-donut-arc is-' + part.key} cx="50" cy="50" r="37"
                        fill="none" strokeWidth="12" transform="rotate(-90 50 50)"
                        strokeDasharray={part.fraction * 2 * Math.PI * 37 + ' ' + (1 - part.fraction) * 2 * Math.PI * 37}
                        strokeDashoffset={-part.offset * 2 * Math.PI * 37}>
                        <title>{part.label}: {amount(part.units4, false)} ({part.percent}%)</title>
                      </circle>
                    ))}
                  </svg>
                  <div className="forecast-donut-center" aria-hidden="true">
                    <strong className="tabular">{composition.segments.length}</strong>
                    <span>classes de cobertura</span>
                  </div>
                </div>
                <div className="forecast-composition-breakdown">
                  {composition.segments.map(part => (
                    <div className={'forecast-composition-item is-' + part.key} key={part.key}>
                      <span className="forecast-composition-name"><i aria-hidden="true" />{part.label}</span>
                      <strong className="tabular">{amount(part.units4, false)}</strong>
                      <span className="forecast-composition-percent tabular">{part.percent}% da referência</span>
                      {(part.key === 'additional' || part.key === 'pending') && (
                        <button type="button" className="forecast-composition-explore"
                          onClick={() => onExplore({ month: selected.month, status: part.key === 'additional' ? 'additional' : 'pending' })}>
                          Ver atendimentos <ArrowUpRight size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="forecast-composition-unavailable" role="status">
                <Info size={19} aria-hidden="true" />
                <p>{selected.recordCount === 0
                  ? 'A composição aparecerá quando houver atendimentos registrados nesta competência.'
                  : 'Composição indisponível: existem valores não informados, registros inconsistentes ou referência nominal nula. Consulte os atendimentos para conferir.'}</p>
              </div>
            )}
          </section>

          <footer className="forecast-footer">
            {selected.incompleteRecordCount > 0 && <p>{selected.incompleteRecordCount} {selected.incompleteRecordCount === 1 ? 'atendimento com informação a conferir.' : 'atendimentos com informações a conferir.'}</p>}
            {selected.overflow && <p>Uma ou mais somas excederam o limite seguro de precisão.</p>}
            {invalidMonthRecordCount > 0 && <p>{invalidMonthRecordCount} atendimento(s) com competência inválida fora da série.</p>}
            <p>Valores de planejamento. Acréscimos já integram a referência nominal. Estes valores não representam pagamento.</p>
          </footer>
        </>
      )}
    </section>
  );
}
