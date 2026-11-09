import assert from 'node:assert/strict';
import {createVerify,generateKeyPairSync} from 'node:crypto';
import {
  TARGET_PROJECT, signServiceAccountAssertion, validateRulesChange,
  collectDeclaredCollections
} from '../scripts/firebase-rules-rest-core.mjs';

const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const key=privateKey.export({type:'pkcs8',format:'pem'});
const serviceAccount={type:'service_account',project_id:TARGET_PROJECT,client_email:'test@example.iam.gserviceaccount.com',private_key:key};
const assertion=signServiceAccountAssertion(serviceAccount,1700000000000);
const pieces=assertion.split('.');
assert.equal(pieces.length,3);
const payload=JSON.parse(Buffer.from(pieces[1],'base64url').toString('utf8'));
assert.equal(payload.iss,serviceAccount.client_email);
assert.equal(payload.scope,'https://www.googleapis.com/auth/firebase');
assert.equal(payload.aud,'https://oauth2.googleapis.com/token');
assert.equal(payload.exp-payload.iat,3500);
const verifier=createVerify('RSA-SHA256');
verifier.update(pieces[0]+'.'+pieces[1]);
verifier.end();
assert.equal(verifier.verify(publicKey,Buffer.from(pieces[2],'base64url')),true);
assert.throws(()=>signServiceAccountAssertion({...serviceAccount,project_id:'outra-cre'},1700000000000),/Projeto/);
assert.throws(()=>signServiceAccountAssertion({...serviceAccount,private_key:'invalida'},1700000000000));
const common=['escolas','chamados','historico','contadores','atendimentos_economicos','programacao_visitas','ajustes_planejamento'];
const source=(names)=>"rules_version = '2';\nservice cloud.firestore { match /databases/{database}/documents {\n"+
  names.map(name=>'match /'+name+'/{id} {allow read: if true;}').join('\n')+
  '\nmatch /{document=**} {allow read, write: if false;}\n}}';
const all=source(common);
assert.equal(collectDeclaredCollections(all).has('ajustes_planejamento'),true);
assert.equal(validateRulesChange(all,source(common.slice(0,-1))).alreadyActive,false);
assert.equal(validateRulesChange(all,all).alreadyActive,true);
assert.throws(()=>validateRulesChange(source(common.slice(0,-1)),all),/ausentes/);
assert.throws(()=>validateRulesChange(source(['escolas']),source(['escolas','extra'])),/ausentes/);
assert.throws(()=>validateRulesChange(all.replace('service cloud.firestore','service cloud.storage'),all),/cloud.firestore/);
assert.throws(()=>validateRulesChange(all.replace("rules_version = '2'","rules_version = '1'"),all),/versão/);
assert.throws(()=>validateRulesChange(all.replace('allow read, write: if false;','allow read, write: if true;'),all),/negação final/);
console.log('Deploy Firestore REST: assinatura JWT, alvo estrito, preservação de coleções, sem alterações desnecessárias PASS.');
