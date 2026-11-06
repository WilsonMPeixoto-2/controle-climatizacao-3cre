import {useCallback, useEffect, useState} from 'react';
import {ATTENDANCE_DEVELOPMENT_PROJECT,readAttendanceDevelopmentConfig} from '../infrastructure/firebase/attendanceDevelopmentClient.js';
import {createFirebaseClient} from '../infrastructure/firebase/firebaseClient.js';
import {createPlanningPersistence} from '../infrastructure/firebase/planningPersistence.js';

function sessionId() {
  try {
    const key='gop_planning_session';
    const existing=sessionStorage.getItem(key);
    if(existing) return existing;
    const created='planejamento-'+crypto.randomUUID();
    sessionStorage.setItem(key,created);
    return created;
  } catch { return 'planejamento-'+crypto.randomUUID(); }
}
function createGateway(env) {
  const config=readAttendanceDevelopmentConfig(env);
  if(!config) return null;
  if(config.mode==='cloud') return createPlanningPersistence(createFirebaseClient(config.firebaseConfig).db);
  const {db}=createFirebaseClient({
    apiKey:'demo-finance-development-key',projectId:ATTENDANCE_DEVELOPMENT_PROJECT,appId:'demo-finance-development-app'
  },{appName:'gop-clima-finance-development',useEmulator:true,emulatorHost:config.host,emulatorPort:config.port});
  return createPlanningPersistence(db);
}

/** Retorna os ajustes publicados, não o planejamento-base incorporado ao código. */
export default function usePlanningAdjustments() {
  const [setup]=useState(()=>{
    try{return {gateway:createGateway(import.meta.env),error:''};}
    catch(error){return {gateway:null,error:error.message};}
  });
  const [records,setRecords]=useState([]);
  const [session]=useState(sessionId);
  const [connection,setConnection]=useState(()=>({
    status:setup.error?'error':setup.gateway?'connecting':'unconfigured',
    error:setup.error
  }));
  useEffect(()=>{
    if(!setup.gateway) return undefined;
    return setup.gateway.subscribe({
      onData:items=>{setRecords(items);setConnection({status:'ready',error:''});},
      onError:error=>setConnection({status:'error',error:error.message})
    });
  },[setup]);
  const onSave=useCallback((row,expectedRevision)=>{
    if(!setup.gateway) throw new Error('Sem conexão de planejamento compartilhado.');
    if(connection.status!=='ready') throw new Error('Planejamento indisponível. Nenhuma alteração foi gravada.');
    return setup.gateway.saveAdjustment(row,{expectedRevision,sessionId:session});
  },[setup,session,connection.status]);
  return {records,connection,onSave};
}
