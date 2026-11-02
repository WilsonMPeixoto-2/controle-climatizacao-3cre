import { Wallet } from 'lucide-react';

export default function SchoolFinancialSummary({ school, onOpenFinance }) {
  return (
    <section className="surface-card finance-school-summary" aria-label="Contexto financeiro da escola">
      <div className="section-header">
        <div className="section-heading">
          <h3><Wallet size={18} aria-hidden="true" />Informações financeiras da unidade</h3>
          <p>{school.unidade_escolar} · {school.designacao}</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm no-print" onClick={onOpenFinance}>Consultar Gestão Financeira</button>
      </div>
      <p><strong>Não informado.</strong> Informações financeiras ainda não registradas para esta escola.</p>
      <p className="finance-hint">O total de aparelhos do cadastro é agregado; não identifica cada equipamento nem determina valor contratual.</p>
    </section>
  );
}
