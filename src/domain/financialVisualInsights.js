/**
 * Séries de visualização para a Gestão Financeira. Somente snapshots
 * presentes no período já filtrado: sem inferir execução, fatura ou pagamento.
 * Valores monetários em inteiros de R$ 0,0001, sem arredondamento acumulativo.
 */

/**
 * Os três componentes são SUBCONJUNTOS mutuamente exclusivos do nominal:
 * incluído com cobertura confirmada, adicional confirmado e cobertura pendente.
 * Só desenhar participação relativa quando todos os valores são confiáveis.
 */
export function buildCoverageComposition(summary) {
  if (!summary || summary.recordCount < 1 || summary.overflow ||
    summary.invalidRecordCount > 0 || summary.missingNominalCount > 0 ||
    !Number.isSafeInteger(summary.nominalUnits4) || summary.nominalUnits4 <= 0) return null;

  const groups = [
    { key: 'included', label: 'Cobertura incluída', units4: summary.includedNominalUnits4 ?? 0 },
    { key: 'additional', label: 'Acréscimo confirmado', units4: summary.additionalUnits4 ?? 0 },
    { key: 'pending', label: 'Cobertura a confirmar', units4: summary.pendingUnits4 ?? 0 }
  ];
  if (groups.some(row => !Number.isSafeInteger(row.units4) || row.units4 < 0) ||
    groups.reduce((n, row) => n + BigInt(row.units4), 0n) !== BigInt(summary.nominalUnits4)) return null;

  const totalUnits4 = summary.nominalUnits4;
  return {
    totalUnits4,
    segments: groups.map(row => ({
      ...row,
      percent: Math.round(row.units4 / totalUnits4 * 100)
    }))
  };
}

/**
 * Perfil informativo de atendimentos na seleção visível (escola, competência,
 * filtro de cobertura e pesquisa). Não usa contagem de equipamentos como se
 * fosse quantidade de atendimentos.
 */
export function buildServiceProfile(rows) {
  const source = Array.isArray(rows) ? rows : [];
  const categories = [
    { key: 'preventiva', label: 'Preventivas' },
    { key: 'corretiva', label: 'Corretivas' },
    { key: 'outra', label: 'Outras atividades' }
  ];
  const total = source.length;
  const counts = { preventiva: 0, corretiva: 0, outra: 0 };
  let linked = 0;
  let incomplete = 0;
  for (const row of source) {
    const kind = row?.record?.serviceKind;
    counts[kind === 'preventiva' || kind === 'corretiva' ? kind : 'outra']++;
    if (Array.isArray(row?.record?.ticketIds) && row.record.ticketIds.length > 0) linked++;
    if (row?.incomplete || row?.invalid) incomplete++;
  }
  return {
    total, linked, incomplete,
    groups: categories.map(group => ({
      ...group, count: counts[group.key],
      percent: total ? Math.round(counts[group.key] * 100 / total) : 0
    }))
  };
}
