import {createHash,createSign} from 'node:crypto';

export const TARGET_PROJECT='gestao-da-climatizacao-3-cre';
const REQUIRED_COLLECTIONS=[
  'escolas','chamados','historico','contadores',
  'atendimentos_economicos','programacao_visitas','ajustes_planejamento'
];
export const digest = value => createHash('sha256').update(value,'utf8').digest('hex');

export function collectDeclaredCollections(source) {
  if(typeof source!=='string') throw new TypeError('Fonte de regras ausente.');
  return new Set([...source.matchAll(/match\s+\/([A-Za-z_][A-Za-z0-9_-]*)\/\{/g)].map(match=>match[1]));
}

export function validateRulesChange(proposed, active) {
  if(typeof proposed!=='string'||!proposed.includes("rules_version = '2'")) {
    throw new Error('O arquivo exige regras Firestore versão 2.');
  }
  if(!proposed.includes('service cloud.firestore')) throw new Error('Fonte sem cloud.firestore.');
  if(!/match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;/.test(proposed)) {
    throw new Error('O arquivo não preservou a negação final de acesso.');
  }
  if(Buffer.byteLength(proposed,'utf8')>=256*1024) throw new Error('Regras excedem limite Firebase 256 KiB.');
  const wanted=collectDeclaredCollections(proposed);
  const missing=REQUIRED_COLLECTIONS.filter(section=>!wanted.has(section));
  if(missing.length) throw new Error('Coleções obrigatórias ausentes: '+missing.join(', '));
  if(typeof active!=='string'||!active.includes('service cloud.firestore')) {
    throw new Error('Não foi possível examinar as regras atuais do Firebase.');
  }
  const old=collectDeclaredCollections(active);
  const lost=[...old].filter(section=>!wanted.has(section));
  if(lost.length) throw new Error('Coleções existentes ausentes da nova versão: '+lost.join(', '));
  return {alreadyActive:proposed.trim()===active.trim(),
    previousHash:digest(active),nextHash:digest(proposed),
    collectionCount:wanted.size};
}

export function signServiceAccountAssertion(credentials,nowMs=Date.now()) {
  if(credentials?.project_id!==TARGET_PROJECT) throw new Error('Projeto Firebase inesperado na credencial.');
  if(credentials?.type!=='service_account'||typeof credentials?.private_key!=='string'
    ||!credentials.client_email?.endsWith('.gserviceaccount.com')) {
    throw new Error('Credencial de conta de serviço inválida.');
  }
  const now=Math.floor(nowMs/1000);
  const header=Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT'})).toString('base64url');
  const claims=Buffer.from(JSON.stringify({
    iss:credentials.client_email,
    scope:'https://www.googleapis.com/auth/firebase',
    aud:'https://oauth2.googleapis.com/token',
    iat:now,exp:now+3500
  })).toString('base64url');
  const message=header+'.'+claims;
  const signer=createSign('RSA-SHA256');
  signer.update(message);
  signer.end();
  return message+'.'+signer.sign(credentials.private_key).toString('base64url');
}
