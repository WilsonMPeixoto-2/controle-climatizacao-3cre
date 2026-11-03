import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { attendanceSchools, attendanceTickets } from '../test/fixtures/attendance-development.mjs';

const PROJECT_ID = 'demo-gop-clima-financeiro';

/** Bootstrap limitado ao emulador; não contém credenciais nem admite destino de produção. */
export async function seedAttendanceDevelopment({ synthetic = false, reset = false } = {}) {
  const address = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8082';
  if (!/^(localhost|127\.0\.0\.1):8082$/.test(address)) {
    throw new Error('O seed financeiro só pode usar o emulador local na porta 8082.');
  }
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID, firestore: { host: address.split(':')[0], port: 8082 }
  });
  try {
    if (reset) {
      if (!synthetic) throw new Error('Limpeza permitida apenas para fixtures sintéticas de teste.');
      await testEnv.clearFirestore();
    }
    const local = synthetic ? null : JSON.parse(fs.readFileSync(new URL('../src/data/db.json', import.meta.url), 'utf8'));
    const schools = synthetic ? attendanceSchools : local.escolas;
    const tickets = synthetic ? attendanceTickets : local.chamados;
    const schoolIds = new Set(schools.map(school => String(school.designacao)));
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await Promise.all(schools.map(school => setDoc(doc(db, 'escolas', String(school.designacao)), {
        designacao: String(school.designacao), unidade_escolar: school.unidade_escolar
      })));
      await Promise.all(tickets.filter(ticket => ticket.id_chamado && schoolIds.has(String(ticket.designacao)))
        .map(ticket => setDoc(doc(db, 'chamados', ticket.id_chamado), {
          id_chamado: ticket.id_chamado, designacao: String(ticket.designacao), unidade_escolar: ticket.unidade_escolar
        })));
    });
  } finally { await testEnv.cleanup(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await seedAttendanceDevelopment({ synthetic: process.argv.includes('--synthetic') });
  console.log('Vínculos de desenvolvimento carregados no emulador financeiro isolado.');
}
