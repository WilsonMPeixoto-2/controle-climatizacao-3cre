// Planejamento consultivo local. Não representa OS, medição, atesto ou registro oficial.
// O calendário do atendimento é independente da data de abertura dos chamados.
export const VISIT_DRAFT_KEY = 'gop_clima_programacao_rascunho_v1';
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
export function readVisitDrafts(storage) {
  const raw = storage?.getItem(VISIT_DRAFT_KEY);
  if (!raw) return [];
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows)) throw new Error('Rascunho de programação possui formato inválido.');
  const ids = new Set();
  return rows.map(row => {
    if (!row || !textValue(row.id) || ids.has(row.id)) throw new Error('Rascunho contém registros repetidos ou inválidos.');
    ids.add(row.id);
    return { ...row, ...validate(row), history: Array.isArray(row.history) ? row.history : [] };
  });
}
export function writeVisitDrafts(storage, rows) {
  if (!storage?.setItem) throw new Error('Armazenamento local indisponível.');
  if (!Array.isArray(rows)) throw new Error('Rascunho inválido.');
  storage.setItem(VISIT_DRAFT_KEY, JSON.stringify(rows));
  return rows;
}
export function summarizeVisits(rows, month, knownSchools = []) {
  const schoolIds = new Set((Array.isArray(knownSchools) ? knownSchools : []).map(item => textValue(item.designacao)));
  const all = Array.isArray(rows) ? rows : [];
  const active = all.filter(item => monthOf(item.plannedDate) === month);
  const movedOut = all.filter(item => monthOf(item.plannedDate) !== month && item.history?.some(rev => monthOf(rev.from) === month));
  const reported = active.filter(item => Boolean(item.reportedDate));
  const inReview = active.filter(item => !item.reportedDate);
  const schoolCount = new Set(active.map(item => item.schoolId)).size;
  const orphaned = active.filter(item => !schoolIds.has(item.schoolId)).length;
  return { active, movedOut, reported, inReview, visits: active.length, schools: schoolCount, orphaned };
}
