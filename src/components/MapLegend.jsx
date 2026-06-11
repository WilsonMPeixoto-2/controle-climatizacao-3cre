import { buildRiskSummary } from '../lib/mapRisk.js';

/**
 * Legenda do Mapa Operacional v2 — visual + textual (acessível).
 * Renderizada FORA do canvas Leaflet, ao lado/abaixo do mapa.
 */
export default function MapLegend({ risk }) {
  const s = buildRiskSummary(risk);

  const niveis = [
    { id: 'critico',    rotulo: 'Crítico',    qtd: s.critico,    dica: 'pior caso ≥ 75 pts' },
    { id: 'alto',       rotulo: 'Alto',       qtd: s.alto,       dica: '50–74 pts' },
    { id: 'moderado',   rotulo: 'Moderado',   qtd: s.moderado,   dica: '25–49 pts' },
    { id: 'vigilancia', rotulo: 'Vigilância', qtd: s.vigilancia, dica: 'demanda leve ativa' }
  ];

  return (
    <aside className="map-legend" aria-label="Legenda do mapa operacional">
      <div className="map-legend-title">Risco territorial</div>

      <ul className="map-legend-list">
        {niveis.map((n) => (
          <li key={n.id} className="map-legend-item">
            <span className={`map-legend-swatch nivel-${n.id}`} aria-hidden="true" />
            <span className="map-legend-rotulo">{n.rotulo}</span>
            <span className="map-legend-qtd">{n.qtd}</span>
            <span className="map-legend-dica">{n.dica}</span>
          </li>
        ))}
      </ul>

      <div className="map-legend-keys">
        <span className="map-legend-key"><i className="key-borda" aria-hidden="true" /> borda grossa = há chamado crítico</span>
        <span className="map-legend-key"><i className="key-opacidade" aria-hidden="true" /> preenchimento mais cheio = mais chamados</span>
      </div>

      <details className="map-legend-howto">
        <summary>Como ler este mapa</summary>
        <p>
          A <strong>cor</strong> indica a gravidade dos piores chamados do bairro
          (média dos 3 piores, na mesma régua da fila “exige ação agora”).
          A <strong>opacidade</strong> indica o volume de chamados ativos.
          A <strong>borda grossa</strong> marca a presença de ao menos um chamado crítico.
          Assim, muitos chamados leves aparecem “cheios” porém claros — nunca
          mais graves do que poucos chamados críticos parados.
        </p>
      </details>

      <p className="sr-only" role="status" aria-live="polite">
        {`Território: ${s.critico} bairros críticos, ${s.alto} altos, ${s.moderado} moderados, ${s.vigilancia} em vigilância; ${s.totalAtivos} chamados ativos em ${s.bairrosComDemanda} bairros.`}
      </p>
    </aside>
  );
}
