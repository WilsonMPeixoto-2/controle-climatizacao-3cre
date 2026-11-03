import { createFirebaseClient, isFirebaseConfigured, readFirebaseConfig } from './firebaseClient.js';
import { createAttendancePersistence } from './attendancePersistence.js';

export const ATTENDANCE_DEVELOPMENT_PROJECT = 'demo-gop-clima-financeiro';

/**
 * DP-004: homologação sem login individual.
 * Usa o mesmo Firebase operacional já configurado no GOP Clima.
 * Apenas testes e desenvolvimento local podem escolher o emulador isolado.
 */
export function readAttendanceDevelopmentConfig(env = {}) {
  const address = env.VITE_FINANCE_FIRESTORE_EMULATOR?.trim();
  if (address) {
    const match = /^(127\.0\.0\.1|localhost):(\d{1,5})$/.exec(address);
    if (!match || Number(match[2]) < 1 || Number(match[2]) > 65535) {
      throw new Error('Configure o Firestore de testes em localhost:porta ou 127.0.0.1:porta.');
    }
    return { host: match[1], port: Number(match[2]), projectId: ATTENDANCE_DEVELOPMENT_PROJECT };
  }

  const firebaseConfig = readFirebaseConfig(env);
  return isFirebaseConfigured(firebaseConfig) ? { mode: 'cloud', firebaseConfig } : null;
}

export function createAttendanceDevelopmentClient(config) {
  if (config?.mode === 'cloud') {
    if (!isFirebaseConfigured(config.firebaseConfig)) {
      throw new Error('A configuração do Firebase financeiro está incompleta.');
    }
    // Reutiliza exatamente a instância nomeada do GOP Clima operacional.
    const { db } = createFirebaseClient(config.firebaseConfig);
    return createAttendancePersistence(db);
  }

  if (!config || config.projectId !== ATTENDANCE_DEVELOPMENT_PROJECT) {
    throw new Error('Configuração financeira inválida.');
  }
  const checked = readAttendanceDevelopmentConfig({
    VITE_FINANCE_FIRESTORE_EMULATOR: `${config.host}:${config.port}`
  });
  const { db } = createFirebaseClient({
    apiKey: 'demo-finance-development-key',
    appId: 'demo-finance-development-app',
    projectId: ATTENDANCE_DEVELOPMENT_PROJECT
  }, {
    appName: 'gop-clima-finance-development',
    useEmulator: true,
    emulatorHost: checked.host,
    emulatorPort: checked.port
  });
  return createAttendancePersistence(db);
}
