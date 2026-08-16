import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const sourcePath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.join(rootDir, 'src/data/db.json');
const outputPath = process.argv[3]
  ? path.resolve(process.cwd(), process.argv[3])
  : path.join(rootDir, 'docs/migration/firebase/seed-plan.json');

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const arrays = {
  escolas: Array.isArray(source.escolas) ? source.escolas : [],
  chamados: Array.isArray(source.chamados) ? source.chamados : [],
  historico: Array.isArray(source.historico) ? source.historico : [],
  modelos_email: Array.isArray(source.modelos_email) ? source.modelos_email : [],
  anexos_chamado: Array.isArray(source.anexos_chamado) ? source.anexos_chamado : []
};

const duplicateValues = (rows, key) => {
  const seen = new Set();
  const duplicates = new Set();
  for (const row of rows) {
    const value = row?.[key];
    if (value == null || value === '') continue;
    if (seen.has(String(value))) duplicates.add(String(value));
    seen.add(String(value));
  }
  return [...duplicates].sort();
};

const schoolIds = new Set(arrays.escolas.map((row) => String(row?.designacao || '')).filter(Boolean));
const ticketIds = new Set(arrays.chamados.map((row) => String(row?.id_chamado || '')).filter(Boolean));

const officialIdPattern = /^GOP-AR-(\d{4})-(\d{4})$/;
const invalidTicketIds = [];
const countersByYear = new Map();

for (const row of arrays.chamados) {
  const id = String(row?.id_chamado || '');
  const match = officialIdPattern.exec(id);
  if (!match) {
    invalidTicketIds.push(id || '(vazio)');
    continue;
  }

  const [, year, sequenceText] = match;
  const sequence = Number(sequenceText);
  const current = countersByYear.get(year);
  if (!current || sequence > current.ultimoNumero) {
    countersByYear.set(year, {
      ano: year,
      ultimoNumero: sequence,
      ultimoId: id,
      atualizado_em: row?.criado_em || row?.modificado_em || row?.data_solicitacao || null
    });
  }
}

const orphanTicketSchools = arrays.chamados
  .filter((row) => row?.designacao && !schoolIds.has(String(row.designacao)))
  .map((row) => ({ id_chamado: row.id_chamado, designacao: String(row.designacao) }));

const orphanHistoryTickets = arrays.historico
  .filter((row) => row?.id_chamado && !ticketIds.has(String(row.id_chamado)))
  .map((row) => ({ id_evento: row.id_evento, id_chamado: String(row.id_chamado) }));

const orphanHistorySchools = arrays.historico
  .filter((row) => row?.designacao && !schoolIds.has(String(row.designacao)))
  .map((row) => ({ id_evento: row.id_evento, designacao: String(row.designacao) }));

const duplicateKeys = {
  escolas_designacao: duplicateValues(arrays.escolas, 'designacao'),
  chamados_id_chamado: duplicateValues(arrays.chamados, 'id_chamado'),
  historico_id_evento: duplicateValues(arrays.historico, 'id_evento'),
  modelos_email_id: duplicateValues(arrays.modelos_email, 'id')
};

const testHistoryArtifacts = arrays.historico
  .filter((row) => /^EV-TEST-/i.test(String(row?.id_evento || '')))
  .map((row) => ({
    id_evento: row.id_evento,
    id_chamado: row.id_chamado || null,
    data: row.data || null,
    observacao: row.observacao || null
  }));
const excludedHistoryIds = new Set(testHistoryArtifacts.map((row) => String(row.id_evento)));

const deferredAttachments = arrays.anexos_chamado.map((row) => ({
  id: row.id,
  id_chamado: row.id_chamado || null,
  designacao: row.designacao || null,
  unidade_escolar: row.unidade_escolar || null,
  nome_original: row.nome_original || null,
  mime_type: row.mime_type || null,
  tamanho_bytes: row.tamanho_bytes || null,
  bucket: row.bucket || null,
  storage_path: row.storage_path || null,
  criado_em: row.criado_em || null,
  migrationStatus: 'deferred-storage-requires-blaze'
}));

const criticalIssues = [
  ...Object.entries(duplicateKeys)
    .filter(([, values]) => values.length > 0)
    .map(([field, values]) => ({ type: 'duplicate-key', field, values })),
  ...invalidTicketIds.map((id) => ({ type: 'invalid-ticket-id', id }))
];

const warnings = [];
if (orphanTicketSchools.length) warnings.push({ type: 'ticket-school-orphans', rows: orphanTicketSchools });
if (orphanHistoryTickets.length) warnings.push({ type: 'history-ticket-orphans', rows: orphanHistoryTickets });
if (orphanHistorySchools.length) warnings.push({ type: 'history-school-orphans', rows: orphanHistorySchools });
if (testHistoryArtifacts.length) warnings.push({
  type: 'test-history-artifacts-excluded-from-production-seed',
  rows: testHistoryArtifacts
});
if (deferredAttachments.length) warnings.push({
  type: 'attachments-deferred-from-spark-seed',
  rows: deferredAttachments
});

const plan = {
  generatedAt: new Date().toISOString(),
  source: path.relative(rootDir, sourcePath).replaceAll('\\', '/'),
  targetCollections: ['escolas', 'chamados', 'historico', 'modelos_email', 'contadores'],
  deferredCollections: ['anexos_chamado'],
  sourceCounts: {
    escolas: arrays.escolas.length,
    chamados: arrays.chamados.length,
    historico: arrays.historico.length,
    modelos_email: arrays.modelos_email.length,
    anexos_chamado: arrays.anexos_chamado.length
  },
  productionSeedCounts: {
    escolas: arrays.escolas.length,
    chamados: arrays.chamados.length,
    historico: arrays.historico.filter((row) => !excludedHistoryIds.has(String(row?.id_evento || ''))).length,
    modelos_email: arrays.modelos_email.length,
    contadores: countersByYear.size
  },
  counters: [...countersByYear.values()].sort((a, b) => a.ano.localeCompare(b.ano)),
  excludedTestArtifacts: {
    historico: testHistoryArtifacts
  },
  deferredAttachments,
  duplicateKeys,
  invalidTicketIds: invalidTicketIds.sort(),
  referentialIntegrity: {
    orphanTicketSchools,
    orphanHistoryTickets,
    orphanHistorySchools
  },
  criticalIssues,
  warnings,
  readyForSeed: criticalIssues.length === 0
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');

console.log(`Seed plan written to ${path.relative(rootDir, outputPath)}`);
console.log(JSON.stringify({
  sourceCounts: plan.sourceCounts,
  productionSeedCounts: plan.productionSeedCounts,
  counters: plan.counters,
  excludedTestArtifacts: testHistoryArtifacts.length,
  deferredAttachments: deferredAttachments.length,
  criticalIssues: criticalIssues.length,
  warnings: warnings.length,
  readyForSeed: plan.readyForSeed
}, null, 2));

if (!plan.readyForSeed) process.exitCode = 1;
