import { useEffect, useRef, useState } from 'react';
import {
  CalendarClock, CalendarPlus, CheckCheck, ChevronDown, Download, Upload,
  FilePenLine, Info, MapPin, RotateCcw, Trash2, X
} from 'lucide-react';
import { formatDateBrazilian } from '../lib/logic.js';
import {
  createVisitDraft, updateVisitDraft, createVisitBackup,
  parseVisitBackup, summarizeVisits, monthOf, VISIT_TYPES,
  VISIT_DRAFT_KEY, VISIT_RECOVERY_KEY, MAX_VISIT_BACKUP_BYTES
} from '../domain/schoolVisitPlan.js';
import { persistVisitDraft, loadVisitSnapshot, readVisitRecovery } from '../domain/visitDraftStorage.js';

const monthNow = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const emptyForm = (schoolId = '') => ({
  schoolId, plannedDate: '', kind: 'preventiva',
  cycle: '', equipmentCount: '', note: '', reportedDate: '', reportReference: ''
});
const dateText = date => date ? formatDateBrazilian(date) : 'Data não informada';

function loadInitial() {
  try {
    const snapshot = loadVisitSnapshot(window.localStorage);
    return { ...snapshot, hasRecovery: window.localStorage.getItem(VISIT_RECOVERY_KEY) !== null, error: '' };
  } catch {
    return { rows: [], raw: null, hasRecovery: false, error: 'Não foi possível ler o rascunho. Os dados existentes foram preservados.' };
  }
}

export default function VisitPlanningBoard({ schools, onOpenSchool, selectedSchoolId = '' }) {
  const initial = useState(loadInitial)[0];
  const [rows, setRows] = useState(initial.rows);
  const [storageBlocked, setStorageBlocked] = useState(Boolean(initial.error));
  const [hasRecovery, setHasRecovery] = useState(initial.hasRecovery);
  const [stale, setStale] = useState(false);
  const baseRawRef = useRef(initial.raw);
  const importInputRef = useRef(null);
  const [error, setError] = useState(initial.error);
  const [notice, setNotice] = useState('');
  const [month, setMonth] = useState(monthNow);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const overview = summarizeVisits(rows, month, schools, { schoolId: selectedSchoolId });
  const schoolById = new Map(schools.map(item => [String(item.designacao), item]));
  const selectedSchool = schoolById.get(String(selectedSchoolId));
  const ordered = [...overview.active].sort((a, b) => a.plannedDate.localeCompare(b.plannedDate) || a.schoolId.localeCompare(b.schoolId));

  useEffect(() => {
    const onStorage = event => {
      if ((event.key === VISIT_DRAFT_KEY || event.key === null) && event.newValue !== baseRawRef.current) {
        setStale(true);
        setError('A programação foi modificada em outra aba. Recarregue antes de editar ou salvar.');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function startNew() {
    setEditingId(null);
    setForm(emptyForm(selectedSchoolId));
    setShowDetails(false);
    setError('');
    setNotice('');
  }
  function startEdit(entry, showReport = false) {
    setEditingId(entry.id);
    setForm({ ...entry, equipmentCount: entry.equipmentCount ?? '' });
    setShowDetails(showReport || Boolean(entry.reportedDate || entry.cycle || entry.note));
    setError('');
    setNotice('');
    if (showReport) {
      window.requestAnimationFrame(() => document.getElementById('visit-reported')?.focus());
    }
  }
  function stopEdit() { setForm(null); setEditingId(null); setError(''); }

  async function commit(nextRows, message, { allowRecovery = false, saveRecovery = false } = {}) {
    if (storageBlocked && !allowRecovery) {
      setError('O rascunho está ilegível. Restaure uma cópia antes de modificar os registros.');
      return false;
    }
    try {
      const result = await persistVisitDraft({
        storage: window.localStorage, locks: window.navigator.locks,
        expectedRaw: baseRawRef.current, rows: nextRows, saveRecovery
      });
      if (result.status === 'conflict') {
        setStale(true);
        setError('Outra aba atualizou esta programação. Sua edição continua aqui; recarregue quando decidir.');
        return false;
      }
      baseRawRef.current = result.raw;
      setRows(result.rows);
      setHasRecovery(previous => previous || saveRecovery);
      setStale(false);
      setStorageBlocked(false);
      setError('');
      setNotice(message);
      return true;
    } catch (reason) {
      setError(reason.message || 'Não foi possível salvar. A edição continua aberta.');
      return false;
    }
  }

  function reloadLocal() {
    if (form && !window.confirm('Descartar esta edição não salva e recarregar a programação de outra aba?')) return;
    try {
      const latest = loadVisitSnapshot(window.localStorage);
      baseRawRef.current = latest.raw;
      setRows(latest.rows);
      setStale(false);
      setStorageBlocked(false);
      setForm(null);
      setEditingId(null);
      setError('');
      setNotice('Programação recarregada deste dispositivo.');
    } catch {
      setStorageBlocked(true);
      setError('O conteúdo atualizado não pôde ser lido. Preserve o armazenamento e restaure uma cópia válida.');
    }
  }

  async function restoreBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > MAX_VISIT_BACKUP_BYTES) throw new Error('Arquivo excede o limite de 2 MB.');
      const imported = parseVisitBackup(await file.text());
      if (!window.confirm(`A cópia contém ${imported.length} visitas. Substituir as ${rows.length} visitas locais (incluindo escolas fora do filtro)? A versão anterior ficará disponível para recuperação neste navegador.`)) return;
      if (await commit(imported, 'Cópia restaurada. A versão anterior pode ser recuperada.', { allowRecovery: true, saveRecovery: true })) {
        if (imported.length) setMonth(monthOf(imported[0].plannedDate));
        setForm(null);
        setEditingId(null);
      }
    } catch (reason) {
      setError(reason.message || 'Arquivo de cópia inválido.');
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!form) return;
    if (!schools.some(school => String(school.designacao) === String(form.schoolId))) {
      setError('Selecione uma unidade do cadastro atual.');
      return;
    }
    if (selectedSchoolId && String(form.schoolId) !== String(selectedSchoolId)) {
      setError('Para programar outra escola, altere o filtro de escola da página.');
      return;
    }
    try {
      const timestamp = new Date().toISOString();
      const next = editingId
        ? rows.map(row => row.id === editingId ? updateVisitDraft(row, form, { now: timestamp }) : row)
        : [...rows, createVisitDraft(form, { id: crypto.randomUUID(), now: timestamp })];
      if (await commit(next, editingId ? 'Programação atualizada neste dispositivo.' : 'Visita incluída na programação local.')) {
        setMonth(monthOf(form.plannedDate));
        setForm(null);
        setEditingId(null);
      }
    } catch (reason) { setError(reason.message || 'Revise os dados informados.'); }
  }

  async function remove(entry) {
    if (!window.confirm('Excluir esta visita apenas do rascunho deste dispositivo?')) return;
    const saved = await commit(rows.filter(row => row.id !== entry.id), 'Visita excluída do rascunho local.');
    if (saved && editingId === entry.id) stopEdit();
  }

  function exportDraft() {
    try {
      const blob = new Blob([createVisitBackup(rows)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `gop-clima-programacao-rascunho-${month}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setError('');
      setNotice('Cópia de toda a programação local baixada, inclusive das escolas ocultas pelo filtro.');
    } catch (reason) {
      setError(reason.message || 'Não foi possível gerar a cópia.');
    }
  }

  async function recoverPrevious() {
    try {
      const previous = readVisitRecovery(window.localStorage);
      if (!previous) throw new Error('Não há versão anterior disponível neste navegador.');
      if (!window.confirm(`Recuperar ${previous.rows.length} visitas da versão anterior? A programação atual será preservada como versão de recuperação.`)) return;
      if (await commit(previous.rows, 'Versão anterior recuperada neste dispositivo.', { allowRecovery: true, saveRecovery: true })) {
        if (previous.rows.length) setMonth(monthOf(previous.rows[0].plannedDate));
        setForm(null);
        setEditingId(null);
      }
    } catch (reason) {
      setError(reason.message || 'A versão anterior não pôde ser recuperada.');
    }
  }

  return (
    <section className="visit-board" aria-labelledby="visit-board-title">
      <header className="visit-board-header">
        <div className="visit-board-heading">
          <span className="section-eyebrow"><CalendarClock size={15} aria-hidden="true" /> Programação de atendimento</span>
          <h3 id="visit-board-title">Planejamento por escola</h3>
          <p>{selectedSchool ? `Programação de ${selectedSchool.unidade_escolar}` : 'Organize visitas, reprogramações e informações de execução.'}</p>
        </div>
        <div className="visit-board-actions">
          <label className="visit-month-control" htmlFor="visit-board-month">
            <span>Mês da programação</span>
            <input id="visit-board-month" type="month" value={month} onChange={event => setMonth(event.target.value)} />
          </label>
          <button className="btn btn-primary" type="button" onClick={startNew} disabled={storageBlocked}>
            <CalendarPlus size={17} aria-hidden="true" /> Programar visita
          </button>
        </div>
      </header>

      <div className="visit-board-summary" aria-label="Resumo da programação local">
        <div><strong className="tabular">{overview.visits}</strong><span>visitas</span></div>
        <div><strong className="tabular">{overview.schools}</strong><span>escolas</span></div>
        <div><strong className="tabular">{overview.executedInMonth.length}</strong><span>execuções informadas no mês</span></div>
        <div className="visit-board-storage"><Info size={17} aria-hidden="true" />
          <span><strong>Rascunho local</strong> · disponível apenas neste navegador, sem sincronização.</span>
        </div>
      </div>

      {notice && <p className="visit-board-notice" role="status">{notice}</p>}
      {error && <p className="field-error visit-board-error" role="alert">{error}</p>}
      {stale && <button type="button" className="btn btn-secondary visit-board-refresh" onClick={reloadLocal}>Recarregar alterações de outra aba</button>}

      {form && (
        <form className="visit-board-editor" onSubmit={submit} aria-label={editingId ? 'Editar programação' : 'Adicionar programação'}>
          <div className="visit-board-editor-title">
            <h4>{editingId ? 'Editar visita planejada' : 'Programar visita'}</h4>
            <button type="button" className="visit-board-close" onClick={stopEdit} aria-label="Fechar edição"><X size={18} /></button>
          </div>
          <div className="visit-board-editor-fields">
            <div className="form-group">
              <label htmlFor="visit-school">Unidade escolar</label>
              <select id="visit-school" className="form-control" value={form.schoolId} onChange={event => setForm({ ...form, schoolId: event.target.value })} disabled={Boolean(selectedSchoolId)} required>
                <option value="">Selecione a escola</option>
                {schools.map(school => <option key={school.designacao} value={school.designacao}>{school.designacao} · {school.unidade_escolar}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="visit-planned">Data prevista</label>
              <input id="visit-planned" className="form-control" type="date" value={form.plannedDate} onChange={event => setForm({ ...form, plannedDate: event.target.value })} required />
            </div>
            <div className="form-group">
              <label htmlFor="visit-kind">Atividade</label>
              <select id="visit-kind" className="form-control" value={form.kind} onChange={event => setForm({ ...form, kind: event.target.value })}>
                {VISIT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>
          </div>
          <details className="visit-board-extra" open={showDetails} onToggle={event => setShowDetails(event.currentTarget.open)}>
            <summary>Informações complementares <ChevronDown size={16} aria-hidden="true" /></summary>
            <div className="visit-board-extra-fields">
              <div className="form-group">
                <label htmlFor="visit-cycle">Ciclo ou referência</label>
                <input id="visit-cycle" className="form-control" value={form.cycle} maxLength={80} onChange={event => setForm({ ...form, cycle: event.target.value })} placeholder="Opcional" />
              </div>
              <div className="form-group">
                <label htmlFor="visit-equipments">Equipamentos previstos</label>
                <input id="visit-equipments" className="form-control" type="number" min="0" step="1" value={form.equipmentCount} onChange={event => setForm({ ...form, equipmentCount: event.target.value })} placeholder="Não informado" />
              </div>
              <div className="form-group">
                <label htmlFor="visit-reported">Data de execução informada</label>
                <input id="visit-reported" className="form-control" type="date" value={form.reportedDate} onChange={event => setForm({ ...form, reportedDate: event.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="visit-reference">Referência do registro</label>
                <input id="visit-reference" className="form-control" value={form.reportReference} maxLength={120} onChange={event => setForm({ ...form, reportReference: event.target.value })} placeholder="OES / SEI / boletim, se houver" />
              </div>
              <div className="form-group visit-board-note">
                <label htmlFor="visit-note">Observações</label>
                <textarea id="visit-note" className="form-control" rows={2} maxLength={500} value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} />
              </div>
              <p className="finance-hint visit-board-note">A data de execução é apenas uma informação lançada no rascunho; não constitui atesto ou medição.</p>
            </div>
          </details>
          <div className="visit-board-editor-footer">
            <button type="button" className="btn btn-secondary" onClick={stopEdit}>Cancelar</button>
            <button className="btn btn-primary" type="submit">{editingId ? 'Salvar alterações' : 'Adicionar visita'}</button>
          </div>
        </form>
      )}

      {ordered.length ? (
        <div className="visit-board-list" role="list" aria-label="Visitas planejadas para a competência">
          {ordered.map(entry => {
            const school = schoolById.get(entry.schoolId);
            const type = VISIT_TYPES.find(item => item.value === entry.kind)?.label || 'Outra atividade';
            return (
              <article className="visit-board-row" role="listitem" key={entry.id}>
                <div className="visit-board-date"><strong>{entry.plannedDate.slice(-2)}</strong><small>{entry.plannedDate.slice(5, 7)}/{entry.plannedDate.slice(0, 4)}</small></div>
                <div className="visit-board-row-main">
                  <strong>{school?.unidade_escolar || `Escola ${entry.schoolId} (fora do cadastro)`}</strong>
                  <span>{entry.schoolId} · {type}{entry.cycle ? ` · ${entry.cycle}` : ''}</span>
                  <small>{entry.reportedDate
                    ? `Execução informada em ${dateText(entry.reportedDate)}`
                    : 'Execução ainda não informada'}
                    {entry.history?.length ? ` · Reprogramada ${entry.history.length}x` : ''}
                  </small>
                </div>
                <div className="visit-board-row-actions">
                  {school && <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpenSchool(school)} aria-label={`Abrir dossiê de ${school.unidade_escolar}`}><MapPin size={15} aria-hidden="true" /> Escola</button>}
                  {!entry.reportedDate && <button type="button" className="btn btn-primary btn-sm" onClick={() => startEdit(entry, true)} aria-label={`Informar execução da visita de ${school?.unidade_escolar || entry.schoolId}`}>Informar execução</button>}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(entry)} aria-label={`Editar visita de ${school?.unidade_escolar || entry.schoolId}`}><FilePenLine size={15} aria-hidden="true" /> Editar</button>
                  <button type="button" className="visit-board-delete" onClick={() => remove(entry)} aria-label={`Excluir rascunho da visita de ${school?.unidade_escolar || entry.schoolId}`} title="Excluir rascunho"><Trash2 size={17} /></button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="visit-board-empty"><CalendarClock size={22} aria-hidden="true" />
          <div><strong>Nenhuma visita programada neste mês.</strong><span>Use “Programar visita” para incluir uma data neste mês.</span></div>
        </div>
      )}

      {overview.executedInMonth.some(item => monthOf(item.plannedDate) !== month) && (
        <section className="visit-board-other-month" aria-label="Execuções informadas neste mês com programação em outra competência">
          <h4>Execuções deste mês programadas em outras competências</h4>
          {overview.executedInMonth.filter(item => monthOf(item.plannedDate) !== month).map(item => (
            <div className="visit-board-cross-month" key={item.id}>
              <span>{schoolById.get(item.schoolId)?.unidade_escolar || item.schoolId} · Execução em {dateText(item.reportedDate)} · Prevista para {dateText(item.plannedDate)}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMonth(monthOf(item.plannedDate))}>Abrir programação</button>
            </div>
          ))}
        </section>
      )}

      {overview.movedOut.length > 0 && (
        <details className="visit-board-moved">
          <summary><RotateCcw size={15} aria-hidden="true" /> {overview.movedOut.length} visita(s) reprogramada(s) para outro mês</summary>
          {overview.movedOut.map(entry => <p key={entry.id}>{schoolById.get(entry.schoolId)?.unidade_escolar || entry.schoolId} · nova data {dateText(entry.plannedDate)}</p>)}
        </details>
      )}
      <footer className="visit-board-footer">
        <span><CheckCheck size={15} aria-hidden="true" /> {overview.inReview.length} {overview.inReview.length === 1 ? 'visita' : 'visitas'} sem execução informada</span>
        <div className="visit-board-backups">
          <input ref={importInputRef} type="file" accept=".json,application/json" className="visit-board-file-input" aria-label="Escolher cópia de segurança da programação" onChange={restoreBackup} />
          <button type="button" className="visit-board-export" onClick={() => importInputRef.current?.click()}><Upload size={15} aria-hidden="true" /> Restaurar cópia</button>
          <button type="button" className="visit-board-export" onClick={exportDraft} disabled={!rows.length}><Download size={15} aria-hidden="true" /> Baixar cópia de segurança</button>
          {hasRecovery && <button type="button" className="visit-board-export" onClick={recoverPrevious}><RotateCcw size={15} aria-hidden="true" /> Recuperar versão anterior</button>
        </div>
      </footer>
    </section>
  );
}
