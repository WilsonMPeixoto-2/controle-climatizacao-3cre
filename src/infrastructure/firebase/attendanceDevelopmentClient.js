import { createFirebaseClient } from './firebaseClient.js';
import { createAttendancePersistence } from './attendancePersistence.js';

export const ATTENDANCE_DEVELOPMENT_PROJECT = 'demo-gop-clima-financeiro';

/** DP-004: conexão separada, exclusivamente com emulador local; nunca usa o projeto operacional. */
export function readAttendanceDevelopmentConfig(env = {}) {
  const address = env.VITE_FINANCE_FIRESTORE_EMULATOR?.trim();
  if (!address) return null;
  const match = /^(127\.0\.0\.1|localhost):(\d{1,5})$/.exec(address);
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 65535) {
    throw new Error('Configure o Firestore de desenvolvimento em localhost:porta ou 127.0.0.1:porta.');
  }
  return { host: match[1], port: Number(match[2]), projectId: ATTENDANCE_DEVELOPMENT_PROJECT };
}

export function createAttendanceDevelopmentClient(config) {
  if (!config || config.projectId !== ATTENDANCE_DEVELOPMENT_PROJECT) {
    throw new Error('Projeto de desenvolvimento financeiro inválido.');
  }
  const checked = readAttendanceDevelopmentConfig({ VITE_FINANCE_FIRESTORE_EMULATOR: `${config.host}:${config.port}` });
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
