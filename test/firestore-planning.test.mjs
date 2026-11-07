import fs from 'node:fs';
import assert from 'node:assert/strict';
import {initializeTestEnvironment, assertFails} from '@firebase/rules-unit-testing';
import {doc, getDoc, setDoc, updateDoc, deleteDoc, setLogLevel} from 'firebase/firestore';
import {createPlanningPersistence} from '../src/infrastructure/firebase/planningPersistence.js';
import {aggregateAdjustedPlanning} from '../src/domain/adjustablePlanning.js';

setLogLevel('silent');
const rules=fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
const env=await initializeTestEnvironment({
  projectId:'demo-controle-climatizacao-3cre',
  firestore:{host:'127.0.0.1',port:8080,rules}
});
try{
  await env.clearFirestore();
  const a=env.unauthenticatedContext().firestore();
  const b=env.unauthenticatedContext().firestore();
  const pa=createPlanningPersistence(a);
  const pb=createPlanningPersistence(b);
  assert.deepEqual(await pa.load(),[]);
  const initial={schoolId:'312001',schoolLabel:'Escola de referência',month:1,equipmentCount:43,budgetUnits4:77173600};
  const first=await pa.saveAdjustment(initial,{expectedRevision:0,sessionId:'sessao-a'});
  assert.equal(first.revision,1);
  assert.equal(first.schoolId,'312001');
  assert.equal(first.budgetUnits4,77173600);
  assert.equal((await pb.load()).length,1);
  const next={...initial,month:2,equipmentCount:50,budgetUnits4:100000000};
  const second=await pb.saveAdjustment(next,{expectedRevision:1,sessionId:'sessao-b'});
  assert.equal(second.revision,2);
  assert.equal((await pa.load())[0].month,2);
  assert.equal((await pa.loadRevisions('312001')).length,2);
  await assert.rejects(pa.saveAdjustment({...next,equipmentCount:51},{expectedRevision:1,sessionId:'sessao-a'}),
    error=>error.code==='planning/conflict');
  await assertFails(updateDoc(doc(a,'ajustes_planejamento','312001'),{equipmentCount:99}));
  await assertFails(deleteDoc(doc(a,'ajustes_planejamento','312001')));
  await assertFails(updateDoc(doc(a,'ajustes_planejamento','312001','revisoes','v1'),{equipmentCount:99}));
  await assert.rejects(pa.saveAdjustment({...initial,schoolId:'nao-escola'},{expectedRevision:0}),/código/);
  await assert.rejects(pa.saveAdjustment({...initial,month:7},{expectedRevision:2}),/mês/);
  // A base original pode ser restaurada sem excluir o documento ou suas revisões.
  const archived=await pa.saveAdjustment({...next,archived:true},{expectedRevision:2,sessionId:'sessao-a'});
  assert.equal(archived.revision,3);
  assert.equal(aggregateAdjustedPlanning([archived],'312001').equipmentCount,43);
  assert.equal((await pa.loadRevisions('312001')).length,3);
  // Escola acrescentada ao planejamento é independente do cadastro operacional.
  const added=await pa.saveAdjustment({schoolId:'330603',schoolLabel:'Nova escola',month:3,
    equipmentCount:17,budgetUnits4:null},{expectedRevision:0,sessionId:'sessao-b'});
  assert.equal(added.budgetUnits4,null);
  const aggregate=aggregateAdjustedPlanning(await pb.load());
  assert.equal(aggregate.schools,135);
  assert.equal(aggregate.unknownBudgetCount,1);
  assert.equal(aggregate.equipmentCount,3097);
  // Reactivação do ajuste arquivado conserva o ID e não perde o histórico.
  const reopened=await pb.saveAdjustment({...next,archived:false},{expectedRevision:3,sessionId:'sessao-b'});
  assert.equal(reopened.revision,4);
  assert.equal((await pb.loadRevisions('312001')).length,4);
  assert.equal((await getDoc(doc(a,'ajustes_planejamento','312001'))).data().revision,4);
  console.log('Planejamento editável Firestore: duas sessões, CAS, histórico, arquivo/restauração e escola adicional PASS.');
}finally{await env.cleanup();}
