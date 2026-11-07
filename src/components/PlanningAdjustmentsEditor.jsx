import {useMemo, useState} from 'react';
import {Check, Pencil, Plus, RotateCcw, X} from 'lucide-react';
import {CRE03_PLANNING_BASELINE,normalizeCreSchoolId} from '../data/cre03PlanningBaseline.js';
import {aggregateAdjustedPlanning,normalizePlanningAdjustment,proratedPlanningBudget} from '../domain/adjustablePlanning.js';
import {formatMoneyUnits4,parseMoneyUnits4} from '../domain/attendanceEstimate.js';
import '../styles/planning-editor.css';

const moneyText = units => units == null ? '' : formatMoneyUnits4(units).replace(/^R\$\s*/, '');
const moneyDisplay = units => units == null ? 'A informar' : formatMoneyUnits4(units,{digits:2});
const planName = (row,schools=[]) => row.schoolLabel || schools.find(
  school=>normalizeCreSchoolId(school.designacao)===normalizeCreSchoolId(row.schoolId)
)?.unidade_escolar || 'Escola '+row.schoolId;

/** UI de apoio: substitui somente a projeção ajustada, jamais a referência original. */
export default function PlanningAdjustmentsEditor({
  adjustments=[], selectedSchoolId='', connection, onSave, schools=[]
}) {
  const [query,setQuery]=useState('');
  const [all,setAll]=useState(false);
  const [form,setForm]=useState(null);
  const [openedRevision,setOpenedRevision]=useState(0);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const allRows=useMemo(()=>aggregateAdjustedPlanning(adjustments).rows,[adjustments]);
  const filtered=useMemo(()=>{
    const selected=normalizeCreSchoolId(selectedSchoolId);
    const search=query.trim().toLocaleLowerCase('pt-BR');
    return allRows.filter(row=>(!selected||selected===row.schoolId)&&
      (!search||row.schoolId.includes(search)||planName(row,schools).toLocaleLowerCase('pt-BR').includes(search)));
  },[allRows,selectedSchoolId,query,schools]);
  const rows=all?filtered:filtered.slice(0,12);
  const ready=connection?.status==='ready';
  function openEdit(row) {
    const id=normalizeCreSchoolId(row.schoolId);
    const prior=adjustments.find(item=>normalizeCreSchoolId(item.schoolId)===id);
    setOpenedRevision(prior?.revision??0);
    setForm({
      schoolId:id,schoolLabel:row.schoolLabel||'',
      month:String(row.month),equipmentCount:String(row.equipmentCount),
      budgetText:moneyText(row.budgetUnits4), added:false
    });
    setError('');setNotice('');
  }
  function openNew() {
    setOpenedRevision(0);
    setForm({schoolId:'',schoolLabel:'',month:'1',equipmentCount:'',budgetText:'',added:true});
    setError('');setNotice('');
  }
  function changeCount(value) {
    setForm(previous=>{
      if(!previous) return previous;
      const before=Number(previous.equipmentCount);
      const after=Number(value);
      let budgetText=previous.budgetText;
      if(previous.equipmentCount.trim()!=='' && value.trim()!=='' &&
          Number.isInteger(after)&&after>=0) {
        try {
          const current=parseMoneyUnits4(previous.budgetText);
          const estimated=proratedPlanningBudget({equipmentCount:before,budgetUnits4:current},after);
          if(estimated!==null) budgetText=moneyText(estimated);
        } catch { /* Valor manual ainda está sendo digitado. */ }
      }
      return {...previous,equipmentCount:value,budgetText};
    });
  }
  async function submit(event) {
    event.preventDefault();
    if(!ready||!form||busy)return;
    setBusy(true);setError('');setNotice('');
    try {
      if(String(form.equipmentCount).trim()==='') throw new Error('Informe a quantidade de aparelhos.');
      const budgetUnits4=parseMoneyUnits4(form.budgetText);
      const normalized=normalizePlanningAdjustment({
        schoolId:form.schoolId,schoolLabel:form.schoolLabel,
        month:Number(form.month),equipmentCount:Number(form.equipmentCount),
        budgetUnits4,archived:false
      });
      const existing=adjustments.find(row=>normalizeCreSchoolId(row.schoolId)===normalized.schoolId);
      if(form.added&&(existing&&!existing.archived || CRE03_PLANNING_BASELINE.some(row=>row.schoolId===normalized.schoolId))) {
        throw new Error('Esta escola já consta do planejamento. Abra o registro existente para editá-lo.');
      }
      if(form.added&&existing?.archived) {
        // Registro previamente removido: a reativação preserva o mesmo histórico.
        await onSave(normalized,existing.revision);
      } else {
        await onSave(normalized,openedRevision);
      }
      setForm(null);setNotice('Planejamento ajustado e salvo no Firestore.');
    } catch(reason) {
      setError(reason.message||'Não foi possível gravar. Sua edição foi preservada.');
    } finally {setBusy(false);}
  }
  async function restore(row) {
    const id=normalizeCreSchoolId(row.schoolId);
    const existing=adjustments.find(item=>normalizeCreSchoolId(item.schoolId)===id&&!item.archived);
    if(!existing||!ready||busy)return;
    if(!window.confirm('Restaurar a referência original desta escola? O ajuste continuará no histórico.'))return;
    setBusy(true);setError('');setNotice('');
    try {
      await onSave({...existing,archived:true},existing.revision);
      setForm(null);setNotice('Ajuste arquivado. A referência anterior voltou a valer.');
    } catch(reason){setError(reason.message||'Não foi possível restaurar.');}
    finally{setBusy(false);}
  }
  return (
    <section className="planning-editor" aria-label="Ajustar planejamento por escola">
      <header className="planning-editor-head">
        <div>
          <h4>Planejamento ajustável</h4>
          <p>Edite o ciclo sem modificar a planilha de referência. Quantidades e orçamento são estimativas.</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm"
          onClick={openNew} disabled={!ready||busy}>
          <Plus size={15} aria-hidden="true"/> Incluir escola
        </button>
      </header>
      {connection?.status!=='ready' && <p role="status" className="planning-editor-status">
        {connection?.status==='error'?'Não foi possível conectar aos ajustes compartilhados: '+connection.error:
        connection?.status==='connecting'?'Conectando aos ajustes do Firestore…':'Planejamento compartilhado não configurado neste ambiente.'}
        {' '}A referência original continua visível e nenhuma alteração será gravada.
      </p>}
      {notice && <p role="status" className="planning-editor-ok">{notice}</p>}
      {error && <p role="alert" className="planning-editor-error">{error}</p>}
      <label className="planning-editor-search">Localizar escola
        <input className="form-control" type="search" value={query}
          onChange={event=>{setQuery(event.target.value);setAll(false);}}
          placeholder="Nome ou código da escola" />
      </label>
      <div className="planning-editor-list">
        {rows.map(row=>{
          const changed=row.source==='ajustado';
          return <div key={row.schoolId} className="planning-editor-row">
            <div className="planning-editor-row-main">
              <strong>{planName(row,schools)}</strong>
              <small>{row.schoolId} · Mês {row.month} · {row.equipmentCount.toLocaleString('pt-BR')} aparelhos · {moneyDisplay(row.budgetUnits4)}</small>
              {changed && <small className="planning-editor-modified">Ajustado pelo usuário</small>}
            </div>
            <div className="planning-editor-actions">
              <button type="button" className="btn btn-secondary btn-sm" disabled={!ready||busy}
                onClick={()=>openEdit(row)} aria-label={'Editar planejamento da escola '+row.schoolId}>
                <Pencil size={14} aria-hidden="true"/> Editar
              </button>
              {changed && <button type="button" className="btn btn-secondary btn-sm"
                disabled={!ready||busy} onClick={()=>restore(row)} aria-label={'Restaurar referência da escola '+row.schoolId}>
                <RotateCcw size={14} aria-hidden="true"/> Restaurar
              </button>}
            </div>
          </div>;
        })}
        {!rows.length && <p className="planning-editor-status">Nenhuma escola localizada neste recorte.</p>}
      </div>
      {filtered.length>12 && <button type="button" className="btn btn-secondary btn-sm"
        onClick={()=>setAll(value=>!value)}>{all?'Mostrar 12 escolas':'Mostrar todas as '+filtered.length+' escolas'}</button>}
      {form && <form className="planning-editor-form" onSubmit={submit} aria-label={form.added?'Incluir escola no planejamento':'Editar planejamento da escola'}>
        <div className="planning-editor-form-head">
          <h5>{form.added?'Incluir escola no planejamento':'Ajustar escola '+form.schoolId}</h5>
          <button type="button" className="btn btn-secondary btn-sm" onClick={()=>setForm(null)} disabled={busy}
            aria-label="Fechar editor"><X size={15} aria-hidden="true"/></button>
        </div>
        <div className="planning-editor-fields">
          <label>Código da escola
            <input className="form-control" value={form.schoolId}
              onChange={event=>setForm(previous=>({...previous,schoolId:event.target.value}))}
              disabled={!form.added||busy} placeholder="Ex.: 312001" required />
          </label>
          <label>Nome de identificação (opcional)
            <input className="form-control" value={form.schoolLabel} maxLength={160}
              onChange={event=>setForm(previous=>({...previous,schoolLabel:event.target.value}))}
              disabled={busy} placeholder="Usar o nome do cadastro" />
          </label>
          <label>Mês relativo do ciclo
            <select className="form-control" value={form.month}
              onChange={event=>setForm(previous=>({...previous,month:event.target.value}))} disabled={busy}>
              {[1,2,3,4,5,6].map(n=><option key={n} value={String(n)}>Mês {n}</option>)}
            </select>
          </label>
          <label>Equipamentos previstos
            <input className="form-control" type="number" min="0" max="100000" step="1"
              value={form.equipmentCount} onChange={event=>changeCount(event.target.value)} disabled={busy} required />
          </label>
          <label>Orçamento estimado (R$)
            <input className="form-control" type="text" inputMode="decimal"
              value={form.budgetText} onChange={event=>setForm(previous=>({...previous,budgetText:event.target.value}))}
              disabled={busy} placeholder="A informar" />
          </label>
        </div>
        <p className="planning-editor-hint">Ao mudar a quantidade, o orçamento é recalculado proporcionalmente quando há valor anterior. Você pode corrigir esse valor livremente; campo em branco significa não informado, não zero.</p>
        <div className="planning-editor-actions">
          <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={()=>setForm(null)}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!ready||busy}>
            <Check size={15} aria-hidden="true"/>{busy?'Salvando…':'Salvar ajustes'}
          </button>
        </div>
      </form>}
    </section>
  );
}
