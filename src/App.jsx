import { useState, useEffect, useCallback } from 'react';
import dbData from './data/db.json';
import { createClient } from '@supabase/supabase-js';
import { Analytics } from '@vercel/analytics/react';
import {
  formatDateBrazilian as fmtDateBR,
  inactivityDays as calcInactivityDays,
  slaLevel,
  ageLevel,
  computeMetrics,
  stuckRanking,
  filterBySector,
  sectorSummary,
  suggestedActionColor,
  compileEmailTemplate,
  searchSchools,
  stageGroupCounts,
  SECTORS,
} from './lib/logic.js';
import { createTicketSchema, editTicketSchema, firstValidationMessage } from './lib/validation.js';
import OperationalMap from './components/OperationalMap.jsx';

// Data dinâmica: "hoje" é sempre a data real do dia. Os cálculos de inatividade
// e antiguidade são derivados em ./lib/logic.js a partir desta referência.
const todayRef = () => new Date();

const initialTickets = dbData?.chamados || [];
const initialSchools = dbData?.escolas || [];
const initialHistory = dbData?.historico || [];
const initialEmailTemplates = dbData?.modelos_email || [];
const initialSelectedSchool = initialSchools[0] || null;

const buildEmailDraft = (templates, ticketList, ticketId, templateIndex) => {
  const ticket = ticketList.find(t => t.id_chamado === ticketId) || ticketList[0];
  const templateText = templates[templateIndex]?.template || '';
  return ticket ? compileEmailTemplate(templateText, ticket, todayRef()) : templateText;
};

// Premium, Minimalist SVG Icon Components (Lucide-inspired)
const IconDashboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
);

const IconList = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
);

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);

const IconForm = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
);

const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
);

const IconSun = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
);

const IconMoon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);

const IconFolder = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
);

const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
);

const IconWarning = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);

const IconSiren = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="16"/><line x1="15" y1="22" x2="15" y2="16"/><line x1="9" y1="16" x2="15" y2="16"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M12 14h.01"/></svg>
);

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

const IconCopy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
);

const IconSettings = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);

const IconFileText = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
);

const IconCloud = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-.08A7 7 0 0 0 4.75 8.75a6 6 0 0 0-1.56 11.23A5 5 0 0 0 8 20h10a5 5 0 0 0 0-10z"/></svg>
);

export default function App() {
  const [initialCloudConfig] = useState(() => ({
    url: import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || '',
    key: import.meta.env.VITE_SUPABASE_KEY || localStorage.getItem('supabase_key') || ''
  }));

  // App states
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [tickets, setTickets] = useState(initialTickets);
  const [schools, setSchools] = useState(initialSchools);
  const [history, setHistory] = useState(initialHistory);
  const [emailTemplates, setEmailTemplates] = useState(initialEmailTemplates);
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'

  // Cloud (Supabase) integration states
  const [supabaseUrl, setSupabaseUrl] = useState(initialCloudConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(initialCloudConfig.key);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('Local (db.json)');
  const [cloudLoading, setCloudLoading] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState(null);

  // Lookup tab states
  const [lookupSchoolQuery, setLookupSchoolQuery] = useState(initialSelectedSchool?.unidade_escolar || '');
  const [selectedSchool, setSelectedSchool] = useState(initialSelectedSchool);
  const [showLookupSuggestions, setShowLookupSuggestions] = useState(false);

  // Tickets tab states
  const [ticketSearch, setTicketSearch] = useState('');
  const [activeListsView, setActiveListsView] = useState('all');
  const [editingTicket, setEditingTicket] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form tab states
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [formSelectedSchool, setFormSelectedSchool] = useState(null);
  const [showFormSuggestions, setShowFormSuggestions] = useState(false);
  const [newTicket, setNewTicket] = useState({
    local_demanda: '',
    tipo_demanda: 'Substituição/Instalação de Aparelho',
    tipo_aparelho: 'Split',
    btu_existente: '',
    btu_pretendido: '',
    prioridade: 'Média',
    observacoes: '',
    proxima_providencia: 'Aguardando triagem inicial pela GOP.',
    status_atual: '1 - Recebido — em triagem',
    setor_responsavel: 'GOP',
    informacao_validada: 'Pendente de Vistoria',
    resultado_aptidao: 'Pendente'
  });
  const [newTicketSuccess, setNewTicketSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Email tab states
  const [selectedEmailTicketId, setSelectedEmailTicketId] = useState('');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [customEmailBody, setCustomEmailBody] = useState(() => buildEmailDraft(initialEmailTemplates, initialTickets, '', 0));
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'error' | 'info'

  // Display floating toast
  const triggerToast = useCallback((msg, type) => {
    const kind = type || (/(erro|falha|inv[áa]lid|preencha|primeiro)/i.test(msg) ? 'error' : 'success');
    setToastMessage(msg);
    setToastType(kind);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  }, []);

  const refreshEmailDraft = (ticketId = selectedEmailTicketId, templateIndex = selectedTemplateIndex) => {
    setCustomEmailBody(buildEmailDraft(emailTemplates, tickets, ticketId, templateIndex));
  };

  // Handle dark/light theme classes on body
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
  }, [theme]);

  // Fecha o modal de edição com Esc e trava o scroll do fundo enquanto aberto
  useEffect(() => {
    if (!showEditModal) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowEditModal(false); };
    const prevOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [showEditModal]);

  // 2. Initialize Supabase Connection
  const initializeSupabase = useCallback(async (url, key) => {
    setCloudLoading(true);
    setSyncStatusText('Conectando à nuvem...');
    try {
      const client = createClient(url, key);
      setSupabaseClient(client);

      // Verify connection by loading schools
      const { data: schoolsData, error: schoolsError } = await client
        .from('escolas')
        .select('*')
        .order('unidade_escolar');

      if (schoolsError) throw schoolsError;

      // If schools table exists, load cloud datasets
      setCloudConnected(true);
      setSyncStatusText('Base online ativa');
      
      if (schoolsData && schoolsData.length > 0) {
        setSchools(schoolsData);
        
        // Load tickets
        const { data: ticketsData } = await client
          .from('chamados')
          .select('*')
          .order('id_chamado', { ascending: false });
        
        if (ticketsData) setTickets(ticketsData);

        // Load timeline history
        const { data: historyData } = await client
          .from('historico')
          .select('*')
          .order('data', { ascending: false });
          
        if (historyData) setHistory(historyData);

        // Load e-mail templates from Supabase so the app uses the curated online models.
        const { data: emailTemplatesData, error: emailTemplatesError } = await client
          .from('modelos_email')
          .select('*')
          .order('id', { ascending: true });

        if (emailTemplatesError) throw emailTemplatesError;
        if (emailTemplatesData) {
          setEmailTemplates(emailTemplatesData);
          setCustomEmailBody(buildEmailDraft(emailTemplatesData, ticketsData || initialTickets, '', 0));
        }
      } else {
        setSyncStatusText('Conectado (Tabelas vazias)');
      }
      triggerToast("Base online carregada com sucesso!");
    } catch (err) {
      console.error("Supabase Error:", err);
      setCloudConnected(false);
      setSyncStatusText('Erro de conexão - Modo Local');
      triggerToast("Erro ao carregar dados online. Usando base local.");
    } finally {
      setCloudLoading(false);
    }
  }, [triggerToast]);

  // 1. Initial cloud configuration. Local db.json is loaded by lazy state above.
  useEffect(() => {
    if (initialCloudConfig.url && initialCloudConfig.key) {
      const timer = window.setTimeout(() => {
        initializeSupabase(initialCloudConfig.url, initialCloudConfig.key);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [initialCloudConfig, initializeSupabase]);

  const handleConnectCloud = (e) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      triggerToast("Preencha a URL e a Chave do Supabase!");
      return;
    }
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_key', supabaseKey);
    initializeSupabase(supabaseUrl, supabaseKey);
  };

  const handleDisconnectCloud = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_key');
    setSupabaseUrl('');
    setSupabaseKey('');
    setCloudConnected(false);
    setSupabaseClient(null);
    setSyncStatusText('Local (db.json)');
    
    // Reload local files
    if (dbData) {
      setTickets(dbData.chamados || []);
      setSchools(dbData.escolas || []);
      setHistory(dbData.historico || []);
    }
    triggerToast("Desconectado da nuvem. Modo local ativo.");
  };

  // Upload local db.json items to Supabase
  const handleSyncLocalToCloud = async () => {
    if (!supabaseClient) {
      triggerToast("Conecte-se ao Supabase primeiro!");
      return;
    }
    setCloudLoading(true);
    setSyncStatusText('Sincronizando tabelas...');
    try {
      triggerToast("Sincronizando escolas (134 registros)...");
      const { error: escErr } = await supabaseClient.from('escolas').upsert(schools);
      if (escErr) throw escErr;

      triggerToast("Sincronizando chamados ativos (28 registros)...");
      const { error: chErr } = await supabaseClient.from('chamados').upsert(tickets);
      if (chErr) throw chErr;

      triggerToast("Sincronizando histórico de eventos...");
      const { error: histErr } = await supabaseClient.from('historico').upsert(history);
      if (histErr) throw histErr;

      setSyncStatusText('Base online ativa');
      triggerToast("Banco de dados local sincronizado e salvo na nuvem!");
    } catch (err) {
      console.error(err);
      triggerToast(`Erro na sincronização: ${err.message}. Verifique se criou as tabelas no SQL Editor.`);
    } finally {
      setCloudLoading(false);
    }
  };

  // Date Formatting Helpers — delega ao módulo de lógica (fonte única da verdade)
  const formatDateBrazilian = (isoStr) => fmtDateBR(isoStr);

  // Dias sem movimentação, calculados em relação à data real de hoje.
  const getInactivityDays = (isoStr) =>
    calcInactivityDays({ modificado_em: isoStr }, todayRef());

  // Lists formatting rule: âmbar/vermelho por inatividade (SLA); roxo por antiguidade.
  // A linha recebe a classe do alerta mais grave aplicável.
  const getTicketInactivityClass = (ticket) => {
    const sla = slaLevel(ticket, todayRef());
    if (sla === 'severe') return 'lists-row-severe';
    if (sla === 'warning') return 'lists-row-warning';
    // Sem alerta de inércia: ainda assim sinaliza antiguidade (tempo em aberto).
    const age = ageLevel(ticket, todayRef());
    if (age === 'severe') return 'lists-row-age-severe';
    if (age === 'warning') return 'lists-row-age-warning';
    return '';
  };

  // Inline status color mapper based on standard lists design
  const getStatusStyle = (status) => {
    let color = 'hsl(215, 12%, 52%)';
    let bg = 'rgba(107, 114, 128, 0.08)';
    
    if (status.startsWith('1 ')) { color = 'hsl(214, 90%, 52%)'; bg = 'rgba(59, 130, 246, 0.08)'; }
    else if (status.startsWith('2 ') || status.startsWith('3 ')) { color = 'hsl(199, 89%, 48%)'; bg = 'rgba(14, 165, 233, 0.08)'; }
    else if (status.startsWith('4 ') || status.startsWith('5 ')) { color = 'hsl(38, 92%, 44%)'; bg = 'rgba(245, 158, 11, 0.08)'; }
    else if (status.startsWith('6 ')) { color = 'hsl(20, 90%, 50%)'; bg = 'rgba(249, 115, 22, 0.08)'; }
    else if (status.startsWith('7 ') || status.startsWith('8 ') || status.startsWith('9 ')) { color = 'hsl(175, 80%, 35%)'; bg = 'rgba(13, 148, 136, 0.08)'; }
    else if (status.startsWith('10 ')) { color = 'hsl(142, 72%, 36%)'; bg = 'rgba(16, 185, 129, 0.08)'; }
    
    return {
      '--status-color': color,
      '--status-color-tint': bg,
      border: `1px solid ${color}`
    };
  };

  // Metric Computations — centralizadas no módulo de lógica (data dinâmica)
  const metrics = computeMetrics(tickets, todayRef());
  const stageCounts = stageGroupCounts(tickets);
  const totalTickets = metrics.total;
  const openTickets = metrics.open;
  const inactivePlus7 = metrics.inactivePlus7;   // SLA âmbar ou pior
  const inactivePlus15 = metrics.inactivePlus15; // SLA vermelho
  const agePlus30 = metrics.agePlus30;           // antiguidade roxo claro ou pior
  const agePlus60 = metrics.agePlus60;           // antiguidade roxo intenso

  // Tickets views filters
  const getFilteredTickets = () => {
    let result = [...tickets];
    
    // Apply tab views
    if (activeListsView === 'gop') {
      result = filterBySector(result, 'GOP');
    } else if (activeListsView === 'cps') {
      result = filterBySector(result, 'CPS');
    } else if (activeListsView === 'gin') {
      result = filterBySector(result, 'GIN');
    } else if (activeListsView === 'cto') {
      result = filterBySector(result, 'CTO');
    } else if (activeListsView === 'stuck') {
      result = result.filter(t => slaLevel(t, todayRef()) !== 'ok');
    } else if (activeListsView === 'closed') {
      result = result.filter(t => t.status_atual === '10 - Concluído' || t.status_atual === '11 - Encerrado');
    }

    // Apply text search
    if (ticketSearch.trim()) {
      const q = ticketSearch.toLowerCase();
      result = result.filter(t => 
        t.id_chamado.toLowerCase().includes(q) || 
        t.unidade_escolar.toLowerCase().includes(q) || 
        t.local_demanda.toLowerCase().includes(q) || 
        t.proxima_providencia.toLowerCase().includes(q) ||
        t.status_atual.toLowerCase().includes(q)
      );
    }

    return result;
  };

  // Ranking dos chamados ativos mais parados (delegado ao módulo de lógica)
  const getDashboardStuckRanking = () => stuckRanking(tickets, todayRef(), 5);

  // Edit ticket action
  const openTicketEdit = (ticket) => {
    setEditingTicket({ ...ticket });
    setShowEditModal(true);
  };

  const saveEditedTicket = async () => {
    const validation = editTicketSchema.safeParse(editingTicket);
    if (!validation.success) {
      triggerToast(firstValidationMessage(validation), 'info');
      return;
    }

    const oldTicket = tickets.find(t => t.id_chamado === editingTicket.id_chamado);
    if (!oldTicket) {
      triggerToast('Não foi possível localizar o chamado original. Recarregue a página e tente novamente.', 'error');
      return;
    }

    const hasStatusChanged = oldTicket.status_atual !== editingTicket.status_atual;
    const hasSectorChanged = oldTicket.setor_responsavel !== editingTicket.setor_responsavel;
    const hasNextStepChanged = oldTicket.proxima_providencia !== editingTicket.proxima_providencia;

    // Build timeline details if updated
    let eventNote = '';
    if (hasStatusChanged) eventNote += `Status alterado para: ${editingTicket.status_atual}. `;
    if (hasSectorChanged) eventNote += `Responsabilidade: ${editingTicket.setor_responsavel}. `;
    if (hasNextStepChanged) eventNote += `Próximo passo: ${editingTicket.proxima_providencia}. `;

    const nowIso = new Date().toISOString().substring(0, 19);

    const updatedRecord = {
      ...editingTicket,
      modificado_em: nowIso
    };

    // Update tickets locally
    const updatedTickets = tickets.map(t => {
      if (t.id_chamado === editingTicket.id_chamado) {
        return updatedRecord;
      }
      return t;
    });
    setTickets(updatedTickets);

    const newEvent = eventNote ? {
      id_evento: `EV-${String(history.length + 1).padStart(5, '0')}`,
      data: nowIso,
      id_chamado: editingTicket.id_chamado,
      designacao: editingTicket.designacao,
      unidade_escolar: editingTicket.unidade_escolar,
      marco_relevante: editingTicket.status_atual,
      setor: editingTicket.setor_responsavel.split('/')[0].trim(),
      responsavel_registro: "GOP / Sistema",
      observacao: `[Modificação] ${eventNote} ${editingTicket.ultima_movimentacao}`
    } : null;

    if (newEvent) {
      setHistory([newEvent, ...history]);
    }

    // Save to Cloud in real-time if connected!
    let cloudOk = true;
    if (supabaseClient) {
      try {
        const { error: tkErr } = await supabaseClient
          .from('chamados')
          .update(updatedRecord)
          .eq('id_chamado', editingTicket.id_chamado);
        
        if (tkErr) throw tkErr;

        if (newEvent) {
          const { error: evErr } = await supabaseClient.from('historico').insert(newEvent);
          if (evErr) throw evErr;
        }
      } catch (err) {
        cloudOk = false;
        console.error("Cloud save failed:", err);
      }
    }

    setShowEditModal(false);
    triggerToast(
      cloudOk
        ? "Chamado atualizado com sucesso!"
        : "Alteração salva localmente, mas a gravação na nuvem falhou.",
      cloudOk ? 'success' : 'error'
    );
  };

  // Submit a new ticket simulator
  const handleRegisterNewTicket = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const validation = createTicketSchema.safeParse({
      school: formSelectedSchool,
      ...newTicket
    });

    if (!validation.success) {
      const message = firstValidationMessage(validation);
      triggerToast(
        message === 'Selecione uma unidade escolar.'
          ? 'Selecione uma unidade escolar na lista para o sistema completar os dados.'
          : message,
        'info'
      );
      return;
    }

    setSubmitting(true);
    let cloudOk = true;
    try {
    const nextIdNum = tickets.reduce((max, t) => {
      const num = parseInt(t.id_chamado.split('-').pop(), 10);
      return num > max ? num : max;
    }, 0) + 1;
    
    const generatedId = `GOP-AR-2026-${String(nextIdNum).padStart(4, '0')}`;
    const nowIso = new Date().toISOString().substring(0, 19);

    const ticketRecord = {
      id_chamado: generatedId,
      unidade_escolar: formSelectedSchool.unidade_escolar,
      designacao: formSelectedSchool.designacao,
      data_solicitacao: nowIso,
      local_demanda: newTicket.local_demanda,
      tipo_demanda: newTicket.tipo_demanda,
      status_atual: newTicket.status_atual,
      setor_responsavel: newTicket.setor_responsavel,
      proxima_providencia: newTicket.proxima_providencia,
      ultima_movimentacao: "Chamado registrado no sistema.",
      informacao_validada: newTicket.informacao_validada,
      prioridade: newTicket.prioridade,
      comunicacao_cto: "Não",
      observacoes: newTicket.observacoes,
      resultado_aptidao: newTicket.resultado_aptidao,
      criado_em: nowIso,
      modificado_em: nowIso
    };

    const initialEvent = {
      id_evento: `EV-${String(history.length + 1).padStart(5, '0')}`,
      data: nowIso,
      id_chamado: generatedId,
      designacao: formSelectedSchool.designacao,
      unidade_escolar: formSelectedSchool.unidade_escolar,
      marco_relevante: newTicket.status_atual,
      setor: "GOP",
      responsavel_registro: "GOP / Sistema",
      observacao: `Abertura oficial do chamado. Demanda cadastrada para o local: ${newTicket.local_demanda}.`
    };

    // Update state locally
    setTickets([ticketRecord, ...tickets]);
    setHistory([initialEvent, ...history]);

    // Save to cloud in real-time!
    if (supabaseClient) {
      try {
        const { error: tkErr } = await supabaseClient.from('chamados').insert(ticketRecord);
        if (tkErr) throw tkErr;

        const { error: evErr } = await supabaseClient.from('historico').insert(initialEvent);
        if (evErr) throw evErr;
      } catch (err) {
        cloudOk = false;
        console.error("Cloud insert failed:", err);
      }
    }

    // Show success panel
    setNewTicketSuccess(generatedId);
    triggerToast(
      cloudOk
        ? "Chamado criado com sucesso!"
        : "Chamado criado, mas a gravação na nuvem falhou — salvo só neste dispositivo.",
      cloudOk ? 'success' : 'error'
    );

    // Clean inputs
    setNewTicket({
      local_demanda: '',
      tipo_demanda: 'Substituição/Instalação de Aparelho',
      tipo_aparelho: 'Split',
      btu_existente: '',
      btu_pretendido: '',
      prioridade: 'Média',
      observacoes: '',
      proxima_providencia: 'Aguardando triagem inicial pela GOP.',
      status_atual: '1 - Recebido — em triagem',
      setor_responsavel: 'GOP',
      informacao_validada: 'Pendente de Vistoria',
      resultado_aptidao: 'Pendente'
    });
    setFormSelectedSchool(null);
    setFormSearchQuery('');
    } finally {
      setSubmitting(false);
    }
  };

  // Interactive SVG circular metrics computations for school detail
  const renderCircularCoverage = (school) => {
    if (!school || school.qtd_salas_de_aula === 0) return null;
    const coverage = Math.min(100, Math.round((school.aparelhos_em_sala / school.qtd_salas_de_aula) * 100));
    
    // SVG circle attributes
    const size = 68;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (coverage / 100) * circumference;

    return (
      <div className="circle-progress-wrapper">
        <svg width={size} height={size} className="circle-progress-svg">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--secondary)" />
            </linearGradient>
          </defs>
          <circle 
            className="circle-progress-bg"
            cx={size/2}
            cy={size/2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle 
            className="circle-progress-bar"
            cx={size/2}
            cy={size/2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>{coverage}%</div>
          <span style={{ fontSize: '10.5px', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Salas Climatizadas
          </span>
        </div>
      </div>
    );
  };

  // Premium Donut chart metrics for active vs closed tickets
  const renderDashboardDonutChart = () => {
    const total = tickets.length;
    const closed = tickets.filter(t => t.status_atual === '10 - Concluído' || t.status_atual === '11 - Encerrado').length;
    const active = total - closed;
    const activePct = Math.round((active / total) * 100) || 0;
    const closedPct = 100 - activePct;

    const size = 110;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const activeOffset = circumference - (activePct / 100) * circumference;
    
    return (
      <div className="donut-chart-wrapper">
        <svg width={size} height={size} className="donut-chart-svg">
          <circle 
            cx={size/2}
            cy={size/2}
            r={radius}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={strokeWidth}
          />
          <circle 
            cx={size/2}
            cy={size/2}
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={activeOffset}
            strokeLinecap="round"
            className="donut-chart-segment"
          />
          <text 
            x="50%" 
            y="52%" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            transform={`rotate(90 ${size/2} ${size/2})`} 
            style={{ fontSize: '16px', fontWeight: '800', fill: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}
          >
            {total}
          </text>
          <text 
            x="50%" 
            y="70%" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            transform={`rotate(90 ${size/2} ${size/2})`} 
            style={{ fontSize: '9px', fontWeight: '800', fill: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            Total
          </text>
        </svg>
        
        <div className="donut-legend">
          <div className="donut-legend-item">
            <div className="donut-legend-dot" style={{ backgroundColor: 'var(--primary)' }} />
            <div>
              <span>Chamados Ativos: </span>
              <strong>{active}</strong> <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>({activePct}%)</span>
            </div>
          </div>
          <div className="donut-legend-item">
            <div className="donut-legend-dot" style={{ backgroundColor: 'var(--border-color)' }} />
            <div>
              <span>Concluídos: </span>
              <strong>{closed}</strong> <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>({closedPct}%)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" aria-live="polite" style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: toastType === 'error' ? 'hsl(350, 72%, 44%)' : toastType === 'info' ? 'var(--primary-hover)' : 'hsl(150, 55%, 30%)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-xs)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: '200',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          maxWidth: '400px',
          animation: 'modalSlide 0.2s ease-out'
        }}>
          {toastType === 'error' ? <IconWarning /> : toastType === 'info' ? <IconSearch /> : <IconCheck />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">3ª</div>
          <div className="sidebar-brand-text">GOP <span>Clima</span></div>
        </div>

        {/* Professional user slot */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">3ª</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">GOP · 3ª CRE</span>
            <span className="sidebar-user-role">{openTickets} chamado{openTickets === 1 ? '' : 's'} ativo{openTickets === 1 ? '' : 's'}</span>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <ul className="sidebar-menu">
            <li>
              <button 
                className={`sidebar-item ${currentTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentTab('dashboard')}
              >
                <IconDashboard />
                <span>Painel Executivo</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item ${currentTab === 'tickets' ? 'active' : ''}`}
                onClick={() => setCurrentTab('tickets')}
              >
                <IconList />
                <span>Lista de chamados</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item ${currentTab === 'lookup' ? 'active' : ''}`}
                onClick={() => setCurrentTab('lookup')}
              >
                <IconSearch />
                <span>Consulta por Escola</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item ${currentTab === 'form' ? 'active' : ''}`}
                onClick={() => setCurrentTab('form')}
              >
                <IconForm />
                <span>Registrar chamado</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item ${currentTab === 'email' ? 'active' : ''}`}
                onClick={() => setCurrentTab('email')}
              >
                <IconMail />
                <span>Comunicações</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item ${currentTab === 'cloud' ? 'active' : ''}`}
                onClick={() => setCurrentTab('cloud')}
              >
                <IconSettings />
                <span>Configurações</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Toggle de tema unificado no cabeçalho (Modo Claro/Escuro) — evita controle duplicado */}
      </aside>

      {/* Main Container */}
      <main className="main-content">
        {/* Top Header */}
        <header className="main-header">
          <div className="header-title">
            <h1>Controle Vivo de Climatização</h1>
            <p>Gerência de Operações · Coordenadoria Regional de Educação (GOP/3ª CRE) · Data de Referência: {formatDateBrazilian(todayRef().toISOString())}</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary theme-toggle-header" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Alternar entre modo escuro e claro">
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
              <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
            <button className="btn btn-primary" onClick={() => {
              setNewTicketSuccess(null);
              setCurrentTab('form');
            }}>
              <IconPlus />
              <span>Registrar chamado</span>
            </button>
          </div>
        </header>

        {/* Dashboard Tab */}
        {currentTab === 'dashboard' && (
          <div>
            <p className="screen-intro">
              Veja a situação geral dos chamados, os alertas de prazo e os casos que precisam de atenção da GOP.
            </p>

            {/* Stat row */}
            <div className="card-grid">
              <div className="stat-card" style={{ '--card-accent': 'var(--primary)' }}>
                <div className="stat-header">
                  <span>Chamados Registrados</span>
                  <div className="stat-icon"><IconFolder /></div>
                </div>
                <div className="stat-number">{totalTickets}</div>
                <div className="stat-description">Total histórico importado</div>
              </div>

              <div className="stat-card" style={{ '--card-accent': 'var(--color-blue)' }}>
                <div className="stat-header">
                  <span>Chamados Ativos</span>
                  <div className="stat-icon"><IconRefresh /></div>
                </div>
                <div className="stat-number">{openTickets}</div>
                <div className="stat-description">Demandas em triagem ou andamento</div>
              </div>

              <div className="stat-card" style={{ '--card-accent': 'var(--color-amber)' }}>
                <div className="stat-header">
                  <span>Parados +7 Dias</span>
                  <div className="stat-icon"><IconWarning /></div>
                </div>
                <div className="stat-number" style={{ color: 'var(--color-amber)' }}>{inactivePlus7}</div>
                <div className="stat-description">Sem movimentação (Alerta Âmbar)</div>
              </div>

              <div className="stat-card" style={{ '--card-accent': 'var(--color-red)' }}>
                <div className="stat-header">
                  <span>Parados +15 Dias</span>
                  <div className="stat-icon"><IconSiren /></div>
                </div>
                <div className="stat-number" style={{ color: 'var(--color-red)' }}>{inactivePlus15}</div>
                <div className="stat-description">Sem movimentação (Alerta Vermelho)</div>
              </div>

              <div className="stat-card" style={{ '--card-accent': 'var(--color-age-warn)' }}>
                <div className="stat-header">
                  <span>Em Aberto +30 Dias</span>
                  <div className="stat-icon"><IconClock /></div>
                </div>
                <div className="stat-number" style={{ color: 'var(--color-age-warn)' }}>{agePlus30}</div>
                <div className="stat-description">Tempo total em aberto (Antiguidade)</div>
              </div>

              <div className="stat-card" style={{ '--card-accent': 'var(--color-age-severe)' }}>
                <div className="stat-header">
                  <span>Em Aberto +60 Dias</span>
                  <div className="stat-icon"><IconCalendar /></div>
                </div>
                <div className="stat-number" style={{ color: 'var(--color-age-severe)' }}>{agePlus60}</div>
                <div className="stat-description">Antiguidade crítica (revisar caso)</div>
              </div>
            </div>

            {/* Mapa Operacional — área de atuação da 3ª CRE (substitui os cards de Etapas e Setor) */}
            <div className="dashboard-section op-panel">
              <div className="section-header">
                <h3><IconBuilding /> Mapa Operacional</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: '600' }}>Área de atuação da 3ª CRE · Zona Norte</span>
              </div>
              <OperationalMap />
              <div className="op-legend">
                <span className="lg"><span className="ld" style={{ background: 'var(--secondary)', color: 'var(--secondary)' }} />Triagem / Vistoria <b>{stageCounts.triagem}</b></span>
                <span className="lg"><span className="ld" style={{ background: 'var(--color-amber)', color: 'var(--color-amber)' }} />Orçamento <b>{stageCounts.orcamento}</b></span>
                <span className="lg"><span className="ld" style={{ background: 'var(--primary)', color: 'var(--primary)' }} />Em execução <b>{stageCounts.execucao}</b></span>
                <span className="lg"><span className="ld" style={{ background: 'var(--color-green)', color: 'var(--color-green)' }} />Concluído <b>{stageCounts.concluido}</b></span>
              </div>
              <p className="op-foot">Mapa-base real (© OpenStreetMap · CARTO) com os 26 bairros da 3ª CRE destacados. As contagens por etapa refletem os chamados do sistema. Mapa de contexto da área de atuação — não localiza unidades individualmente.</p>
            </div>

            {/* Layout Grid */}
            <div className="dashboard-layout">
              {/* Left section: Charts */}
              <div>
                <div className="dashboard-section">
                  <div className="section-header">
                    <h3><IconDashboard /> Visão de Metas & Conclusões</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase' }}>Consolidado Geral</span>
                  </div>
                  {renderDashboardDonutChart()}
                </div>

{/* (removido) "Distribuição pelas 12 Etapas POP" — substituído pelo Mapa Operacional; a leitura por etapa agora aparece na legenda do mapa */}

{/* (removido) "Envolvimento e Demandas por Setor" — a visão por setor permanece na barra de setor da Lista de chamados (Bloco C) */}
              </div>

              {/* Right Section: Inactivity Ranking */}
              <div className="dashboard-section" style={{ height: 'fit-content' }}>
                <div className="section-header">
                  <h3><IconWarning /> Ranking de Inatividade (Gargalos)</h3>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.45', fontWeight: '500' }}>
                  Chamados ativos parados há mais tempo sem movimentação no sistema.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {getDashboardStuckRanking().map((t) => {
                    const isSevere = t.inactivityDays >= 15;
                    return (
                      <div 
                        key={t.id_chamado} 
                        onClick={() => openTicketEdit(t)}
                        style={{
                          padding: '14px 18px',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--bg-app)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderLeft: `4px solid ${isSevere ? 'var(--color-red)' : 'var(--color-amber)'}`,
                          transition: 'var(--transition)'
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '12.5px', color: 'var(--text-main)' }}>{t.id_chamado}</strong>
                            <span className={`badge ${t.prioridade === 'Crítica' ? 'badge-priority-critica' : 'badge-priority-alta'}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                              {t.prioridade}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: '600' }}>
                            {t.unidade_escolar}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <span className={`sla-pulse ${isSevere ? 'sla-pulse-red' : 'sla-pulse-amber'}`} />
                            <span style={{ 
                              fontSize: '13.5px', 
                              fontWeight: '800', 
                              color: isSevere ? 'var(--color-red)' : 'var(--color-amber)' 
                            }}>
                              {t.inactivityDays} dias
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>sem alteração</div>
                          {typeof t.ageDays === 'number' && t.ageDays > 0 && (
                            <div style={{ fontSize: '10px', color: 'var(--color-age-severe)', fontWeight: '700', marginTop: '3px' }}>
                              {t.ageDays} dias em aberto
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Info and Sync center box */}
                <div className="sync-panel" style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('cloud')}>
                  <div className="sync-status">
                    <span className="sync-dot" style={{ backgroundColor: cloudConnected ? 'var(--color-green)' : 'var(--color-red)', boxShadow: cloudConnected ? '0 0 8px var(--color-green)' : '0 0 8px var(--color-red)' }} />
                  <span>{syncStatusText}</span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-light)' }}>
                    {cloudConnected ? 'Base online ativa' : 'Configurar base online'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tickets Tab (Lists Mirror) */}
        {currentTab === 'tickets' && (
          <div className="dashboard-section" style={{ padding: '24px' }}>
            <div className="section-header" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3><IconList /> Lista de chamados</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', fontWeight: '500' }}>
                  Use esta tela para localizar chamados, filtrar por setor e abrir uma linha para atualizar o andamento.
                </p>
              </div>

              {/* Text Search */}
              <div style={{ display: 'flex', gap: '12px', flex: 1, justifySelf: 'flex-end', maxWidth: '350px' }}>
                <div className="input-search" style={{ flex: 1 }}>
                  <IconSearch />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar chamado..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Lists View tabs */}
            <div className="view-tabs">
              <button className={`view-tab ${activeListsView === 'all' ? 'active' : ''}`} onClick={() => setActiveListsView('all')}>
                Todos os Chamados ({tickets.length})
              </button>
              <button className={`view-tab ${activeListsView === 'gop' ? 'active' : ''}`} onClick={() => setActiveListsView('gop')}>
                Com a GOP
              </button>
              <button className={`view-tab ${activeListsView === 'cps' ? 'active' : ''}`} onClick={() => setActiveListsView('cps')}>
                Com a CPS
              </button>
              <button className={`view-tab ${activeListsView === 'gin' ? 'active' : ''}`} onClick={() => setActiveListsView('gin')}>
                Com a GIN
              </button>
              <button className={`view-tab ${activeListsView === 'cto' ? 'active' : ''}`} onClick={() => setActiveListsView('cto')}>
                Com a CTO
              </button>
              <button className={`view-tab ${activeListsView === 'stuck' ? 'active' : ''}`} onClick={() => setActiveListsView('stuck')}>
                Parados +7d ({inactivePlus7})
              </button>
              <button className={`view-tab ${activeListsView === 'closed' ? 'active' : ''}`} onClick={() => setActiveListsView('closed')}>
                Concluídos/Encerrados
              </button>
            </div>

            {/* Bloco C — Indicadores da visão de setor (quando uma aba de setor está ativa) */}
            {SECTORS.map(s => s.toLowerCase()).includes(activeListsView) && (() => {
              const sec = activeListsView.toUpperCase();
              const sm = sectorSummary(tickets, sec, todayRef());
              return (
                <div className="sector-summary-bar">
                  <div className="sector-summary-title">
                    <IconBuilding /> Visão do setor: <strong>{sec}</strong>
                  </div>
                  <div className="sector-summary-metrics">
                    <div className="sector-metric">
                      <span className="sector-metric-num">{sm.total}</span>
                      <span className="sector-metric-label">Envolvimentos</span>
                    </div>
                    <div className="sector-metric">
                      <span className="sector-metric-num" style={{ color: 'var(--color-blue)' }}>{sm.open}</span>
                      <span className="sector-metric-label">Em aberto</span>
                    </div>
                    <div className="sector-metric">
                      <span className="sector-metric-num" style={{ color: 'var(--color-amber)' }}>{sm.stuck}</span>
                      <span className="sector-metric-label">Parados (SLA)</span>
                    </div>
                    <div className="sector-metric">
                      <span className="sector-metric-num" style={{ color: 'var(--color-green)' }}>{sm.closed}</span>
                      <span className="sector-metric-label">Concluídos</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Lists grid table */}
            <div className="lists-table-wrapper">
              <table className="lists-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Unidade Escolar</th>
                    <th>Tipo Demanda</th>
                    <th>Local</th>
                    <th>Responsável</th>
                    <th>Status Atual</th>
                    <th>Prioridade</th>
                    <th>Modificado Em</th>
                    <th>Aptidão</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredTickets().map((t) => {
                    const rowClass = getTicketInactivityClass(t);
                    const days = getInactivityDays(t.modificado_em);
                    const closed = ['10 - Concluído', '11 - Encerrado', 'Suspenso / pendente'];
                    const hasPulse = !closed.includes(t.status_atual) && days >= 7;
                    return (
                      <tr 
                        key={t.id_chamado} 
                        className={rowClass} 
                        onClick={() => openTicketEdit(t)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ fontWeight: '800' }}>{t.id_chamado}</td>
                        <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '700' }} title={t.unidade_escolar}>
                          {t.unidade_escolar}
                        </td>
                        <td>{t.tipo_demanda}</td>
                        <td>{t.local_demanda}</td>
                        <td style={{ fontWeight: '700' }}>{t.setor_responsavel}</td>
                        <td>
                          <span className="badge badge-status" style={getStatusStyle(t.status_atual)}>
                            {t.status_atual}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-priority-${t.prioridade.toLowerCase()}`}>
                            {t.prioridade}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {hasPulse && (
                              <span className={`sla-pulse ${days >= 15 ? 'sla-pulse-red' : 'sla-pulse-amber'}`} />
                            )}
                            {formatDateBrazilian(t.modificado_em)}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${t.resultado_aptidao === 'Apta' ? 'badge-valid-sim' : t.resultado_aptidao === 'Pendente' ? 'badge-valid-pendente' : 'badge-valid-nao'}`}>
                            {t.resultado_aptidao}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {getFilteredTickets().length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)', fontWeight: '600' }}>
                        Nenhum chamado encontrado para os filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* School Lookup Tab */}
        {currentTab === 'lookup' && (
          <div className="school-grid-layout">
            {/* Left Column: School registry lookups */}
            <div className="dashboard-section">
              <div className="section-header">
                <h3><IconBuilding /> Cadastro Vivo 3ª CRE — Consulta Rápida</h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.45', fontWeight: '500' }}>
                Pesquise uma escola pelo nome, designação, SICI ou bairro para consultar a ficha da unidade e seus chamados vinculados.
              </p>

              {/* Autocomplete Input */}
              <div className="suggestion-container" style={{ marginBottom: '24px' }}>
                <div className="input-search">
                  <IconSearch />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Digite o nome da escola ou designação..."
                    value={lookupSchoolQuery}
                    onChange={(e) => {
                      setLookupSchoolQuery(e.target.value);
                      setShowLookupSuggestions(true);
                    }}
                    onFocus={() => setShowLookupSuggestions(true)}
                  />
                </div>
                
                {showLookupSuggestions && lookupSchoolQuery && (
                  <div className="suggestion-box">
                    {searchSchools(schools, lookupSchoolQuery).map(s => (
                      <div 
                        key={s.designacao}
                        className="suggestion-item"
                        onClick={() => {
                          setSelectedSchool(s);
                          setLookupSchoolQuery(s.unidade_escolar);
                          setShowLookupSuggestions(false);
                        }}
                      >
                        🏢 {s.unidade_escolar} ({s.designacao})
                      </div>
                    ))}
                    {searchSchools(schools, lookupSchoolQuery).length === 0 && (
                      <div style={{ padding: '10px 14px', color: 'var(--text-light)', fontSize: '12px', fontWeight: '600' }}>
                        Nenhuma escola correspondente
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedSchool && (
                <div className="school-details-card">
                  <div style={{ 
                    padding: '18px', 
                    borderRadius: 'var(--radius-xs)', 
                    background: 'var(--primary-light)', 
                    borderLeft: '4px solid var(--primary)',
                    marginBottom: '14px'
                  }}>
                    <h4 style={{ fontWeight: '850', fontSize: '16px', color: 'var(--primary)' }}>
                      {selectedSchool.unidade_escolar}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: '700' }}>
                      Designação: {selectedSchool.designacao} · Código SICI: {selectedSchool.sici}
                    </span>
                  </div>

                  {/* Circular Coverage progress */}
                  {renderCircularCoverage(selectedSchool)}

                  <div className="school-detail-row">
                    <span className="school-detail-label">Endereço</span>
                    <span className="school-detail-value">{selectedSchool.endereco}</span>
                  </div>
                  <div className="school-detail-row">
                    <span className="school-detail-label">Bairro</span>
                    <span className="school-detail-value">{selectedSchool.bairro}</span>
                  </div>
                  <div className="school-detail-row">
                    <span className="school-detail-label">Total Salas de Aula</span>
                    <span className="school-detail-value">{selectedSchool.qtd_salas_de_aula}</span>
                  </div>
                  <div className="school-detail-row">
                    <span className="school-detail-label">Aparelhos em Sala</span>
                    <span className="school-detail-value">{selectedSchool.aparelhos_em_sala}</span>
                  </div>
                  <div className="school-detail-row">
                    <span className="school-detail-label">Aparelhos Total (Escola)</span>
                    <span className="school-detail-value">{selectedSchool.aparelhos_total}</span>
                  </div>
                  <div className="school-detail-row" style={{ borderBottomColor: 'var(--primary-light)' }}>
                    <span className="school-detail-label" style={{ color: 'var(--color-red)' }}>Salas Sem Aparelho</span>
                    <span className="school-detail-value" style={{ color: 'var(--color-red)' }}>{selectedSchool.salas_sem_aparelho}</span>
                  </div>
                  <div className="school-detail-row" style={{ borderBottomColor: 'var(--primary-light)' }}>
                    <span className="school-detail-label" style={{ color: 'var(--color-orange)' }}>Necessidade Estimada</span>
                    <span className="school-detail-value" style={{ color: 'var(--color-orange)' }}>{selectedSchool.necessidade_aparelhos} aparelhos</span>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '800', color: 'var(--text-light)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                      Status de Validação de Cadastro
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div className="school-indicator" style={{
                        backgroundColor: selectedSchool.confirmado_pela_unidade === 'Sim' ? 'var(--color-green-tint)' : 'var(--color-red-tint)',
                        color: selectedSchool.confirmado_pela_unidade === 'Sim' ? 'var(--color-green)' : 'var(--color-red)'
                      }}>
                        {selectedSchool.confirmado_pela_unidade === 'Sim' ? '✓ Confirmado Unidade' : '✗ Não Confirmado'}
                      </div>
                      <div className="school-indicator" style={{
                        backgroundColor: selectedSchool.validado_pela_gop === 'Sim' ? 'var(--color-green-tint)' : 'var(--color-red-tint)',
                        color: selectedSchool.validado_pela_gop === 'Sim' ? 'var(--color-green)' : 'var(--color-red)'
                      }}>
                        {selectedSchool.validado_pela_gop === 'Sim' ? '✓ Validado GOP' : '✗ Não Validado'}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const acColor = suggestedActionColor(selectedSchool);
                    const acVar = acColor === 'red' ? 'var(--color-red)'
                                : acColor === 'amber' ? 'var(--color-amber)'
                                : 'var(--color-green)';
                    return (
                      <div style={{
                        marginTop: '20px',
                        padding: '16px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px dashed var(--border-color)',
                        borderLeft: `4px solid ${acVar}`
                      }}>
                        <strong style={{ fontSize: '12px', display: 'block', marginBottom: '4px', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.5px' }}>🎯 Ação Sugerida pelo POP:</strong>
                        <span style={{ fontSize: '13px', fontWeight: '750', color: acVar }}>
                          {selectedSchool.acao_sugerida}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Right Column: Active tickets and History Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {selectedSchool && (
                <>
                  {/* Tickets associated */}
                  <div className="dashboard-section">
                    <div className="section-header">
                      <h3><IconFolder /> Chamados da Unidade ({tickets.filter(t => t.designacao === selectedSchool.designacao).length})</h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {tickets.filter(t => t.designacao === selectedSchool.designacao).map(t => (
                        <div 
                          key={t.id_chamado}
                          onClick={() => openTicketEdit(t)}
                          style={{
                            padding: '12px 14px',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-app)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          className="hover-trigger"
                        >
                          <div>
                            <strong style={{ fontSize: '12px', color: 'var(--text-main)' }}>{t.id_chamado}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '500' }}>
                              Local: {t.local_demanda} | Setor: {t.setor_responsavel}
                            </div>
                          </div>
                          <span className="badge badge-status" style={getStatusStyle(t.status_atual)}>
                            {t.status_atual}
                          </span>
                        </div>
                      ))}
                      {tickets.filter(t => t.designacao === selectedSchool.designacao).length === 0 && (
                        <p style={{ fontSize: '12px', color: 'var(--text-light)', textAlign: 'center', padding: '16px', fontWeight: '600' }}>
                          Nenhum chamado ativo registrado para esta unidade escolar.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* School Event Timeline history */}
                  <div className="dashboard-section">
                    <div className="section-header">
                      <h3><IconClock /> Linha do Tempo e Marcos Históricos</h3>
                    </div>

                    <div className="timeline">
                      {history
                        .filter(h => h.designacao === selectedSchool.designacao || h.unidade_escolar === selectedSchool.unidade_escolar)
                        .map(h => (
                          <div key={h.id_evento} className="timeline-event">
                            <div className="timeline-event-marker" />
                            <div className="timeline-event-card">
                              <div className="timeline-event-meta">
                                <span>📅 {formatDateBrazilian(h.data)}</span>
                                <span style={{ fontWeight: 'bold' }}>👤 {h.responsavel_registro} ({h.setor})</span>
                              </div>
                              <div className="timeline-event-title">
                                {h.id_chamado ? `Chamado ${h.id_chamado}: ` : ''}{h.marco_relevante}
                              </div>
                              <p className="timeline-event-desc">{h.observacao}</p>
                            </div>
                          </div>
                        ))}
                      {history.filter(h => h.designacao === selectedSchool.designacao || h.unidade_escolar === selectedSchool.unidade_escolar).length === 0 && (
                        <p style={{ fontSize: '12px', color: 'var(--text-light)', textAlign: 'center', padding: '16px', fontWeight: '600' }}>
                          Nenhum marco de evento registrado no histórico para esta unidade.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Simulador de Novo Chamado Tab */}
        {currentTab === 'form' && (
          <div className="dashboard-section" style={{ maxWidth: '750px', margin: '0 auto' }}>
            <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3><IconForm /> Registrar chamado</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', fontWeight: '500' }}>
                  Selecione a unidade escolar, informe o local da demanda e registre a próxima providência inicial.
                </p>
              </div>
            </div>

            {newTicketSuccess ? (
              <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--primary)' }}><IconCheck /></div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Demanda Registrada com Sucesso!</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '13px', fontWeight: '500' }}>
                  O chamado foi gravado com o identificador exclusivo: <strong style={{ color: 'var(--primary)' }}>{newTicketSuccess}</strong>
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setSelectedEmailTicketId(newTicketSuccess);
                      setCustomEmailBody(buildEmailDraft(emailTemplates, tickets, newTicketSuccess, selectedTemplateIndex));
                      setCurrentTab('email');
                    }}
                  >
                    <IconMail />
                    <span>Minutar E-mail Inicial</span>
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setNewTicketSuccess(null);
                    }}
                  >
                    <IconRefresh />
                    <span>Registrar Outro</span>
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setCurrentTab('tickets');
                    }}
                  >
                    <IconList />
                    <span>Ir para Tabela</span>
                  </button>
                </div>
              </div>
            ) : (
              <form noValidate onSubmit={handleRegisterNewTicket}>
                {/* 1. SEÇÃO DE IDENTIFICAÇÃO */}
                <div className="form-section-title">
                  <IconBuilding />
                  <span>Seção 1: Identificação da Unidade e Demanda</span>
                </div>
                
                <div className="form-grid">
                  <div className="form-group suggestion-container">
                    <label className="form-label">Buscar Escola por Nome / Designação *</label>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Pesquise para autocompletar..."
                      required
                      value={formSearchQuery}
                      onChange={(e) => {
                        setFormSearchQuery(e.target.value);
                        setShowFormSuggestions(true);
                      }}
                      onFocus={() => setShowFormSuggestions(true)}
                    />
                    
                    {showFormSuggestions && formSearchQuery && (
                      <div className="suggestion-box">
                        {searchSchools(schools, formSearchQuery).map(s => (
                          <div 
                            key={s.designacao}
                            className="suggestion-item"
                            onClick={() => {
                              setFormSelectedSchool(s);
                              setFormSearchQuery(s.unidade_escolar);
                              setShowFormSuggestions(false);
                            }}
                          >
                            🏢 {s.unidade_escolar} ({s.designacao})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Designação (Preenchido auto)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      disabled 
                      value={formSelectedSchool ? formSelectedSchool.designacao : ''} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Código SICI (Preenchido auto)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      disabled 
                      value={formSelectedSchool ? formSelectedSchool.sici : ''} 
                    />
                  </div>
                </div>

                {formSelectedSchool && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--primary-light)',
                    borderLeft: '4px solid var(--primary)',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '20px'
                  }}>
                    📍 <strong>Endereço:</strong> {formSelectedSchool.endereco}, Bairro: {formSelectedSchool.bairro}
                  </div>
                )}

                {/* 2. SEÇÃO DE DETALHES TÉCNICOS */}
                <div className="form-section-title">
                  <IconSettings />
                  <span>Seção 2: Especificações Técnicas da Solicitação</span>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Tipo de Solicitação *</label>
                    <select 
                      className="form-control"
                      value={newTicket.tipo_demanda}
                      onChange={(e) => setNewTicket({ ...newTicket, tipo_demanda: e.target.value })}
                    >
                      <option value="Substituição/Instalação de Aparelho">Substituição/Instalação de Aparelho</option>
                      <option value="Nova Instalação">Nova Instalação</option>
                      <option value="Substituição de Aparelho">Substituição de Aparelho</option>
                      <option value="Manutenção Corretiva">Manutenção Corretiva</option>
                      <option value="Manutenção Preventiva">Manutenção Preventiva</option>
                      <option value="Adequação infra/elétrica">Adequação infra/elétrica</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Local Exato da Demanda *</label>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Ex: Sala 5, Secretaria, Diretoria"
                      required
                      value={newTicket.local_demanda}
                      onChange={(e) => setNewTicket({ ...newTicket, local_demanda: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tipo de Equipamento</label>
                    <select 
                      className="form-control"
                      value={newTicket.tipo_aparelho}
                      onChange={(e) => setNewTicket({ ...newTicket, tipo_aparelho: e.target.value })}
                    >
                      <option value="Split">Split</option>
                      <option value="Janela">Janela</option>
                      <option value="Split e Janela">Split e Janela</option>
                      <option value="Não Possui">Não Possui</option>
                      <option value="Não Sabe Informar">Não Sabe Informar</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">BTU Existente</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: 12000"
                      value={newTicket.btu_existente}
                      onChange={(e) => setNewTicket({ ...newTicket, btu_existente: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">BTU Pretendido</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: 18000"
                      value={newTicket.btu_pretendido}
                      onChange={(e) => setNewTicket({ ...newTicket, btu_pretendido: e.target.value })}
                    />
                  </div>
                </div>

                {/* 3. SEÇÃO ADMINISTRATIVA */}
                <div className="form-section-title">
                  <IconFileText />
                  <span>Seção 3: Triagem e Parâmetros da GOP</span>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Prioridade Inicial *</label>
                    <select 
                      className="form-control"
                      value={newTicket.prioridade}
                      onChange={(e) => setNewTicket({ ...newTicket, prioridade: e.target.value })}
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Crítica">Crítica</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status Inicial *</label>
                    <select 
                      className="form-control"
                      value={newTicket.status_atual}
                      onChange={(e) => setNewTicket({ ...newTicket, status_atual: e.target.value })}
                    >
                      <option value="1 - Recebido — em triagem">1 - Recebido — em triagem</option>
                      <option value="2 - Em vistoria técnica">2 - Em vistoria técnica</option>
                      <option value="4 - Aguardando orçamento">4 - Aguardando orçamento</option>
                      <option value="Suspenso / pendente">Suspenso / pendente</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Setor Responsável Atual *</label>
                    <select 
                      className="form-control"
                      value={newTicket.setor_responsavel}
                      onChange={(e) => setNewTicket({ ...newTicket, setor_responsavel: e.target.value })}
                    >
                      <option value="GOP">GOP</option>
                      <option value="CPS">CPS</option>
                      <option value="GIN">GIN</option>
                      <option value="CTO">CTO</option>
                      <option value="Unidade Escolar">Unidade Escolar</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group form-group-full">
                    <label className="form-label">Próxima Providência GOP *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required
                      value={newTicket.proxima_providencia}
                      onChange={(e) => setNewTicket({ ...newTicket, proxima_providencia: e.target.value })}
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">Observações de Campo</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      placeholder="Adicione informações adicionais recebidas..."
                      value={newTicket.observacoes}
                      onChange={(e) => setNewTicket({ ...newTicket, observacoes: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setCurrentTab('dashboard')}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <span className="spin" style={{ display: 'inline-flex' }}><IconRefresh /></span> : <IconPlus />}
                    <span>{submitting ? 'Registrando…' : 'Registrar Demanda'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Email Templates Tab (Premium Email Client Simulator) */}
        {currentTab === 'email' && (
          <div className="dashboard-section">
            <div className="section-header" style={{ marginBottom: '24px' }}>
              <div>
                <h3><IconMail /> Comunicações</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', fontWeight: '500' }}>
                  Escolha um chamado e um modelo para gerar uma minuta de e-mail com os dados já preenchidos.
                </p>
              </div>
            </div>

            <div className="email-composer-layout">
              {/* Left Column: Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Select active ticket */}
                <div className="form-group">
                  <label className="form-label">Selecionar Chamado Ativo *</label>
                  <select 
                    className="form-control"
                    value={selectedEmailTicketId}
                    onChange={(e) => {
                      const ticketId = e.target.value;
                      setSelectedEmailTicketId(ticketId);
                      refreshEmailDraft(ticketId, selectedTemplateIndex);
                    }}
                  >
                    <option value="">-- Escolha um Chamado --</option>
                    {tickets.map(t => (
                      <option key={t.id_chamado} value={t.id_chamado}>
                        {t.id_chamado} - {t.unidade_escolar.substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* Templates Selector */}
                <div className="form-group">
                  <label className="form-label">Selecionar Modelo de E-mail *</label>
                  <div className="template-list">
                    {emailTemplates.map((tp, idx) => (
                      <div 
                        key={idx}
                        className={`template-item ${selectedTemplateIndex === idx ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedTemplateIndex(idx);
                          refreshEmailDraft(selectedEmailTicketId, idx);
                        }}
                      >
                        <div className="template-item-title">📧 {tp.tipo}</div>
                        <div className="template-item-meta">Etapa POP: {tp.etapa}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Preview & Action */}
              <div className="email-preview-panel">
                <div className="email-preview-header">
                  <div className="email-preview-field">
                    <span className="email-preview-field-label">Assunto:</span>
                    <span className="email-preview-field-value" style={{ color: 'var(--primary)' }}>
                      {customEmailBody.split('\n')[0]?.replace('Assunto: ', '') || 'Comunicação Oficial'}
                    </span>
                  </div>
                  <div className="email-preview-field">
                    <span className="email-preview-field-label">Destinatário:</span>
                    <span className="email-preview-field-value">Setor Parceiro / Unidade Escolar</span>
                  </div>
                </div>
                
                <textarea 
                  className="email-preview-body"
                  value={customEmailBody}
                  onChange={(e) => setCustomEmailBody(e.target.value)}
                />

                <div className="email-preview-actions">
                  <span style={{ 
                    fontSize: '11px', 
                    color: 'var(--text-light)', 
                    marginRight: 'auto', 
                    alignSelf: 'center',
                    fontWeight: '600'
                  }}>
                    💡 Você pode editar o texto na caixa acima antes de copiar.
                  </span>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      navigator.clipboard.writeText(customEmailBody);
                      triggerToast("Texto copiado para a área de transferência!");
                    }}
                  >
                    <IconCopy />
                    <span>Copiar E-mail</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuração da base online */}
        {currentTab === 'cloud' && (
          <div className="dashboard-section" style={{ maxWidth: '750px', margin: '0 auto' }}>
            <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3><IconSettings /> Administração dos Dados</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-light)', marginTop: '4px', fontWeight: '500' }}>
                  Acompanhe a situação da base usada pelo sistema. As ações técnicas ficam separadas para evitar uso acidental.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <div className={`admin-status-card ${cloudConnected ? 'admin-status-ok' : 'admin-status-off'}`}>
                <div className="admin-status-icon">
                  {cloudConnected ? <IconCloud /> : <IconWarning />}
                </div>
                <div>
                  <strong>{cloudConnected ? 'Base online ativa' : 'Base online não conectada'}</strong>
                  <p>
                    {cloudConnected
                      ? 'Chamados, alterações e históricos estão usando a base online configurada para o site.'
                      : 'O sistema está usando a base local carregada junto com a aplicação neste navegador.'}
                  </p>
                  <span>Status: {syncStatusText}</span>
                </div>
              </div>

              {!cloudConnected ? (
                <div>
                  <button className="btn btn-secondary" onClick={() => setCurrentTab('tickets')}>
                    <IconList />
                    <span>Ver Lista de Chamados</span>
                  </button>

                  <details className="admin-advanced">
                    <summary>Configuração técnica da base online</summary>
                    <p className="admin-warning">
                      Use esta área somente durante implantação ou manutenção. Usuários da rotina diária não precisam preencher URL, chave ou SQL.
                    </p>

                    <form onSubmit={handleConnectCloud} className="admin-technical-form">
                      <div className="form-group">
                        <label className="form-label">Supabase Project URL *</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="Ex: https://xxxxxxxxx.supabase.co"
                          required
                          value={supabaseUrl}
                          onChange={(e) => setSupabaseUrl(e.target.value)}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Supabase Project API Key (Anon / Public) *</label>
                        <input 
                          type="password"
                          className="form-control"
                          placeholder="Digite a chave anon do projeto Supabase..."
                          required
                          value={supabaseKey}
                          onChange={(e) => setSupabaseKey(e.target.value)}
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }} disabled={cloudLoading}>
                        {cloudLoading ? <IconRefresh /> : <IconCloud />}
                        <span>{cloudLoading ? 'Conectando...' : 'Conectar base online'}</span>
                      </button>
                    </form>

                    <details className="admin-sql-details">
                      <summary>Ver instruções SQL de configuração</summary>
                      <ol>
                        <li>Use o SQL Editor do Supabase apenas na configuração inicial ou em manutenção controlada.</li>
                        <li>Confirme o projeto correto antes de executar qualquer comando.</li>
                        <li>Não cole chaves privadas ou service role no front-end.</li>
                      </ol>
                      <pre>
{`-- 1. Tabela de Escolas
CREATE TABLE IF NOT EXISTS escolas (
  designacao TEXT PRIMARY KEY,
  unidade_escolar TEXT,
  sici TEXT,
  endereco TEXT,
  bairro TEXT,
  confirmado_pela_unidade TEXT,
  validado_pela_gop TEXT,
  qtd_salas_de_aula INTEGER,
  aparelhos_em_sala INTEGER,
  aparelhos_total INTEGER,
  salas_sem_aparelho INTEGER,
  necessidade_aparelhos INTEGER,
  acao_sugerida TEXT
);

-- 2. Tabela de Chamados
CREATE TABLE IF NOT EXISTS chamados (
  id_chamado TEXT PRIMARY KEY,
  unidade_escolar TEXT,
  designacao TEXT REFERENCES escolas(designacao),
  data_solicitacao TIMESTAMPTZ,
  local_demanda TEXT,
  tipo_demanda TEXT,
  status_atual TEXT,
  setor_responsavel TEXT,
  proxima_providencia TEXT,
  ultima_movimentacao TEXT,
  informacao_validada TEXT,
  prioridade TEXT,
  comunicacao_cto TEXT,
  observacoes TEXT,
  resultado_aptidao TEXT,
  criado_em TIMESTAMPTZ,
  modificado_em TIMESTAMPTZ
);

-- 3. Tabela de Histórico
CREATE TABLE IF NOT EXISTS historico (
  id_evento TEXT PRIMARY KEY,
  data TIMESTAMPTZ,
  id_chamado TEXT REFERENCES chamados(id_chamado),
  designacao TEXT REFERENCES escolas(designacao),
  unidade_escolar TEXT,
  marco_relevante TEXT,
  setor TEXT,
  responsavel_registro TEXT,
  observacao TEXT
);`}
                      </pre>
                    </details>
                  </details>
                </div>
              ) : (
                <div>
                  <div className="admin-primary-actions">
                    <button className="btn btn-primary" onClick={() => setCurrentTab('tickets')}>
                      <IconList />
                      <span>Ver Lista de Chamados</span>
                    </button>
                  </div>

                  <details className="admin-advanced">
                    <summary>Ações técnicas avançadas</summary>
                    <p className="admin-warning">
                      Estas ações podem afetar a base usada pelo site. Use apenas em manutenção controlada, quando houver certeza sobre a base correta.
                    </p>
                    <div className="admin-advanced-actions">
                      <button className="btn btn-secondary" onClick={handleSyncLocalToCloud} disabled={cloudLoading}>
                        <IconRefresh />
                        <span>{cloudLoading ? 'Processando...' : 'Enviar base local para a base online'}</span>
                      </button>
                      <button className="btn btn-secondary btn-danger" onClick={handleDisconnectCloud}>
                        <IconClose />
                        <span>Desconectar base online</span>
                      </button>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Edit Ticket & Ficha Técnica Modal */}
      {showEditModal && editingTicket && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconList />
                  <span>Ficha do Chamado {editingTicket.id_chamado}</span>
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', fontWeight: '500' }}>
                  {editingTicket.unidade_escolar} · Designação: {editingTicket.designacao}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}><IconClose /></button>
            </div>

            <div className="modal-body">
              {/* Two column detail lookup layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                {/* Left side: Editors */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    ⚙️ Atualização Administrativa da GOP
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Status do Chamado (12 Etapas POP) *</label>
                      <select 
                        className="form-control"
                        value={editingTicket.status_atual}
                        onChange={(e) => setEditingTicket({ ...editingTicket, status_atual: e.target.value })}
                      >
                        <option value="1 - Recebido — em triagem">1 - Recebido — em triagem</option>
                        <option value="2 - Em vistoria técnica">2 - Em vistoria técnica</option>
                        <option value="3 - Vistoria concluída">3 - Vistoria concluída</option>
                        <option value="4 - Aguardando orçamento">4 - Aguardando orçamento</option>
                        <option value="5 - Orçamento em análise/decisão">5 - Orçamento em análise/decisão</option>
                        <option value="6 - Recurso / remanejamento">6 - Recurso / remanejamento</option>
                        <option value="7 - Adequação em execução">7 - Adequação em execução</option>
                        <option value="8 - Autorizado — CTO acionada">8 - Autorizado — CTO acionada</option>
                        <option value="9 - Aguardando aparelho/instalação">9 - Aguardando aparelho/instalação</option>
                        <option value="10 - Concluído">10 - Concluído</option>
                        <option value="11 - Encerrado">11 - Encerrado</option>
                        <option value="Suspenso / pendente">Suspenso / pendente</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Setor Responsável Atual *</label>
                      <select 
                        className="form-control"
                        value={editingTicket.setor_responsavel}
                        onChange={(e) => setEditingTicket({ ...editingTicket, setor_responsavel: e.target.value })}
                      >
                        <option value="GOP">GOP</option>
                        <option value="CPS">CPS</option>
                        <option value="GIN">GIN</option>
                        <option value="CTO">CTO</option>
                        <option value="CTIN">CTIN</option>
                        <option value="Unidade Escolar">Unidade Escolar</option>
                        <option value="GIN / Unidade Escolar">GIN / Unidade Escolar</option>
                        <option value="CPS / Unidade Escolar">CPS / Unidade Escolar</option>
                        <option value="COMP">COMP</option>
                        <option value="GMP">GMP</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Prioridade *</label>
                      <select 
                        className="form-control"
                        value={editingTicket.prioridade}
                        onChange={(e) => setEditingTicket({ ...editingTicket, prioridade: e.target.value })}
                      >
                        <option value="Baixa">Baixa</option>
                        <option value="Média">Média</option>
                        <option value="Alta">Alta</option>
                        <option value="Crítica">Crítica</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Próxima Providência (O que falta fazer) *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required
                        value={editingTicket.proxima_providencia}
                        onChange={(e) => setEditingTicket({ ...editingTicket, proxima_providencia: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Última Movimentação Relevante *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required
                        value={editingTicket.ultima_movimentacao || ''}
                        onChange={(e) => setEditingTicket({ ...editingTicket, ultima_movimentacao: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
                      <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox" 
                          id="c_cto"
                          checked={editingTicket.comunicacao_cto === 'Sim'}
                          onChange={(e) => setEditingTicket({ ...editingTicket, comunicacao_cto: e.target.checked ? 'Sim' : 'Não' })}
                        />
                        <label htmlFor="c_cto" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>Comunicação CTO?</label>
                      </div>

                      <div className="form-group">
                        <select 
                          className="form-control"
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                          value={editingTicket.informacao_validada}
                          onChange={(e) => setEditingTicket({ ...editingTicket, informacao_validada: e.target.value })}
                        >
                          <option value="Sim">Validada</option>
                          <option value="Pendente de Vistoria">Pendente de Vistoria</option>
                          <option value="Não validada">Não Validada</option>
                          <option value="Não procede">Não procede</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Observações Gerais</label>
                      <textarea 
                        className="form-control" 
                        rows="2" 
                        value={editingTicket.observacoes}
                        onChange={(e) => setEditingTicket({ ...editingTicket, observacoes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Right side: Summary & Timeline */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--secondary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    🏢 Ficha Técnica da Demanda
                  </h4>

                  <div style={{ 
                    padding: '12px', 
                    borderRadius: 'var(--radius-xs)', 
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '20px',
                    fontWeight: '600'
                  }}>
                    <div><strong>Local exato:</strong> {editingTicket.local_demanda}</div>
                    <div><strong>Tipo de solicitação:</strong> {editingTicket.tipo_demanda}</div>
                    <div><strong>Aparelho atual:</strong> {editingTicket.tipo_aparelho || 'Não informado'}</div>
                    <div><strong>Aptidão técnica:</strong> {editingTicket.resultado_aptidao}</div>
                    <div><strong>Abertura:</strong> {formatDateBrazilian(editingTicket.criado_em)}</div>
                    <div><strong>Última Alteração:</strong> {formatDateBrazilian(editingTicket.modificado_em)}</div>
                    <div style={{ color: 'var(--color-orange)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IconClock />
                      <span>Sem movimentação há {getInactivityDays(editingTicket.modificado_em)} dias.</span>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    ⏳ Linha de Tempo do Chamado
                  </h4>

                  <div className="timeline" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '6px' }}>
                    {history
                      .filter(h => h.id_chamado === editingTicket.id_chamado)
                      .map(h => (
                        <div key={h.id_evento} className="timeline-event">
                          <div className="timeline-event-marker" />
                          <div className="timeline-event-card" style={{ padding: '8px 10px' }}>
                            <div className="timeline-event-meta">
                              <span>📅 {formatDateBrazilian(h.data)}</span>
                              <span>👤 {h.responsavel_registro}</span>
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{h.marco_relevante}</div>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.3' }}>{h.observacao}</p>
                          </div>
                        </div>
                      ))}
                    {history.filter(h => h.id_chamado === editingTicket.id_chamado).length === 0 && (
                      <p style={{ fontSize: '11px', color: 'var(--text-light)', textAlign: 'center', padding: '10px', fontWeight: '600' }}>
                        Nenhum evento registrado.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setSelectedEmailTicketId(editingTicket.id_chamado);
                  setCustomEmailBody(buildEmailDraft(emailTemplates, tickets, editingTicket.id_chamado, selectedTemplateIndex));
                  setCurrentTab('email');
                  setShowEditModal(false);
                }}
                style={{ marginRight: 'auto' }}
              >
                <IconMail />
                <span>Minutar E-mail</span>
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                Fechar
              </button>
              <button type="button" className="btn btn-primary" onClick={saveEditedTicket}>
                <IconCheck />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <Analytics />
    </div>
  );
}
