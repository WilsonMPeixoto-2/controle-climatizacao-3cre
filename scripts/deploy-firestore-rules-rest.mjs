/**
 * Publicação controlada das Security Rules pela API oficial do Firebase.
 * Não consulta Service Usage, não modifica dados Firestore e não recebe credenciais
 * como argumentos. O segredo permanece em arquivo temporário do GitHub Actions.
 *
 * node scripts/deploy-firestore-rules-rest.mjs --inspect | --publish
 */
import {readFile} from 'node:fs/promises';
import {TARGET_PROJECT,digest,signServiceAccountAssertion,validateRulesChange} from './firebase-rules-rest-core.mjs';

const mode=process.argv[2];
if(!['--inspect','--publish'].includes(mode)) throw new Error('Use --inspect ou --publish.');
const file=process.env.GOOGLE_APPLICATION_CREDENTIALS;
if(!file) throw new Error('GOOGLE_APPLICATION_CREDENTIALS não configurado.');
const creds=JSON.parse(await readFile(file,'utf8'));
const proposed=await readFile(new URL('../firestore.rules',import.meta.url),'utf8');
const firebaseConfig=JSON.parse(await readFile(new URL('../.firebaserc',import.meta.url),'utf8'));
if(firebaseConfig.projects?.default!==TARGET_PROJECT) throw new Error('Projeto inesperado na .firebaserc.');
const assertion=signServiceAccountAssertion(creds);
const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{
  method:'POST',signal:AbortSignal.timeout(30000),
  headers:{'content-type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({
    grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  })
});
const tokenBody=await tokenResponse.json();
if(!tokenResponse.ok||typeof tokenBody.access_token!=='string'){
  throw new Error('Falha ao autenticar a conta de serviço Google. HTTP '+tokenResponse.status+
    ': '+String(tokenBody.error_description||tokenBody.error||'sem detalhes').slice(0,250));
}
const api='https://firebaserules.googleapis.com/v1/';
async function request(method,path,data){
  const response=await fetch(api+path,{
    method,signal:AbortSignal.timeout(45000),
    headers:{'authorization':'Bearer '+tokenBody.access_token,
      'content-type':'application/json'},
    ...(data?{body:JSON.stringify(data)}:{})
  });
  const raw=await response.text();
  let result;
  try{result=JSON.parse(raw)}catch{result={error:{message:'Resposta não JSON'}}}
  if(!response.ok){
    const message=String(result?.error?.message||'sem detalhes').slice(0,500);
    throw new Error('Firebase Rules API '+method+' '+path.split('?')[0]+
      ': HTTP '+response.status+' '+message);
  }
  return result;
}

const releasePath='projects/'+TARGET_PROJECT+'/releases/cloud.firestore';
const release=await request('GET',releasePath);
if(!release.name||!release.rulesetName?.startsWith('projects/'+TARGET_PROJECT+'/rulesets/')){
  throw new Error('Release ativo de Firestore não identificado com segurança.');
}
const previousRuleset=await request('GET',release.rulesetName);
const active=(previousRuleset?.source?.files||[]).map(item=>item.content||'').join('\n');
const validation=validateRulesChange(proposed,active);
console.log('Firebase project: '+TARGET_PROJECT+'; release atual: '+release.name);
console.log('Snapshot anterior preservado: '+release.rulesetName);
console.log('SHA256 atual: '+validation.previousHash+'; pretendido: '+validation.nextHash+
  '; coleções mantidas: '+validation.collectionCount);
if(validation.alreadyActive){
  console.log('FIREBASE RULES VERIFIED: já estão publicadas, nenhuma mudança necessária.');
  process.exit(0);
}
if(mode==='--inspect'){
  console.log('INSPECT ONLY: existem diferenças; nenhuma regra foi publicada.');
  process.exit(0);
}
const created=await request('POST','projects/'+TARGET_PROJECT+'/rulesets',{
  source:{files:[{name:'firestore.rules',content:proposed}]}
});
if(!created?.name?.startsWith('projects/'+TARGET_PROJECT+'/rulesets/')){
  throw new Error('API não confirmou a criação do ruleset; não será atualizado o release.');
}
console.log('Ruleset validado e armazenado: '+created.name);
const updated=await request('PATCH',releasePath,{
  release:{name:release.name,rulesetName:created.name},
  updateMask:'rulesetName'
});
if(updated.rulesetName!==created.name) throw new Error('PATCH não retornou o ruleset esperado.');
const verifiedRelease=await request('GET',releasePath);
if(verifiedRelease.rulesetName!==created.name){
  throw new Error('Verificação do release não confirmou o novo ruleset.');
}
const verifiedRuleset=await request('GET',created.name);
const verifiedContent=(verifiedRuleset?.source?.files||[]).map(item=>item.content||'').join('\n');
if(digest(verifiedContent)!==digest(proposed)){
  throw new Error('Conteúdo do ruleset publicado difere do arquivo de origem.');
}
console.log('FIREBASE RULES DEPLOYED AND VERIFIED: '+created.name);
console.log('Release: '+verifiedRelease.name+'; SHA256: '+digest(verifiedContent));
console.log('As regras podem levar alguns minutos para propagação. O deploy não alterou documentos do banco.');
