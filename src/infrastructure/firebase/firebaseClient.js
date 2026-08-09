import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const emulatorConnections = new WeakSet();

export function readFirebaseConfig(env = import.meta.env || {}) {
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''
  };
}

export function isFirebaseConfigured(config) {
  return Boolean(config?.apiKey && config?.projectId && config?.appId);
}

export function createFirebaseClient(
  config,
  {
    appName = 'controle-climatizacao-3cre',
    useEmulator = false,
    emulatorHost = '127.0.0.1',
    emulatorPort = 8080
  } = {}
) {
  if (!isFirebaseConfigured(config)) {
    throw new Error('Configuração Firebase incompleta. Informe apiKey, projectId e appId.');
  }

  const existing = getApps().find((candidate) => candidate.name === appName);
  const app = existing ? getApp(appName) : initializeApp(config, appName);
  const db = getFirestore(app);

  if (useEmulator && !emulatorConnections.has(db)) {
    connectFirestoreEmulator(db, emulatorHost, emulatorPort);
    emulatorConnections.add(db);
  }

  return { app, db };
}
