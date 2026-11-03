import { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, CalendarDays, Info, RotateCcw } from 'lucide-react';
import { buildMonthlyForecast } from '../domain/monthlyForecast.js';
import { formatMoneyUnits4 } from '../domain/attendanceEstimate.js';
import '../styles/monthly-forecast.css';

function labelMonth(month, { long = false } = {}) {
  const [year, number] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    month: long ? 'long' : 'short', year: long ? 'numeric' : '2-digit', timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, number - 1, 15)));
}

function amount(value, overflow = false) {
  if (overflow) return 'Limite de precisão excedido';
  return value === null ? 'Não informado' : formatMoneyUnits4(value);
}

export default function MonthlyForecast({
  records = [], schools = [], selectedSchoolId = '', connection, onOpenAttendance
}) {
  const [month, setMonth] = useState('');
  const detailsRef = useRef(null);
  const ready = connection?.status === 'ready';
  const forecast = useMemo(() => buildMonthlyForecast(ready ? records : [], {
    schoolId: selectedSchoolId, selectedMonth: month
  }), [records, ready, selectedSchoolId, month]);
  const selected = forecast.selected;
  const highest = Math.max(1, ...forecast.months.flatMap(item => [
    item.additionalUnits4 || 0, item.pendingUnits4 || 0
  ]));
  const schoolsById = new Map(schools.map(item => [String(item.designacao), item]));
  const totalRecords = forecast.months.reduce((count, item) => count + item.recordCount, 0);

  // Em site sem emulador não renderizar um painel de valores fictícios/vazios.
  // A visão completa só é exibida quando o backend de desenvolvimento responde.
  if (!ready) {
    return (
      <section className="monthly-forecast surface-card" aria-label="Previsão mensal por competência">
        <header className="forecast-header">
          <div className="forecast-heading">
            <span className="section-eyebrow"><CalendarDays size={16} aria-hidden="true" /> Previsão de referências</span>
            <h3>Previsão mensal por competência</h3>
            <p>Composições e valores previstos, com acesso ao atendimento de origem.</p>
          </div>
        </header>
        <p className="forecast-unavailable" role="status">
          <Info size={18} aria-hidden="true" />
          {connection?.status === 'connecting'
            ? 'Conectando à base de desenvolvimento…'
            : 'A previsão compartilhada está disponível no ambiente de desenvolvimento isolado. Nenhum valor financeiro foi presumido no site publicado.'}
        </p>
      </section>
    );
  }

  function chooseMonth(value) {
    setMonth(value);
    requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ block: 'nearest' }));
  }

  return (
    <section className="monthly-forecast surface-card" aria-label="Previsão mensal por competência">
      <header className="forecast-header">
        <div className="forecast-heading">
          <span className="section-eyebrow"><CalendarDays size={16} aria-hidden="true" /> Previsão de referências</span>
          <h3>Previsão mensal por competência</h3>
          <p>Consulte valores informados e abra os atendimentos que sustentam cada mês.</p>
        </div>
        <div className="forecast-month-control">
          <label htmlFor="forecast-month">Competência</label>
          <div className="forecast-month-controls">
            <input id="forecast-month" className="form-control" type="month" value={month || forecast.selectedMonth} onChange={event => setMonth(event.target.value)} />
            <button type="button" className="btn btn-secondary btn-sm" disabled={!month}
              onClick={() => setMonth('')} aria-label="Voltar ao mês mais recente">
              <RotateCcw size={15} aria-hidden="true" /> <span>Mais recente</span>
            </button>
          </div>
        </div>
      </header>

      {!ready && (
        <p className="forecast-connection" role="status">
          <Info size={16} aria-hidden="true" />
          A previsão compartilhada depende do Firestore de desenvolvimento. Sem conexão, nenhum valor é presumido.
        </p>
      )}

      <div className="forecast-totals" aria-label={'Síntese de ' + labelMonth(selected.month, { long: true })}>
        <div>
          <span>Acréscimos informados</span>
          <strong className="tabular">{amount(selected.additionalUnits4, selected.overflowByNature.additional)}</strong>
          <small>Cobertura adicional com referência identificada</small>
        </div>
        <div>
          <span>Referência nominal</span>
          <strong className="tabular">{amount(selected.nominalUnits4, selected.overflowByNature.nominal)}</strong>
          <small>Inclui preços nominais de serviços cobertos</small>
        </div>
        <div>
          <span>Cobertura a confirmar</span>
          <strong className="tabular">{amount(selected.pendingUnits4, selected.overflowByNature.pending)}</strong>
          <small>Referências ainda sem enquadramento confirmado</small>
        </div>
      </div>

      <div className="forecast-trend">
        <div className="forecast-trend-heading">
          <div>
            <h4>Evolução dos atendimentos</h4>
            <p>Duas séries separadas: acréscimo informado e referência pendente. Não são valores de pagamento.</p>
          </div>
          <div className="forecast-legend" aria-label="Legenda das barras">
            <span><i className="forecast-dot is-additional" /> Acréscimo</span>
            <span><i className="forecast-dot is-pending" /> A confirmar</span>
          </div>
        </div>

        <div className="forecast-months" role="group" aria-label="Competências da previsão interativa">
          {forecast.months.map(item => (
            <button
              type="button"
              className={'forecast-month' + (selected.month === item.month ? ' is-selected' : '')}
              key={item.month}
              aria-pressed={selected.month === item.month}
              aria-label={'Selecionar ' + labelMonth(item.month, { long: true }) + ': ' + item.recordCount +
                ' atendimentos; acréscimos ' + amount(item.additionalUnits4, item.overflowByNature?.additional || item.overflow) +
                '; pendentes ' + amount(item.pendingUnits4, item.overflowByNature?.pending || item.overflow)}
              onClick={() => chooseMonth(item.month)}
            >
              <span className="forecast-month-count tabular">{item.recordCount}</span>
              <span className="forecast-bar-track">
                <span className="forecast-bar is-additional" style={{ height: item.additionalUnits4 === null ? '0' : Math.max(item.additionalUnits4 > 0 ? 5 : 2, (item.additionalUnits4 / highest) * 100) + '%' }} />
                <span className="forecast-bar is-pending" style={{ height: item.pendingUnits4 === null ? '0' : Math.max(item.pendingUnits4 > 0 ? 5 : 2, (item.pendingUnits4 / highest) * 100) + '%' }} />
              </span>
              <span className="forecast-month-label">{labelMonth(item.month)}</span>
            </button>
          ))}
        </div>
        {totalRecords === 0 && (
          <p className="forecast-empty-trend">Nenhuma estimativa registrada nas seis competências exibidas.</p>
        )}
      </div>

      <div className="forecast-drill" ref={detailsRef}>
        <div className="forecast-drill-heading">
          <div>
            <h4>Composições de {labelMonth(selected.month, { long: true })}</h4>
            <p>{selected.recordCount} {selected.recordCount === 1 ? 'atendimento' : 'atendimentos'} · {selected.schoolCount} {selected.schoolCount === 1 ? 'escola' : 'escolas'}</p>
          </div>
          {(selected.incompleteRecordCount > 0 || selected.invalidRecordCount > 0 || selected.overflow) &&
            <span className="forecast-pending-note">{selected.incompleteRecordCount} com informação a conferir</span>}
        </div>
        {selected.recordCount ? (
          <ul className="forecast-records">
            {selected.records.map((item, index) => {
              const school = schoolsById.get(String(item.record.schoolId));
              return (
                <li key={item.record.id || 'invalid-' + index}>
                  <div>
                    <strong>{school?.unidade_escolar || item.record.schoolId || 'Escola não identificada'}</strong>
                    <span>{item.invalid ? 'Composição inválida · requer revisão' :
                      item.incomplete ? 'Referências ou cobertura pendentes' : 'Composição informada'}
                      {' · '}Versão {item.record.revision || 1}
                    </span>
                    <small>Acréscimo: {amount(item.additionalUnits4, item.overflowByNature?.additional || item.overflow)}
                      {' · '}Referência nominal: {amount(item.nominalUnits4, item.overflow)}
                    </small>
                    {item.error && <small role="status">{item.error}</small>}
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm"
                    disabled={item.invalid || typeof onOpenAttendance !== 'function'}
                    onClick={() => onOpenAttendance(item.record)}
                    aria-label={'Abrir composição de ' + (school?.unidade_escolar || item.record.schoolId) + ', ' + labelMonth(item.record.plannedMonth, { long: true })}>
                    Abrir composição <ArrowUpRight size={16} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="forecast-empty-month">Nenhuma estimativa nesta competência. Selecione outro mês ou registre um atendimento.</p>
        )}
        {selected.invalidRecordCount > 0 && <p className="forecast-warning" role="status">{selected.invalidRecordCount} registro(s) inválido(s) excluído(s) dos valores; conferir a origem.</p>}
        {selected.overflow && <p className="forecast-warning" role="status">A soma ultrapassou o limite seguro de precisão; os valores não foram apresentados como totais.</p>}
        {forecast.invalidMonthRecordCount > 0 && <p className="forecast-warning" role="status">Existem atendimentos com competência inválida fora da série mensal.</p>}
      </div>

      <footer className="forecast-footer">
        Valores de planejamento, não constituem medição, atesto, NF, liquidação ou pagamento.
        Os totais nominais incluem parcelas adicionais e cobertas e não devem ser somados aos acréscimos.
      </footer>
    </section>
  );
}
