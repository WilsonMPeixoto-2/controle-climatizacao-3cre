import assert from 'node:assert/strict';
import {
  readAttendanceDevelopmentConfig,
  ATTENDANCE_DEVELOPMENT_PROJECT
} from '../src/infrastructure/firebase/attendanceDevelopmentClient.js';

// Sem configuração operacional nem emulador: não se fabricam credenciais.
assert.equal(readAttendanceDevelopmentConfig({}), null);
assert.equal(readAttendanceDevelopmentConfig({ VITE_FIREBASE_PROJECT_ID: 'gop-real' }), null);

const cloudEnv = {
  VITE_FIREBASE_API_KEY: 'public-web-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'gop-real.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'gop-real',
  VITE_FIREBASE_APP_ID: '1:123:web:abc',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123'
};

// A conexão financeira deve reutilizar exatamente o projeto operacional.
assert.deepEqual(readAttendanceDevelopmentConfig(cloudEnv), {
  mode: 'cloud',
  firebaseConfig: {
    apiKey: 'public-web-key',
    authDomain: 'gop-real.firebaseapp.com',
    projectId: 'gop-real',
    appId: '1:123:web:abc',
    messagingSenderId: '123'
  }
});

// Testes locais preexistentes continuam isolados do Firestore remoto.
assert.deepEqual(readAttendanceDevelopmentConfig({
  ...cloudEnv,
  VITE_FINANCE_FIRESTORE_EMULATOR: '127.0.0.1:8082'
}), { host: '127.0.0.1', port: 8082, projectId: ATTENDANCE_DEVELOPMENT_PROJECT });

for (const address of ['firebase.example:8082', 'https://localhost:8082', 'localhost:0', 'localhost:65536', 'localhost']) {
  assert.throws(() => readAttendanceDevelopmentConfig({
    ...cloudEnv, VITE_FINANCE_FIRESTORE_EMULATOR: address
  }));
}

console.log('Cliente financeiro: Firestore operacional por padrão; emulador isolado apenas em testes locais.');
