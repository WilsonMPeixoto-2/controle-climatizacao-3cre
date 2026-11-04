import { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowUpRight, Calculator, CheckCheck, ChevronDown, FilePenLine, History, Info,
  Plus, Save, Trash2, X
} from 'lucide-react';
import {
  MAX_ATTENDANCE_ITEMS, MAX_TICKET_LINKS, calculateAttendance,
  formatMoneyUnits4, normalizeAttendance, parseMoneyUnits4
} from '../domain/attendanceEstimate.js';
import { currentForecastMonth } from '../domain/monthlyForecast.js';
import { parseCapacityBtu } from '../domain/financialReference.js';
import { CRE03_CATALOG_ID, findCre03TrItem, applyCre03TrPriceToDraft, createValidatedCre03Catalog } from '../domain/cre03TrCatalog.js';
import { CRE03_SIGNED_PRICE_SCHEDULE } from '../data/cre03SignedPriceSchedule.js';
import { matchesSchool, normalizeString } from '../lib/logic.js';
import '../styles/attendance-estimates.css';

const SERVICE_LABELS = { preventiva: 'Preventiva', corretiva: 'Corretiva', outra: 'Outra atividade' };
const NATURE_LABELS = {
  nao_informada: 'Referência não informada',
  provisoria: 'Referência provisória',
  informada: 'Referência informada manualmente',
  contratual_informada: 'Referência contratual informada'
};
const COVERAGE_LABELS = {
  a_confirmar: 'Cobertura a confirmar',
  incluido: 'Incluído na cobertura informada',
  adicional: 'Adicional informado'
};

const PAGE_SIZE = 12;
const attendanceStatuses = [
  { value: 'all', label: 'Todos' },
  { value: 'additional', label: 'Com acréscimo' },
  { value: 'pending', label: 'Cobertura a confirmar' }
];

function emptyItem(values = {}) {
  return {
    id: crypto.randomUUID(), description: '', equipmentType: '', capacityBtu: '',
    equipmentRef: '', quantity: '', coverage: 'a_confirmar', referenceNature: 'provisoria',
    priceText: '', sourceRef: '', coverageSourceRef: '', referenceVersion: '', catalogId: '', categoryCode: '',
    ...values
  };
}

function withAutomaticTrPrices(form) {
  return {
    ...form,
    items: form.items.map(item => applyCre03TrPriceToDraft(
      item, form.serviceKind, CRE03_SIGNED_PRICE_SCHEDULE
    ))
  };
}

function newForm(schoolId = '', context = null, tickets = [], school = null) {
  const ticket = context?.ticketId
    ? tickets.find(item => String(item.id_chamado) === String(context.ticketId) && matchesSchool(item, school))
    : null;
  const demand = String(ticket?.tipo_demanda || '').toLocaleLowerCase('pt-BR');
  const plannedDate = context?.plannedDate || '';
  return withAutomaticTrPrices({
    schoolId, plannedMonth: plannedDate.slice(0, 7) || context?.plannedMonth || currentForecastMonth(), plannedDate,
    serviceKind: Object.hasOwn(SERVICE_LABELS, context?.serviceKind || '') ? context.serviceKind
      : demand.includes('corretiva') ? 'corretiva' : demand.includes('preventiva') ? 'preventiva' : ticket ? 'outra' : 'preventiva',
    cycle: context?.cycle || '', visitId: context?.visitId || '',
    ticketIds: ticket ? [String(ticket.id_chamado)] : [], responsibleLabel: '', sessionId: '',
    items: [emptyItem({
      description: context?.description || ticket?.tipo_demanda || '',
      quantity: context?.quantity ?? '',
      equipmentType: context?.equipmentType || ticket?.tipo_aparelho || '',
      capacityBtu: context?.capacityBtu ?? parseCapacityBtu(ticket?.btu_existente) ?? '',
      equipmentRef: context?.equipmentRef || ''
    })]
  });
}

function recordForm(record) {
  return {
    schoolId: record.schoolId, plannedMonth: record.plannedMonth, plannedDate: record.plannedDate || '',
    serviceKind: record.serviceKind, cycle: record.cycle || '', visitId: record.visitId || '',
    ticketIds: [...(record.ticketIds || [])], responsibleLabel: record.responsibleLabel || '',
    sessionId: '',
    items: record.items.map(item => ({
      ...item,
      quantity: item.quantity ?? '', capacityBtu: item.capacityBtu ?? '',
      priceText: item.unitPriceUnits4 === null || item.unitPriceUnits4 === undefined
        ? '' : formatMoneyUnits4(item.unitPriceUnits4).replace(/^R\$\s*/, '')
    }))
  };
}

function formContent(form, { saving = false } = {}) {
  return {
    ...form,
    items: form.items.map((item, index) => {
      const group = 'Grupo ' + (index + 1) + ': ';
      const quantityText = String(item.quantity).trim();
      if (quantityText && !/^\d+$/.test(quantityText)) {
        throw new Error(group + 'informe uma quantidade inteira, ou deixe em branco.');
      }
      const quantity = quantityText ? Number(quantityText) : null;
      const capacityText = String(item.capacityBtu).trim();
      const capacityBtu = capacityText ? parseCapacityBtu(capacityText) : null;
      if (capacityText && capacityBtu === null) {
        throw new Error(group + 'confira a capacidade em BTU, ou deixe em branco.');
      }
      let unitPriceUnits4;
      try {
        unitPriceUnits4 = parseMoneyUnits4(item.priceText);
      } catch (reason) {
        throw new Error(group + reason.message, { cause: reason });
      }
      if (saving && unitPriceUnits4 !== null && !item.sourceRef.trim()) {
        throw new Error(group + 'informe a origem do preço antes de salvar.');
      }
      if (saving && unitPriceUnits4 !== null && item.referenceNature === 'nao_informada') {
        throw new Error(group + 'selecione a natureza do preço informado.');
      }
      return { ...item, quantity, capacityBtu, unitPriceUnits4 };
    })
  };
}

function calculationOf(content, draft = false) {
  try {
    return { result: calculateAttendance(content, { draft }), error: '' };
  } catch (reason) {
    return { result: null, error: reason.message || 'Confira os dados para calcular a estimativa.' };
  }
}

function formCalculation(form) {
  if (!form.schoolId) return { result: null, error: 'Selecione uma escola para visualizar a estimativa.' };
  try {
    return calculationOf(formContent(form), true);
  } catch (reason) {
    return { result: null, error: reason.message };
  }
}

function monthText(value) {
  return /^\d{4}-\d{2}$/.test(value || '') ? value.slice(5) + '/' + value.slice(0, 4) : 'Competência não informada';
}

function dateTimeText(value) {
  if (!value) return 'Data não informada';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Data não informada' : parsed.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function tableAmount(value, overflow) {
  if (overflow) return 'Limite excedido';
  return value === null ? 'Não informado' : formatMoneyUnits4(value);
}

function EstimateValue({ calculation, className = '' }) {
  if (!calculation) return <div className={'attendance-value ' + className}><span>Estimativa</span><strong>Não calculada</strong></div>;
  const amount = calculation.complete ? calculation.totalUnits4 : calculation.knownSubtotalUnits4;
  const onlyIncrement = calculation.lines.every(line => line.amountNature === 'incremento_adicional');
  const hasIncrement = calculation.lines.some(line => line.amountNature === 'incremento_adicional');
  return (
    <div className={'attendance-value ' + className}>
      <span>{calculation.complete ? onlyIncrement ? 'Incremento adicional estimado' : 'Estimativa de referência' : 'Estimativa parcial · parcela conhecida'}</span>
      <strong className="tabular">{amount === null ? 'Não informada' : formatMoneyUnits4(amount)}</strong>
      {!calculation.complete && <small>{calculation.missingCount} {calculation.missingCount === 1 ? 'grupo com informação pendente' : 'grupos com informações pendentes'}</small>}
      {calculation.coveragePendingCount > 0 && <small>Cobertura pendente em {calculation.coveragePendingCount} {calculation.coveragePendingCount === 1 ? 'grupo' : 'grupos'}</small>}
      {hasIncrement && !onlyIncrement && <small>Parcelas nominais e acréscimos conforme cobertura informada</small>}
      {hasIncrement && calculation.nominalMissingCount > 0 && <small>Preço nominal não informado em {calculation.nominalMissingCount} {calculation.nominalMissingCount === 1 ? 'grupo' : 'grupos'}</small>}
    </div>
  );
}

function Composition({ content, calculation, preview = false }) {
  const lines = calculation?.lines || content.items;
  return (
    <details className="attendance-composition">
      <summary><span>{preview ? 'Ver composição da prévia' : 'Ver composição'} · {lines.length} {lines.length === 1 ? 'grupo' : 'grupos'}</span><ChevronDown size={16} aria-hidden="true" /></summary>
      <ol>
        {lines.map((line, index) => (
          <li key={line.id}>
            <div className="attendance-composition-line">
              <strong>{line.description || 'Grupo ' + (index + 1)}</strong>
              <span className="tabular">
                {line.quantity === '' || line.quantity === null || line.quantity === undefined ? '?' : line.quantity} × {formatMoneyUnits4(line.unitPriceUnits4)}
                {' = '}{formatMoneyUnits4(calculation ? line.nominalTotalUnits4 : null)}
              </span>
            </div>
            <p>Preço nominal: {line.unitPriceUnits4 === null ? 'não informado' : NATURE_LABELS[line.referenceNature] || NATURE_LABELS.nao_informada} · {line.sourceRef || 'Origem do preço não informada'}{line.referenceVersion ? ' · versão ' + line.referenceVersion : ''}</p>
            {line.amountNature === 'incremento_adicional' && <p><strong>Acréscimo estimado: {formatMoneyUnits4(line.lineTotalUnits4)}</strong> · cobertura informada em {line.coverageSourceRef}</p>}
            <small>
              {COVERAGE_LABELS[line.coverage] || COVERAGE_LABELS.a_confirmar}
              {line.coverage === 'a_confirmar' || !line.coverageSourceRef ? ' · referência da cobertura pendente' : ' · referência: ' + line.coverageSourceRef}
              {line.equipmentType ? ' · ' + line.equipmentType : ''}
              {line.capacityBtu ? ' · ' + Number(line.capacityBtu).toLocaleString('pt-BR') + ' BTU' : ''}
              {line.equipmentRef ? ' · ' + line.equipmentRef : ''}
              {line.catalogId ? ' · catálogo informado: ' + line.catalogId : ''}
              {line.categoryCode ? ' · categoria: ' + line.categoryCode : ''}
            </small>
          </li>
        ))}
      </ol>
    </details>
  );
}

function AttendanceHistory({ record, loadRevisions }) {
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    // A revisão recebida pelo snapshot invalida a consulta anterior. Respostas
    // de revisões antigas ou de uma seção já fechada não substituem a atual.
    Promise.resolve().then(() => loadRevisions(record.id)).then(rows => {
      if (active) setHistory({ revision: record.revision, attempt, rows, error: '' });
    }, reason => {
      if (active) setHistory({
        revision: record.revision, attempt, rows: [],
        error: reason.message || 'Não foi possível consultar o histórico.'
      });
    });
    return () => { active = false; };
  }, [open, record.id, record.revision, loadRevisions, attempt]);

  const current = history?.revision === record.revision && history.attempt === attempt;
  return (
    <details className="attendance-history" onToggle={event => setOpen(event.currentTarget.open)}>
      <summary><History size={15} aria-hidden="true" /><span>Histórico de alterações</span><ChevronDown size={15} aria-hidden="true" /></summary>
      <div className="attendance-history-content">
        {!current && <p role="status">Consultando versões no Firestore…</p>}
        {current && history.error && <div><p role="alert">{history.error}</p><button type="button" className="btn btn-secondary btn-sm" onClick={() => setAttempt(previous => previous + 1)}>Tentar consultar novamente</button></div>}
        {current && !history.error && (history.rows.length ? <ol>
          {history.rows.map(revision => {
            const revisionCalculation = calculationOf(revision);
            return <li key={revision.revision}>
              <strong>Versão {revision.revision} · {dateTimeText(revision.updatedAtISO || revision.updatedAt)}</strong>
              <p>Responsável informado: {revision.responsibleLabel || 'Não informado'} · {monthText(revision.plannedMonth)}</p>
              <EstimateValue calculation={revisionCalculation.result} />
              <Composition content={revision} calculation={revisionCalculation.result} />
            </li>;
          })}
        </ol> : <p>Nenhuma versão disponível para consulta.</p>)}
        <p className="attendance-hint">As versões preservam os valores e a origem aplicados. Responsável e sessão não comprovam identidade individual.</p>
      </div>
    </details>
  );
}

export default function AttendanceEstimates({
  schools = [], tickets = [], records = [], rows, selectedSchoolId = '', month,
  status, onStatusChange, search, onSearchChange, headingRef,
  connection = { status: 'unconfigured' }, onSave, loadRevisions,
  context = null, onContextConsumed, onSaved
}) {
  const instanceId = useId();
  const titleId = instanceId + '-title';
  const editorTitleId = instanceId + '-editor-title';
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pagination, setPagination] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const drawerRef = useRef(null);
  const detailTriggerRef = useRef(null);
  const savingRef = useRef(false);
  const creationIdRef = useRef(null);
  const consumedContextRef = useRef(null);
  const editorHeadingRef = useRef(null);
  const feedbackRef = useRef(null);
  const newButtonRef = useRef(null);
  const returnFocusRef = useRef(null);
  const schoolById = new Map(schools.map(school => [String(school.designacao), school]));
  const selectedSchool = schoolById.get(String(selectedSchoolId));
  const formSchool = form ? schoolById.get(form.schoolId) : null;
  const schoolTickets = formSchool ? tickets.filter(ticket => matchesSchool(ticket, formSchool)) : [];
  const searchText = normalizeString(search);
  const visibleRows = rows.filter(row => {
    if (status === 'additional' && !(row.additionalUnits4 > 0 || row.overflowByNature?.additional)) return false;
    if (status === 'pending' && !(row.coveragePendingCount > 0)) return false;
    if (!searchText) return true;
    const { record } = row;
    return [record.schoolId, schoolById.get(String(record.schoolId))?.unidade_escolar,
      record.cycle, ...(Array.isArray(record.items) ? record.items.map(item => item?.description) : [])]
      .some(value => normalizeString(value).includes(searchText));
  }).toSorted((a, b) => String(b.record.updatedAtISO || b.record.updatedAt || '').localeCompare(String(a.record.updatedAtISO || a.record.updatedAt || '')));
  const scope = JSON.stringify([month, selectedSchoolId, status, searchText]);
  const pageCount = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
  const page = pagination?.scope === scope ? Math.min(pagination.page, pageCount) : 1;
  const pageRows = visibleRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const detailRecord = records.find(record => record.id === detailId);
  const detailSchool = detailRecord ? schoolById.get(String(detailRecord.schoolId)) : null;
  const detailCalculation = detailRecord ? calculationOf(detailRecord) : null;
  const preview = form ? formCalculation(form) : null;
  const latestEditingRecord = editing ? records.find(record => record.id === editing.id) : null;
  const hasNewRevision = Boolean(latestEditingRecord && latestEditingRecord.revision !== editing.revision);
  const ready = connection.status === 'ready';
  const fieldId = name => instanceId + '-' + name;
  const focusEditor = () => requestAnimationFrame(() => {
    editorHeadingRef.current?.scrollIntoView?.({ block: 'nearest' });
    editorHeadingRef.current?.focus();
  });
  const focusFeedback = () => requestAnimationFrame(() => feedbackRef.current?.focus());

  useEffect(() => {
    const drawer = drawerRef.current;
    if (detailRecord && !drawer.open) drawer.showModal();
    if (!detailRecord && drawer.open) drawer.close();
  }, [detailRecord]);

  useEffect(() => {
    if (!context?.key || consumedContextRef.current === context.key || isSaving) return;
    const contextRecord = context.attendanceId ? records.find(record => record.id === context.attendanceId) : null;
    if (context.attendanceId && !contextRecord && connection.status !== 'ready') return;
    const contextSchool = schools.find(school => String(school.designacao) === String(context.schoolId));
    const frame = requestAnimationFrame(() => {
      consumedContextRef.current = context.key;
      creationIdRef.current = contextRecord || context.attendanceId ? null : crypto.randomUUID();
      // Uma nova chave é um pedido de navegação do pai, consumido uma única vez.
      setForm(contextRecord ? recordForm(contextRecord)
        : context.attendanceId ? null : newForm(contextSchool ? String(contextSchool.designacao) : '', context, tickets, contextSchool));
      setEditing(contextRecord ? { id: contextRecord.id, revision: contextRecord.revision } : null);
      setError(context.attendanceId && !contextRecord ? 'Atendimento não encontrado na base financeira.' : '');
      setNotice('');
      returnFocusRef.current = null;
      onContextConsumed?.();
      // O editor passa a existir depois do commit causado pelo novo contexto.
      requestAnimationFrame(() => {
        editorHeadingRef.current?.scrollIntoView?.({ block: 'nearest' });
        if (context.attendanceId && !contextRecord) feedbackRef.current?.focus();
        else editorHeadingRef.current?.focus();
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [context, isSaving, onContextConsumed, schools, tickets, records, connection.status]);

  function startNew(event) {
    if (savingRef.current) return;
    returnFocusRef.current = event?.currentTarget || newButtonRef.current;
    creationIdRef.current = crypto.randomUUID();
    setForm(newForm(selectedSchool ? String(selectedSchool.designacao) : '', { plannedMonth: month }));
    setEditing(null);
    setError('');
    setNotice('');
    focusEditor();
  }

  function startEdit(record, trigger) {
    if (savingRef.current) return;
    returnFocusRef.current = trigger || newButtonRef.current;
    creationIdRef.current = null;
    setForm(recordForm(record));
    setEditing({ id: record.id, revision: record.revision });
    setError('');
    setNotice('');
    focusEditor();
  }

  function closeEditor() {
    if (savingRef.current) return;
    creationIdRef.current = null;
    setForm(null);
    setEditing(null);
    setError('');
    requestAnimationFrame(() => {
      const target = returnFocusRef.current;
      if (target?.isConnected) target.focus();
      else newButtonRef.current?.focus();
    });
  }

  function updateField(name, value) {
    if (savingRef.current) return;
    setForm(previous => {
      const next = {
        ...previous, [name]: value,
        ...(name === 'schoolId' ? { ticketIds: [], visitId: '' } : {})
      };
      return name === 'serviceKind' ? withAutomaticTrPrices(next) : next;
    });
  }

  function updateItem(id, name, value) {
    if (savingRef.current) return;
    setForm(previous => ({
      ...previous,
      items: previous.items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [name]: value };
        // Preço digitado pelo responsável deixa de ser tratado como preço automático.
        if (name === 'priceText' && item.catalogId === CRE03_CATALOG_ID
          && item.referenceNature === 'contratual_informada') {
          return {
            ...updated, unitPriceUnits4: null, sourceRef: '',
            referenceNature: 'informada', catalogId: '', categoryCode: '', referenceVersion: ''
          };
        }
        return name === 'equipmentType' || name === 'capacityBtu'
          ? applyCre03TrPriceToDraft(updated, previous.serviceKind, CRE03_SIGNED_PRICE_SCHEDULE)
          : updated;
      })
    }));
  }

  function addItem() {
    if (savingRef.current || form.items.length >= MAX_ATTENDANCE_ITEMS) return;
    const item = emptyItem();
    setForm(previous => ({ ...previous, items: [...previous.items, item] }));
    requestAnimationFrame(() => document.getElementById(fieldId(item.id + '-description'))?.focus());
  }

  function removeItem(id) {
    if (savingRef.current || form.items.length < 2) return;
    setForm(previous => ({ ...previous, items: previous.items.filter(item => item.id !== id) }));
    requestAnimationFrame(() => document.getElementById(fieldId('add-group'))?.focus());
  }

  function toggleTicket(ticketId, checked) {
    if (savingRef.current) return;
    setForm(previous => ({
      ...previous,
      ticketIds: checked ? [...previous.ticketIds, ticketId] : previous.ticketIds.filter(id => id !== ticketId)
    }));
  }

  async function submit(event) {
    event.preventDefault();
    if (savingRef.current) return;
    setNotice('');
    setError('');
    if (!ready || typeof onSave !== 'function') {
      setError('Firestore financeiro indisponível. A prévia permanece editável; confira a conexão antes de salvar.');
      focusFeedback();
      return;
    }
    let content;
    try {
      if (!schoolById.has(form.schoolId)) throw new Error('Selecione uma escola cadastrada.');
      if (!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(form.plannedMonth) || form.plannedMonth.startsWith('0000-')) {
        throw new Error('Informe o mês previsto do atendimento.');
      }
      if (form.plannedDate && form.plannedDate.slice(0, 7) !== form.plannedMonth) {
        throw new Error('A data prevista deve pertencer ao mês informado. Ajuste a data ou a competência.');
      }
      if (form.ticketIds.some(id => !schoolTickets.some(ticket => String(ticket.id_chamado) === id))) {
        throw new Error('Confira os chamados vinculados: todos devem pertencer à escola selecionada.');
      }
      content = normalizeAttendance(formContent(form, { saving: true }));
    } catch (reason) {
      setError(reason.message || 'Confira os dados do atendimento.');
      focusFeedback();
      return;
    }
    savingRef.current = true;
    setIsSaving(true);
    try {
      // O mesmo rascunho mantém seu ID em uma nova tentativa após falha de rede.
      // Isso impede uma segunda criação caso a primeira gravação já tenha chegado à base.
      if (!editing && !creationIdRef.current) creationIdRef.current = crypto.randomUUID();
      const saved = await onSave(content, { id: editing?.id || creationIdRef.current, expectedRevision: editing?.revision ?? 0 });
      if (!saved?.id || !Number.isSafeInteger(saved.revision)) {
        throw new Error('A base não confirmou a gravação. Sua edição foi preservada; confira a conexão antes de tentar novamente.');
      }
      creationIdRef.current = null;
      setForm(null);
      setEditing(null);
      setNotice('Atendimento salvo no Firestore compartilhado · versão ' + saved.revision + '.');
      setPagination(null);
      onSaved?.(content);
      focusFeedback();
    } catch (reason) {
      setError(reason.message || 'Não foi possível salvar. Sua edição foi preservada para tentar novamente.');
      focusFeedback();
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <section className="attendance-estimates" aria-labelledby={titleId} aria-busy={isSaving}>
      <header className="attendance-header">
        <div>
          <h3 ref={headingRef} tabIndex={-1} id={titleId}>Estimativas de atendimento</h3>
          <p>{monthText(month)} · {selectedSchool ? selectedSchool.unidade_escolar : 'Todas as escolas'}</p>
        </div>
        <button ref={newButtonRef} type="button" className="btn btn-primary" onClick={startNew} disabled={isSaving}>
          <Plus size={17} aria-hidden="true" /> Nova estimativa
        </button>
      </header>

      <div className={'attendance-connection ' + (ready ? 'is-ready' : '')} role="status">
        {ready ? <CheckCheck size={17} aria-hidden="true" /> : <Info size={17} aria-hidden="true" />}
        <span>{ready ? 'Firestore financeiro conectado' : connection.status === 'connecting' ? 'Conectando ao Firestore financeiro…' : 'Firestore financeiro indisponível'}
          {!ready && connection.status !== 'connecting' && <small>A prévia pode ser editada. O salvamento ficará disponível com a conexão.</small>}
          {connection.status === 'error' && connection.error && <small>{typeof connection.error === 'string' ? connection.error : connection.error.message}</small>}
        </span>
      </div>

      {(error || notice) && <p ref={feedbackRef} className={'attendance-feedback ' + (error ? 'is-error' : '')} role={error ? 'alert' : 'status'} tabIndex={-1}>{error || notice}</p>}

      {form && (
        <form key={editing?.id || form.items[0].id} className="attendance-editor" aria-labelledby={editorTitleId} onSubmit={submit} noValidate>
          <div className="attendance-editor-heading">
            <div>
              <h4 ref={editorHeadingRef} id={editorTitleId} tabIndex={-1}>{editing ? 'Editar estimativa de atendimento' : 'Estimar atendimento'}</h4>
              <p>{createValidatedCre03Catalog(CRE03_SIGNED_PRICE_SCHEDULE)
                ? 'Valor de referência do TR preenchido automaticamente quando há faixa validada.'
                : 'O TR identifica as faixas técnicas; preços unitários dependem da planilha contratual preenchida.'}</p>
            </div>
            <button type="button" className="attendance-icon-button" aria-label="Fechar edição da estimativa" onClick={closeEditor} disabled={isSaving}><X size={19} aria-hidden="true" /></button>
          </div>

          {hasNewRevision && <div className="attendance-revision-alert" role="status">
            <span>Este atendimento tem uma versão mais recente. Sua edição foi preservada.</span>
            <button type="button" className="btn btn-secondary btn-sm" disabled={isSaving} onClick={event => startEdit(latestEditingRecord, event)}>Reabrir versão atual</button>
          </div>}

          <fieldset className="attendance-editor-lock" disabled={isSaving}>
            <legend className="attendance-sr-only">Dados do atendimento e grupos de referência</legend>
            <div className="attendance-main-fields">
              <div className="form-group attendance-school-field">
                <label htmlFor={fieldId('school')}>Escola</label>
                <select id={fieldId('school')} className="form-control" value={form.schoolId} onChange={event => updateField('schoolId', event.target.value)} required>
                  <option value="">Selecione a escola</option>
                  {schools.map(school => <option key={school.designacao} value={String(school.designacao)}>{school.designacao} · {school.unidade_escolar}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor={fieldId('month')}>Mês previsto</label>
                <input id={fieldId('month')} className="form-control" type="month" value={form.plannedMonth} onChange={event => updateField('plannedMonth', event.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor={fieldId('service')}>Atividade</label>
                <select id={fieldId('service')} className="form-control" value={form.serviceKind} onChange={event => updateField('serviceKind', event.target.value)}>
                  {Object.entries(SERVICE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </div>

            <details className="attendance-extra">
              <summary><span>Data, ciclo e vínculos{form.ticketIds.length ? ' · ' + form.ticketIds.length + ' chamado(s)' : ''}{form.visitId ? ' · visita vinculada' : ''}</span><ChevronDown size={16} aria-hidden="true" /></summary>
              <div className="attendance-extra-fields">
                <div className="form-group">
                  <label htmlFor={fieldId('date')}>Data prevista <span>(opcional)</span></label>
                  <input id={fieldId('date')} className="form-control" type="date" value={form.plannedDate} onChange={event => updateField('plannedDate', event.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor={fieldId('cycle')}>Ciclo ou referência <span>(opcional)</span></label>
                  <input id={fieldId('cycle')} className="form-control" value={form.cycle} maxLength={120} placeholder="Ex.: ciclo de manutenção" onChange={event => updateField('cycle', event.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor={fieldId('responsible')}>Responsável informado <span>(opcional)</span></label>
                  <input id={fieldId('responsible')} className="form-control" value={form.responsibleLabel} maxLength={160} onChange={event => updateField('responsibleLabel', event.target.value)} aria-describedby={fieldId('responsible-hint')} />
                  <small id={fieldId('responsible-hint')}>Rótulo informado, sem autenticação individual nesta fase.</small>
                </div>
                {form.visitId && <p className="attendance-context-note">Programação vinculada: <strong>{form.visitId}</strong>. A estimativa não altera o rascunho da visita.</p>}
                <fieldset className="attendance-ticket-links">
                  <legend>Chamados da escola <span>(opcional · até {MAX_TICKET_LINKS})</span></legend>
                  {schoolTickets.length ? <div className="attendance-ticket-options">
                    {schoolTickets.map(ticket => {
                      const ticketId = String(ticket.id_chamado);
                      const checked = form.ticketIds.includes(ticketId);
                      return <label key={ticketId} className="attendance-ticket-option" htmlFor={fieldId('ticket-' + ticketId)}>
                        <input id={fieldId('ticket-' + ticketId)} type="checkbox" checked={checked} disabled={!checked && form.ticketIds.length >= MAX_TICKET_LINKS} onChange={event => toggleTicket(ticketId, event.target.checked)} />
                        <span><strong>{ticketId}</strong><small>{ticket.tipo_demanda || 'Demanda não informada'}</small></span>
                      </label>;
                    })}
                  </div> : <p>{form.schoolId ? 'Nenhum chamado desta escola. O atendimento pode ser salvo sem chamado.' : 'Selecione a escola para consultar seus chamados.'}</p>}
                </fieldset>
              </div>
            </details>

            <div className="attendance-groups">
              {form.items.map((item, index) => {
                const itemId = name => fieldId(item.id + '-' + name);
                const sourceRequired = item.priceText.trim() !== '';
                const trItem = findCre03TrItem(item.equipmentType, item.capacityBtu);
                return (
                  <fieldset className="attendance-group" key={item.id}>
                    <legend>Grupo {index + 1}</legend>
                    <div className="attendance-group-toolbar">
                      <span>Uma referência para este serviço ou conjunto de aparelhos.</span>
                      {form.items.length > 1 && <button type="button" className="attendance-icon-button" onClick={() => removeItem(item.id)} aria-label={'Remover grupo ' + (index + 1)}><Trash2 size={17} aria-hidden="true" /></button>}
                    </div>
                    <div className="attendance-group-fields">
                      <div className="form-group attendance-group-description">
                        <label htmlFor={itemId('description')}>Serviço ou grupo <span>(opcional)</span></label>
                        <input id={itemId('description')} className="form-control" value={item.description} maxLength={500} placeholder="Identifique o grupo a atender" onChange={event => updateItem(item.id, 'description', event.target.value)} />
                      </div>
                      <div className="form-group">
                        <label htmlFor={itemId('quantity')}>Quantidade</label>
                        <input id={itemId('quantity')} className="form-control" type="number" min="0" max="1000000" step="1" value={item.quantity} placeholder="Não informada" onChange={event => updateItem(item.id, 'quantity', event.target.value)} />
                      </div>
                      <div className="form-group">
                        <label htmlFor={itemId('price')}>Preço unitário <span>(R$)</span></label>
                        <input id={itemId('price')} className="form-control tabular" type="text" inputMode="decimal" value={item.priceText} maxLength={30} placeholder="Não informado" aria-describedby={itemId('price-hint')} onChange={event => updateItem(item.id, 'priceText', event.target.value)} />
                        <small id={itemId('price-hint')}>Até 4 casas · ex.: 125,4321</small>
                      </div>
                      <div className="form-group">
                        <label htmlFor={itemId('coverage')}>Cobertura do serviço</label>
                        <select id={itemId('coverage')} className="form-control" value={item.coverage} onChange={event => updateItem(item.id, 'coverage', event.target.value)}>
                          <option value="a_confirmar">A confirmar</option>
                          <option value="incluido">Incluído na cobertura</option>
                          <option value="adicional">Adicional informado</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor={itemId('nature')}>Natureza da referência</label>
                        <select id={itemId('nature')} className="form-control" value={item.referenceNature} onChange={event => updateItem(item.id, 'referenceNature', event.target.value)}>
                          <option value="provisoria">Provisória</option>
                          <option value="informada">Informada manualmente</option>
                          <option value="nao_informada">Não informada</option>
                          {item.referenceNature === 'contratual_informada' && <option value="contratual_informada">Contratual informada · origem registrada</option>}
                        </select>
                      </div>
                      <div className="form-group attendance-group-source">
                        <label htmlFor={itemId('source')}>Origem do preço <span>({sourceRequired ? 'obrigatória' : 'se houver'})</span></label>
                        <input id={itemId('source')} className="form-control" value={item.sourceRef} maxLength={300} placeholder="Documento, orçamento ou informação identificada" onChange={event => updateItem(item.id, 'sourceRef', event.target.value)} />
                      </div>
                      {item.coverage !== 'a_confirmar' && <div className="form-group attendance-group-source">
                        <label htmlFor={itemId('coverage-source')}>Referência da cobertura <span>(se houver)</span></label>
                        <input id={itemId('coverage-source')} className="form-control" value={item.coverageSourceRef || ''} maxLength={300} placeholder="Documento ou decisão de cobertura informada" onChange={event => updateItem(item.id, 'coverageSourceRef', event.target.value)} />
                      </div>}
                    </div>
                    {item.coverage === 'incluido' && <p className="attendance-included-note"><Info size={15} aria-hidden="true" /> {item.coverageSourceRef?.trim()
                      ? 'Acréscimo estimado zero pela cobertura informada. O preço nominal, se conhecido, permanece registrado.'
                      : 'Sem referência da cobertura, o acréscimo permanece pendente. Um preço conhecido permite somente a estimativa nominal.'}</p>}
                    <details className="attendance-technical">
                      <summary><span>Equipamentos e versão da referência <span>(opcional)</span></span><ChevronDown size={15} aria-hidden="true" /></summary>
                      <div className="attendance-technical-fields">
                        <div className="form-group">
                          <label htmlFor={itemId('equipment-type')}>Tipo de equipamento</label>
                          <input id={itemId('equipment-type')} className="form-control" value={item.equipmentType} maxLength={120} placeholder="Se já identificado" onChange={event => updateItem(item.id, 'equipmentType', event.target.value)} />
                        </div>
                        <div className="form-group">
                          <label htmlFor={itemId('capacity')}>Capacidade <span>(BTU)</span></label>
                          <input id={itemId('capacity')} className="form-control" type="text" inputMode="numeric" value={item.capacityBtu} maxLength={20} placeholder="Não confirmada" onChange={event => updateItem(item.id, 'capacityBtu', event.target.value)} />
                        </div>
                        <div className="form-group">
                          <label htmlFor={itemId('equipment-ref')}>Identificação dos aparelhos</label>
                          <input id={itemId('equipment-ref')} className="form-control" value={item.equipmentRef} maxLength={120} placeholder="Patrimônio ou grupo, se houver" onChange={event => updateItem(item.id, 'equipmentRef', event.target.value)} />
                        </div>
                        <div className="form-group">
                          <label htmlFor={itemId('version')}>Versão da referência</label>
                          <input id={itemId('version')} className="form-control" value={item.referenceVersion} maxLength={120} placeholder="Edição ou data da fonte" onChange={event => updateItem(item.id, 'referenceVersion', event.target.value)} />
                        </div>
                        {item.catalogId && <p className="attendance-context-note">Catálogo registrado: {item.catalogId}{item.categoryCode ? ' · categoria ' + item.categoryCode : ''}.</p>}
                        {trItem && <p className="attendance-context-note" role="status">
                          Enquadramento do TR CRE03: item {trItem.number} · {trItem.type} · {parseCapacityBtu(item.capacityBtu)?.toLocaleString('pt-BR')} BTU.
                          {item.catalogId === CRE03_CATALOG_ID
                            ? ' Preço unitário contratual referenciado automaticamente.'
                            : ' Preço unitário pendente de planilha contratual validada.'}
                        </p>}
                        <p className="attendance-context-note">O atendimento pode ser estimado sem cadastro individual dos aparelhos. Tipo e BTU não determinam cobrança.</p>
                      </div>
                    </details>
                  </fieldset>
                );
              })}
              <button id={fieldId('add-group')} type="button" className="btn btn-secondary attendance-add-group" onClick={addItem} disabled={form.items.length >= MAX_ATTENDANCE_ITEMS}>
                <Plus size={16} aria-hidden="true" /> Adicionar grupo
              </button>
              {form.items.length >= MAX_ATTENDANCE_ITEMS && <p className="attendance-hint">Limite de {MAX_ATTENDANCE_ITEMS} grupos por atendimento.</p>}
            </div>
          </fieldset>

          <section className="attendance-preview" aria-label="Prévia da estimativa" aria-live="polite" aria-atomic="true">
            <EstimateValue calculation={preview.result} />
            <div className="attendance-preview-context">
              <span>Estimativa ≠ cobrança.</span>
              <p>Não constitui execução, apuração, atesto, nota fiscal ou pagamento.</p>
              {preview.error && <p className="attendance-hint">{preview.error}</p>}
              {!preview.error && form.items.some(item => (item.priceText.trim() || item.coverage === 'incluido') && !item.sourceRef.trim()) && <p className="attendance-hint">Informe a origem para completar a referência e salvar.</p>}
            </div>
          </section>
          <Composition content={form} calculation={preview.result} preview />
          <div className="attendance-editor-footer">
            <button type="button" className="btn btn-secondary" onClick={closeEditor} disabled={isSaving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving || !ready || typeof onSave !== 'function'}>
              <Save size={17} aria-hidden="true" />{isSaving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Salvar atendimento'}
            </button>
          </div>
        </form>
      )}

      {ready && (
        <>
          <div className="attendance-table-tools">
            <input className="form-control" type="search" aria-label="Buscar atendimentos"
              placeholder="Buscar escola ou serviço…" value={search} onChange={event => onSearchChange(event.target.value)} />
            <div className="attendance-filter-options" role="group" aria-label="Filtrar por cobertura">
              {attendanceStatuses.map(({ value, label }) => (
                <button type="button" className="btn btn-secondary btn-sm" key={value}
                  aria-pressed={status === value} onClick={() => onStatusChange(value)}>{label}</button>
              ))}
            </div>
          </div>

          {pageRows.length ? (
            <div className="attendance-table-scroll" role="region" aria-label="Tabela de estimativas" tabIndex={0}>
              <table className="attendance-table" aria-label="Atendimentos da competência">
                <thead>
                  <tr>
                    <th scope="col">Escola</th>
                    <th scope="col">Atividade</th>
                    <th scope="col" className="attendance-money">Referência nominal</th>
                    <th scope="col" className="attendance-money">Acréscimo</th>
                    <th scope="col">Cobertura</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, index) => {
                    const { record } = row;
                    const schoolName = schoolById.get(String(record.schoolId))?.unidade_escolar || record.schoolId || 'Escola não identificada';
                    const coverageLabel = row.invalid ? 'Conferir registro' : row.coveragePendingCount > 0
                      ? 'A confirmar' : 'Informada';
                    return (
                      <tr key={record.id || 'sem-id-' + index}>
                        <th scope="row">
                          <button type="button" className="attendance-row-link" disabled={isSaving || row.invalid}
                            aria-label={'Abrir atendimento de ' + schoolName + ', ' + monthText(record.plannedMonth) + ', ' +
                              (SERVICE_LABELS[record.serviceKind] || 'Outra atividade') + (record.cycle ? ', ' + record.cycle : '')}
                            onClick={event => {
                              detailTriggerRef.current = event.currentTarget;
                              setDetailId(record.id);
                            }}>
                            <span>{schoolName}<small>{record.schoolId}{record.cycle ? ' · ' + record.cycle : ''}</small></span>
                            <ArrowUpRight size={16} aria-hidden="true" />
                          </button>
                          {row.invalid && <small>{row.error}</small>}
                        </th>
                        <td>{SERVICE_LABELS[record.serviceKind] || 'Outra atividade'}</td>
                        <td className="attendance-money tabular">
                          {tableAmount(row.nominalUnits4, row.overflowByNature?.nominal)}
                          {row.nominalUnits4 !== null && row.missingNominalCount > 0 && <small>Parcial</small>}
                        </td>
                        <td className="attendance-money tabular">
                          {tableAmount(row.additionalUnits4, row.overflowByNature?.additional)}
                          {row.additionalUnits4 !== null && row.incomplete && <small>Parcial</small>}
                        </td>
                        <td><span className={'attendance-coverage' + (row.invalid || row.coveragePendingCount > 0 ? ' is-pending' : '')}>{coverageLabel}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="attendance-empty">
              <Calculator size={22} aria-hidden="true" />
              <strong>{searchText || status !== 'all' ? 'Nenhum atendimento com estes filtros.' : 'Nenhuma estimativa nesta competência.'}</strong>
            </div>
          )}
          <footer className="attendance-list-footer">
            <span role="status">{visibleRows.length} {visibleRows.length === 1 ? 'atendimento' : 'atendimentos'}</span>
            {pageCount > 1 && <div role="group" aria-label="Paginação dos atendimentos">
              <button type="button" className="btn btn-secondary btn-sm" disabled={page === 1}
                onClick={() => setPagination({ scope, page: page - 1 })}>Anterior</button>
              <span>Página {page} de {pageCount}</span>
              <button type="button" className="btn btn-secondary btn-sm" disabled={page === pageCount}
                onClick={() => setPagination({ scope, page: page + 1 })}>Próxima</button>
            </div>}
          </footer>
        </>
      )}

      <dialog className="attendance-drawer" ref={drawerRef} aria-labelledby={fieldId('details-title')}
        onClose={() => setDetailId(null)}>
        {detailRecord && (
          <article className="attendance-record" key={detailRecord.id}>
            <header className="attendance-drawer-header">
              <div>
                <span className="attendance-record-period">{monthText(detailRecord.plannedMonth)} · {SERVICE_LABELS[detailRecord.serviceKind] || 'Outra atividade'}</span>
                <h4 id={fieldId('details-title')}>{detailSchool?.unidade_escolar || 'Escola ' + detailRecord.schoolId}</h4>
                <p>{detailRecord.schoolId}{detailRecord.cycle ? ' · ' + detailRecord.cycle : ''}{detailRecord.plannedDate ? ' · prevista para ' + detailRecord.plannedDate.split('-').reverse().join('/') : ''}</p>
              </div>
              <button type="button" className="btn btn-secondary btn-sm attendance-drawer-close"
                aria-label="Fechar detalhes" onClick={() => drawerRef.current.close()}><X size={20} aria-hidden="true" /></button>
            </header>
            <div className="attendance-drawer-overview">
              <EstimateValue calculation={detailCalculation.result} />
              <button type="button" className="btn btn-primary btn-sm" disabled={isSaving}
                onClick={() => {
                  drawerRef.current.close();
                  startEdit(detailRecord, detailTriggerRef.current);
                }}><FilePenLine size={16} aria-hidden="true" /> Editar atendimento</button>
            </div>
            {detailCalculation.error && <p className="attendance-hint" role="status">{detailCalculation.error}</p>}
            <Composition content={detailRecord} calculation={detailCalculation.result} />
            <div className="attendance-record-meta">
              <span>Versão {detailRecord.revision} · {dateTimeText(detailRecord.updatedAtISO || detailRecord.updatedAt)}</span>
              <span>{detailRecord.ticketIds?.length ? detailRecord.ticketIds.length + ' chamado(s) vinculado(s)' : 'Sem chamado vinculado'}{detailRecord.visitId ? ' · com programação vinculada' : ''}</span>
            </div>
            {loadRevisions && <AttendanceHistory record={detailRecord} loadRevisions={loadRevisions} />}
          </article>
        )}
      </dialog>
    </section>
  );
}
