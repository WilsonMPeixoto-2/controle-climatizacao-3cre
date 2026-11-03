import { useCallback, useEffect, useState } from 'react';
import {
  createAttendanceDevelopmentClient, readAttendanceDevelopmentConfig
} from '../infrastructure/firebase/attendanceDevelopmentClient.js';

function getSessionId() {
  const key = 'gop_finance_development_session';
  try {
    let sessionId = sessionStorage.getItem(key);
    if (!sessionId) {
      sessionId = `dev-${crypto.randomUUID()}`;
      sessionStorage.setItem(key, sessionId);
    }
    return sessionId;
  } catch {
    return `dev-${crypto.randomUUID()}`;
  }
}

export default function useAttendanceDevelopment() {
  const [setup] = useState(() => {
    try {
      const config = readAttendanceDevelopmentConfig(import.meta.env);
      return { gateway: config ? createAttendanceDevelopmentClient(config) : null, error: '' };
    } catch (error) {
      return { gateway: null, error: error.message };
    }
  });
  const [sessionId] = useState(getSessionId);
  const [records, setRecords] = useState([]);
  const [connection, setConnection] = useState(() => ({
    status: setup.error ? 'error' : setup.gateway ? 'connecting' : 'unconfigured', error: setup.error
  }));

  useEffect(() => {
    if (!setup.gateway) return undefined;
    return setup.gateway.subscribeAttendances({
      onData(rows) {
        setRecords(rows);
        setConnection({ status: 'ready', error: '' });
      },
      onError(error) {
        setConnection({ status: 'error', error: error.message });
      }
    });
  }, [setup]);

  const onSave = useCallback(async (content, options) => {
    if (!setup.gateway) throw new Error('O Firestore financeiro não está conectado.');
    return setup.gateway.saveAttendance({ ...content, sessionId }, options);
  }, [setup, sessionId]);

  const loadRevisions = useCallback(async id => {
    if (!setup.gateway) throw new Error('O Firestore financeiro não está conectado.');
    return setup.gateway.loadAttendanceRevisions(id);
  }, [setup]);

  return { records, connection, onSave, loadRevisions };
}
