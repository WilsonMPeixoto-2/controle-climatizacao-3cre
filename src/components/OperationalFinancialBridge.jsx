import { useMemo, useState } from 'react';
import { ArrowUpRight, BarChart3, Calculator, ClipboardList, FileSpreadsheet, Info, Wrench } from 'lucide-react';
import { buildOperationalFinancialBridge } from '../domain/operationalFinancialBridge.js';
import { aggregatePlanningBaseline, CRE03_PLANNING_SOURCE } from '../data/cre03PlanningBaseline.js';
import { HISTORIC_CORRECTIVE_PROFILE } from '../data/historicCorrectivePriceProfile.js';
import { aggregateHistoricCorrections } from '../domain/historicCorrections.js';
import { formatMoneyUnits4 } from '../domain/attendanceEstimate.js';
import '../styles/operational-financial-bridge.css';

const money = value => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2
}).format(value / 10000);

export default function OperationalFinancialBridge({
  tickets, attendances, selectedSchoolId = '', onOpenTicket, onStartAttendance
}) {
  const [showAll, setShowAll] = useState(false);
  const linked = useMemo(() => buildOperationalFinancialBridge(tickets, attendances, selectedSchoolId),
    [tickets, attendances, selectedSchoolId]);
  const planned = useMemo(() => aggregatePlanningBaseline(selectedSchoolId), [selectedSchoolId]);
  const historic = useMemo(() => aggregateHistoricCorrections({ schoolId: selectedSchoolId }), [selectedSchoolId]);
  const maxBudget = Math.max(1, ...planned.byMonth.map(row => row.budgetUnits4));
  const visibleTickets = showAll ? linked.tickets : linked.tickets.slice(0, 5);
  return (
    <section className="finance-evidence" aria-labelledby="finance-evidence-title">
      <header className="finance-evidence-header">
        <div>
          <span className="section-eyebrow"><BarChart3 size={17} aria-hidden="true" /> Fontes integradas · leitura gerencial</span>
          <h3 id="finance-evidence-title">Planejamento e demandas existentes</h3>
          <p>O planejamento e os chamados aparecem mesmo sem estimativas salvas. São dados consultivos, separados de serviços medidos, faturados ou pagos.</p>
        </div>
        <span className="finance-evidence-chip">Fontes identificadas</span>
      </header>
      <div className="finance-evidence-grid">
        <article className="finance-evidence-block is-plan" aria-labelledby="finance-evidence-plan-title">
          <header>
            <span className="finance-evidence-kicker"><Calculator size={15} aria-hidden="true" /> Referência de planejamento</span>
            <h4 id="finance-evidence-plan-title">Preventivas · primeiro ciclo</h4>
          </header>
          <strong className="finance-evidence-money tabular">{planned.schools ? money(planned.budgetUnits4) : 'Sem escola no plano'}</strong>
          <div className="finance-evidence-numbers">
            <span><b className="tabular">{planned.schools}</b> escolas</span>
            <span><b className="tabular">{planned.equipmentCount}</b> aparelhos previstos</span>
            <span><b className="tabular">{planned.withIndividualEquipment}</b> escola(s) com aparelhos individualizados</span>
          </div>
          <div className="finance-evidence-bars" role="img"
            aria-label={'Distribuição do orçamento preventivo por mês relativo do primeiro ciclo: ' +
              planned.byMonth.map(x => 'Mês ' + x.month + ': ' + money(x.budgetUnits4)).join('; ')}>
            {planned.byMonth.map(row => (
              <div className="finance-evidence-month" key={row.month}>
                <span className="finance-evidence-month-bar"><i
                  style={{ height: (row.budgetUnits4 ? Math.max(4, 100 * row.budgetUnits4 / maxBudget) : 0) + '%' }}
                  aria-hidden="true" /></span>
                <b>{row.month}</b>
                <small>{row.schools} esc.</small>
              </div>
            ))}
          </div>
          <p className="finance-evidence-note"><Info size={14} aria-hidden="true" />
            Mês 1–6 é relativo ao semestre, não ao calendário. A planilha não contém datas de visita nem atestes.
            Origem: {CRE03_PLANNING_SOURCE.workbook}, aba {CRE03_PLANNING_SOURCE.sheet}.
          </p>
        </article>
        <article className="finance-evidence-block is-tickets" aria-labelledby="finance-evidence-ticket-title">
          <header>
            <span className="finance-evidence-kicker"><ClipboardList size={15} aria-hidden="true" /> Cadastros operacionais em tempo real</span>
            <h4 id="finance-evidence-ticket-title">Solicitações já registradas</h4>
          </header>
          <strong className="finance-evidence-money tabular">{linked.totalTickets} <small>chamados</small></strong>
          <div className="finance-evidence-numbers">
            <span><b className="tabular">{linked.linked}</b> com estimativa vinculada</span>
            <span><b className="tabular">{linked.withoutFinancialRecord}</b> sem estimativa vinculada</span>
            <span><b className="tabular">{linked.identifiableUnitPrices}</b> referências unitárias calculáveis</span>
          </div>
          <p className="finance-evidence-note">Solicitações de instalação/substituição não recebem automaticamente o preço de manutenção. Tipo, quantidade e escopo precisam ser confirmados antes de gerar orçamento.</p>
          {visibleTickets.length ? (
            <ul className="finance-evidence-ticket-list">
              {visibleTickets.map(row => (
                <li key={row.id}>
                  <div>
                    <strong>{row.id}</strong>
                    <span>{row.type} · {row.opened ? row.opened.split('-').reverse().join('/') : 'sem data'}</span>
                    <small>{row.linked ? 'Estimativa vinculada' :
                      row.unitPriceUnits4 !== null ? 'Preço unitário de referência: ' + formatMoneyUnits4(row.unitPriceUnits4) + ' · quantidade a conferir'
                        : row.maintenance ? 'Tipo/BTU existente não identificados para precificar' :
                          'Demanda sem enquadramento automático na tabela de manutenção'}</small>
                  </div>
                  <div className="finance-evidence-ticket-actions">
                    <button type="button" onClick={() => onOpenTicket(row.ticket)}
                      aria-label={'Abrir ficha ' + row.id}>Ficha <ArrowUpRight size={13} aria-hidden="true" /></button>
                    {onStartAttendance && <button type="button"
                      onClick={() => onStartAttendance({ ticketId: row.id, schoolId: String(row.ticket.designacao) })}
                      aria-label={'Abrir estimativa contextual do chamado ' + row.id}>
                      Estimar <ArrowUpRight size={13} aria-hidden="true" />
                    </button>}
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="finance-evidence-empty">Não há chamados desta escola no cadastro carregado. Isso não representa informação financeira igual a zero.</p>}
          {linked.tickets.length > 5 && <button type="button" className="finance-evidence-more"
            aria-expanded={showAll} onClick={() => setShowAll(value => !value)}>
            {showAll ? 'Mostrar apenas 5' : 'Consultar todos os ' + linked.tickets.length + ' chamados'}
          </button>}
        </article>
      </div>
      <div className="finance-evidence-history">
        <div>
          <span className="finance-evidence-kicker"><Wrench size={15} aria-hidden="true" /> Registro histórico de corretivas · setembro e outubro de 2026</span>
          <h4>Registros da planilha de manutenção</h4>
          <p>{historic.total} lançamento(s) no recorte · {historic.schoolCount} escolas. Esta fonte já foi incorporada como histórico consultivo, não como notas fiscais.</p>
        </div>
        {!selectedSchoolId && <div className="finance-evidence-history-money">
          <strong className="tabular">{formatMoneyUnits4(HISTORIC_CORRECTIVE_PROFILE.knownGrossUnits4)}</strong>
          <small>Referência técnica bruta para 85 linhas, sem deduplicação, cobertura ou ateste</small>
        </div>}
        <div className="finance-evidence-historic-stats">
          <span><b>{historic.byStatus.resolvido}</b> resolvidos na origem</span>
          <span><b>{historic.byStatus.emAndamento}</b> em andamento</span>
          <span><b>{historic.byStatus.imprestabilidade}</b> imprestabilidades</span>
          <span><b>{historic.possibleDuplicates}</b> possíveis repetições</span>
        </div>
        <p className="finance-evidence-note"><FileSpreadsheet size={14} aria-hidden="true" />
          {HISTORIC_CORRECTIVE_PROFILE.workbook}, linhas 3–87. O cálculo bruto considera uma referência unitária por linha,
          inclusive ocorrências possivelmente duplicadas ou imprestáveis: <strong>não é valor medido, autorizado ou pagável.</strong>
          Consulte as ocorrências detalhadas em “Histórico de corretivas”, na aba Atendimentos.
        </p>
      </div>
    </section>
  );
}
