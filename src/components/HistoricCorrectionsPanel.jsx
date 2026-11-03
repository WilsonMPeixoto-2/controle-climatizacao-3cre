import { useMemo, useState } from 'react';
import { ArrowUpRight, ClipboardCheck, FileSpreadsheet, Info, RotateCcw } from 'lucide-react';
import { aggregateHistoricCorrections, HISTORIC_CORRECTIVE_SOURCE } from '../domain/historicCorrections.js';
import '../styles/historic-corrections.css';

const STATUSES = [
  { key:'resolvido', label:'Resolvido', slug:'resolved' },
  { key:'emAndamento', label:'Em andamento', slug:'ongoing' },
  { key:'imprestabilidade', label:'Imprestabilidade', slug:'unfit' },
  { key:'pendente', label:'Pendente', slug:'pending' }
];

function monthName(month) {
  if (!month) return 'Setembro e outubro de 2026';
  return month === '2026-09' ? 'Setembro de 2026' : 'Outubro de 2026';
}

function StatusBar({ record }) {
  return (
    <div className="historic-stacked-bar" role="img"
      aria-label={STATUSES.map(item=>item.label+': '+record.byStatus[item.key]).join('; ')}>
      {STATUSES.filter(item=>record.byStatus[item.key]>0).map(item=>(
        <span key={item.key} className={'historic-segment is-'+item.slug}
          style={{flexGrow:record.byStatus[item.key]}} aria-hidden="true"/>
      ))}
    </div>
  );
}

export default function HistoricCorrectionsPanel({
  selectedSchoolId = '', schools = [], onOpenSchool
}) {
  const [selectedMonth,setSelectedMonth] = useState('');
  const all = useMemo(()=>aggregateHistoricCorrections({schoolId:selectedSchoolId}),[selectedSchoolId]);
  const selected = useMemo(()=>aggregateHistoricCorrections({
    schoolId:selectedSchoolId,month:selectedMonth
  }),[selectedMonth,selectedSchoolId]);
  const grouped = selected.rows.toSorted((a,b)=>
    (b.byStatus.emAndamento+b.byStatus.imprestabilidade+b.byStatus.pendente)-
    (a.byStatus.emAndamento+a.byStatus.imprestabilidade+a.byStatus.pendente) ||
    b.total-a.total || a.schoolId.localeCompare(b.schoolId));
  const schoolMap = new Map(schools.map(item=>[String(item.designacao),item]));
  const global = aggregateHistoricCorrections();
  const monthly = global.byMonth;
  return (
    <section className="historic-corrections surface-card" aria-label="Histórico de corretivas de setembro e outubro">
      <header className="historic-heading">
        <div>
          <span className="section-eyebrow"><FileSpreadsheet size={16} aria-hidden="true"/> Dados históricos importados</span>
          <h3>Corretivas: setembro e outubro</h3>
          <p>Compare os lançamentos por mês e abra a relação das escolas com cada situação registrada.</p>
        </div>
        <span className="historic-source-chip">Arquivo de referência · não sincronizado</span>
      </header>

      <div className="historic-summary" aria-label="Resumo do histórico no filtro atual">
        <div><strong className="tabular">{all.total}</strong><span>lançamentos da planilha</span></div>
        <div><strong className="tabular">{all.schoolCount}</strong><span>escolas com registros</span></div>
        <div><strong className="tabular">{all.possibleDuplicates}</strong><span>possíveis repetições</span></div>
        <div><strong className="tabular">{all.recoveredIdentifiers}</strong><span>designações recuperadas do texto</span></div>
      </div>

      <div className="historic-month-area">
        <div className="historic-subheading">
          <div>
            <h4>Situação por mês da data registrada</h4>
            <p>As barras mostram contagens de linhas originais, antes de esclarecer as possíveis repetições.</p>
          </div>
          <div className="historic-legend" aria-label="Legenda de situações">
            {STATUSES.map(s=>(
              <span key={s.key}><i className={'historic-legend-dot is-'+s.slug}/>{s.label}</span>
            ))}
          </div>
        </div>
        <div className="historic-month-chart" role="group" aria-label="Selecionar mês dos registros históricos">
          {monthly.map(m=> {
            // O recorte escolar aplica-se às barras; a base não é alterada.
            const filtered=all.byMonth.find(item=>item.month===m.month);
            const total=filtered?.total||0;
            return (
              <button type="button" key={m.month} className={'historic-month-button'+(selectedMonth===m.month?' is-selected':'')}
                aria-pressed={selectedMonth===m.month}
                aria-label={'Filtrar '+monthName(m.month).toLowerCase()+' · '+total+' lançamentos'}
                onClick={()=>setSelectedMonth(prev=>prev===m.month?'':m.month)}>
                <span className="historic-month-top"><strong>{monthName(m.month)}</strong><b className="tabular">{total}</b></span>
                <StatusBar record={filtered||{byStatus:{resolvido:0,emAndamento:0,imprestabilidade:0,pendente:0}}}/>
                <span className="historic-month-foot">{total?STATUSES.filter(s=>filtered.byStatus[s.key]).map(s=>s.label+' '+filtered.byStatus[s.key]).join(' · '):'Sem lançamento para a escola'}</span>
              </button>
            );
          })}
        </div>
        <div className="historic-actions">
          <span>{selectedMonth?monthName(selectedMonth):'Dois meses'} · {selected.total} linhas · {selected.schoolCount} escolas</span>
          {selectedMonth&&<button type="button" className="btn btn-secondary btn-sm" onClick={()=>setSelectedMonth('')}>
            <RotateCcw size={14} aria-hidden="true"/> Mostrar os dois meses
          </button>}
        </div>
      </div>

      <div className="historic-detail">
        <div className="historic-detail-heading">
          <h4>Escolas e origens dos lançamentos</h4>
          <span>{grouped.length} agrupamentos escola/mês</span>
        </div>
        {grouped.length ? (
          <div className="historic-rows">
            {grouped.map(item=>{
              const school=schoolMap.get(item.schoolId);
              const issues=item.byStatus.emAndamento+item.byStatus.imprestabilidade+item.byStatus.pendente;
              return (
                <details className="historic-school" key={item.schoolId+'-'+item.month}>
                  <summary>
                    <span className="historic-school-label">
                      <strong>{item.schoolName}</strong>
                      <small>{item.schoolId} · {monthName(item.month)}{item.possibleDuplicates?' · '+item.possibleDuplicates+' possível(is) repetição(ões)':''}</small>
                    </span>
                    <span className="historic-school-count tabular">{item.total} linha(s)</span>
                    <span className={'historic-school-indicator'+(issues?' has-issues':'')}>
                      {issues?issues+' a conferir':'Situação resolvida na fonte'}
                    </span>
                  </summary>
                  <div className="historic-school-expanded">
                    <StatusBar record={item}/>
                    <div className="historic-school-statuses">
                      {STATUSES.map(s=><span key={s.key}>{s.label}: <b className="tabular">{item.byStatus[s.key]}</b></span>)}
                      <span>Split: <b className="tabular">{item.byType.split}</b></span>
                      <span>ACJ: <b className="tabular">{item.byType.acj}</b></span>
                    </div>
                    <p className="historic-source-rows">
                      Origem: {HISTORIC_CORRECTIVE_SOURCE.workbook} · aba {HISTORIC_CORRECTIVE_SOURCE.worksheet} ·
                      linhas {item.sourceRows.join(', ')}.
                      {item.recoveredIdentifiers>0?' '+item.recoveredIdentifiers+' designação(ões) recuperada(s) da coluna de identificação textual.':''}
                    </p>
                    {school&&typeof onOpenSchool==='function'&&
                      <button type="button" className="btn btn-secondary btn-sm" onClick={()=>onOpenSchool(school)}>
                        Abrir dossiê da escola <ArrowUpRight size={15} aria-hidden="true"/>
                      </button>}
                    {!school&&<small className="historic-school-unlinked">Unidade sem correspondência confirmada na lista de escolas carregada. Nenhum vínculo foi criado automaticamente.</small>}
                  </div>
                </details>
              );
            })}
          </div>
        ):<p className="historic-empty">Nenhum lançamento correspondente ao recorte escolhido. Isso não comprova ausência de atendimento.</p>}
      </div>

      <footer className="historic-note">
        <Info size={17} aria-hidden="true"/>
        <p><strong>Fonte e limites:</strong> {HISTORIC_CORRECTIVE_SOURCE.workbook}, aba {HISTORIC_CORRECTIVE_SOURCE.worksheet},
          linhas {HISTORIC_CORRECTIVE_SOURCE.sourceRows}. Agrupamento por mês da data do registro, não por competência financeira.
          Situação “resolvido” é informação da planilha, não atesto; repetições são alertas, não exclusões.
          <strong> Sem valores de medição, glosa, nota fiscal ou pagamento neste conjunto.</strong></p>
      </footer>
    </section>
  );
}
