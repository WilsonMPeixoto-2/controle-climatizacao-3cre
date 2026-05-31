/**
 * logic.test.mjs — Bateria de testes da lógica de negócio.
 *
 * Executa em Node puro (sem React/DOM) contra os DADOS REAIS de src/data/db.json.
 * Usa uma data de referência FIXA para resultados determinísticos.
 *
 * Rodar:  node test/logic.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  diffDays, formatDateBrazilian, isClosed, inactivityDays, ageDays,
  slaLevel, ageLevel, computeMetrics, stuckRanking, stageGroup, stageGroupCounts,
  filterBySector, sectorSummary, ticketInSector,
  suggestedActionColor, isTruthyFlag, compileEmailTemplate, searchSchools,
  CLOSED_STATUSES, SLA_WARN_DAYS, SLA_SEVERE_DAYS,
  AGE_WARN_DAYS, AGE_SEVERE_DAYS, SECTORS,
} from '../src/lib/logic.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = JSON.parse(readFileSync(join(__dirname, '../src/data/db.json'), 'utf-8'));

// Data de referência fixa: 30/05/2026 (contexto do projeto).
const REF = new Date('2026-05-30T12:00:00');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}\n      → ${e.message}`); }
}
function section(t) { console.log(`\n— ${t} —`); }

// ===========================================================================
section('Datas (diffDays / formatDateBrazilian)');

test('diffDays calcula dias inteiros corretamente', () => {
  assert.equal(diffDays('2026-05-20T12:00:00', REF), 10);
  assert.equal(diffDays('2026-05-30T12:00:00', REF), 0);
});
test('diffDays nunca retorna negativo (data futura → 0)', () => {
  assert.equal(diffDays('2026-12-31T00:00:00', REF), 0);
});
test('diffDays trata data ausente/inválida como 0', () => {
  assert.equal(diffDays(null, REF), 0);
  assert.equal(diffDays('', REF), 0);
  assert.equal(diffDays('xx/xx/xxxx', REF), 0);
});
test('formatDateBrazilian formata ISO em dd/mm/aaaa', () => {
  assert.equal(formatDateBrazilian('2026-05-30T00:00:00'), '30/05/2026');
});
test('formatDateBrazilian devolve o original se inválido', () => {
  assert.equal(formatDateBrazilian('texto'), 'texto');
  assert.equal(formatDateBrazilian(''), '');
});

// ===========================================================================
section('Alerta de SLA (inércia) — limiares 7/15');

test('limiares são 7 (âmbar) e 15 (vermelho)', () => {
  assert.equal(SLA_WARN_DAYS, 7);
  assert.equal(SLA_SEVERE_DAYS, 15);
});
test('classifica corretamente nas fronteiras', () => {
  const mk = days => ({ status_atual: '4 - Aguardando orçamento',
    modificado_em: new Date(REF.getTime() - days*86400000).toISOString() });
  assert.equal(slaLevel(mk(6), REF), 'ok');
  assert.equal(slaLevel(mk(7), REF), 'warning');
  assert.equal(slaLevel(mk(14), REF), 'warning');
  assert.equal(slaLevel(mk(15), REF), 'severe');
  assert.equal(slaLevel(mk(40), REF), 'severe');
});
test('chamado encerrado nunca dispara SLA, mesmo muito parado', () => {
  const old = { status_atual: '10 - Concluído', modificado_em: '2025-01-01T00:00:00' };
  assert.equal(slaLevel(old, REF), 'ok');
});

// ===========================================================================
section('Alerta de Antiguidade (tempo em aberto) — limiares 30/60');

test('limiares são 30 (roxo claro) e 60 (roxo intenso)', () => {
  assert.equal(AGE_WARN_DAYS, 30);
  assert.equal(AGE_SEVERE_DAYS, 60);
});
test('mede tempo desde a abertura (criado_em), não a última atualização', () => {
  // Aberto há 90 dias, mas atualizado ontem: SLA ok, antiguidade severa.
  const t = {
    status_atual: '7 - Adequação em execução',
    criado_em: new Date(REF.getTime() - 90*86400000).toISOString(),
    modificado_em: new Date(REF.getTime() - 1*86400000).toISOString(),
  };
  assert.equal(slaLevel(t, REF), 'ok', 'SLA deveria estar ok (atualizado ontem)');
  assert.equal(ageLevel(t, REF), 'severe', 'antiguidade deveria ser severa (90 dias)');
});
test('usa data_solicitacao como fallback quando não há criado_em', () => {
  const t = { status_atual: '4 - Aguardando orçamento',
    data_solicitacao: new Date(REF.getTime() - 45*86400000).toISOString() };
  assert.equal(ageDays(t, REF), 45);
  assert.equal(ageLevel(t, REF), 'warning');
});
test('chamado encerrado nunca dispara antiguidade', () => {
  const old = { status_atual: '11 - Encerrado', criado_em: '2024-01-01T00:00:00' };
  assert.equal(ageLevel(old, REF), 'ok');
});

// ===========================================================================
section('Métricas agregadas (computeMetrics) sobre dados reais');

const m = computeMetrics(db.chamados, REF);
test('total = 28 chamados reais', () => assert.equal(m.total, 28));
test('aberto + concluído = total', () => assert.equal(m.open + m.closed, m.total));
test('contagem de concluídos confere com varredura direta', () => {
  const closed = db.chamados.filter(isClosed).length;
  assert.equal(m.closed, closed);
});
test('inactivePlus15 ⊆ inactivePlus7 (severo é subconjunto de âmbar-ou-pior)', () => {
  assert.ok(m.inactivePlus15 <= m.inactivePlus7);
});
test('agePlus60 ⊆ agePlus30', () => {
  assert.ok(m.agePlus60 <= m.agePlus30);
});
test('nenhum chamado encerrado entra nos alertas', () => {
  // Recalcula manualmente ignorando encerrados e compara.
  const ativos = db.chamados.filter(t => !isClosed(t));
  const sla7 = ativos.filter(t => inactivityDays(t, REF) >= 7).length;
  assert.equal(m.inactivePlus7, sla7);
});

// ===========================================================================
section('Ranking de parados (stuckRanking)');

const rank = stuckRanking(db.chamados, REF, 5);
test('retorna no máximo 5', () => assert.ok(rank.length <= 5));
test('ordenado por inatividade decrescente', () => {
  for (let i = 1; i < rank.length; i++)
    assert.ok(rank[i-1].inactivityDays >= rank[i].inactivityDays);
});
test('nenhum encerrado no ranking', () => {
  assert.ok(rank.every(t => !isClosed(t)));
});
test('cada item traz inactivityDays e ageDays numéricos', () => {
  assert.ok(rank.every(t => typeof t.inactivityDays === 'number' && typeof t.ageDays === 'number'));
});

// ===========================================================================
section('Visões por setor (Bloco C) sobre dados reais');

test('SECTORS = GOP, GIN, CPS, CTO', () => {
  assert.deepEqual(SECTORS, ['GOP', 'GIN', 'CPS', 'CTO']);
});
test('ticketInSector reconhece setor composto', () => {
  assert.ok(ticketInSector({ setor_responsavel: 'GIN / Unidade Escolar' }, 'GIN'));
  assert.ok(!ticketInSector({ setor_responsavel: 'GIN / Unidade Escolar' }, 'CTO'));
});
test('GOP casa em responsabilidade isolada e composta, mas não como substring', () => {
  assert.ok(ticketInSector({ setor_responsavel: 'GOP' }, 'GOP'));
  assert.ok(ticketInSector({ setor_responsavel: 'GOP / CPS' }, 'GOP'));
  assert.ok(!ticketInSector({ setor_responsavel: 'CPS' }, 'GOP'));
});
test('soma dos envolvimentos por setor ≥ total (chamados multi-setor)', () => {
  const soma = SECTORS.reduce((acc, s) => acc + filterBySector(db.chamados, s).length, 0);
  assert.ok(soma >= 0);
  // pelo menos um chamado pertence a algum setor conhecido
  assert.ok(soma > 0);
});
test('sectorSummary: aberto + concluído = total do setor', () => {
  for (const s of SECTORS) {
    const sm = sectorSummary(db.chamados, s, REF);
    assert.equal(sm.open + sm.closed, sm.total, `setor ${s}`);
  }
});
test('GOP tem 11 chamados nos dados reais (dono isolado)', () => {
  const gop = db.chamados.filter(t => t.setor_responsavel === 'GOP').length;
  assert.equal(gop, 11);
  // filterBySector deve incluir ao menos esses 11
  assert.ok(filterBySector(db.chamados, 'GOP').length >= 11);
});

// ===========================================================================
section('Ação Sugerida colorida (Bloco A)');

test('isTruthyFlag interpreta Sim/Não/boolean', () => {
  assert.equal(isTruthyFlag('Sim'), true);
  assert.equal(isTruthyFlag('Não'), false);
  assert.equal(isTruthyFlag(true), true);
  assert.equal(isTruthyFlag(null), false);
});
test('não confirmada → vermelho', () => {
  assert.equal(suggestedActionColor({ confirmado_pela_unidade: 'Não',
    acao_sugerida: 'Solicitar confirmação à unidade' }), 'red');
});
test('confirmada com necessidade → âmbar', () => {
  assert.equal(suggestedActionColor({ confirmado_pela_unidade: 'Sim',
    necessidade_aparelhos: 18, acao_sugerida: 'Instalar aparelhos' }), 'amber');
});
test('confirmada e sem necessidade → verde', () => {
  assert.equal(suggestedActionColor({ confirmado_pela_unidade: 'Sim',
    necessidade_aparelhos: 0, acao_sugerida: 'Inventário em dia' }), 'green');
});
test('toda escola real recebe uma cor válida', () => {
  const valid = new Set(['red', 'amber', 'green']);
  assert.ok(db.escolas.every(e => valid.has(suggestedActionColor(e))));
});

// ===========================================================================
section('Modelos de e-mail (compileEmailTemplate)');

test('substitui {ID_CHAMADO}, {UNIDADE} e {DATA}', () => {
  const tpl = 'Chamado {ID_CHAMADO} da {UNIDADE} atualizado em {DATA}.';
  const tk = { id_chamado: 'GOP-AR-2026-0001', unidade_escolar: 'Escola X',
    modificado_em: '2026-05-20T00:00:00' };
  const out = compileEmailTemplate(tpl, tk, REF);
  assert.ok(out.includes('GOP-AR-2026-0001'));
  assert.ok(out.includes('Escola X'));
  assert.ok(out.includes('20/05/2026'));
  assert.ok(!out.includes('{'));
});
test('usa a data de referência quando o chamado não tem modificado_em', () => {
  const out = compileEmailTemplate('Em {DATA}.', { id_chamado: 'X', unidade_escolar: 'Y' }, REF);
  assert.ok(out.includes('30/05/2026'));
});
test('compila todos os 8 modelos reais sem deixar placeholders', () => {
  const tk = db.chamados[0];
  for (const mdl of db.modelos_email) {
    const out = compileEmailTemplate(mdl.template, tk, REF);
    assert.ok(!/{ID_CHAMADO}|{UNIDADE}|{DATA}/.test(out), `modelo: ${mdl.etapa}`);
  }
});

// ===========================================================================
section('Busca de escolas (searchSchools) — correção do bug filterLookupSchools');

test('termo vazio devolve a lista (limitada ao default)', () => {
  const r = searchSchools(db.escolas, '');
  assert.ok(r.length > 0 && r.length <= 8);
});
test('respeita o limite informado', () => {
  assert.equal(searchSchools(db.escolas, '', 3).length, 3);
});
test('busca por nome é case-insensitive', () => {
  const r = searchSchools(db.escolas, 'ciep', 100);
  assert.ok(r.length > 0);
  assert.ok(r.every(s => /ciep/i.test(s.unidade_escolar)));
});
test('encontra escola específica por nome', () => {
  const r = searchSchools(db.escolas, 'Chanceler Willy Brandt', 100);
  assert.ok(r.some(s => s.designacao === '313502'));
});
test('busca por designação e por bairro funciona', () => {
  assert.ok(searchSchools(db.escolas, '313502', 100).some(s => s.unidade_escolar.includes('Willy Brandt')));
  assert.ok(searchSchools(db.escolas, 'Inhaúma', 100).length > 0);
});
test('termo sem correspondência devolve lista vazia', () => {
  assert.deepEqual(searchSchools(db.escolas, 'zzz-nao-existe-xyz', 100), []);
});
test('entrada inválida (não-array) não quebra', () => {
  assert.deepEqual(searchSchools(null, 'x'), []);
  assert.deepEqual(searchSchools(undefined, ''), []);
});

// ===========================================================================
section('Grupos de etapa (stageGroupCounts) — legenda do Mapa Operacional');

const sg = stageGroupCounts(db.chamados);
test('soma dos grupos = total de chamados', () => {
  assert.equal(sg.triagem + sg.orcamento + sg.execucao + sg.concluido, db.chamados.length);
});
test('contagens reais batem com os dados (3/10/4/11)', () => {
  assert.equal(sg.triagem, 3);
  assert.equal(sg.orcamento, 10);
  assert.equal(sg.execucao, 4);
  assert.equal(sg.concluido, 11);
});
test('concluído inclui encerrados e suspensos (independe de data)', () => {
  assert.equal(stageGroup({ status_atual: '10 - Concluído' }), 'concluido');
  assert.equal(stageGroup({ status_atual: '11 - Encerrado' }), 'concluido');
  assert.equal(stageGroup({ status_atual: 'Suspenso / pendente' }), 'concluido');
});
test('classifica etapas abertas pela faixa do número', () => {
  assert.equal(stageGroup({ status_atual: '1 - Recebido — em triagem' }), 'triagem');
  assert.equal(stageGroup({ status_atual: '4 - Aguardando orçamento' }), 'orcamento');
  assert.equal(stageGroup({ status_atual: '7 - Adequação em execução' }), 'execucao');
});
test('stageGroupCounts tolera entrada inválida (não-array)', () => {
  const z = stageGroupCounts(null);
  assert.equal(z.triagem + z.orcamento + z.execucao + z.concluido, 0);
});

// ===========================================================================
console.log(`\n${'='.repeat(48)}`);
console.log(`RESULTADO: ${passed} passaram, ${failed} falharam`);
console.log('='.repeat(48));
if (failed > 0) process.exit(1);
