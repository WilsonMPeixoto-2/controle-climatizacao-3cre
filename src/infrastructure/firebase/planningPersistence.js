import {collection, doc, getDoc, getDocs, onSnapshot, query, runTransaction, orderBy, serverTimestamp} from 'firebase/firestore';
import {normalizePlanningAdjustment} from '../../domain/adjustablePlanning.js';

const COLLECTION = 'ajustes_planejamento';
const REVISIONS = 'revisoes';
const toIso = value => value?.toDate?.().toISOString() ?? null;
const fromSnapshot = snapshot => {
  const data = snapshot.data({serverTimestamps:'estimate'});
  return {...data, createdAt:toIso(data.createdAt), updatedAt:toIso(data.updatedAt)};
};
const conflict = (expected,actual) => Object.assign(new Error('O planejamento mudou em outro dispositivo. Reabra a edição para atualizar sua versão.'),{
  code:'planning/conflict', expectedRevision:expected, actualRevision:actual
});

/** Camada de ajustes compartilhados; nunca reescreve o planejamento V4 original. */
export function createPlanningPersistence(db) {
  if(!db) throw new Error('Firebase de planejamento indisponível.');
  const collectionRef = collection(db,COLLECTION);
  const recordsQuery = query(collectionRef,orderBy('updatedAt','desc'));
  async function saveAdjustment(row,{expectedRevision=0,sessionId='planejamento-sem-login'}={}) {
    const adjusted = normalizePlanningAdjustment(row);
    if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0) throw new Error('Revisão inválida.');
    if(typeof sessionId !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(sessionId)) throw new Error('Sessão inválida.');
    const ref=doc(collectionRef,adjusted.schoolId);
    try {
      await runTransaction(db,async tx=>{
        const snapshot=await tx.get(ref);
        const prior=snapshot.exists()?snapshot.data():null;
        const current=prior?.revision??0;
        if(current!==expectedRevision) throw conflict(expectedRevision,current);
        const next={
          ...adjusted,id:adjusted.schoolId,revision:current+1,sessionId,
          createdAt:prior?prior.createdAt:serverTimestamp(),
          updatedAt:serverTimestamp()
        };
        tx.set(ref,next);
        tx.set(doc(ref,REVISIONS,'v'+next.revision),next);
      });
    } catch(error) {
      if(['permission-denied','aborted'].includes(error.code)){
        const fresh=await getDoc(ref);
        const current=fresh.exists()?fresh.data().revision:0;
        if(current!==expectedRevision) throw conflict(expectedRevision,current);
      }
      throw error;
    }
    return fromSnapshot(await getDoc(doc(ref,REVISIONS,'v'+(expectedRevision+1))));
  }
  return {
    async load(){return (await getDocs(recordsQuery)).docs.map(fromSnapshot);},
    subscribe({onData,onError}={}){return onSnapshot(recordsQuery,snapshot=>onData?.(snapshot.docs.map(fromSnapshot)),error=>onError?.(error));},
    saveAdjustment,
    async loadRevisions(schoolId) {
      const id=normalizePlanningAdjustment({schoolId,month:1,equipmentCount:0,budgetUnits4:null}).schoolId;
      const revisions=query(collection(db,COLLECTION,id,REVISIONS),orderBy('revision','desc'));
      return (await getDocs(revisions)).docs.map(fromSnapshot);
    }
  };
}
