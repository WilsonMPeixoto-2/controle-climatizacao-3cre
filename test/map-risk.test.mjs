/**
 * map-risk.test.mjs — Bateria de testes do Índice de Risco Territorial (IRT).
 *
 * Executa em Node puro contra DADOS SINTÉTICOS controlados, com data de
 * referência FIXA para resultados determinísticos (padrão do projeto).
 *
 * Rodar:  node test/map-risk.test.mjs   (ou: npm test)
 */
import assert from 'node:assert/strict';
import {
  computeBairroRisk,
  riskLevel,
  pressureBand,
  buildRiskSummary,
  topRiskBairros,
  RISK_THRESHOLDS,
  TOP_K
} from '../src/lib/mapRisk.js';

const REF = new Date('2026-06-10T12:00:00Z');
const iso = (d) => new Date(REF.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

let nextId = 1;
function mkTicket({ prioridade = 'Baixa', paradoDias = 0, idadeDias = 10, escola, status = '04 - Em orçamento' } = {}) {
  return {
    id_chamado: `T-${String(nextId++).padStart(3, '0')}`,
    unidade_escolar: schoolName(escola),
    designacao: escola.designacao,
    status_atual: status,
    prioridade,
    proxima_providencia: 'Acompanhar',
    informacao_validada: 'Sim',
    comunicacao_cto: 'Sim',
    criado_em: iso(idadeDias),
    modificado_em: iso(paradoDias)
  };
}

function schoolName(escola) {
  return escola.unidade_escolar;
}

const escolaA1 = { designacao: 'EM-A1', unidade_escolar: 'EM Alfa Um', bairro: 'Piedade' };
const escolaA2 = { designacao: 'EM-A2', unidade_escolar: 'EM Alfa Dois', bairro: 'Piedade' };
const escolaB1 = { designacao: 'EM-B1', unidade_escolar: 'EM Beta Um', bairro: 'Bonsucesso' };
const escolaC1 = { designacao: 'EM-C1', unidade_escolar: 'EM Gama Um', bairro: 'Inhaúma' };
const schools = [escolaA1, escolaA2, escolaB1, escolaC1];

// ---------------------------------------------------------------------------
// 1) ANTI-DISTORÇÃO: muitos chamados leves NÃO superam poucos críticos parados
// ---------------------------------------------------------------------------
{
  const leves = Array.from({ length: 8 }, () =>
    mkTicket({ prioridade: 'Baixa', paradoDias: 1, escola: escolaA1 })
  ); // score esperado por chamado: 0 (prio) + 0 (inércia) + 8 (sem anexo) = 8
  const criticosParados = [
    mkTicket({ prioridade: 'Crítica', paradoDias: 16, escola: escolaB1 }), // 50+25+8 = 83
    mkTicket({ prioridade: 'Crítica', paradoDias: 31, escola: escolaB1 })  // 50+40+8 = 98
  ];
  const risk = computeBairroRisk([...leves, ...criticosParados], schools, { ref: REF });

  const piedade = risk['piedade'];
  const bonsucesso = risk['bonsucesso'];

  assert.equal(piedade.chamados_ativos, 8, 'Piedade deve ter 8 ativos');
  assert.equal(piedade.risco, 8, 'Piedade: média top-3 de scores 8 = 8');
  assert.equal(piedade.nivel, 'vigilancia', 'Volume leve => vigilância, nunca crítico');
  assert.equal(piedade.pressao, 3, '8 ativos => banda de pressão máxima');

  assert.equal(bonsucesso.chamados_ativos, 2);
  assert.equal(bonsucesso.risco, 90.5, 'Bonsucesso: média de 98 e 83 = 90.5');
  assert.equal(bonsucesso.nivel, 'critico');
  assert.equal(bonsucesso.temCritico, true);
  assert.ok(
    bonsucesso.risco > piedade.risco,
    'Poucos críticos parados devem superar muitos leves'
  );
  console.log('OK 1: anti-distorção volume × severidade');
}

// ---------------------------------------------------------------------------
// 2) ENCERRADOS/SUSPENSOS são ignorados (herda regra de aggregateBairroStats)
// ---------------------------------------------------------------------------
{
  const encerrado = mkTicket({
    prioridade: 'Crítica', paradoDias: 90, escola: escolaC1, status: '10 - Concluído'
  });
  const risk = computeBairroRisk([encerrado], schools, { ref: REF });
  const inhauma = risk['inhauma'];
  assert.equal(inhauma.chamados_ativos, 0);
  assert.equal(inhauma.risco, 0);
  assert.equal(inhauma.nivel, 'em-dia', 'Escolas cadastradas sem ativos => em-dia');
  console.log('OK 2: encerrados ignorados');
}

// ---------------------------------------------------------------------------
// 3) LIMIARES de riskLevel nas fronteiras exatas
// ---------------------------------------------------------------------------
{
  assert.equal(riskLevel(RISK_THRESHOLDS.CRITICO, 1, 5), 'critico');
  assert.equal(riskLevel(RISK_THRESHOLDS.CRITICO - 0.1, 1, 5), 'alto');
  assert.equal(riskLevel(RISK_THRESHOLDS.ALTO, 1, 5), 'alto');
  assert.equal(riskLevel(RISK_THRESHOLDS.ALTO - 0.1, 1, 5), 'moderado');
  assert.equal(riskLevel(RISK_THRESHOLDS.MODERADO, 1, 5), 'moderado');
  assert.equal(riskLevel(RISK_THRESHOLDS.MODERADO - 0.1, 1, 5), 'vigilancia');
  assert.equal(riskLevel(0, 0, 5), 'em-dia');
  assert.equal(riskLevel(0, 0, 0), 'sem-cobertura');
  console.log('OK 3: limiares nas fronteiras');
}

// ---------------------------------------------------------------------------
// 4) BANDAS de pressão
// ---------------------------------------------------------------------------
{
  assert.equal(pressureBand(0), 0);
  assert.equal(pressureBand(1), 1);
  assert.equal(pressureBand(2), 1);
  assert.equal(pressureBand(3), 2);
  assert.equal(pressureBand(5), 2);
  assert.equal(pressureBand(6), 3);
  assert.equal(pressureBand(40), 3);
  console.log('OK 4: bandas de pressão');
}

// ---------------------------------------------------------------------------
// 5) DENSIDADE segura (bairro órfão "Desconhecido" sem escolas não divide por 0)
// ---------------------------------------------------------------------------
{
  const orfao = mkTicket({
    prioridade: 'Alta', paradoDias: 16,
    escola: { designacao: 'ZZ-999', unidade_escolar: 'Escola Fantasma', bairro: '' }
  });
  // designação inexistente em schools -> cai em "Desconhecido"
  const risk = computeBairroRisk([orfao], schools, { ref: REF });
  const desconhecido = risk['desconhecido'];
  assert.ok(desconhecido, 'Bairro órfão deve existir como "Desconhecido"');
  assert.equal(desconhecido.escolas_cadastradas, 0);
  assert.equal(Number.isFinite(desconhecido.densidade), true);
  assert.equal(desconhecido.densidade, 1, 'ativos/max(1, escolas) = 1/1');
  console.log('OK 5: densidade sem divisão por zero');
}

// ---------------------------------------------------------------------------
// 6) TOP OFENSORES ordenados e limitados a 3; média usa só os TOP_K piores
// ---------------------------------------------------------------------------
{
  const ts = [
    mkTicket({ prioridade: 'Crítica', paradoDias: 31, escola: escolaA1 }), // 98
    mkTicket({ prioridade: 'Crítica', paradoDias: 16, escola: escolaA1 }), // 83
    mkTicket({ prioridade: 'Alta', paradoDias: 16, escola: escolaA2 }),    // 68
    mkTicket({ prioridade: 'Baixa', paradoDias: 0, escola: escolaA2 })     // 8
  ];
  const risk = computeBairroRisk(ts, schools, { ref: REF });
  const p = risk['piedade'];
  assert.equal(p.topOfensores.length, 3);
  assert.deepEqual(
    p.topOfensores.map((o) => o.score),
    [98, 83, 68],
    'Ofensores em ordem decrescente'
  );
  assert.equal(p.risco, Math.round(((98 + 83 + 68) / TOP_K) * 10) / 10);
  assert.equal(p.nivel, 'critico');
  console.log('OK 6: top ofensores e média top-K');
}

// ---------------------------------------------------------------------------
// 7) DETERMINISMO e resumo executivo
// ---------------------------------------------------------------------------
{
  const ts = [
    mkTicket({ prioridade: 'Crítica', paradoDias: 16, escola: escolaB1 }),
    mkTicket({ prioridade: 'Média', paradoDias: 8, escola: escolaC1 })
  ];
  const r1 = computeBairroRisk(ts, schools, { ref: REF });
  const r2 = computeBairroRisk(ts, schools, { ref: REF });
  assert.deepEqual(r1, r2, 'Mesma ref => mesma saída');

  const sum = buildRiskSummary(r1);
  assert.equal(sum.bairrosComDemanda, 2);
  assert.equal(sum.totalAtivos, 2);
  assert.equal(sum.critico, 1);
  assert.equal(sum.piorBairro.nome_exibicao, 'Bonsucesso');

  const top = topRiskBairros(r1, 3);
  assert.equal(top.length, 1, 'Só níveis alto/critico recebem rótulo');
  assert.equal(top[0][0], 'bonsucesso');
  console.log('OK 7: determinismo, resumo e top de rótulos');
}

console.log('\nmap-risk.test.mjs: todos os testes passaram.');
