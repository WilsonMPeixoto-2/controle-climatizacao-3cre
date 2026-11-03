import { useId } from 'react';
import { Info } from 'lucide-react';
import { getTicketReferenceContext } from '../domain/financialPresentation.js';
import { REFERENCE_STATUS } from '../domain/financialReference.js';

export default function FinancialReferenceCard({ ticket, school, compact = false, onEstimate, estimateDisabled = false }) {
  const titleId = useId();
  const context = getTicketReferenceContext(ticket);
  const capacity = value => value === null ? 'Não informado' : `${value.toLocaleString('pt-BR')} BTU`;
  const content = (
    <div className="finance-reference-content">
      {school && <p className="finance-context-school">{school.unidade_escolar} · {school.designacao}</p>}
      {!context.maintenance ? (
        <p>Referência financeira de manutenção não aplicável automaticamente a este tipo de demanda.</p>
      ) : (
        <>
          <dl className="finance-equipment">
            <div><dt>Tipo informado</dt><dd>{ticket.tipo_aparelho || 'Não informado'}</dd></div>
            <div><dt>BTU existente</dt><dd>{capacity(context.existingBtu)}</dd></div>
            <div><dt>BTU pretendido</dt><dd>{capacity(context.intendedBtu)}</dd></div>
          </dl>
          <p>{context.capacitySource && <>Consulta a partir de <strong>{context.capacitySource}</strong>. </>}{context.capacityNote}</p>
          <p>
            {context.reference.status === REFERENCE_STATUS.PENDING_CATALOG
              ? 'Tabela de referência ainda não informada.'
              : 'Tipo ou capacidade não confirmados; nenhuma categoria presumida.'}
            {' '}<strong>Valor de referência: Não informado.</strong>
          </p>
        </>
      )}
      <p className="finance-hint">A composição do atendimento pode usar referências informadas ou provisórias. O registro do chamado continua disponível, sem gerar cobrança pelo seu status.</p>
      {onEstimate && <button type="button" className="btn btn-secondary btn-sm" onClick={onEstimate} disabled={estimateDisabled}>Estimar atendimento deste chamado</button>}
    </div>
  );
  if (compact) {
    return (
      <details className="surface-card finance-reference finance-reference--compact">
        <summary><Info size={18} aria-hidden="true" />Referência financeira · consulta opcional</summary>
        {content}
      </details>
    );
  }
  return (
    <section className="surface-card finance-reference" aria-labelledby={titleId}>
      <h3 id={titleId}><Info size={18} aria-hidden="true" />Referência financeira de manutenção</h3>
      {content}
    </section>
  );
}
