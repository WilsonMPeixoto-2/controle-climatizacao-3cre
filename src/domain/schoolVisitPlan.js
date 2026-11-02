// Planejamento consultivo local. Não representa OS, medição, atesto ou registro oficial.
// O calendário do atendimento é independente da data de abertura dos chamados.
export const VISIT_DRAFT_KEY = 'gop_clima_programacao_rascunho_v1';
export const VISIT_RECOVERY_KEY = 'gop_clima_programacao_antes_restauracao_v1';
export const MAX_VISIT_BACKUP_BYTES = 2_000_000;
export const VISIT_TYPES = Object.freeze([
  { value: 'preventiva', label: 'Preventiva' },
  { value: 'corretiva', label: 'Corretiva' },
  { value: 'outra', label: 'Outra atividade' }
]);

export function isCivilDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() + 1 === month && check.getUTCDate() === day;
}
export const monthOf = date => isCivilDate(date) ? date.slice(0, 7) : '';
const textValue = value => String(value ?? '').trim();
function normalizedCount(value) {
  if (value == null || textValue(value) === '') return null;
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error('Quantidade de equipamentos inválida.');
  return n;
}
function validate(fields) {
  if (!textValue(fields.schoolId)) throw new Error('Selecione uma escola cadastrada.');
  if (!isCivilDate(fields.plannedDate)) throw new Error('Informe uma data prevista válida.');
  if (!VISIT_TYPES.some(type => type.value === fields.kind)) throw new Error('Selecione uma modalidade.');
  if (fields.reportedDate && !isCivilDate(fields.reportedDate)) throw new Error('Informe uma data de execução válida ou deixe o campo vazio.');
  return {
    schoolId: textValue(fields.schoolId),
    plannedDate: fields.plannedDate,
    kind: fields.kind,
    cycle: textValue(fields.cycle).slice(0, 80),
    equipmentCount: normalizedCount(fields.equipmentCount),
    note: textValue(fields.note).slice(0, 500),
    reportedDate: textValue(fields.reportedDate),
    reportReference: textValue(fields.reportReference).slice(0, 120)
  };
}
export function createVisitDraft(fields, { id, now } = {}) {
  if (!textValue(id)) throw new Error('Identificador do registro ausente.');
  const safe = validate(fields);
  const timestamp = now || new Date().toISOString();
  return { id: textValue(id), ...safe, createdAt: timestamp, updatedAt: timestamp, history: [] };
}
export function updateVisitDraft(current, patch, { now } = {}) {
  if (!current?.id) throw new Error('Registro para edição inexistente.');
  const safe = validate({ ...current, ...patch });
  const timestamp = now || new Date().toISOString();
  const changed = Object.keys(safe).some(key => safe[key] !== current[key]);
  if (!changed) return current;
  const previous = Array.isArray(current.history) ? current.history : [];
  const moved = current.plannedDate !== safe.plannedDate;
  return {
    ...current, ...safe, updatedAt: timestamp,
    history: moved
      ? [...previous, { at: timestamp, from: current.plannedDate, to: safe.plannedDate }]
      : previous
  };
}
export function validateVisitRows(rows) {
  if (!Array.isArray(rows)) throw new Error('Rascunho de programação possui formato inválido.');
  if (rows.length > 10000) throw new Error('Quantidade excessiva de registros na cópia.');
  const ids = new Set();
  return rows.map(row => {
    if (!row || !textValue(row.id) || ids.has(row.id)) throw new Error('Rascunho contém registros repetidos ou inválidos.');
    ids.add(row.id);
    return { ...row, ...validate(row), history: Array.isArray(row.history) ? row.history : [] };
  });
}
export function parseStoredVisitDrafts(raw) {
  if (raw == null || raw === '') return [];
  return validateVisitRows(JSON.parse(raw));
}
export function readVisitDrafts(storage) {
  return parseStoredVisitDrafts(storage?.getItem(VISIT_DRAFT_KEY));
}
/** Só aceita o formato exportado pelo próprio módulo; importação nunca sincroniza Firestore. */
export function parseVisitBackup(raw) {
  const data = JSON.parse(raw);
  if (!data || data.format !== 'gop-clima-visit-draft-v1') {
    throw new Error('Arquivo não é uma cópia de segurança da programação GOP Clima.');
  }
  return validateVisitRows(data.rows);
}
export function createVisitBackup(rows, exportedAt = new Date().toISOString()) {
  const validated = validateVisitRows(rows);
  const text = JSON.stringify({ format: 'gop-clima-visit-draft-v1', exportedAt, rows: validated });
  if (new TextEncoder().encode(text).byteLength > MAX_VISIT_BACKUP_BYTES) {
    throw new Error('A cópia excede 2 MB. Reduza o volume antes de exportar.');
  }
  return text;
}
export function writeVisitDrafts(storage, rows) {
  if (!storage?.setItem) throw new Error('Armazenamento local indisponível.');
  const validated = validateVisitRows(rows);
  createVisitBackup(validated); // todos os dados gravados poderão ser exportados e restaurados
  storage.setItem(VISIT_DRAFT_KEY, JSON.stringify(validated));
  return validated;
}
export function summarizeVisits(rows, month, knownSchools = [], { schoolId = '' } = {}) {
  const schoolIds = new Set((Array.isArray(knownSchools) ? knownSchools : []).map(item => textValue(item.designacao)));
  const all = (Array.isArray(rows) ? rows : []).filter(item => !schoolId || item.schoolId === String(schoolId));
  const active = all.filter(item => monthOf(item.plannedDate) === month);
  const movedOut = all.filter(item => monthOf(item.plannedDate) !== month && item.history?.some(rev => monthOf(rev.from) === month));
  const reported = active.filter(item => Boolean(item.reportedDate));
  const executedInMonth = all.filter(item => monthOf(item.reportedDate) === month);
  const inReview = active.filter(item => !item.reportedDate);
  const schoolCount = new Set(active.map(item => item.schoolId)).size;
  const orphaned = active.filter(item => !schoolIds.has(item.schoolId)).length;
  return { active, movedOut, reported, executedInMonth, inReview, visits: active.length, schools: schoolCount, orphaned };
}
