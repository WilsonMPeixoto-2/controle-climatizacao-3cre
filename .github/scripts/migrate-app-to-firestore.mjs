import fs from 'node:fs';

const appPath = 'src/App.jsx';
let source = fs.readFileSync(appPath, 'utf8');

function replaceExact(label, from, to) {
  if (!source.includes(from)) {
    throw new Error(`[${label}] bloco esperado não encontrado.`);
  }
  source = source.replace(from, to);
}

function replaceRegex(label, pattern, replacement) {
  const matches = [...source.matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`))];
  if (matches.length !== 1) {
    throw new Error(`[${label}] esperado 1 bloco, encontrados ${matches.length}.`);
  }
  source = source.replace(pattern, replacement);
}

function replaceBetween(label, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`[${label}] marcador inicial não encontrado.`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`[${label}] marcador final não encontrado.`);
  source = source.slice(0, start) + replacement + source.slice(end);
}

replaceExact(
  'remove createClient',
  "import { createClient } from '@supabase/supabase-js';\n",
  ''
);

replaceRegex(
  'replace Supabase/attachment imports',
  /import \{\n  uploadTicketAttachment,[\s\S]*?\} from '\.\/services\/chamadosService\.js';\n/,
  `import {\n  readFirebaseConfig,\n  isFirebaseConfigured,\n  createFirebaseClient\n} from './infrastructure/firebase/firebaseClient.js';\nimport { createFirestorePersistence } from './infrastructure/firebase/firestorePersistence.js';\n`
);

replaceExact(
  'initial local datasets',
  `const initialTickets = dbData?.chamados || [];\nconst initialSchools = dbData?.escolas || [];\nconst initialHistory = dbData?.historico || [];\nconst initialEmailTemplates = dbData?.modelos_email || [];\nconst initialSelectedSchool = null;`,
  `const initialTickets = dbData?.chamados || [];\nconst initialSchools = dbData?.escolas || [];\nconst initialHistory = (dbData?.historico || []).filter(\n  (event) => !/^EV-TEST-/i.test(String(event?.id_evento || ''))\n);\nconst initialEmailTemplates = dbData?.modelos_email || [];\nconst initialAttachments = dbData?.anexos_chamado || [];\nconst initialSelectedSchool = null;`
);

replaceExact(
  'initial Firebase config',
  `  const [initialCloudConfig] = useState(() => ({\n    url: import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || '',\n    key: import.meta.env.VITE_SUPABASE_KEY || localStorage.getItem('supabase_key') || ''\n  }));\n\n  // App states — isInitialLoad só inicia como true quando há credenciais de nuvem disponíveis\n  const [isInitialLoad, setIsInitialLoad] = useState(() => !!(initialCloudConfig.url && initialCloudConfig.key));`,
  `  const [initialCloudConfig] = useState(() => readFirebaseConfig(import.meta.env));\n  const firebaseConfigured = isFirebaseConfigured(initialCloudConfig);\n\n  // App states — a carga online só inicia quando o Firebase está configurado no ambiente.\n  const [isInitialLoad, setIsInitialLoad] = useState(() => firebaseConfigured);`
);

replaceExact(
  'cloud state',
  `  // Cloud (Supabase) integration states\n  const [supabaseUrl, setSupabaseUrl] = useState(initialCloudConfig.url);\n  const [supabaseKey, setSupabaseKey] = useState(initialCloudConfig.key);\n  const [cloudConnected, setCloudConnected] = useState(false);\n  const [syncStatusText, setSyncStatusText] = useState('Local (db.json)');\n  const [cloudLoading, setCloudLoading] = useState(false);\n  const [supabaseClient, setSupabaseClient] = useState(null);\n\n  // Estados de controle para arquivos e uploads reais\n  const [ticketAttachments, setTicketAttachments] = useState([]);\n  const [schoolAttachments, setSchoolAttachments] = useState([]);\n  const [isAttachmentPending, setAttachmentUploading] = useState(false);\n  const [allAttachments, setAllAttachments] = useState([]);`,
  `  // Persistência online desacoplada da UI. Nesta fase, o provider ativo é Cloud Firestore.\n  const [cloudConnected, setCloudConnected] = useState(false);\n  const [syncStatusText, setSyncStatusText] = useState('Local (db.json)');\n  const [cloudLoading, setCloudLoading] = useState(false);\n  const [persistence, setPersistence] = useState(null);\n\n  // Anexos permanecem como metadados legados nesta fase Spark; upload/Storage está adiado.\n  const [ticketAttachments, setTicketAttachments] = useState([]);\n  const [schoolAttachments, setSchoolAttachments] = useState([]);\n  const [allAttachments, setAllAttachments] = useState(initialAttachments);`
);

replaceBetween(
  'attachment data handlers',
  '  // Carrega anexos consolidados da escola de forma reativa\n',
  '  // 2. Initialize Supabase Connection\n',
  `  // Anexos são preservados apenas como metadados legados durante a fase Firestore Spark.\n  useEffect(() => {\n    if (!selectedSchool?.designacao) {\n      setSchoolAttachments([]);\n      return;\n    }\n    setSchoolAttachments(\n      allAttachments.filter((attachment) => attachment.designacao === selectedSchool.designacao)\n    );\n  }, [selectedSchool, allAttachments]);\n\n`
);

replaceBetween(
  'cloud initialization and realtime',
  '  // 2. Initialize Supabase Connection\n',
  '  // Date Formatting Helpers — delega ao módulo de lógica (fonte única da verdade)\n',
  `  // Inicializa o Firebase/Firestore a partir das variáveis de ambiente do deploy.\n  const initializeFirebase = async () => {\n    setCloudLoading(true);\n    setIsInitialLoad(true);\n    setSyncStatusText('Conectando ao Firestore...');\n\n    try {\n      if (!isFirebaseConfigured(initialCloudConfig)) {\n        throw new Error('Configuração Firebase ausente ou incompleta.');\n      }\n\n      const { db } = createFirebaseClient(initialCloudConfig);\n      const gateway = createFirestorePersistence(db);\n      const onlineData = await gateway.loadInitialData();\n\n      setPersistence(gateway);\n      setCloudConnected(true);\n      setSyncStatusText('Cloud Firestore ativo');\n      setSchools(onlineData.schools);\n      setTickets(onlineData.tickets);\n      setHistory(onlineData.history);\n      setEmailTemplates(onlineData.emailTemplates);\n      setAllAttachments(initialAttachments);\n      setCustomEmailBody(\n        buildEmailDraft(onlineData.emailTemplates, onlineData.tickets, '', 0)\n      );\n      triggerToast('Base Firestore carregada com sucesso!', 'success');\n    } catch (err) {\n      console.error('Firebase/Firestore connection error:', err);\n      setPersistence(null);\n      setCloudConnected(false);\n      setSyncStatusText('Firestore indisponível — modo local');\n      triggerToast('Base online indisponível. O sistema continua em modo local.', 'info');\n    } finally {\n      setCloudLoading(false);\n      setIsInitialLoad(false);\n    }\n  };\n\n  // Conexão inicial: local db.json continua sendo o fallback imediato.\n  useEffect(() => {\n    if (!firebaseConfigured) {\n      setIsInitialLoad(false);\n      setSyncStatusText('Local (Firebase não configurado)');\n      return undefined;\n    }\n\n    const timer = window.setTimeout(() => {\n      initializeFirebase();\n    }, 0);\n    return () => window.clearTimeout(timer);\n    // Configuração é imutável durante a sessão e vem do ambiente de build.\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [firebaseConfigured]);\n\n  // Firestore entrega os snapshots diretamente; não há refetch integral a cada evento.\n  useEffect(() => {\n    if (!persistence || !cloudConnected) return undefined;\n    return persistence.subscribeOperationalData({\n      onTickets: setTickets,\n      onHistory: setHistory,\n      onError: (err) => console.error('Realtime Firestore:', err)\n    });\n  }, [persistence, cloudConnected]);\n\n  const handleConnectCloud = () => {\n    if (!firebaseConfigured) {\n      triggerToast(\n        'Firebase ainda não está configurado no ambiente deste deploy. Consulte a documentação técnica.',\n        'info'\n      );\n      return;\n    }\n    initializeFirebase();\n  };\n\n  const handleDisconnectCloud = () => {\n    setCloudConnected(false);\n    setPersistence(null);\n    setSyncStatusText('Local (db.json)');\n\n    const normalized = initialTickets.map((ticket) => ({\n      ...ticket,\n      setor_responsavel: normalizeSector(ticket.setor_responsavel)\n    }));\n    setTickets(normalized);\n    setSchools(initialSchools);\n    setHistory(initialHistory);\n    setEmailTemplates(initialEmailTemplates);\n    setAllAttachments(initialAttachments);\n    triggerToast('Modo local ativado para esta sessão.', 'info');\n  };\n\n  // Date Formatting Helpers — delega ao módulo de lógica (fonte única da verdade)\n`
);

replaceRegex(
  'open ticket attachments',
  /  const openTicketEdit = async \(ticket\) => \{[\s\S]*?\n  \};\n\n  const goToCommunicationForTicket/,
  `  const openTicketEdit = (ticket) => {\n    setEditingTicket({ ...ticket });\n    setShowEditModal(true);\n    setTicketAttachments(\n      allAttachments.filter((attachment) => attachment.id_chamado === ticket.id_chamado)\n    );\n  };\n\n  const goToCommunicationForTicket`
);

// A partir daqui, a UI usa apenas o contrato neutro de persistência para operações online.
source = source.replaceAll('supabaseClient', 'persistence');
source = source.replaceAll('Supabase', 'Firestore');
source = source.replaceAll('supabase', 'firestore');

replaceExact(
  'school history persistence method',
  '        await insertHistoryEvent(persistence, newHistoryEvent);',
  '        await persistence.insertHistoryEvent(newHistoryEvent);'
);
replaceExact(
  'ticket history persistence method',
  '      const savedEvent = await insertHistoryEvent(persistence, newEvent);',
  '      const savedEvent = await persistence.insertHistoryEvent(newEvent);'
);
replaceRegex(
  'ticket update persistence method',
  /const savedTicket = await updateTicketWithHistory\(\s*persistence,\s*updatedRecord,\s*novosEventos\s*\);/,
  'const savedTicket = await persistence.updateTicketWithHistory(updatedRecord, novosEventos);'
);
replaceRegex(
  'ticket create persistence method',
  /const result = await createTicketWithHistory\(\s*persistence,\s*ticketRecord,\s*initialEvent\s*\);/,
  'const result = await persistence.createTicketWithHistory(ticketRecord, initialEvent);'
);

replaceBetween(
  'offline draft id',
  '      // Fallback offline: cria ID local apenas quando NÃO há conexão Firestore\n',
  '      // Atualiza o estado local consolidando os registros reais finais\n',
  `      // Offline nunca recebe número oficial: evita colisões entre dispositivos desconectados.\n      if (!persistence) {\n        const generatedId = \`RASCUNHO-\${crypto.randomUUID()}\`;\n\n        finalTicketRecord = {\n          id_chamado: generatedId,\n          ...ticketRecord\n        };\n\n        finalEventRecord = {\n          id_evento: \`EV-\${crypto.randomUUID()}\`,\n          data: nowIso,\n          id_chamado: generatedId,\n          designacao: formSelectedSchool.designacao,\n          unidade_escolar: formSelectedSchool.unidade_escolar,\n          marco_relevante: newTicket.status_atual,\n          setor: 'GOP',\n          responsavel_registro: 'GOP / Sistema',\n          observacao: \`Rascunho local. Demanda cadastrada para o local: \${newTicket.local_demanda}. O número oficial será atribuído somente após gravação online.\`\n        };\n      }\n\n`
);

replaceExact(
  'offline creation message',
  `        persistence\n          ? 'Chamado criado com sucesso na nuvem!'\n          : 'Chamado criado em modo offline — salvo neste dispositivo.',`,
  `        persistence\n          ? 'Chamado criado com sucesso no Firestore!'\n          : 'Rascunho local criado neste dispositivo. O número oficial será atribuído somente online.',`
);

// Evidências na ficha da escola permanecem catalogadas, mas sem ações de Storage nesta fase.
replaceRegex(
  'school attachment actions',
  /                              <div className="no-print" style=\{\{ display: 'flex', gap: '6px' \}\}>[\s\S]*?                              <\/div>\n                            <\/div>\n                          \)\)\}/,
  `                              <div className="no-print" style={{ display: 'flex', gap: '6px' }}>\n                                <span\n                                  style={{\n                                    fontSize: '11px',\n                                    fontWeight: '800',\n                                    padding: '4px 8px',\n                                    borderRadius: '99px',\n                                    color: 'var(--color-orange)',\n                                    border: '1px solid var(--border-color)'\n                                  }}\n                                  title="Arquivo legado preservado; Storage será reativado em fase futura."\n                                >\n                                  Arquivo legado · acesso adiado\n                                </span>\n                              </div>\n                            </div>\n                          ))}`
);

// Substitui a seção de anexos do chamado por visualização de metadados sem upload/download.
{
  const startMarker = '                  {/* Seção de Anexos do Chamado */}';
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error('[ticket attachment section] início não encontrado.');
  const titleText = '                    ⏳ Linha de Tempo do Chamado';
  const titlePos = source.indexOf(titleText, start);
  if (titlePos < 0) throw new Error('[ticket attachment section] título da timeline não encontrado.');
  const end = source.lastIndexOf('                  <h4', titlePos);
  if (end < start) throw new Error('[ticket attachment section] fim não encontrado.');

  const replacement = `                  {/* Anexos: metadados legados preservados; Storage adiado na fase Spark. */}\n                  <h4\n                    style={{\n                      fontSize: '13px',\n                      fontWeight: '800',\n                      color: 'var(--primary)',\n                      marginBottom: '16px',\n                      borderBottom: '1px solid var(--border-color)',\n                      paddingBottom: '6px',\n                      textTransform: 'uppercase',\n                      letterSpacing: '0.3px'\n                    }}\n                  >\n                    📎 Documentos do chamado ({ticketAttachments.length})\n                  </h4>\n                  <div\n                    style={{\n                      padding: '16px',\n                      borderRadius: 'var(--radius-xs)',\n                      backgroundColor: 'var(--bg-app)',\n                      border: '1px solid var(--border-color)',\n                      marginBottom: '20px'\n                    }}\n                  >\n                    <div\n                      style={{\n                        fontSize: '12px',\n                        color: 'var(--color-orange)',\n                        fontWeight: '700',\n                        marginBottom: ticketAttachments.length ? '12px' : 0\n                      }}\n                    >\n                      Upload, abertura, download e exclusão estão temporariamente indisponíveis na fase Firestore Spark. Os metadados existentes foram preservados para migração futura do Storage.\n                    </div>\n                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>\n                      {ticketAttachments.map((anexo) => (\n                        <div\n                          key={anexo.id}\n                          style={{\n                            display: 'flex',\n                            justifyContent: 'space-between',\n                            alignItems: 'center',\n                            gap: '12px',\n                            padding: '10px 12px',\n                            borderRadius: 'var(--radius-xs)',\n                            border: '1px solid var(--border-color)',\n                            backgroundColor: 'var(--bg-card)'\n                          }}\n                        >\n                          <div>\n                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>\n                              {anexo.nome_original}\n                            </div>\n                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>\n                              {anexo.tamanho_bytes ? \`\${(anexo.tamanho_bytes / 1024).toFixed(1)} KB · \` : ''}\n                              {formatDateBrazilian(anexo.criado_em)}\n                            </div>\n                          </div>\n                          <span style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--color-orange)' }}>\n                            LEGADO\n                          </span>\n                        </div>\n                      ))}\n                    </div>\n                  </div>\n\n`;
  source = source.slice(0, start) + replacement + source.slice(end);
}

// A aba técnica deixa de solicitar credenciais no navegador e passa a refletir o ambiente Vercel/Firebase.
replaceBetween(
  'cloud tab',
  '        {/* Configuração da base online */}\n',
  '      </main>\n',
  `        {/* Configuração da base online */}\n        {currentTab === 'cloud' && (\n          <div className="dashboard-section" style={{ maxWidth: '750px', margin: '0 auto' }}>\n            <div\n              className="section-header"\n              style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}\n            >\n              <div>\n                <h3>\n                  <IconDatabase /> Administração dos Dados\n                </h3>\n                <p\n                  style={{\n                    fontSize: '13.5px',\n                    color: 'var(--text-light)',\n                    marginTop: '4px',\n                    fontWeight: '500'\n                  }}\n                >\n                  O sistema usa Cloud Firestore quando as variáveis Firebase estão configuradas no ambiente de implantação. Não há credenciais digitadas ou armazenadas no navegador.\n                </p>\n              </div>\n            </div>\n\n            <div style={{ marginTop: '24px' }}>\n              <div\n                className={\`admin-status-card \${cloudConnected ? 'admin-status-ok' : 'admin-status-off'}\`}\n              >\n                <div className="admin-status-icon">\n                  {cloudConnected ? <IconCloud /> : <IconWarning />}\n                </div>\n                <div>\n                  <strong>\n                    {cloudConnected ? 'Cloud Firestore ativo' : 'Modo local ativo'}\n                  </strong>\n                  <p>\n                    {cloudConnected\n                      ? 'Chamados, alterações, modelos e histórico usam a base Firestore configurada para este deploy.'\n                      : firebaseConfigured\n                        ? 'A configuração Firebase existe, mas a conexão online não está ativa nesta sessão.'\n                        : 'As variáveis VITE_FIREBASE_* ainda não foram configuradas neste ambiente. O db.json permanece como fallback local.'}\n                  </p>\n                  <span>Status: {syncStatusText}</span>\n                </div>\n              </div>\n\n              <div className="admin-primary-actions" style={{ marginTop: '18px' }}>\n                <button className="btn btn-primary" onClick={() => setCurrentTab('tickets')}>\n                  <IconList />\n                  <span>Ver Lista de Chamados</span>\n                </button>\n                {!cloudConnected && (\n                  <button\n                    className="btn btn-secondary"\n                    onClick={handleConnectCloud}\n                    disabled={!firebaseConfigured || cloudLoading}\n                  >\n                    {cloudLoading ? <IconRefresh /> : <IconCloud />}\n                    <span>{cloudLoading ? 'Conectando...' : 'Tentar conexão Firestore'}</span>\n                  </button>\n                )}\n              </div>\n\n              <details className="admin-advanced" style={{ marginTop: '18px' }}>\n                <summary>Informações técnicas da migração</summary>\n                <div className="admin-warning">\n                  <p>\n                    <strong>Banco:</strong> Cloud Firestore · plano alvo: Spark.\n                  </p>\n                  <p>\n                    <strong>Anexos:</strong> Storage está adiado. Metadados legados continuam catalogados, sem upload/download nesta fase.\n                  </p>\n                  <p>\n                    <strong>Configuração:</strong> VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID e VITE_FIREBASE_MESSAGING_SENDER_ID.\n                  </p>\n                </div>\n                {cloudConnected && (\n                  <button className="btn btn-secondary" onClick={handleDisconnectCloud}>\n                    <IconClose />\n                    <span>Usar modo local nesta sessão</span>\n                  </button>\n                )}\n              </details>\n            </div>\n          </div>\n        )}\n`
);

// Ajustes editoriais e semânticos restantes.
source = source.replaceAll('via RPC no Firestore', 'via adapter transacional de persistência');
source = source.replaceAll('Erro ao registrar comentário no Firestore:', 'Erro ao registrar comentário na base online:');
source = source.replaceAll('Se estiver conectado à nuvem Firestore, salva o log diretamente na tabela `historico`', 'Se estiver conectado à base online, persiste o log pelo contrato neutro');
source = source.replaceAll('Conecte a base online (Firestore) para editar e salvar alterações permanentes.', 'Conecte a base online para editar e salvar alterações permanentes.');

if (/supabase/i.test(source)) {
  const lines = source.split('\n').map((line, index) => ({ line, index: index + 1 })).filter(({ line }) => /supabase/i.test(line));
  throw new Error(`Referências Supabase remanescentes no App.jsx: ${JSON.stringify(lines.slice(0, 10))}`);
}

for (const forbidden of [
  'insertHistoryEvent(',
  'updateTicketWithHistory(',
  'createTicketWithHistory(',
  'listTicketAttachments(',
  'listSchoolAttachments(',
  'uploadTicketAttachment(',
  'deleteTicketAttachment(',
  'getAttachmentPublicUrl(',
  'getAttachmentDownloadUrl(',
  '.storage'
]) {
  if (source.includes(forbidden)) {
    throw new Error(`API legada remanescente no App.jsx: ${forbidden}`);
  }
}

if (!source.includes("persistence.createTicketWithHistory(ticketRecord, initialEvent)")) {
  throw new Error('Criação de chamado não está ligada ao contrato de persistência.');
}
if (!source.includes('RASCUNHO-${crypto.randomUUID()}')) {
  throw new Error('ID de rascunho offline não foi aplicado.');
}

fs.writeFileSync(appPath, source, 'utf8');
console.log('App.jsx migrado para o contrato Firestore com guardas estruturais.');
