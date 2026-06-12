/**
 * Legenda do Mapa Operacional — enxuta e espelhando exatamente a pintura
 * dos polígonos. Sem escalas numéricas: a linguagem é a da operação.
 */
export default function MapLegend({ risk }) {
  let criticos = 0;
  let atencao = 0;
  let ativos = 0;

  for (const b of Object.values(risk || {})) {
    if (!b || !b.chamados_ativos) continue;
    if (b.criticos > 0) criticos += 1;
    else if (b.atencao > 0) atencao += 1;
    else ativos += 1;
  }

  const itens = [
    { id: 'criticos', cor: 'var(--color-red)', rotulo: 'Com chamado crítico', qtd: criticos },
    { id: 'atencao', cor: 'var(--color-amber)', rotulo: 'Com chamado em atenção', qtd: atencao },
    { id: 'ativos', cor: 'var(--color-blue)', rotulo: 'Com demanda ativa recente', qtd: ativos }
  ];

  return (
    <aside className="map-legend" aria-label="Legenda do mapa operacional">
      {itens.map((n) => (
        <span key={n.id} className="map-legend-item">
          <i className="map-legend-swatch" style={{ background: n.cor }} aria-hidden="true" />
          {n.rotulo} <strong>{n.qtd}</strong>
        </span>
      ))}
      <p className="sr-only" role="status" aria-live="polite">
        {`${criticos} bairros com chamado crítico, ${atencao} com chamado em atenção, ${ativos} com demanda ativa recente.`}
      </p>
    </aside>
  );
}
