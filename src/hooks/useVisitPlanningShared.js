import { useCallback, useEffect, useState } from 'react';
import {
  ATTENDANCE_DEVELOPMENT_PROJECT, readAttendanceDevelopmentConfig
} from '../infrastructure/firebase/attendanceDevelopmentClient.js';
import { createFirebaseClient } from '../infrastructure/firebase/firebaseClient.js';
import { createVisitPlanningPersistence } from '../infrastructure/firebase/visitPlanningPersistence.js';

function visitSession() {
  try {
    const key = 'gop_visit_development_session';
    let value = sessionStorage.getItem(key);
    if (!value) {
      value = 'visita-' + crypto.randomUUID();
      sessionStorage.setItem(key, value);
    }
    return value;
  } catch {
    return 'visita-' + crypto.randomUUID();
  }
}

/** O mesmo Firestore do GOP Clima; emulador somente quando configurado. */
function makeSetup(env) {
  const config = readAttendanceDevelopmentConfig(env);
  if (!config) return { gateway: null, error: '' };
  if (config.mode === 'cloud') {
    return { gateway: createVisitPlanningPersistence(createFirebaseClient(config.firebaseConfig).db), error: '' };
  }
  const { db } = createFirebaseClient({
    apiKey: 'demo-finance-development-key',
    projectId: ATTENDANCE_DEVELOPMENT_PROJECT,
    appId: 'demo-finance-development-app'
  }, {
    appName: 'gop-clima-finance-development',
    useEmulator: true, emulatorHost: config.host, emulatorPort: config.port
  });
  return { gateway: createVisitPlanningPersistence(db), error: '' };
}

export default function useVisitPlanningShared() {
  const [setup] = useState(() => {
    try { return makeSetup(import.meta.env); }
    catch (error) { return { gateway: null, error: error.message }; }
  });
  const [sessionId] = useState(visitSession);
  const [records, setRecords] = useState([]);
  const [connection, setConnection] = useState(() => ({
    status: setup.error ? 'error' : setup.gateway ? 'connecting' : 'unconfigured',
    error: setup.error
  }));

  useEffect(() => {
    if (!setup.gateway) return undefined;
    return setup.gateway.subscribeVisits({
      onData: next => {
        setRecords(next);
        setConnection({ status: 'ready', error: '' });
      },
      onError: error => setConnection({ status: 'error', error: error.message })
    });
  }, [setup]);

  const onSave = useCallback((row, options) => {
    if (!setup.gateway) throw new Error('A programação compartilhada não está conectada.');
    return setup.gateway.saveVisit(row, { ...options, sessionId });
  }, [setup, sessionId]);

  const onArchive = useCallback((id, options) => {
    if (!setup.gateway) throw new Error('A programação compartilhada não está conectada.');
    return setup.gateway.archiveVisit(id, { ...options, sessionId });
  }, [setup, sessionId]);

  return { records, connection, onSave, onArchive };
}
