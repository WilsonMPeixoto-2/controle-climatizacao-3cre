import assert from 'node:assert/strict';
import { getSchoolRecordReview } from '../src/domain/schoolRecordReview.js';

// Apenas dados sintéticos: estados dizem respeito a CHAMADOS, não à execução contratual.
const schools = Object.freeze([
  Object.freeze({ designacao: 'T001', unidade_escolar: 'Escola A', bairro: 'Teste' }),
  Object.freeze({ designacao: 'T002', unidade_escolar: 'Escola B', bairro: 'Teste' }),
  Object.freeze({ designacao: 'T003', unidade_escolar: 'Escola C', bairro: 'Teste' })
]);
const tickets = Object.freeze([
  Object.freeze({ id_chamado: 'A1', designacao: 'T001', criado_em: '2026-09-02', status_atual: '1 - Recebido — em triagem' }),
  Object.freeze({ id_chamado: 'A2', designacao: 'T001', criado_em: '2026-09-03', status_atual: '10 - Concluído' }),
  Object.freeze({ id_chamado: 'B1', designacao: 'T002', criado_em: '2026-09-05', status_atual: '11 - Encerrado' }),
  Object.freeze({ id_chamado: 'B2', designacao: 'T002', criado_em: '2026-10-01', status_atual: '2 - Em vistoria técnica' }),
  Object.freeze({ id_chamado: 'A3', designacao: 'T001', criado_em: '', status_atual: '2 - Em vistoria técnica' }),
  Object.freeze({ id_chamado: 'ORPHAN', designacao: 'T999', criado_em: '2026-09-01', status_atual: '2 - Em vistoria técnica' })
]);
const snapshot = JSON.stringify({ schools, tickets });

const sept = getSchoolRecordReview(schools, tickets, { month: '2026-09' });
assert.equal(sept.total, 3);
assert.equal(sept.toReview, 1);
assert.equal(sept.withConclusion, 1);
assert.equal(sept.noRequest, 1);
assert.equal(sept.unmatchedRecords, 1);
assert.equal(sept.attendanceConfirmed, null);
const a = sept.schools.find(item => item.school.designacao === 'T001');
assert.equal(a.category, 'to_review');
assert.equal(a.requests, 2);
assert.equal(a.withoutConclusion, 1);
assert.equal(a.withConclusion, 1);
assert.equal(a.undatedRecords, 1);
assert.equal(a.lastOpening, '2026-09-03');
const b = sept.schools.find(item => item.school.designacao === 'T002');
assert.equal(b.category, 'with_conclusion');
assert.equal(b.withoutConclusion, 0);
assert.equal(sept.schools.find(item => item.school.designacao === 'T003').category, 'no_request');

const oct = getSchoolRecordReview(schools, tickets, { month: '2026-10' });
assert.equal(oct.toReview, 1);
assert.equal(oct.noRequest, 2);
assert.equal(oct.withConclusion, 0);
const all = getSchoolRecordReview(schools, tickets);
assert.equal(all.toReview, 2);
assert.equal(all.withConclusion, 0);
assert.equal(all.noRequest, 1);
assert.equal(getSchoolRecordReview(schools, tickets, { schoolId: 'T003' }).noRequest, 1);
assert.equal(getSchoolRecordReview(schools, tickets, { schoolId: 'T003' }).total, 1);
assert.equal(getSchoolRecordReview([], [], {}).total, 0);

// Mês sem chamados não é prova de que nenhuma escola tenha sido atendida.
const future = getSchoolRecordReview(schools, tickets, { month: '2035-01' });
assert.equal(future.noRequest, 3);
assert.equal(future.attendanceConfirmed, null);
assert.equal(getSchoolRecordReview(null, null).total, 0);
assert.equal(JSON.stringify({ schools, tickets }), snapshot);
console.log('Etapa 2 | Conferência escolar: recorte, estados operacionais, ausência e imutabilidade passaram.');
