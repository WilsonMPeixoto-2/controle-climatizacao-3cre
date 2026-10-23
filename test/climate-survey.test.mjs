import assert from 'node:assert/strict';
import test from 'node:test';
import {
  APPLIANCE_STATUS_OPTIONS,
  buildDisplayName,
  createEnvironment,
  normalizeSurvey,
  resizeAppliances,
  validateSurvey
} from '../src/lib/climateSurvey.js';

test('buildDisplayName compõe tipo e identificação sem espaços sobrando', () => {
  assert.equal(buildDisplayName({ tipo: ' Sala de Aula ', identificacao: ' 101 ' }), 'Sala de Aula 101');
  assert.equal(buildDisplayName({ tipo: 'Biblioteca', identificacao: '' }), 'Biblioteca');
});

test('resizeAppliances preserva dados existentes e cria somente os blocos faltantes', () => {
  const ids = ['apr-2', 'apr-3'];
  const existing = [{
    id: 'apr-1', modelo_marca: 'Springer Midea', capacidade_btu: '12000', tipo: 'Split', situacao: 'Funcionando', observacoes: ''
  }];
  const expanded = resizeAppliances(existing, 3, { idFactory: () => ids.shift() });
  assert.equal(expanded.length, 3);
  assert.equal(expanded[0].modelo_marca, 'Springer Midea');
  assert.equal(expanded[1].situacao, 'Não informado');
  const reduced = resizeAppliances(expanded, 1);
  assert.deepEqual(reduced, [expanded[0]]);
});

test('createEnvironment cria ambiente editável vazio com estrutura estável', () => {
  const ambiente = createEnvironment({ idFactory: () => 'amb-1' });
  assert.equal(ambiente.id, 'amb-1');
  assert.equal(ambiente.tipo, 'Sala de Aula');
  assert.equal(ambiente.quantidade_aparelhos, 0);
  assert.deepEqual(ambiente.aparelhos, []);
});

test('normalizeSurvey mantém campos técnicos opcionais e recalcula nomes e quantidades', () => {
  const normalized = normalizeSurvey({
    designacao: '312014',
    unidade_escolar: 'Escola Municipal Nereu Sampaio',
    ambientes: [{
      id: 'amb-1', tipo: 'Sala de Aula', identificacao: '6', quantidade_aparelhos: 99,
      aparelhos: [{ id: 'apr-1', modelo_marca: '', capacidade_btu: '', tipo: '', situacao: 'Não informado', observacoes: '' }]
    }]
  });
  assert.equal(normalized.ambientes[0].nome_exibicao, 'Sala de Aula 6');
  assert.equal(normalized.ambientes[0].quantidade_aparelhos, 1);
});

test('validateSurvey aceita dados técnicos vazios e rejeita situação fora do catálogo', () => {
  assert.deepEqual(APPLIANCE_STATUS_OPTIONS, ['Não informado', 'Funcionando', 'Precisa de manutenção']);
  const valid = validateSurvey({
    designacao: '312014',
    unidade_escolar: 'Escola Municipal Nereu Sampaio',
    ambientes: [{
      id: 'amb-1', tipo: 'Biblioteca', identificacao: '', nome_exibicao: 'Biblioteca', quantidade_aparelhos: 1,
      aparelhos: [{ id: 'apr-1', modelo_marca: '', capacidade_btu: '', tipo: '', situacao: 'Não informado', observacoes: '' }]
    }]
  });
  assert.equal(valid.success, true);
  const invalid = validateSurvey({
    ...valid.data,
    ambientes: [{ ...valid.data.ambientes[0], aparelhos: [{ ...valid.data.ambientes[0].aparelhos[0], situacao: 'Crítico' }] }]
  });
  assert.equal(invalid.success, false);
});
