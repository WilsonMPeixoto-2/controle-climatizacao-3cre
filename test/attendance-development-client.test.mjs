import assert from 'node:assert/strict';
import { readAttendanceDevelopmentConfig, ATTENDANCE_DEVELOPMENT_PROJECT } from '../src/infrastructure/firebase/attendanceDevelopmentClient.js';

assert.equal(readAttendanceDevelopmentConfig({}), null);
assert.equal(readAttendanceDevelopmentConfig({ VITE_FIREBASE_PROJECT_ID: 'producao' }), null);
assert.deepEqual(readAttendanceDevelopmentConfig({ VITE_FINANCE_FIRESTORE_EMULATOR: '127.0.0.1:8082' }), {
  host: '127.0.0.1', port: 8082, projectId: ATTENDANCE_DEVELOPMENT_PROJECT
});
for (const address of ['firebase.example:8082', 'https://localhost:8082', 'localhost:0', 'localhost:65536', 'localhost']) {
  assert.throws(() => readAttendanceDevelopmentConfig({ VITE_FINANCE_FIRESTORE_EMULATOR: address }));
}
console.log('Etapa 1 | Cliente financeiro permanece isolado do projeto operacional e de destinos remotos.');
