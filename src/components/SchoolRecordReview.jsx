import { useState } from 'react';
import { Building2, ClipboardList, ArrowUpRight, Search, ChevronDown, Info } from 'lucide-react';
import { getSchoolRecordReview } from '../domain/schoolRecordReview.js';
import { formatDateBrazilian } from '../lib/logic.js';

const views = [
  { key: 'to_review', label: 'A conferir', field: 'toReview' },
  { key: 'with_conclusion', label: 'Com conclusão', field: 'withConclusion' },
  { key: 'no_request', label: 'Sem solicitação', field: 'noRequest' }
];

/**
 * Conecta escolas e chamados reais para uma conferência GERENCIAL.
 * Não oferece atesto, medição, classificação financeira ou gravação adicional.
 * Ações abrem a consulta e a lista já existentes, mantendo os registros como fonte.
 */
export default function SchoolRecordReview({
  schools,
  tickets,
  month,
  schoolId,
  onOpenSchool,
  onOpenSchoolRequests
}) {
  const [view, setView] = useState('to_review');
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const overview = getSchoolRecordReview(schools, tickets, { month, schoolId });
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
  const matching = overview.schools
    .filter(row => row.category === view)
    .filter(row => !normalizedQuery ||
      [row.school.unidade_escolar, row.school.designacao, row.school.bairro]
        .some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(normalizedQuery)))
    .sort((a, b) => {
      if (view === 'to_review') {
        const count = b.withoutConclusion - a.withoutConclusion;
        if (count) return count;
      }
      return String(a.school.unidade_escolar || '').localeCompare(String(b.school.unidade_escolar || ''), 'pt-BR');
    });
  const visible = showAll ? matching : matching.slice(0, 8);
  const label = views.find(item => item.key === view)?.label || 'A conferir';

  return (
    <section className="dashboard-section school-review" aria-labelledby="school-review-title">
      <div className="section-header">
        <div className="section-heading">
          <span className="section-eyebrow"><Building2 size={16} aria-hidden="true" /> Acompanhamento operacional</span>
          <h3 id="school-review-title" className="section-title">Conferência por escola</h3>
          <p className="section-subtitle">Escolha uma situação e abra os registros da unidade.</p>
        </div>
      </div>

      <div className="school-review-facts" role="group" aria-label="Situação dos registros das escolas">
        {views.map(item => (
          <button
            type="button"
            key={item.key}
            className={`school-review-filter ${view === item.key ? 'is-active' : ''}`}
            aria-pressed={view === item.key}
            onClick={() => { setView(item.key); setShowAll(false); }}
          >
            <span className="school-review-filter-count tabular">{overview[item.field]}</span>
            <span className="school-review-filter-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="school-review-toolbar">
        <div className="form-group">
          <label htmlFor="school-review-search"><Search size={15} aria-hidden="true" /> Localizar escola</label>
          <input
            id="school-review-search"
            className="form-control"
            type="search"
            autoComplete="off"
            value={query}
            onChange={event => { setQuery(event.target.value); setShowAll(false); }}
            placeholder="Nome, designação ou bairro"
          />
        </div>
        <span className="school-review-result" role="status">
          {matching.length} {matching.length === 1 ? 'escola' : 'escolas'} · {label.toLocaleLowerCase('pt-BR')}
        </span>
      </div>

      <details className="school-review-context">
        <summary><Info size={17} aria-hidden="true" /> Como interpretar estes números?</summary>
        <p>
          <strong>A conferir</strong> indica chamados sem conclusão registrada no site, não falta comprovada de atendimento.
          <strong> Sem solicitação</strong> indica apenas ausência de chamados no recorte.
          A execução e a medição contratual podem constar de registros externos.
        </p>
      </details>

      {overview.unmatchedRecords > 0 && (
        <p className="finance-hint school-review-unmatched">
          {overview.unmatchedRecords} {overview.unmatchedRecords === 1 ? 'chamado não pôde ser associado' : 'chamados não puderam ser associados'} às escolas do cadastro neste recorte.
        </p>
      )}

      {visible.length ? (
        <ul className="school-review-list">
          {visible.map(({ school, requests, withoutConclusion, withConclusion, lastOpening, undatedRecords }) => (
            <li key={String(school.designacao)} className="school-review-item">
              <div className="school-review-details">
                <span className="school-review-school-code">{school.designacao} {school.bairro ? `· ${school.bairro}` : ''}</span>
                <strong>{school.unidade_escolar}</strong>
                <div className="school-review-meta">
                  {view === 'no_request'
                    ? 'Nenhuma solicitação registrada neste recorte'
                    : `${requests} ${requests === 1 ? 'chamado' : 'chamados'} · ${withoutConclusion || withConclusion} ${withoutConclusion ? 'sem' : 'com'} conclusão`
                  {lastOpening && <span> · Última abertura: {formatDateBrazilian(lastOpening)}</span>}
                  {month && undatedRecords > 0 && <span> · {undatedRecords} sem data válida fora do recorte mensal</span>
                </div>
              </div>
              {requests > 0 && (
                <div className="school-review-progress" role="img" aria-label={`${withoutConclusion} de ${requests} chamados sem conclusão registrada`}>
                  <span style={{ width: `${100 * withoutConclusion / requests}%` }} />
                </div>
              )}
              <div className="school-review-actions">
                <button className="btn btn-secondary btn-sm" type="button"
                  onClick={() => onOpenSchool(school)}
                  aria-label={`Abrir dossiê de ${school.unidade_escolar}`}>
                  <Building2 size={15} aria-hidden="true" />Dossiê
                </button>
                {requests > 0 && (
                  <button className="btn btn-secondary btn-sm" type="button"
                    onClick={() => onOpenSchoolRequests(school)}
                    aria-label={`Ver chamados de ${school.unidade_escolar}`}>
                    <ClipboardList size={15} aria-hidden="true" />Chamados <ArrowUpRight size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="school-review-empty" role="status">
          <ClipboardList size={20} aria-hidden="true" />
          <p>Nenhuma escola encontrada para esta seleção. Você pode alterar a categoria, a busca ou o período.</p>
        </div>
      )}

      {!showAll && matching.length > visible.length && (
        <button type="button" className="btn btn-secondary school-review-more" onClick={() => setShowAll(true)}>
          <ChevronDown size={17} aria-hidden="true" /> Ver mais {matching.length - visible.length} escolas
        </button>
      )}
      <p className="finance-hint school-review-footnote">
        Situações baseadas nos chamados registrados. Conclusão no site não equivale a atesto contratual.
      </p>
    </section>
  );
}
