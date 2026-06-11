import { Fragment, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  LayoutDashboard,
  ListTodo,
  Search,
  FileText,
  Mail,
  Sun,
  Moon,
  Plus,
  FolderOpen,
  RefreshCw,
  AlertTriangle,
  AlertOctagon,
  Building2,
  Clock,
  Calendar,
  Check,
  X,
  Compass,
  MapPin,
  Copy,
  Cloud,
  User,
  Database,
  Activity,
  CheckCircle2,
  Settings,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import dbData from './data/db.json';
import { createClient } from '@supabase/supabase-js';
import { Analytics } from '@vercel/analytics/react';
import {
  formatDateBrazilian as fmtDateBR,
  inactivityDays as calcInactivityDays,
  ageDays as calcAgeDays,
  isInactive,
  slaLevel,
  ageLevel,
  computeMetrics,
  stuckRanking,
  filterBySector,
  sectorSummary,
  compileEmailTemplate,
  searchSchools,
  SECTORS,
  severidadeInatividade,
  normalizeSector,
  matchesSchool,
  SLA_WARN_DAYS,
  SLA_SEVERE_DAYS,
  AGE_WARN_DAYS,
  AGE_SEVERE_DAYS
} from './lib/logic.js';
import { createTicketSchema, editTicketSchema, firstValidationMessage } from './lib/validation.js';
import OperationalMap from './components/OperationalMap.jsx';
import { computeBairroRisk } from './lib/mapRisk.js';
import MapLegend from './components/MapLegend.jsx';
import { STATUSES, STATUS_LIST } from './domain/statuses.js';
import { SECTORS as DOMAIN_SECTORS, SECTOR_LIST } from './domain/sectors.js';
import { PRIORITY_LIST } from './domain/priorities.js';
import { getOperationalSummary, getActionItems } from './lib/operationalIntelligence.js';
import { getSchoolDossierData } from './lib/schoolDossier.js';
import {
  uploadTicketAttachment,
  listTicketAttachments,
  listSchoolAttachments,
  deleteTicketAttachment,
  getAttachmentPublicUrl,
  getAttachmentDownloadUrl
} from './lib/attachments.js';
import { fetchEscolas } from './services/escolasService.js';
import { fetchHistorico, insertHistoryEvent } from './services/historicoService.js';
import {
  fetchChamados,
  createTicketWithHistory,
  updateTicketWithHistory
} from './services/chamadosService.js';


// Data dinâmica: "hoje" é sempre a data real do dia. Os cálculos de inatividade
// e antiguidade são derivados em ./lib/logic.js a partir desta referência.
const todayRef = () => new Date();

const normalizePriorityClass = (priority) => {
  if (!priority) return '';
  return priority
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const initialTickets = dbData?.chamados || [];
const initialSchools = dbData?.escolas || [];
const initialHistory = dbData?.historico || [];
const initialEmailTemplates = dbData?.modelos_email || [];
const initialSelectedSchool = null;

const buildEmailDraft = (templates, ticketList, ticketId, templateIndex) => {
  if (!ticketId) return 'Selecione um chamado para gerar a minuta.';
  const ticket = ticketList.find((t) => t.id_chamado === ticketId);
  const templateText = templates[templateIndex]?.template || '';
  return ticket
    ? compileEmailTemplate(templateText, ticket, todayRef())
    : 'Chamado não encontrado.';
};

// Premium wrappers around Lucide Icons for drop-in backward compatibility
const IconDashboard = () => <LayoutDashboard size={18} strokeWidth={2.2} />;
const IconList = () => <ListTodo size={18} strokeWidth={2.2} />;
const IconSearch = () => <Search size={18} strokeWidth={2.2} />;
const IconForm = () => <FileText size={18} strokeWidth={2.2} />;
const IconMail = () => <Mail size={18} strokeWidth={2.2} />;
const IconSun = () => <Sun size={18} strokeWidth={2.2} />;
const IconMoon = () => <Moon size={18} strokeWidth={2.2} />;
const IconPlus = () => <Plus size={18} strokeWidth={2.2} />;
const IconFolder = () => <FolderOpen size={18} strokeWidth={2.2} />;
const IconRefresh = () => <RefreshCw size={18} strokeWidth={2.2} />;
const IconWarning = () => <AlertTriangle size={18} strokeWidth={2.2} />;
const IconSiren = () => <AlertOctagon size={18} strokeWidth={2.2} />;
const IconBuilding = () => <Building2 size={18} strokeWidth={2.2} />;
const IconClock = () => <Clock size={18} strokeWidth={2.2} />;
const IconCalendar = () => <Calendar size={18} strokeWidth={2.2} />;
const IconCheck = () => <Check size={18} strokeWidth={2.2} />;
const IconClose = () => <X size={18} strokeWidth={2.2} />;
const IconFocus = () => <Compass size={18} strokeWidth={2.2} />;
const IconPin = () => <MapPin size={18} strokeWidth={2.2} />;
const IconCopy = () => <Copy size={18} strokeWidth={2.2} />;
const IconSettings = () => <Settings size={18} strokeWidth={2.2} />;
const IconDatabase = () => <Database size={18} strokeWidth={2.2} />;
const IconActivity = () => <Activity size={18} strokeWidth={2.2} />;
const IconCheckCircle = () => <CheckCircle2 size={18} strokeWidth={2.2} />;
const IconFileText = () => <FileText size={18} strokeWidth={2.2} />;
const IconUser = () => <User size={18} strokeWidth={2.2} />;
const IconChevronRight = ({ size = 18 }) => <ChevronRight size={size} strokeWidth={2.2} />;
const IconChevronDown = ({ size = 18 }) => <ChevronDown size={size} strokeWidth={2.2} />;

const EmptyState = ({ iconType, title, description, style = {} }) => {
  const renderIcon = () => {
    switch (iconType) {
      case 'search':
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        );
      case 'attachment':
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        );
      case 'ticket':
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case 'history':
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
            <path d="M12 2a10 10 0 0 0-7.38 16.72" strokeDasharray="3 3" />
          </svg>
        );
      default:
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
    }
  };

  return (
    <div className="empty-state-container" style={style}>
      <div className="empty-state-icon-wrapper">{renderIcon()}</div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-description">{description}</p>
    </div>
  );
};

const IconCloud = () => <Cloud size={18} strokeWidth={2.2} />;
const IconInfo = (props) => <AlertTriangle {...props} size={18} strokeWidth={2.2} />;

const VALID_TABS = ['dashboard', 'tickets', 'lookup', 'form', 'email', 'cloud'];
const VALID_THEMES = ['dark', 'light'];

function rotuloNivel(nivel) {
  switch (nivel) {
    case 'critico': return 'Crítico';
    case 'alto': return 'Alto';
    case 'moderado': return 'Moderado';
    case 'vigilancia': return 'Vigilância';
    case 'em-dia': return 'Em dia';
    default: return 'Sem cobertura';
  }
}

export default function App() {
  const dossierRef = useRef(null);
  const [initialCloudConfig] = useState(() => ({
    url: import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || '',
    key: import.meta.env.VITE_SUPABASE_KEY || localStorage.getItem('supabase_key') || ''
  }));

  // App states — isInitialLoad só inicia como true quando há credenciais de nuvem disponíveis
  const [isInitialLoad, setIsInitialLoad] = useState(() => !!(initialCloudConfig.url && initialCloudConfig.key));
  const [currentTab, setCurrentTab] = useState(() => {
    try {
      const savedTab = sessionStorage.getItem('gop_current_tab');
      return VALID_TABS.includes(savedTab) ? savedTab : 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [tickets, setTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('gop_tickets');
      return saved ? JSON.parse(saved) : initialTickets;
    } catch {
      return initialTickets;
    }
  });
  const [schools, setSchools] = useState(() => {
    try {
      const saved = localStorage.getItem('gop_schools');
      return saved ? JSON.parse(saved) : initialSchools;
    } catch {
      return initialSchools;
    }
  });
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('gop_history');
      return saved ? JSON.parse(saved) : initialHistory;
    } catch {
      return initialHistory;
    }
  });

  // Persistir chamados, escolas e histórico localmente para offline/local-fallback
  useEffect(() => {
    localStorage.setItem('gop_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('gop_schools', JSON.stringify(schools));
  }, [schools]);

  useEffect(() => {
    localStorage.setItem('gop_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    try {
      sessionStorage.setItem('gop_current_tab', currentTab);
    } catch (e) {
      console.error('Erro ao salvar tab no sessionStorage:', e);
    }
  }, [currentTab]);

  const [emailTemplates, setEmailTemplates] = useState(initialEmailTemplates);
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('gop_theme');
      return VALID_THEMES.includes(savedTheme) ? savedTheme : 'dark';
    } catch {
      return 'dark';
    }
  }); // 'dark' or 'light'

  useEffect(() => {
    try {
      localStorage.setItem('gop_theme', theme);
    } catch (e) {
      console.error('Erro ao salvar tema no localStorage:', e);
    }
  }, [theme]);
  const [sortField, setSortField] = useState('id_chamado');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [emailTab, setEmailTab] = useState('preview');
  const [expandedTicketId, setExpandedTicketId] = useState(null);

  // Controle de comentários do histórico
  const [newTicketComment, setNewTicketComment] = useState('');
  const [schoolLogs, setSchoolLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('gop_school_notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [newCommentText, setNewCommentText] = useState('');

  // Persistir anotações de escolas localmente no localStorage
  useEffect(() => {
    localStorage.setItem('gop_school_notes', JSON.stringify(schoolLogs));
  }, [schoolLogs]);

  const renderRichEmail = (text, ticket) => {
    if (!text) return '';
    let rich = text;

    // Escapar caracteres HTML básicos para segurança XSS
    rich = rich.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Converter quebras de linha em tags <br/> para HTML
    rich = rich.replace(/\n/g, '<br/>');

    if (!ticket) {
      return <div dangerouslySetInnerHTML={{ __html: rich }} />;
    }

    // Lista de variáveis a serem realçadas em negrito e ciano
    const vars = [
      ticket.id_chamado,
      ticket.unidade_escolar,
      ticket.designacao,
      ticket.status_atual,
      ticket.setor_responsavel,
      ticket.prioridade,
      ticket.local_demanda,
      ticket.proxima_providencia
    ].filter(Boolean);

    // Ordenar de forma decrescente para evitar substituição parcial de termos menores
    vars.sort((a, b) => b.length - a.length);

    // Substituir ocorrências exatas por <strong> estilizado
    vars.forEach((v) => {
      const escaped = v.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'g');
      rich = rich.replace(regex, '<strong class="email-highlight">$1</strong>');
    });

    return <div dangerouslySetInnerHTML={{ __html: rich }} />;
  };
  const [selectedBairroNormalized, setSelectedBairroNormalized] = useState(null);
  const [focusedBairro, setFocusedBairro] = useState(null);
  const [vistaTerritorio, setVistaTerritorio] = useState('mapa'); // 'mapa' | 'lista'

  // Cloud (Supabase) integration states
  const [supabaseUrl, setSupabaseUrl] = useState(initialCloudConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(initialCloudConfig.key);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('Local (db.json)');
  const [cloudLoading, setCloudLoading] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState(null);

  // Estados de controle para arquivos e uploads reais
  const [ticketAttachments, setTicketAttachments] = useState([]);
  const [schoolAttachments, setSchoolAttachments] = useState([]);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [allAttachments, setAllAttachments] = useState([]);

  // Lookup tab states
  const [lookupSchoolQuery, setLookupSchoolQuery] = useState(
    initialSelectedSchool?.unidade_escolar || ''
  );
  const [selectedSchool, setSelectedSchool] = useState(initialSelectedSchool);
  const [showLookupSuggestions, setShowLookupSuggestions] = useState(false);

  // Tickets tab states
  const [ticketSearch, setTicketSearch] = useState('');
  const [activeListsView, setActiveListsView] = useState('all');
  const [editingTicket, setEditingTicket] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const [isSavingHistory, setIsSavingHistory] = useState(false);

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
  const [customEmailBody, setCustomEmailBody] = useState(() =>
    buildEmailDraft(initialEmailTemplates, initialTickets, '', 0)
  );
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'error' | 'info'

  // Display floating toast
  const triggerToast = (msg, type) => {
    const kind =
      type || (/(erro|falha|inv[áa]lid|preencha|primeiro)/i.test(msg) ? 'error' : 'success');
    setToastMessage(msg);
    setToastType(kind);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handleAddSchoolLog = useCallback(async () => {
    if (!newCommentText.trim()) return;

    const newLog = {
      id: 'SL-' + Date.now(),
      type: 'comentario',
      date: new Date().toISOString(),
      content: newCommentText,
      docMeta: null,
      user: 'GOP / 3ª CRE'
    };

    // Se estiver conectado à nuvem Supabase, salva o log diretamente na tabela `historico`
    if (cloudConnected && supabaseClient) {
      try {
        const newHistoryEvent = {
          id_evento: newLog.id,
          data: newLog.date,
          designacao: selectedSchool.designacao,
          unidade_escolar: selectedSchool.unidade_escolar,
          marco_relevante: 'Nota Técnica GOP',
          setor: 'GOP',
          responsavel_registro: 'GOP / 3ª CRE',
          observacao: newCommentText
        };

        await insertHistoryEvent(supabaseClient, newHistoryEvent);

        // Atualiza o estado local do histórico
        setHistory((prev) => [newHistoryEvent, ...prev]);

        setNewCommentText('');
        triggerToast('Anotação técnica registrada na ficha!', 'success');
      } catch (err) {
        console.error('Falha ao salvar histórico na nuvem:', err);
        triggerToast('Erro ao registrar anotação técnica na nuvem.', 'error');
      }
    } else {
      // Modo local offline
      setSchoolLogs((prev) => {
        const list = prev[selectedSchool.designacao] || [];
        return {
          ...prev,
          [selectedSchool.designacao]: [newLog, ...list]
        };
      });
      setNewCommentText('');
      triggerToast('Anotação técnica registrada localmente (Modo Offline)!', 'info');
    }
  }, [newCommentText, selectedSchool, cloudConnected, supabaseClient]);

  const refreshEmailDraft = (
    ticketId = selectedEmailTicketId,
    templateIndex = selectedTemplateIndex
  ) => {
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
    const onKey = (e) => {
      if (e.key === 'Escape' && !isSavingTicket && !isSavingHistory) {
        setShowEditModal(false);
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [showEditModal, isSavingTicket, isSavingHistory]);

  // Carrega anexos consolidados da escola de forma reativa
  useEffect(() => {
    const fetchSchoolAttachments = async () => {
      if (supabaseClient && selectedSchool?.designacao) {
        try {
          const anexos = await listSchoolAttachments(supabaseClient, selectedSchool.designacao);
          setSchoolAttachments(anexos || []);
        } catch (err) {
          console.error('Erro ao carregar anexos da escola:', err);
          setSchoolAttachments([]);
        }
      } else {
        setSchoolAttachments([]);
      }
    };
    fetchSchoolAttachments();
  }, [selectedSchool, supabaseClient]);

  const handleUploadTicketAttachment = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !editingTicket) return;

    setAttachmentUploading(true);
    try {
      const anexo = await uploadTicketAttachment(supabaseClient, editingTicket, file);
      setTicketAttachments((prev) => [anexo, ...prev]);
      setSchoolAttachments((prev) => [anexo, ...prev]);
      setAllAttachments((prev) => [anexo, ...prev]);
      if (anexo && anexo._historyEvent) {
        setHistory((prev) => [anexo._historyEvent, ...prev]);
      }
      triggerToast('Arquivo enviado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro no upload do anexo:', err);
      triggerToast(err.message || 'Erro ao enviar arquivo.', 'error');
    } finally {
      setAttachmentUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteTicketAttachment = async (attachment) => {
    if (!window.confirm(`Tem certeza que deseja excluir o anexo "${attachment.nome_original}"?`))
      return;

    try {
      const deleteEvent = await deleteTicketAttachment(supabaseClient, attachment);
      setTicketAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      setSchoolAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      setAllAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      if (deleteEvent && typeof deleteEvent === 'object') {
        setHistory((prev) => [deleteEvent, ...prev]);
      }
      triggerToast('Arquivo excluído com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao excluir anexo:', err);
      triggerToast(err.message || 'Erro ao excluir arquivo.', 'error');
    }
  };

  // 2. Initialize Supabase Connection
  const initializeSupabase = async (url, key) => {
    setCloudLoading(true);
    setIsInitialLoad(true);
    setSyncStatusText('Conectando à nuvem...');
    try {
      const client = createClient(url, key);
      setSupabaseClient(client);

      // Verify connection by loading schools
      const schoolsData = await fetchEscolas(client);

      // If schools table exists, load cloud datasets
      setCloudConnected(true);
      setSyncStatusText('Base online ativa');

      if (schoolsData && schoolsData.length > 0) {
        setSchools(schoolsData);

        // Load tickets
        const ticketsData = await fetchChamados(client);
        setTickets(ticketsData);

        // Load timeline history
        const historyData = await fetchHistorico(client);
        setHistory(historyData);

        // Load all attachments
        const { data: attachmentsData, error: attachmentsError } = await client
          .from('anexos_chamado')
          .select('*');

        if (attachmentsError) throw attachmentsError;
        if (attachmentsData) setAllAttachments(attachmentsData);

        // Load e-mail templates from Supabase so the app uses the curated online models.
        const { data: emailTemplatesData, error: emailTemplatesError } = await client
          .from('modelos_email')
          .select('*')
          .order('id', { ascending: true });

        if (emailTemplatesError) throw emailTemplatesError;
        if (emailTemplatesData) {
          setEmailTemplates(emailTemplatesData);
          setCustomEmailBody(
            buildEmailDraft(emailTemplatesData, ticketsData || initialTickets, '', 0)
          );
        }
        triggerToast('Base online carregada com sucesso!', 'success');
      } else {
        setSyncStatusText('Conectado (Tabelas vazias)');
        triggerToast('Conectado à nuvem, mas a base está vazia. Usando dados locais.', 'info');
      }
    } catch (err) {
      console.error('Supabase Error:', err);
      setCloudConnected(false);
      setSupabaseClient(null);
      setSyncStatusText('Erro de conexão - Modo Local');
      triggerToast('Erro ao carregar dados online. Usando base local.');
    } finally {
      setCloudLoading(false);
      setIsInitialLoad(false);
    }
  };

  // 1. Initial cloud configuration. Local db.json is loaded by lazy state above.
  useEffect(() => {
    if (initialCloudConfig.url && initialCloudConfig.key) {
      const timer = window.setTimeout(() => {
        initializeSupabase(initialCloudConfig.url, initialCloudConfig.key);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCloudConfig]);

  const handleConnectCloud = (e) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      triggerToast('Preencha a URL e a Chave do Supabase!');
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
      const normalized = (dbData.chamados || []).map(t => ({
        ...t,
        setor_responsavel: normalizeSector(t.setor_responsavel)
      }));
      setTickets(normalized);
      setSchools(dbData.escolas || []);
      setHistory(dbData.historico || []);
      setAllAttachments([]);
    }
    triggerToast('Desconectado da nuvem. Modo local ativo.');
  };

  // Upload local db.json items to Supabase
  const handleSyncLocalToCloud = async () => {
    triggerToast('A sincronização local para a nuvem está desativada por segurança.', 'error');
  };

  // Date Formatting Helpers — delega ao módulo de lógica (fonte única da verdade)
  const formatDateBrazilian = (isoStr) => fmtDateBR(isoStr);

  // Dias sem movimentação, calculados em relação à data real de hoje.
  const getInactivityDays = (isoStr) => calcInactivityDays({ modificado_em: isoStr }, todayRef());

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

    if (status.startsWith('1 ')) {
      color = 'hsl(214, 90%, 52%)';
      bg = 'rgba(59, 130, 246, 0.08)';
    } else if (status.startsWith('2 ') || status.startsWith('3 ')) {
      color = 'hsl(199, 89%, 48%)';
      bg = 'rgba(14, 165, 233, 0.08)';
    } else if (status.startsWith('4 ') || status.startsWith('5 ')) {
      color = 'hsl(38, 92%, 44%)';
      bg = 'rgba(245, 158, 11, 0.08)';
    } else if (status.startsWith('6 ')) {
      color = 'hsl(20, 90%, 50%)';
      bg = 'rgba(249, 115, 22, 0.08)';
    } else if (status.startsWith('7 ') || status.startsWith('8 ') || status.startsWith('9 ')) {
      color = 'hsl(175, 80%, 35%)';
      bg = 'rgba(13, 148, 136, 0.08)';
    } else if (status.startsWith('10 ')) {
      color = 'hsl(142, 72%, 36%)';
      bg = 'rgba(16, 185, 129, 0.08)';
    }

    return {
      '--status-color': color,
      '--status-color-tint': bg,
      border: `1px solid ${color}`
    };
  };

  // Metric Computations — centralizadas no módulo de lógica (data dinâmica)
  const metrics = computeMetrics(tickets, todayRef());
  const totalTickets = metrics.total;
  const openTickets = metrics.open;
  const inactivePlus7 = metrics.inactivePlus7; // SLA âmbar ou pior
  const inactivePlus15 = metrics.inactivePlus15; // SLA vermelho
  const agePlus30 = metrics.agePlus30; // antiguidade roxo claro ou pior
  const agePlus60 = metrics.agePlus60; // antiguidade roxo intenso

  const summary = getOperationalSummary(tickets, schools, allAttachments, todayRef());
  const actionItems = getActionItems(tickets, schools, allAttachments, todayRef());
  const territorialRisk = useMemo(
    () => computeBairroRisk(tickets, schools, { attachments: allAttachments, ref: todayRef() }),
    [tickets, schools, allAttachments]
  );

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
    } else if (activeListsView === 'stuck' || activeListsView === 'inactive7') {
      result = result.filter(
        (t) => !isInactive(t) && calcInactivityDays(t, todayRef()) >= SLA_WARN_DAYS
      );
    } else if (activeListsView === 'inactive15') {
      result = result.filter(
        (t) => !isInactive(t) && calcInactivityDays(t, todayRef()) >= SLA_SEVERE_DAYS
      );
    } else if (activeListsView === 'age30') {
      result = result.filter(
        (t) => !isInactive(t) && calcAgeDays(t, todayRef()) >= AGE_WARN_DAYS
      );
    } else if (activeListsView === 'age60') {
      result = result.filter(
        (t) => !isInactive(t) && calcAgeDays(t, todayRef()) >= AGE_SEVERE_DAYS
      );
    } else if (activeListsView === 'active') {
      result = result.filter((t) => !isInactive(t));
    } else if (activeListsView === 'closed') {
      result = result.filter((t) => isInactive(t));
    }

    // Filtro rápido de prioridade
    if (filterPriority) {
      result = result.filter((t) => t.prioridade === filterPriority);
    }

    // Filtro rápido de status
    if (filterStatus) {
      result = result.filter((t) => t.status_atual === filterStatus);
    }

    // Apply text search
    if (ticketSearch.trim()) {
      const q = ticketSearch.toLowerCase();
      result = result.filter(
        (t) =>
          String(t.id_chamado || '')
            .toLowerCase()
            .includes(q) ||
          String(t.unidade_escolar || '')
            .toLowerCase()
            .includes(q) ||
          String(t.local_demanda || '')
            .toLowerCase()
            .includes(q) ||
          String(t.proxima_providencia || '')
            .toLowerCase()
            .includes(q) ||
          String(t.status_atual || '')
            .toLowerCase()
            .includes(q)
      );
    }

    // Apply dynamic sorting
    if (sortField) {
      result.sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';

        if (sortField === 'prioridade') {
          const getPriorityWeight = (p) => {
            const val = String(p).trim().toLowerCase();
            if (val === 'crítica' || val === 'critica') return 4;
            if (val === 'alta') return 3;
            if (val === 'média' || val === 'media') return 2;
            if (val === 'baixa') return 1;
            return 0;
          };
          valA = getPriorityWeight(valA);
          valB = getPriorityWeight(valB);
        }

        if (sortField === 'modificado_em') {
          valA = new Date(valA || 0).getTime();
          valB = new Date(valB || 0).getTime();
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB, 'pt-BR')
            : valB.localeCompare(valA, 'pt-BR');
        }

        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
    }

    return result;
  };

  // Ranking dos chamados ativos mais parados (delegado ao módulo de lógica)
  const getDashboardStuckRanking = () => stuckRanking(tickets, todayRef(), 5);

  // Edit ticket action
  const openTicketEdit = async (ticket) => {
    setEditingTicket({ ...ticket });
    setShowEditModal(true);

    if (supabaseClient) {
      try {
        const anexos = await listTicketAttachments(supabaseClient, ticket.id_chamado);
        setTicketAttachments(anexos);
      } catch (err) {
        console.error('Erro ao listar anexos do chamado:', err);
        setTicketAttachments([]);
      }
    } else {
      setTicketAttachments([]);
    }
  };

  const goToCommunicationForTicket = (ticket, type) => {
    let templateIndex = 0;
    if (type === 'cto') {
      const idx = emailTemplates.findIndex(
        (t) =>
          (t.tipo || '').toLowerCase().includes('cto') ||
          (t.template || '').toLowerCase().includes('cto')
      );
      templateIndex = idx !== -1 ? idx : 0;
      if (idx === -1) {
        triggerToast(
          'Modelo de e-mail para CTO não encontrado. Usando primeiro modelo disponível.',
          'info'
        );
      }
    } else if (type === 'school') {
      const idx = emailTemplates.findIndex(
        (t) =>
          (t.tipo || '').toLowerCase().includes('escola') ||
          (t.tipo || '').toLowerCase().includes('vistoria') ||
          (t.template || '').toLowerCase().includes('unidade')
      );
      templateIndex = idx !== -1 ? idx : 0;
    }

    setSelectedEmailTicketId(ticket.id_chamado);
    setSelectedTemplateIndex(templateIndex);
    setCustomEmailBody(buildEmailDraft(emailTemplates, tickets, ticket.id_chamado, templateIndex));
    setCurrentTab('email');
    triggerToast(`Minuta de e-mail gerada para o chamado ${ticket.id_chamado}!`, 'info');
  };

  const renderOperationalSummary = () => {
    const { totalActive, criticalCount, stuckCount, topBairros, prioritizedTickets } = summary;

    return (
      <div className="operational-summary-card animate-slide-in">
        <div className="summary-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="summary-icon" style={{ display: 'inline-flex' }}>
              <IconActivity />
            </span>
            <h3 className="summary-title">Resumo operacional</h3>
          </div>
          <span className="summary-badge-editorial">Leitura Operacional</span>
        </div>

        <p className="summary-text">
          Há <strong>{totalActive}</strong> chamados ativos, sendo <strong>{criticalCount}</strong>{' '}
          em prioridade alta ou crítica. Foram identificados <strong>{stuckCount}</strong> chamados
          sem movimentação há mais de 15 dias. As maiores concentrações de chamados aparecem em{' '}
          {topBairros.length > 0
            ? topBairros.map((b, i) => (
                <span key={b}>
                  <strong>{b}</strong>
                  {i < topBairros.length - 1 ? ' e ' : ''}
                </span>
              ))
            : 'diversos setores'}
          . Recomenda-se priorizar os chamados{' '}
          {prioritizedTickets.length > 0
            ? prioritizedTickets.map((id, index) => (
                <span key={id}>
                  <span
                    className="priority-ticket-link"
                    onClick={() => {
                      const tk = tickets.find((t) => t.id_chamado === id);
                      if (tk) openTicketEdit(tk);
                    }}
                    title={`Abrir chamado ${id}`}
                  >
                    {id}
                  </span>
                  {index < prioritizedTickets.length - 1 ? ', ' : ''}
                </span>
              ))
            : 'indicados na fila de ação.'}
          .
        </p>

        <div className="summary-chips-container">
          <div className="summary-chip font-semibold">
            <span className="summary-chip-label">Ativos:</span>
            <span className="summary-chip-value color-blue">{totalActive}</span>
          </div>
          <div className="summary-chip font-semibold">
            <span className="summary-chip-label">Alta/Crítica:</span>
            <span className="summary-chip-value color-red">{criticalCount}</span>
          </div>
          <div className="summary-chip font-semibold">
            <span className="summary-chip-label">+15d sem movimentação:</span>
            <span className="summary-chip-value color-amber">{stuckCount}</span>
          </div>
          <div className="summary-chip font-semibold">
            <span className="summary-chip-label">Bairros Foco:</span>
            <span className="summary-chip-value color-teal">
              {topBairros.join(', ') || 'Nenhum'}
            </span>
          </div>
        </div>

        <div className="summary-footer">
          <span className="summary-footnote">
            Leitura gerada automaticamente com base nos chamados cadastrados, prioridades, prazos e
            histórico de movimentação.
          </span>
        </div>
      </div>
    );
  };

  const renderActionItems = () => {
    return (
      <div className="dashboard-section task-queue-section" style={{ marginBottom: 0 }}>
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconCheck />
            <h3>O que exige ação agora</h3>
          </div>
          <span className="task-count-badge">{actionItems.length}</span>
        </div>
        <p
          className="task-queue-intro"
          style={{
            fontSize: '13px',
            color: 'var(--text-light)',
            marginBottom: '16px',
            lineHeight: '1.45',
            fontWeight: '500'
          }}
        >
          Pendências operacionais prioritárias ordenadas por urgência. Ações de e-mail iniciam
          minutas pré-configuradas.
        </p>

        <div
          className="task-list"
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {actionItems.length > 0 ? (
            actionItems.map((item) => {
              let borderCol = 'var(--primary)';
              let tagText = 'Pendência';
              let tagClass = 'tag-primary';

              const inactDays = calcInactivityDays(item.ticket, todayRef());
              if (item.type === 'attachment') {
                borderCol = 'var(--color-red)';
                tagText = 'Urgente';
                tagClass = 'tag-danger';
              } else if (item.type === 'stuck') {
                const sev = severidadeInatividade(inactDays);
                if (sev.nivel === 'CRITICO') {
                  borderCol = 'var(--color-red)';
                  tagText = 'Crítico — revisar caso';
                  tagClass = 'tag-danger';
                } else if (sev.nivel === 'ALTO') {
                  borderCol = 'var(--color-red)';
                  tagText = 'Alto risco';
                  tagClass = 'tag-danger';
                } else {
                  borderCol = 'var(--color-amber)';
                  tagText = 'Atenção';
                  tagClass = 'tag-warning';
                }
              } else if (item.type === 'stuck-group') {
                borderCol = 'var(--color-red)';
                tagText = 'Inatividade';
                tagClass = 'tag-danger';
              } else if (item.type === 'cto') {
                borderCol = 'var(--color-blue)';
                tagText = 'Comunicar CTO';
                tagClass = 'tag-info';
              } else if (item.type === 'school') {
                borderCol = 'var(--secondary)';
                tagText = 'Retorno Escola';
                tagClass = 'tag-secondary';
              } else if (item.type === 'completion') {
                borderCol = 'var(--color-green)';
                tagText = 'Encerramento';
                tagClass = 'tag-success';
              }

              return (
                <div
                  key={item.id}
                  className="task-item animate-hover"
                  style={{
                    padding: '14px 18px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-app)',
                    borderLeft: `4px solid ${borderCol}`,
                    transition: 'var(--transition)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {['attachment', 'stuck', 'stuck-group'].includes(item.type) && (
                        <span
                          className={`sla-pulse-active ${item.type === 'stuck' && borderCol === 'var(--color-amber)' ? 'sla-pulse-amber' : 'sla-pulse-red'}`}
                          style={{ flexShrink: 0 }}
                        />
                      )}
                      <span
                        className={`task-tag ${tagClass}`}
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          letterSpacing: '0.4px'
                        }}
                      >
                        {tagText}
                      </span>
                    </div>
                    <span
                      className="task-ticket-id"
                      onClick={() => openTicketEdit(item.ticket)}
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        color: 'var(--text-light)',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                      title={`Abrir chamado ${item.ticket.id_chamado}`}
                    >
                      {item.ticket.id_chamado}
                    </span>
                  </div>
                  <h4
                    className="task-title"
                    style={{
                      fontSize: '13.5px',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      margin: 0
                    }}
                  >
                    {item.title}
                  </h4>
                  <p
                    className="task-desc"
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--text-muted)',
                      margin: 0,
                      lineHeight: '1.4'
                    }}
                  >
                    {item.description}
                  </p>
                  <div
                    className="task-actions"
                    style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}
                  >
                    <button
                      className="btn-task-action"
                      onClick={() => {
                        if (item.type === 'stuck-group') {
                          setActiveListsView('inactive15');
                          setCurrentTab('tickets');
                          setTimeout(() => {
                            const el = document.getElementById('lists-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }, 50);
                        } else if (item.type === 'cto' || item.type === 'school') {
                          goToCommunicationForTicket(item.ticket, item.type);
                        } else {
                          openTicketEdit(item.ticket);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        backgroundColor: 'var(--primary-light)',
                        border: '1px solid var(--border-hover)',
                        borderRadius: '6px',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      {item.actionLabel}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className="task-empty-state"
              style={{
                padding: '28px 16px',
                textAlign: 'center',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div
                className="task-empty-icon"
                style={{ display: 'inline-flex', color: 'var(--primary)' }}
              >
                <IconCheckCircle />
              </div>
              <div
                className="task-empty-title"
                style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-main)' }}
              >
                Tudo em dia!
              </div>
              <p
                className="task-empty-desc"
                style={{ fontSize: '12.5px', color: 'var(--text-light)', margin: 0 }}
              >
                Nenhuma ação urgente pendente para os chamados cadastrados.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleAddTicketHistoryEvent = async (commentText) => {
    if (isSavingHistory) return false;
    if (!commentText.trim()) return false;
    if (!supabaseClient) {
      triggerToast(
        'Registro de comentário bloqueado em modo local. Conecte a base online.',
        'error'
      );
      return false;
    }

    setIsSavingHistory(true);

    try {
      const nowIso = new Date().toISOString().substring(0, 19);
      const newEvent = {
        id_evento: `EV-MANUAL-${crypto.randomUUID()}`,
        data: nowIso,
        id_chamado: editingTicket.id_chamado,
        designacao: editingTicket.designacao,
        unidade_escolar: editingTicket.unidade_escolar,
        marco_relevante: 'Nota Técnica GOP',
        setor: 'GOP',
        responsavel_registro: 'GOP / 3ª CRE',
        observacao: commentText.trim()
      };

      const savedEvent = await insertHistoryEvent(supabaseClient, newEvent);

      setHistory((prev) => [savedEvent, ...prev]);
      triggerToast('Comentário registrado na linha do tempo!', 'success');
      return true;
    } catch (err) {
      console.error('Erro ao registrar comentário no Supabase:', err);
      triggerToast(`Falha ao registrar comentário na nuvem: ${err.message || err}`, 'error');
      return false;
    } finally {
      setIsSavingHistory(false);
    }
  };

  const saveEditedTicket = async () => {
    if (isSavingTicket) return;
    if (!supabaseClient) {
      triggerToast('Edição bloqueada em modo local. Conecte a base online.', 'error');
      return;
    }

    const validation = editTicketSchema.safeParse(editingTicket);
    if (!validation.success) {
      triggerToast(firstValidationMessage(validation), 'info');
      return;
    }

    const oldTicket = tickets.find((t) => t.id_chamado === editingTicket.id_chamado);
    if (!oldTicket) {
      triggerToast(
        'Não foi possível localizar o chamado original. Recarregue a página e tente novamente.',
        'error'
      );
      return;
    }

    const nowIso = new Date().toISOString().substring(0, 19);
    const dataFormatada = fmtDateBR(nowIso);

    const camposMapeados = {
      status_atual: 'Status',
      setor_responsavel: 'Setor Responsável',
      prioridade: 'Prioridade',
      proxima_providencia: 'Próxima Providência',
      ultima_movimentacao: 'Última Movimentação Relevante',
      comunicacao_cto: 'Comunicação CTO',
      informacao_validada: 'Informação Validada',
      local_demanda: 'Local exato',
      tipo_demanda: 'Tipo de solicitação',
      tipo_aparelho: 'Tipo de aparelho',
      btu_existente: 'BTU Existente',
      btu_pretendido: 'BTU Pretendido',
      resultado_aptidao: 'Aptidão técnica',
      observacoes: 'Observações Gerais'
    };

    const camposFemininos = [
      'prioridade',
      'proxima_providencia',
      'ultima_movimentacao',
      'informacao_validada',
      'observacoes',
      'tipo_demanda',
      'resultado_aptidao'
    ];

    const logsGerados = [];
    Object.keys(camposMapeados).forEach((campo) => {
      const valOld = String(oldTicket[campo] || '').trim();
      const valNew = String(editingTicket[campo] || '').trim();
      if (valOld !== valNew) {
        const preposicao = camposFemininos.includes(campo) ? 'alterada de' : 'alterado de';
        logsGerados.push({
          campoNome: camposMapeados[campo],
          desc: `${camposMapeados[campo]} ${preposicao} '${valOld || 'Vazio'}' para '${valNew || 'Vazio'}' em ${dataFormatada}.`
        });
      }
    });

    if (logsGerados.length === 0) {
      triggerToast('Nenhuma alteração identificada.', 'info');
      setShowEditModal(false);
      return;
    }

    const updatedRecord = {
      ...editingTicket,
      modificado_em: nowIso
    };

    const novosEventos = logsGerados.map((log) => {
      return {
        id_evento: `EV-${crypto.randomUUID()}`,
        data: nowIso,
        id_chamado: editingTicket.id_chamado,
        designacao: editingTicket.designacao,
        unidade_escolar: editingTicket.unidade_escolar,
        marco_relevante: `Alteração de ${log.campoNome}`,
        setor: (editingTicket.setor_responsavel || 'GOP').split('/')[0].trim() || 'GOP',
        responsavel_registro: 'GOP / Sistema',
        observacao: log.desc
      };
    });

    setIsSavingTicket(true);

    try {
      // 1. Gravação pessimista transacional via RPC no Supabase
      const savedTicket = await updateTicketWithHistory(
        supabaseClient,
        updatedRecord,
        novosEventos
      );

      // 3. Somente após sucesso na nuvem, atualiza o estado local do frontend
      const updatedTickets = tickets.map((t) => {
        if (t.id_chamado === editingTicket.id_chamado) {
          return savedTicket;
        }
        return t;
      });
      setTickets(updatedTickets);

      if (novosEventos.length > 0) {
        setHistory([...novosEventos, ...history]);
      }

      setShowEditModal(false);
      triggerToast('Chamado atualizado com sucesso!', 'success');
    } catch (err) {
      console.error('Cloud save failed:', err);
      triggerToast(`Falha ao salvar alteração na nuvem: ${err.message || err}`, 'error');
    } finally {
      setIsSavingTicket(false);
    }
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
    try {
      const nowIso = new Date().toISOString().substring(0, 19);

      // Constrói o registro do chamado (id_chamado é omitido para inserção na nuvem e gerado na trigger do banco)
      const ticketRecord = {
        unidade_escolar: formSelectedSchool.unidade_escolar,
        designacao: formSelectedSchool.designacao,
        data_solicitacao: nowIso,
        local_demanda: newTicket.local_demanda,
        tipo_demanda: newTicket.tipo_demanda,
        tipo_aparelho: newTicket.tipo_aparelho || 'Split',
        btu_existente: newTicket.btu_existente || '',
        btu_pretendido: newTicket.btu_pretendido || '',
        status_atual: newTicket.status_atual,
        setor_responsavel: newTicket.setor_responsavel,
        proxima_providencia: newTicket.proxima_providencia,
        ultima_movimentacao: 'Chamado registrado no sistema.',
        informacao_validada: newTicket.informacao_validada,
        prioridade: newTicket.prioridade,
        comunicacao_cto: 'Não',
        observacoes: newTicket.observacoes,
        resultado_aptidao: newTicket.resultado_aptidao,
        criado_em: nowIso,
        modificado_em: nowIso
      };

      let finalTicketRecord;
      let finalEventRecord;

      if (supabaseClient) {
        try {
          const initialEvent = {
            id_evento: `EV-${crypto.randomUUID()}`, // ID robusto para evitar conflitos de chaves primarias
            data: nowIso,
            designacao: formSelectedSchool.designacao,
            unidade_escolar: formSelectedSchool.unidade_escolar,
            marco_relevante: newTicket.status_atual,
            setor: 'GOP',
            responsavel_registro: 'GOP / Sistema',
            observacao: `Abertura oficial do chamado. Demanda cadastrada para o local: ${newTicket.local_demanda}.`
          };

          // 1. Gravação pessimista transacional via RPC no Supabase
          const result = await createTicketWithHistory(
            supabaseClient,
            ticketRecord,
            initialEvent
          );
          finalTicketRecord = result.ticket;
          finalEventRecord = result.event;
        } catch (err) {
          console.error('Cloud insert failed:', err);
          triggerToast(
            `Falha ao registrar chamado na nuvem: ${err.message || err}. O formulário foi mantido para nova tentativa.`,
            'error'
          );
          setSubmitting(false);
          return; // Aborta sem criar chamado local — dado não confiável
        }
      }

      // Fallback offline: cria ID local apenas quando NÃO há conexão Supabase
      if (!supabaseClient) {
        const nextIdNum =
          tickets.reduce((max, t) => {
            const num = parseInt(t.id_chamado.split('-').pop(), 10);
            return num > max ? num : max;
          }, 0) + 1;

        const generatedId = `GOP-AR-2026-${String(nextIdNum).padStart(4, '0')}`;

        finalTicketRecord = {
          id_chamado: generatedId,
          ...ticketRecord
        };

        finalEventRecord = {
          id_evento: `EV-${crypto.randomUUID()}`,
          data: nowIso,
          id_chamado: generatedId,
          designacao: formSelectedSchool.designacao,
          unidade_escolar: formSelectedSchool.unidade_escolar,
          marco_relevante: newTicket.status_atual,
          setor: 'GOP',
          responsavel_registro: 'GOP / Sistema',
          observacao: `Abertura oficial do chamado. Demanda cadastrada para o local: ${newTicket.local_demanda}.`
        };
      }

      // Atualiza o estado local consolidando os registros reais finais
      setTickets([finalTicketRecord, ...tickets]);
      setHistory([finalEventRecord, ...history]);

      // Mostra painel de sucesso com o ID real gerado
      setNewTicketSuccess(finalTicketRecord.id_chamado);
      triggerToast(
        supabaseClient
          ? 'Chamado criado com sucesso na nuvem!'
          : 'Chamado criado em modo offline — salvo neste dispositivo.',
        supabaseClient ? 'success' : 'info'
      );

      // Limpa inputs
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
    const totalSalas = Number(school?.qtd_salas_de_aula);
    if (!school || !(totalSalas > 0)) return null;
    const coverage = Math.min(
      100,
      Math.round((Number(school.aparelhos_em_sala || 0) / totalSalas) * 100)
    );

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
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            className="circle-progress-bar"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>
            {coverage}%
          </div>
          <span
            style={{
              fontSize: '10.5px',
              color: 'var(--text-light)',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.3px'
            }}
          >
            Salas Climatizadas
          </span>
        </div>
      </div>
    );
  };

  const getStatusColor = (status) => {
    if (status.includes('Concluído') || status.includes('Encerrado')) return 'hsl(142, 70%, 45%)';
    if (
      status.includes('Recebido') ||
      status.includes('vistoria técnica') ||
      status.includes('Vistoria concluída')
    )
      return 'hsl(215, 60%, 55%)';
    if (status.includes('orçamento') || status.includes('Orçamento')) {
      if (status.includes('análise')) return 'hsl(24, 95%, 55%)';
      return 'hsl(38, 92%, 50%)';
    }
    if (status.includes('execução') || status.includes('adequação')) return 'hsl(199, 89%, 48%)';
    return 'hsl(215, 16%, 47%)';
  };

  const getSectorColor = (sector) => {
    const s = sector.toUpperCase();
    if (s.includes('GOP')) return 'hsl(199, 89%, 48%)';
    if (s.includes('CTO')) return 'hsl(174, 65%, 41%)';
    if (s.includes('CPS')) return 'hsl(340, 75%, 55%)';
    if (s.includes('GIN')) {
      if (s.includes('UNIDADE') || s.includes('ESCOLA')) return 'hsl(262, 70%, 58%)';
      return 'hsl(280, 65%, 50%)';
    }
    if (s.includes('UNIDADE') || s.includes('ESCOLA')) return 'hsl(262, 70%, 58%)';
    return 'hsl(215, 16%, 47%)';
  };

  const handleCopySummary = (text, type = 'informações') => {
    navigator.clipboard.writeText(text);
    triggerToast(`Resumo de ${type} copiado para a área de transferência!`, 'success');
  };

  const handlePrintSchoolDossier = useReactToPrint({
    contentRef: dossierRef,
    documentTitle: `Dossie_Tecnico_${selectedSchool ? selectedSchool.designacao : 'Escola'}`,
    onBeforePrint: () => {
      document.body.classList.add('printing-school-dossier');
      return Promise.resolve();
    },
    onAfterPrint: () => {
      document.body.classList.remove('printing-school-dossier');
    }
  });

  const handleExportCSV = () => {
    const filtered = getFilteredTickets();
    if (filtered.length === 0) {
      triggerToast('Nenhum chamado encontrado para exportação.', 'error');
      return;
    }

    const headers = [
      'Código',
      'Unidade Escolar',
      'Designação',
      'Data Solicitação',
      'Local Demanda',
      'Tipo Demanda',
      'Status Atual',
      'Setor Responsável',
      'Prioridade',
      'Modificado Em',
      'Resultado Aptidão',
      'Observações'
    ];

    const rows = filtered.map((t) => [
      t.id_chamado || '',
      t.unidade_escolar || '',
      t.designacao || '',
      t.data_solicitacao ? fmtDateBR(t.data_solicitacao) : '',
      t.local_demanda || '',
      t.tipo_demanda || '',
      t.status_atual || '',
      t.setor_responsavel || '',
      t.prioridade || '',
      t.modificado_em ? fmtDateBR(t.modificado_em) : '',
      t.resultado_aptidao || '',
      (t.observacoes || '').replace(/\r?\n|\r/g, ' ')
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Chamados_GOP_3CRE_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast(`Exportado ${filtered.length} chamados com sucesso!`, 'success');
  };

  const renderSortableHeader = (label, field) => {
    const isSorted = sortField === field;
    return (
      <th
        onClick={() => {
          if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortField(field);
            setSortDirection('asc');
          }
        }}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        className={`sortable-header ${isSorted ? 'sorted' : ''}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{label}</span>
          <span
            style={{
              fontSize: '13px',
              color: isSorted ? 'var(--primary)' : 'var(--text-light)',
              transition: '0.2s'
            }}
          >
            {!isSorted ? '↕' : sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        </div>
      </th>
    );
  };

  // Premium Donut chart metrics for active vs closed tickets
  const renderDashboardDonutChart = () => {
    const total = tickets.length;
    const closed = tickets.filter(
      (t) => t.status_atual === '10 - Concluído' || t.status_atual === '11 - Encerrado'
    ).length;
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
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
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
            transform={`rotate(90 ${size / 2} ${size / 2})`}
            style={{
              fontSize: '16px',
              fontWeight: '800',
              fill: 'var(--text-main)',
              fontFamily: 'var(--font-sans)'
            }}
          >
            {total}
          </text>
          <text
            x="50%"
            y="70%"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(90 ${size / 2} ${size / 2})`}
            style={{
              fontSize: '9px',
              fontWeight: '800',
              fill: 'var(--text-light)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Total
          </text>
        </svg>

        <div className="donut-legend">
          <div className="donut-legend-item">
            <div className="donut-legend-dot" style={{ backgroundColor: 'var(--primary)' }} />
            <div>
              <span>Chamados Ativos: </span>
              <strong>{active}</strong>{' '}
              <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>({activePct}%)</span>
            </div>
          </div>
          <div className="donut-legend-item">
            <div className="donut-legend-dot" style={{ backgroundColor: 'var(--border-color)' }} />
            <div>
              <span>Concluídos: </span>
              <strong>{closed}</strong>{' '}
              <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>({closedPct}%)</span>
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
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor:
              toastType === 'error'
                ? 'hsl(350, 72%, 44%)'
                : toastType === 'info'
                  ? 'var(--primary-hover)'
                  : 'hsl(150, 55%, 30%)',
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
          }}
        >
          {toastType === 'error' ? (
            <IconWarning />
          ) : toastType === 'info' ? (
            <IconSearch />
          ) : (
            <IconCheck />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div
          className="sidebar-brand"
          onClick={() => {
            setCurrentTab('dashboard');
            triggerToast('Retornando ao Painel Executivo...', 'info');
          }}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title="Ir para o Painel Executivo"
        >
          <div
            className="sidebar-logo"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
          >
            GC
          </div>
          <div className="sidebar-brand-text">
            GOP <span>Clima</span>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <ul className="sidebar-menu">
            <li>
              <button
                className={`sidebar-item ${currentTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentTab('dashboard')}
                aria-label="Painel Executivo"
                title="Painel Executivo"
              >
                <IconDashboard />
                <span>Painel Executivo</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-item ${currentTab === 'tickets' ? 'active' : ''}`}
                onClick={() => setCurrentTab('tickets')}
                aria-label="Lista de chamados"
                title="Lista de chamados"
              >
                <IconList />
                <span>Lista de chamados</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-item ${currentTab === 'lookup' ? 'active' : ''}`}
                onClick={() => setCurrentTab('lookup')}
                aria-label="Consulta por Escola"
                title="Consulta por Escola"
              >
                <IconSearch />
                <span>Consulta por Escola</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-item ${currentTab === 'form' ? 'active' : ''}`}
                onClick={() => setCurrentTab('form')}
                aria-label="Registrar chamado"
                title="Registrar chamado"
              >
                <IconForm />
                <span>Registrar chamado</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-item ${currentTab === 'email' ? 'active' : ''}`}
                onClick={() => setCurrentTab('email')}
                aria-label="Comunicações"
                title="Comunicações"
              >
                <IconMail />
                <span>Comunicações</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-item ${currentTab === 'cloud' ? 'active' : ''}`}
                onClick={() => {
                  try {
                    const isAuth = sessionStorage.getItem('gop_admin_authenticated') === 'true';
                    if (isAuth) {
                      setCurrentTab('cloud');
                    } else {
                      const pass = window.prompt(
                        'Digite a chave de acesso administrativo:'
                      );
                      if (pass === 'GOP-ADMIN-3CRE') {
                        sessionStorage.setItem('gop_admin_authenticated', 'true');
                        setCurrentTab('cloud');
                        triggerToast('Acesso administrativo concedido!', 'success');
                      } else if (pass !== null) {
                        triggerToast('Chave administrativa inválida.', 'error');
                      }
                    }
                  } catch {
                    setCurrentTab('cloud');
                  }
                }}
                aria-label="Administração dos Dados"
                title="Administração dos Dados"
              >
                <IconDatabase />
                <span>Administração dos Dados</span>
              </button>
            </li>
          </ul>
        </nav>

        <div
          className="sidebar-footer"
          style={{
            padding: '18px 16px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '11px',
            color: 'var(--text-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            fontFamily: 'var(--font-sans)',
            lineHeight: '1.4'
          }}
        >
          <div>
            Desenvolvido por{' '}
            <strong style={{ color: 'var(--text-main)', fontWeight: '700' }}>
              Wilson M. Peixoto
            </strong>{' '}
            — SME/RJ
          </div>
          <div
            style={{
              fontStyle: 'italic',
              fontSize: '10.5px',
              color: 'var(--primary)',
              fontWeight: '600'
            }}
          >
            Inovação para a Gestão Pública
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, color: 'var(--text-light)' }}
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>(21) 99497-4132</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, color: 'var(--text-light)' }}
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <a
                href="mailto:wilson.mpeixoto@rioeduca.net"
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => (e.target.style.color = 'var(--primary)')}
                onMouseOut={(e) => (e.target.style.color = 'inherit')}
              >
                wilson.mpeixoto@rioeduca.net
              </a>
            </div>
          </div>
        </div>

        {/* Toggle de tema unificado no cabeçalho (Modo Claro/Escuro) — evita controle duplicado */}
      </aside>

      {/* Main Container */}
      <main className="main-content">
        {/* Top Header */}
        <header className="main-header">
          <div className="header-title">
            <h1 className="main-portal-title">Gestão de Climatização Escolar</h1>
            <p>
              Gerência de Operações · Coordenadoria Regional de Educação (GOP/3ª CRE) · Data de
              Referência: {formatDateBrazilian(todayRef().toISOString())}
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-secondary theme-toggle-header"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Alternar entre modo escuro e claro"
            >
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
              <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setNewTicketSuccess(null);
                setCurrentTab('form');
              }}
            >
              <IconPlus />
              <span>Registrar chamado</span>
            </button>
          </div>
        </header>

        {/* Dashboard Tab */}
        {currentTab === 'dashboard' && (
          <div>
            <p className="screen-intro">
              Veja a situação geral dos chamados, os alertas de prazo e os casos que precisam de
              atenção da GOP.
            </p>

            {isInitialLoad ? (
              <div className="skeleton-container" style={{ padding: '24px 0' }}>
                <div className="skeleton-line short" style={{ height: '32px', marginBottom: '16px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
                  <div className="skeleton-card" style={{ height: '120px' }} />
                  <div className="skeleton-card" style={{ height: '120px' }} />
                  <div className="skeleton-card" style={{ height: '120px' }} />
                </div>
                <div className="skeleton-card" style={{ height: '350px' }} />
              </div>
            ) : (
              <>
                {renderOperationalSummary()}

            {/* Stat row */}
            <p
              className="stat-cards-instruction"
              style={{
                fontSize: '13px',
                color: 'var(--text-light)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600'
              }}
            >
              <IconInfo style={{ width: '14px', height: '14px', color: 'var(--primary)' }} />
              <span>Clique em um indicador para filtrar a lista de chamados abaixo.</span>
            </p>
            <div className="kpi-group-container" style={{ marginBottom: '24px' }}>
              <div className="kpi-group-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
                <IconFolder style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
                <span>Volume Geral</span>
              </div>
              <div className="card-grid volume-grid">
                <div
                  className={`stat-card ${activeListsView === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveListsView('all')}
                  style={{ '--card-accent': 'var(--primary)' }}
                >
                  <div className="stat-header">
                    <span>Chamados Registrados</span>
                    <div className="stat-icon">
                      <IconFolder />
                    </div>
                  </div>
                  <div className="stat-number">{totalTickets}</div>
                  <div className="stat-description">Total histórico importado</div>
                </div>

                <div
                  className={`stat-card ${activeListsView === 'active' ? 'active' : ''}`}
                  onClick={() => setActiveListsView('active')}
                  style={{ '--card-accent': 'var(--color-blue)' }}
                >
                  <div className="stat-header">
                    <span>Chamados Ativos</span>
                    <div className="stat-icon">
                      <IconRefresh />
                    </div>
                  </div>
                  <div className="stat-number">{openTickets}</div>
                  <div className="stat-description">Demandas em triagem ou andamento</div>
                </div>
              </div>
            </div>

            <div className="kpi-group-container" style={{ marginBottom: '36px' }}>
              <div className="kpi-group-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
                <IconClock style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
                <span>Prazos e Gestão de Risco</span>
              </div>
              <div className="kpi-subgroups-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="kpi-subgroup-column">
                  <h5 className="kpi-subgroup-title" style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '12px' }}>Sem Movimentação Recente (Inércia)</h5>
                  <div className="card-grid subgroup-cards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div
                      className={`stat-card ${activeListsView === 'inactive7' || activeListsView === 'stuck' ? 'active' : ''}`}
                      onClick={() => setActiveListsView('inactive7')}
                      style={{ '--card-accent': 'var(--color-amber)' }}
                    >
                      <div className="stat-header">
                        <span>Em Aberto +7 Dias</span>
                        <div className="stat-icon">
                          <IconWarning />
                        </div>
                      </div>
                      <div className="stat-number" style={{ color: 'var(--color-amber)' }}>
                        {inactivePlus7}
                      </div>
                      <div className="stat-description">Sem movimentação (Alerta Âmbar)</div>
                    </div>

                    <div
                      className={`stat-card ${activeListsView === 'inactive15' ? 'active' : ''}`}
                      onClick={() => setActiveListsView('inactive15')}
                      style={{ '--card-accent': 'var(--color-red)' }}
                    >
                      <div className="stat-header">
                        <span>Em Aberto +15 Dias</span>
                        <div className="stat-icon">
                          <IconSiren />
                        </div>
                      </div>
                      <div className="stat-number" style={{ color: 'var(--color-red)' }}>
                        {inactivePlus15}
                      </div>
                      <div className="stat-description">Sem movimentação (Alerta Vermelho)</div>
                    </div>
                  </div>
                </div>

                <div className="kpi-subgroup-column">
                  <h5 className="kpi-subgroup-title" style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '12px' }}>Tempo Total em Aberto (Antiguidade)</h5>
                  <div className="card-grid subgroup-cards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div
                      className={`stat-card ${activeListsView === 'age30' ? 'active' : ''}`}
                      onClick={() => setActiveListsView('age30')}
                      style={{ '--card-accent': 'var(--color-age-warn)' }}
                    >
                      <div className="stat-header">
                        <span>Em Aberto +30 Dias</span>
                        <div className="stat-icon">
                          <IconClock />
                        </div>
                      </div>
                      <div className="stat-number" style={{ color: 'var(--color-age-warn)' }}>
                        {agePlus30}
                      </div>
                      <div className="stat-description">Tempo total em aberto (Antiguidade)</div>
                    </div>

                    <div
                      className={`stat-card ${activeListsView === 'age60' ? 'active' : ''}`}
                      onClick={() => setActiveListsView('age60')}
                      style={{ '--card-accent': 'var(--color-age-severe)' }}
                    >
                      <div className="stat-header">
                        <span>Em Aberto +60 Dias</span>
                        <div className="stat-icon">
                          <IconCalendar />
                        </div>
                      </div>
                      <div className="stat-number" style={{ color: 'var(--color-age-severe)' }}>
                        {agePlus60}
                      </div>
                      <div className="stat-description">Antiguidade crítica (revisar caso)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mapa Operacional — área de atuação da 3ª CRE */}
            <div className="dashboard-section op-panel">
              <div
                className="section-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3>
                    <IconBuilding /> Mapa Operacional
                  </h3>
                  <span
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-light)',
                      fontWeight: '600',
                      marginTop: '2px'
                    }}
                  >
                    Área de atuação da 3ª CRE · Zona Norte
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div className="territorio-toggle" role="tablist" aria-label="Visualização do território">
                    <button
                      role="tab"
                      aria-selected={vistaTerritorio === 'mapa'}
                      className={vistaTerritorio === 'mapa' ? 'is-active' : ''}
                      onClick={() => setVistaTerritorio('mapa')}
                    >
                      Mapa
                    </button>
                    <button
                      role="tab"
                      aria-selected={vistaTerritorio === 'lista'}
                      className={vistaTerritorio === 'lista' ? 'is-active' : ''}
                      onClick={() => setVistaTerritorio('lista')}
                    >
                      Lista
                    </button>
                  </div>

                  <span
                    className="map-instruction"
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--primary)',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'var(--primary-light)',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1px solid var(--border-hover)'
                    }}
                  >
                    <IconInfo style={{ width: '13px', height: '13px', flexShrink: 0 }} />
                    {vistaTerritorio === 'mapa'
                      ? 'Clique em um bairro para ver escolas e chamados ativos.'
                      : 'Selecione uma linha para detalhar o bairro.'}
                  </span>
                </div>
              </div>

              <div
                className={`map-and-details-container ${selectedBairroNormalized ? 'has-details' : ''}`}
              >
                {vistaTerritorio === 'mapa' ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <OperationalMap
                      selectedSchool={selectedSchool}
                      theme={theme}
                      onSelectBairro={setSelectedBairroNormalized}
                      focusedBairro={focusedBairro}
                      risk={territorialRisk}
                    />
                    <MapLegend risk={territorialRisk} />
                  </div>
                ) : (
                  <div className="territorio-tabela-wrapper" style={{ flex: 1, overflowX: 'auto', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border-color)', padding: '16px' }}>
                    <table className="territorio-tabela">
                      <caption className="sr-only">Bairros por risco territorial</caption>
                      <thead>
                        <tr>
                          <th>Bairro</th>
                          <th>Nível</th>
                          <th>Risco</th>
                          <th>Ativos</th>
                          <th>Críticos</th>
                          <th>Escolas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(territorialRisk)
                          .filter(([, b]) => b.chamados_ativos > 0)
                          .sort((a, b) => b[1].risco - a[1].risco)
                          .map(([key, b]) => (
                            <tr
                              key={key}
                              className={selectedBairroNormalized === key ? 'is-selected' : ''}
                              onClick={() => setSelectedBairroNormalized(key)}
                              tabIndex={0}
                              onKeyDown={(ev) => {
                                if (ev.key === 'Enter' || ev.key === ' ') {
                                  ev.preventDefault();
                                  setSelectedBairroNormalized(key);
                                }
                              }}
                            >
                              <td>{b.nome_exibicao}</td>
                              <td>
                                <span className={`map-nivel-badge nivel-${b.nivel}`}>
                                  {rotuloNivel(b.nivel)}
                                </span>
                              </td>
                              <td style={{ fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
                                {b.risco.toFixed(1)}
                              </td>
                              <td style={{ fontVariantNumeric: 'tabular-nums' }}>{b.chamados_ativos}</td>
                              <td style={{ fontVariantNumeric: 'tabular-nums' }}>{b.criticos}</td>
                              <td style={{ fontVariantNumeric: 'tabular-nums' }}>{b.escolas_cadastradas}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedBairroNormalized &&
                  (() => {
                    const bData = territorialRisk[selectedBairroNormalized];
                    if (!bData) return null;
                    return (
                      <div className="bairro-details-card bairro-details-card-v2 animate-slide-in">
                        <div className="bairro-card-header">
                          <div className="bairro-card-title-group" style={{ flexWrap: 'wrap', gap: '8px' }}>
                            <span className="bairro-header-pin-icon">
                              <IconPin />
                            </span>
                            <h4>{bData.nome_exibicao}</h4>
                            <span className={`map-nivel-badge nivel-${bData.nivel}`} style={{ marginLeft: '4px' }}>
                              {rotuloNivel(bData.nivel)}
                            </span>
                            <button
                              className="btn-focus-bairro-small"
                              onClick={() =>
                                setFocusedBairro({
                                  name: selectedBairroNormalized,
                                  timestamp: Date.now()
                                })
                              }
                              title="Recentralizar e focar este bairro no mapa"
                              aria-label="Focar este bairro no mapa"
                            >
                              <IconFocus />
                            </button>
                            <button
                              className="btn-copy-summary"
                              onClick={() =>
                                handleCopySummary(
                                  `Bairro: ${bData.nome_exibicao}\nRisco: ${bData.risco} (${rotuloNivel(bData.nivel)})\nEscolas Cadastradas: ${bData.escolas_cadastradas}\nChamados Ativos: ${bData.chamados_ativos}\nCríticos: ${bData.criticos}\nDensidade: ${bData.densidade}`,
                                  'bairro'
                                )
                              }
                              title="Copiar resumo gerencial do bairro"
                              aria-label="Copiar resumo gerencial do bairro"
                            >
                              <IconCopy />
                            </button>
                          </div>
                          <button
                            className="btn-close-small"
                            onClick={() => setSelectedBairroNormalized(null)}
                            title="Fechar detalhes do bairro"
                            aria-label="Fechar detalhes do bairro"
                          >
                            <IconClose />
                          </button>
                        </div>
                        <div className="bairro-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          
                          {/* Score e Nível */}
                          <div className="bairro-irt-box" style={{ padding: '12px', borderRadius: '10px', background: 'var(--surface-2, rgba(148,163,184,.08))', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', opacity: 0.75 }}>Índice de Risco (IRT)</div>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>Média dos piores casos</div>
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: bData.nivel === 'critico' ? 'var(--map-risk-critico, #C2434E)' : bData.nivel === 'alto' ? 'var(--map-risk-alto, #CC7A3D)' : 'var(--text-main)' }}>
                              {bData.risco.toFixed(1)}
                            </div>
                          </div>

                          {/* Grid de Microcards */}
                          <div className="bairro-microcards-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div className="microcard" style={{ padding: '8px 12px', background: 'var(--surface-2, rgba(148,163,184,.08))', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7, fontWeight: '700' }}>Escolas</span>
                              <span style={{ fontSize: '15px', fontWeight: '800' }}>{bData.escolas_cadastradas}</span>
                            </div>
                            <div className="microcard" style={{ padding: '8px 12px', background: 'var(--surface-2, rgba(148,163,184,.08))', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7, fontWeight: '700' }}>Ativos</span>
                              <span style={{ fontSize: '15px', fontWeight: '800' }}>{bData.chamados_ativos}</span>
                            </div>
                            <div className="microcard" style={{ padding: '8px 12px', background: 'var(--surface-2, rgba(148,163,184,.08))', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7, fontWeight: '700' }}>Críticos</span>
                              <span style={{ fontSize: '15px', fontWeight: '800', color: bData.criticos > 0 ? 'var(--color-red)' : 'inherit' }}>{bData.criticos}</span>
                            </div>
                            <div className="microcard" style={{ padding: '8px 12px', background: 'var(--surface-2, rgba(148,163,184,.08))', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7, fontWeight: '700' }}>Densidade</span>
                              <span style={{ fontSize: '15px', fontWeight: '800' }}>{bData.densidade.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Seção Principais Ofensores */}
                          {bData.topOfensores && bData.topOfensores.length > 0 && (
                            <div className="bairro-ofensores-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                              <h5 style={{ fontSize: '11px', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                Principais Ofensores
                              </h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {bData.topOfensores.map((o) => {
                                  const rawTicket = tickets.find((t) => String(t.id_chamado) === String(o.id_chamado));
                                  return (
                                    <div
                                      key={o.id_chamado}
                                      className="ofensor-card"
                                      style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-app)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px',
                                        transition: 'var(--transition)'
                                      }}
                                      onClick={() => rawTicket && openTicketEdit(rawTicket)}
                                      title={`Editar chamado ${o.id_chamado}`}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>{o.id_chamado}</span>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: o.score >= 75 ? 'var(--color-red)' : 'var(--color-amber)' }}>{o.score} pts</span>
                                      </div>
                                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {o.unidade_escolar}
                                      </div>
                                      <div style={{ fontSize: '10.5px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                                        Inativo há {o.inactivityDays} dias
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Seção Lista Completa */}
                          <div className="bairro-tickets-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                            <h5 style={{ fontSize: '11px', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                              Todos os Chamados Ativos ({bData.chamados_lista.length})
                            </h5>
                            <div className="bairro-tickets-list">
                              {bData.chamados_lista.map((tk) => {
                                const statusNorm = tk.status_atual || '';
                                const isCritical =
                                  statusNorm.startsWith('2') ||
                                  statusNorm.startsWith('3') ||
                                  statusNorm.startsWith('4');
                                const isWarning =
                                  statusNorm.startsWith('1') && tk.prioridade === 'Crítica';

                                let accentClass = 'accent-blue';
                                if (isCritical) {
                                  accentClass = 'accent-red';
                                } else if (isWarning) {
                                  accentClass = 'accent-amber';
                                }

                                const rawTicket = tickets.find((t) => String(t.id_chamado) === String(tk.id_chamado));

                                return (
                                  <div
                                    key={tk.id_chamado}
                                    className={`bairro-ticket-item ${accentClass}`}
                                    onClick={() => openTicketEdit(rawTicket || tk)}
                                    title={`Editar chamado ${tk.id_chamado}`}
                                  >
                                    <div className="bairro-ticket-meta">
                                      <span className="bairro-ticket-code">{tk.id_chamado}</span>
                                      <span
                                        className={`badge badge-priority-${normalizePriorityClass(tk.prioridade)}`}
                                        style={{ fontSize: '8px', padding: '0px 4px' }}
                                      >
                                        {tk.prioridade}
                                      </span>
                                    </div>
                                    <div className="bairro-ticket-school">{tk.unidade_escolar}</div>
                                    <div className="bairro-ticket-status">{tk.status_atual}</div>
                                  </div>
                                );
                              })}
                              {bData.chamados_lista.length === 0 && (
                                <EmptyState
                                  iconType="ticket"
                                  title="Nenhum chamado ativo"
                                  description="Nenhum chamado ativo pendente neste bairro."
                                  style={{ padding: '16px 12px' }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </div>

            {/* Layout Grid */}
            <div className="dashboard-layout">
              {/* Left section: Charts */}
              <div>
                <div className="dashboard-section">
                  <div className="section-header">
                    <h3>
                      <IconDashboard /> Visão de Metas & Conclusões
                    </h3>
                    <span
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-light)',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}
                    >
                      Consolidado Geral
                    </span>
                  </div>

                  <div className="dashboard-goals-split">
                    {/* Coluna 1: Donut Chart Geral */}
                    <div className="goals-column">{renderDashboardDonutChart()}</div>

                    {/* Coluna 2: Status dos Chamados */}
                    <div className="goals-column">
                      <h4>Status das Demandas</h4>
                      <div className="mini-progress-list">
                        {(() => {
                          const statusCounts = tickets.reduce((acc, t) => {
                            const st = t.status_atual || 'Não especificado';
                            acc[st] = (acc[st] || 0) + 1;
                            return acc;
                          }, {});
                          const sortedStatuses = Object.entries(statusCounts).sort(
                            (a, b) => b[1] - a[1]
                          );
                          return sortedStatuses.map(([status, count]) => {
                            const pct = Math.round((count / tickets.length) * 100) || 0;
                            const color = getStatusColor(status);
                            return (
                              <div key={status} className="mini-progress-item">
                                <div className="mini-progress-label">
                                  <span
                                    className="status-bullet"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="status-name" title={status}>
                                    {status}
                                  </span>
                                </div>
                                <div className="mini-progress-track-wrapper">
                                  <div className="mini-progress-track">
                                    <div
                                      className="mini-progress-fill"
                                      style={{
                                        width: `${pct}%`,
                                        backgroundColor: color
                                      }}
                                    />
                                  </div>
                                  <span className="mini-progress-value">{count}</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Coluna 3: Setor Responsável */}
                    <div className="goals-column">
                      <h4>Responsabilidade (Último Setor)</h4>
                      <div className="mini-progress-list">
                        {(() => {
                          const sectorCounts = tickets.reduce((acc, t) => {
                            const sec = normalizeSector(t.setor_responsavel || 'Não especificado');
                            acc[sec] = (acc[sec] || 0) + 1;
                            return acc;
                          }, {});
                          const sortedSectors = Object.entries(sectorCounts).sort(
                            (a, b) => b[1] - a[1]
                          );
                          return sortedSectors.map(([sector, count]) => {
                            const pct = Math.round((count / tickets.length) * 100) || 0;
                            const color = getSectorColor(sector);
                            return (
                              <div key={sector} className="mini-progress-item">
                                <div className="mini-progress-label">
                                  <span
                                    className="sector-bullet"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="sector-name" title={sector}>
                                    {sector}
                                  </span>
                                </div>
                                <div className="mini-progress-track-wrapper">
                                  <div className="mini-progress-track">
                                    <div
                                      className="mini-progress-fill"
                                      style={{
                                        width: `${pct}%`,
                                        backgroundColor: color
                                      }}
                                    />
                                  </div>
                                  <span className="mini-progress-value">{count}</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* (removido) "Distribuição pelas 12 Etapas POP" — substituído pelo Mapa Operacional; a leitura por etapa agora aparece na legenda do mapa */}

                {/* (removido) "Envolvimento e Demandas por Setor" — a visão por setor permanece na barra de setor da Lista de chamados (Bloco C) */}
              </div>

              {/* Right column: Action checklist, Inactivity ranking, and Sync panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {renderActionItems()}

                {/* Right Section: Inactivity Ranking */}
                <div
                  className="dashboard-section"
                  style={{ height: 'fit-content', marginBottom: 0 }}
                >
                  <div className="section-header">
                    <h3>
                      <IconWarning /> Acompanhamento Prioritário de Demandas
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: '13.5px',
                      color: 'var(--text-muted)',
                      marginBottom: '16px',
                      lineHeight: '1.45',
                      fontWeight: '500'
                    }}
                  >
                    Lista das demandas em andamento ordenadas por tempo de tramitação para
                    priorização de ações.
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
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '4px'
                              }}
                            >
                              <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                                {t.id_chamado}
                              </strong>
                              <span
                                className={`badge ${t.prioridade === 'Crítica' ? 'badge-priority-critica' : 'badge-priority-alta'}`}
                                style={{ fontSize: '9px', padding: '1px 5px' }}
                              >
                                {t.prioridade}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '13px',
                                color: 'var(--text-muted)',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                fontWeight: '600'
                              }}
                            >
                              {t.unidade_escolar}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end'
                              }}
                            >
                              <span
                                className={`sla-pulse-active ${isSevere ? 'sla-pulse-red' : 'sla-pulse-amber'}`}
                              />
                              <span
                                style={{
                                  fontSize: '13.5px',
                                  fontWeight: '800',
                                  color: isSevere ? 'var(--color-red)' : 'var(--color-amber)'
                                }}
                              >
                                {t.inactivityDays} dias
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '11.5px',
                                color: 'var(--text-light)',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                marginTop: '2px'
                              }}
                            >
                              sem alteração
                            </div>
                            {typeof t.ageDays === 'number' && t.ageDays > 0 && (
                              <div
                                style={{
                                  fontSize: '11.5px',
                                  color: 'var(--color-age-severe)',
                                  fontWeight: '700',
                                  marginTop: '3px'
                                }}
                              >
                                {t.ageDays} dias em aberto
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Info and Sync center box */}
                <div
                  className="sync-panel"
                  style={{ cursor: 'pointer', margin: 0 }}
                  onClick={() => setCurrentTab('cloud')}
                >
                  <div className="sync-status">
                    <span
                      className="sync-dot"
                      style={{
                        backgroundColor: cloudConnected ? 'var(--color-green)' : 'var(--color-red)',
                        boxShadow: cloudConnected
                          ? '0 0 8px var(--color-green)'
                          : '0 0 8px var(--color-red)'
                      }}
                    />
                    <span>{syncStatusText}</span>
                  </div>
                  <span
                    style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-light)' }}
                  >
                    {cloudConnected ? 'Base online ativa' : 'Configurar base online'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )}

        {/* Tickets Tab (Lists Mirror) */}
        {currentTab === 'tickets' && (
          <div id="lists-section" className="dashboard-section" style={{ padding: '24px' }}>
            <div
              className="section-header"
              style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}
            >
              <div>
                <h3>
                  <IconList /> Lista de chamados
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-light)',
                    marginTop: '4px',
                    fontWeight: '500'
                  }}
                >
                  Use esta tela para localizar chamados, filtrar por setor e abrir uma linha para
                  atualizar o andamento.
                </p>
              </div>

              {/* Text Search */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  flex: 1,
                  justifySelf: 'flex-end',
                  maxWidth: '350px'
                }}
              >
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

            {/* FASE 4: Barra de Ferramentas de Tabelas (Filtros, Contadores e Exportador CSV) */}
            <div
              className="table-toolbar"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '18px',
                padding: '12px 18px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xs)',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Filtro Prioridade */}
                <div className="filter-select-wrapper">
                  <span className="filter-label">Prioridade:</span>
                  <select
                    aria-label="Filtro de prioridade"
                    className="form-control select-filter"
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    style={{
                      width: '110px',
                      padding: '5px 10px',
                      fontSize: '13px',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Todas</option>
                    <option value="Crítica">Crítica</option>
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>

                {/* Filtro Status */}
                <div className="filter-select-wrapper">
                  <span className="filter-label">Status:</span>
                  <select
                    aria-label="Filtro de status"
                    className="form-control select-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                      width: '200px',
                      padding: '5px 10px',
                      fontSize: '13px',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Todos</option>
                    {Array.from(new Set(tickets.map((t) => t.status_atual)))
                      .sort()
                      .map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Contador de chamados exibidos */}
                <div
                  style={{
                    fontSize: '13.5px',
                    color: 'var(--text-muted)',
                    fontWeight: '700',
                    marginLeft: '8px'
                  }}
                >
                  Exibindo{' '}
                  <span style={{ color: 'var(--primary)' }}>{getFilteredTickets().length}</span> de{' '}
                  <span>{tickets.length}</span> chamados
                </div>

                {/* Botão limpar filtros */}
                {(filterPriority || filterStatus || ticketSearch) && (
                  <button
                    onClick={() => {
                      setFilterPriority('');
                      setFilterStatus('');
                      setTicketSearch('');
                    }}
                    style={{
                      fontSize: '13.5px',
                      color: 'var(--color-red)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '800',
                      padding: '2px 6px',
                      textTransform: 'uppercase'
                    }}
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>

              {/* Botão de Exportação CSV */}
              <button
                className="btn btn-primary btn-export"
                onClick={handleExportCSV}
                style={{
                  padding: '7px 14px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#fff',
                  background: 'linear-gradient(135deg, hsl(142, 60%, 40%), hsl(142, 70%, 30%))',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <span>📥 Exportar Lista (CSV)</span>
              </button>
            </div>

            {/* Lists View tabs */}
            <div className="view-tabs">
              <button
                className={`view-tab ${activeListsView === 'all' ? 'active' : ''}`}
                onClick={() => setActiveListsView('all')}
              >
                Todos os Chamados ({tickets.length})
              </button>
              <button
                className={`view-tab ${activeListsView === 'gop' ? 'active' : ''}`}
                onClick={() => setActiveListsView('gop')}
              >
                Com o GOP
              </button>
              <button
                className={`view-tab ${activeListsView === 'cps' ? 'active' : ''}`}
                onClick={() => setActiveListsView('cps')}
              >
                Com a CPS
              </button>
              <button
                className={`view-tab ${activeListsView === 'gin' ? 'active' : ''}`}
                onClick={() => setActiveListsView('gin')}
              >
                Com a GIN
              </button>
              <button
                className={`view-tab ${activeListsView === 'cto' ? 'active' : ''}`}
                onClick={() => setActiveListsView('cto')}
              >
                Com a CTO
              </button>
              <button
                className={`view-tab ${activeListsView === 'stuck' || activeListsView === 'inactive7' ? 'active' : ''}`}
                onClick={() => setActiveListsView('inactive7')}
              >
                Sem Atualização +7d ({inactivePlus7})
              </button>
              <button
                className={`view-tab ${activeListsView === 'closed' ? 'active' : ''}`}
                onClick={() => setActiveListsView('closed')}
              >
                Concluídos/Encerrados
              </button>

              {['active', 'inactive15', 'age30', 'age60'].includes(activeListsView) && (
                <button
                  className="view-tab active"
                  onClick={() => setActiveListsView('all')}
                  style={{
                    borderBottomColor: 'var(--card-accent, var(--primary))',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '800'
                  }}
                  title="Clique para limpar o filtro"
                >
                  🔍 Filtro:{' '}
                  {activeListsView === 'active'
                    ? 'Ativos'
                    : activeListsView === 'inactive15'
                      ? 'Sem Atualização +15d'
                      : activeListsView === 'age30'
                        ? 'Em Aberto +30d'
                        : 'Em Aberto +60d'}{' '}
                  <span style={{ opacity: 0.6, fontSize: '10px' }}>✕</span>
                </button>
              )}
            </div>

            {/* Bloco C — Indicadores da visão de setor (quando uma aba de setor está ativa) */}
            {SECTORS.map((s) => s.toLowerCase()).includes(activeListsView) &&
              (() => {
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
                        <span className="sector-metric-num" style={{ color: 'var(--color-blue)' }}>
                          {sm.open}
                        </span>
                        <span className="sector-metric-label">Em aberto</span>
                      </div>
                      <div className="sector-metric">
                        <span className="sector-metric-num" style={{ color: 'var(--color-amber)' }}>
                          {sm.stuck}
                        </span>
                        <span className="sector-metric-label">Sem Atualização</span>
                      </div>
                      <div className="sector-metric">
                        <span className="sector-metric-num" style={{ color: 'var(--color-green)' }}>
                          {sm.closed}
                        </span>
                        <span className="sector-metric-label">Concluídos</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Legend Panel for status colors and row borders (M-11) */}
            <div className="lists-legend-panel">
              <div className="legend-section">
                <span className="legend-section-title">🕒 Prazos (Bordas e Alertas):</span>
                <div className="legend-items">
                  <div className="legend-item">
                    <span className="legend-indicator border-severe"></span>
                    <span>Inércia Crítica (parado +15 dias)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-indicator border-warning"></span>
                    <span>Inércia Alerta (parado +7 dias)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-indicator border-age-severe"></span>
                    <span>Antiguidade Crítica (aberto +60 dias)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-indicator border-age-warning"></span>
                    <span>Antiguidade Alerta (aberto +30 dias)</span>
                  </div>
                </div>
              </div>
              <div className="legend-section">
                <span className="legend-section-title">📋 Status (Etapas POP):</span>
                <div className="legend-items">
                  <div className="legend-item">
                    <span className="legend-badge-dot bg-triagem"></span>
                    <span>Triagem (1-3)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-badge-dot bg-orcamento"></span>
                    <span>Orçamento (4-5)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-badge-dot bg-adequacao"></span>
                    <span>Adequação (6)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-badge-dot bg-execucao"></span>
                    <span>Execução (7-9)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-badge-dot bg-concluido"></span>
                    <span>Concluído (10-11)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lists grid table */}
            <div className="lists-table-desktop-view">
              <div className="lists-table-wrapper">
                <table className="lists-table">
                  <thead>
                    <tr>
                      {renderSortableHeader('Código', 'id_chamado')}
                      {renderSortableHeader('Unidade Escolar', 'unidade_escolar')}
                      <th>Status Atual</th>
                      {renderSortableHeader('Prioridade', 'prioridade')}
                      {renderSortableHeader('Modificado Em', 'modificado_em')}
                      <th style={{ textAlign: 'center', width: '80px' }}>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredTickets().map((t) => {
                      const rowClass = getTicketInactivityClass(t);
                      const days = getInactivityDays(t.modificado_em);
                      const hasPulse = !isInactive(t) && days >= SLA_WARN_DAYS;
                      const isExpanded = expandedTicketId === t.id_chamado;
                      return (
                        <Fragment key={t.id_chamado}>
                          <tr
                            className={`${rowClass} ${isExpanded ? 'row-expanded-parent' : ''}`}
                            onClick={() => openTicketEdit(t)}
                            style={{ cursor: 'pointer', display: 'table-row' }}
                          >
                            <td data-label="Código" style={{ fontWeight: '800', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{t.id_chamado}</span>
                                {(() => {
                                  const count = allAttachments.filter(
                                    (a) => a.id_chamado === t.id_chamado
                                  ).length;
                                  if (count > 0) {
                                    return (
                                      <span
                                        style={{
                                          fontSize: '11px',
                                          fontWeight: '800',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                          color: 'var(--primary)',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}
                                        title={`${count} documento(s) anexo(s)`}
                                      >
                                        📎 {count}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </td>
                            <td
                              data-label="Unidade Escolar"
                              style={{
                                maxWidth: '240px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: '700'
                              }}
                              title={t.unidade_escolar}
                            >
                              {t.unidade_escolar}
                            </td>
                            <td data-label="Status Atual">
                              <span
                                className="badge badge-status"
                                style={getStatusStyle(t.status_atual)}
                              >
                                {t.status_atual}
                              </span>
                            </td>
                            <td data-label="Prioridade">
                              <span className={`badge badge-priority-${normalizePriorityClass(t.prioridade)}`}>
                                {t.prioridade}
                              </span>
                            </td>
                            <td data-label="Modificado Em" style={{ fontWeight: '700' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} title={hasPulse ? `Sem atualização há ${days} dias (${days >= 15 ? 'Aviso Crítico/Vermelho' : 'Atenção/Âmbar'})` : ''}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {hasPulse && (
                                    <span
                                      className={`sla-pulse-active ${days >= 15 ? 'sla-pulse-red' : 'sla-pulse-amber'}`}
                                    />
                                  )}
                                  <span>{formatDateBrazilian(t.modificado_em)}</span>
                                </div>
                                {(() => {
                                  const sla = slaLevel(t, todayRef());
                                  const age = ageLevel(t, todayRef());
                                  if (sla === 'severe') {
                                    return <span className="lists-alert-tag alert-tag-severe">Inércia: {days} dias</span>;
                                  }
                                  if (sla === 'warning') {
                                    return <span className="lists-alert-tag alert-tag-warning">Inércia: {days} dias</span>;
                                  }
                                  if (age === 'severe') {
                                    return <span className="lists-alert-tag alert-tag-age-severe">Aberto +60 dias</span>;
                                  }
                                  if (age === 'warning') {
                                    return <span className="lists-alert-tag alert-tag-age-warn">Aberto +30 dias</span>;
                                  }
                                  return null;
                                })()}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <button
                                type="button"
                                className="btn-chevron-expand"
                                aria-expanded={isExpanded}
                                aria-label={isExpanded ? 'Ocultar detalhes' : 'Expandir detalhes'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedTicketId(isExpanded ? null : t.id_chamado);
                                }}
                              >
                                {isExpanded ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="detail-row" onClick={(e) => e.stopPropagation()} style={{ display: 'table-row' }}>
                              <td colSpan="6" style={{ padding: '0', border: 'none' }}>
                                <div className="detail-grid">
                                  <div className="detail-item">
                                    <span className="detail-item-label">Tipo Demanda</span>
                                    <span className="detail-item-value">{t.tipo_demanda || '-'}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-item-label">Local</span>
                                    <span className="detail-item-value">{t.local_demanda || '-'}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-item-label">Responsável</span>
                                    <span className="detail-item-value">{t.setor_responsavel || '-'}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-item-label">Aptidão</span>
                                    <span className="detail-item-value">
                                      <span className={`badge ${t.resultado_aptidao === 'Apta' ? 'badge-valid-sim' : t.resultado_aptidao === 'Pendente' ? 'badge-valid-pendente' : 'badge-valid-nao'}`}>
                                        {t.resultado_aptidao || '-'}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="detail-action">
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      onClick={() => openTicketEdit(t)}
                                    >
                                      <IconFileText /> Abrir Ficha do Chamado
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                    {getFilteredTickets().length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '30px 10px' }}>
                          <EmptyState
                            iconType="search"
                            title="Nenhum chamado encontrado"
                            description="Ajuste os filtros ou pesquise por escola, bairro, status ou ID do chamado."
                            style={{ margin: '0 auto', maxWidth: '480px' }}
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lists-table-mobile-view">
              {getFilteredTickets().map((t) => {
                const rowClass = getTicketInactivityClass(t);
                const days = getInactivityDays(t.modificado_em);
                const hasPulse = !isInactive(t) && days >= SLA_WARN_DAYS;
                const isExpanded = expandedTicketId === t.id_chamado;
                return (
                  <div
                    key={t.id_chamado}
                    className={`mobile-ticket-card ${rowClass} ${isExpanded ? 'card-expanded' : ''}`}
                    onClick={() => openTicketEdit(t)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-header-mobile">
                      <div className="card-title-id">
                        <span className="card-id">{t.id_chamado}</span>
                        {(() => {
                          const count = allAttachments.filter(
                            (a) => a.id_chamado === t.id_chamado
                          ).length;
                          if (count > 0) {
                            return (
                              <span className="attachment-badge-mobile">
                                📎 {count}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <span className="badge badge-status" style={getStatusStyle(t.status_atual)}>
                        {t.status_atual}
                      </span>
                    </div>
                    <div className="card-school-name">{t.unidade_escolar}</div>
                    <div className="card-meta-row">
                      <span className={`badge badge-priority-${normalizePriorityClass(t.prioridade)}`}>
                        {t.prioridade}
                      </span>
                      <div className="card-date-info">
                        {hasPulse && (
                          <span className={`sla-pulse-active ${days >= 15 ? 'sla-pulse-red' : 'sla-pulse-amber'}`} />
                        )}
                        <span>{formatDateBrazilian(t.modificado_em)}</span>
                      </div>
                    </div>

                    {(() => {
                      const sla = slaLevel(t, todayRef());
                      const age = ageLevel(t, todayRef());
                      if (sla === 'severe') {
                        return <div className="card-alert-banner alert-tag-severe">Inércia: {days} dias</div>;
                      }
                      if (sla === 'warning') {
                        return <div className="card-alert-banner alert-tag-warning">Inércia: {days} dias</div>;
                      }
                      if (age === 'severe') {
                        return <div className="card-alert-banner alert-tag-age-severe">Aberto +60 dias</div>;
                      }
                      if (age === 'warning') {
                        return <div className="card-alert-banner alert-tag-age-warn">Aberto +30 dias</div>;
                      }
                      return null;
                    })()}

                    <div className="card-action-mobile">
                      <button
                        type="button"
                        className="btn-mobile-details"
                        aria-expanded={isExpanded}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTicketId(isExpanded ? null : t.id_chamado);
                        }}
                      >
                        {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                        <span style={{ marginLeft: '4px', display: 'inline-flex', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                          ▾
                        </span>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="card-details-expanded" onClick={(e) => e.stopPropagation()}>
                        <div className="details-expanded-grid">
                          <div className="detail-item">
                            <span className="detail-item-label">Tipo Demanda</span>
                            <span className="detail-item-value">{t.tipo_demanda || '-'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-item-label">Local</span>
                            <span className="detail-item-value">{t.local_demanda || '-'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-item-label">Responsável</span>
                            <span className="detail-item-value">{t.setor_responsavel || '-'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-item-label">Aptidão</span>
                            <span className="detail-item-value">
                              <span className={`badge ${t.resultado_aptidao === 'Apta' ? 'badge-valid-sim' : t.resultado_aptidao === 'Pendente' ? 'badge-valid-pendente' : 'badge-valid-nao'}`}>
                                {t.resultado_aptidao || '-'}
                              </span>
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-open-ticket-mobile"
                          onClick={() => openTicketEdit(t)}
                        >
                          <IconFileText /> Abrir Ficha do Chamado
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {getFilteredTickets().length === 0 && (
                <EmptyState
                  iconType="search"
                  title="Nenhum chamado encontrado"
                  description="Ajuste os filtros ou pesquise por escola, bairro, status ou ID do chamado."
                  style={{ margin: '20px auto', maxWidth: '480px' }}
                />
              )}
            </div>
          </div>
        )}

        {/* School Lookup Tab */}
        {currentTab === 'lookup' &&
          (() => {
            const dossier = selectedSchool
              ? getSchoolDossierData({
                  school: selectedSchool,
                  tickets,
                  history,
                  schoolLogs,
                  refDate: todayRef()
                })
              : null;

            return (
              <div className="school-grid-layout">
                {/* Left Column: Sidebar Controls (no-print) */}
                <div className="lookup-sidebar no-print">
                  {/* Search box */}
                  <div className="dashboard-section compact-search-section">
                    <div className="section-header">
                      <h3>
                        <IconBuilding /> Dossiê da Escola
                      </h3>
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-muted)',
                        marginBottom: '14px',
                        lineHeight: '1.45',
                        fontWeight: '500'
                      }}
                    >
                      Pesquise pelo nome, designação ou bairro.
                    </p>

                    <div className="suggestion-container" style={{ marginBottom: '16px' }}>
                      <div className="input-search">
                        <IconSearch />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nome ou designação..."
                          value={lookupSchoolQuery}
                          onChange={(e) => {
                            setLookupSchoolQuery(e.target.value);
                            setSelectedSchool(null);
                            setShowLookupSuggestions(true);
                          }}
                          onFocus={() => setShowLookupSuggestions(true)}
                        />
                      </div>

                      {showLookupSuggestions && lookupSchoolQuery && (
                        <div className="suggestion-box">
                          {searchSchools(schools, lookupSchoolQuery).map((s) => (
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
                            <div
                              style={{
                                padding: '12px 14px',
                                color: 'var(--text-light)',
                                fontSize: '13px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <span style={{ fontSize: '15px' }}>🔍</span>
                              <span>Nenhuma escola encontrada</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick actions card */}
                  {selectedSchool && (
                    <div className="dashboard-section compact-actions-section">
                      <div className="section-header">
                        <h3>Ações Rápidas</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                          onClick={() => {
                            setFormSelectedSchool(selectedSchool);
                            setFormSearchQuery(selectedSchool.unidade_escolar);
                            setNewTicket((prev) => ({
                              ...prev,
                              local_demanda: '',
                              observacoes: `Ficha da Escola: Salas: ${selectedSchool.qtd_salas_de_aula}, Climatizadas: ${selectedSchool.aparelhos_em_sala}, Necessidade: ${selectedSchool.necessidade_aparelhos} aparelhos.`
                            }));
                            setCurrentTab('form');
                            triggerToast(
                              `Escola ${selectedSchool.unidade_escolar} vinculada no formulário de registro!`,
                              'info'
                            );
                          }}
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <IconPlus /> Registrar chamado para esta unidade
                        </button>

                        <button
                          onClick={() => {
                            setTicketSearch(selectedSchool.unidade_escolar);
                            setActiveListsView('all');
                            setCurrentTab('tickets');
                            triggerToast(
                              `Filtrando chamados para a escola ${selectedSchool.unidade_escolar}!`,
                              'info'
                            );
                          }}
                          className="btn select-filter"
                          style={{
                            width: '100%',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            padding: '10px 14px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-app)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <IconSearch /> Ver chamados desta unidade
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status legend box */}
                  <div className="dashboard-section legend-section">
                    <div className="section-header">
                      <h3>Status de Climatização</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span
                          className="legend-dot status-regular-dot"
                          style={{
                            backgroundColor: 'var(--color-green)',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            flexShrink: 0,
                            marginTop: '5px'
                          }}
                        ></span>
                        <div>
                          <strong
                            style={{
                              fontSize: '12.5px',
                              color: 'var(--text-main)',
                              display: 'block'
                            }}
                          >
                            Situação Regular
                          </strong>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-light)' }}>
                            Climatização satisfatória, dados validados e sem chamados ativos.
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span
                          className="legend-dot status-atencao-dot"
                          style={{
                            backgroundColor: 'var(--color-amber)',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            flexShrink: 0,
                            marginTop: '5px'
                          }}
                        ></span>
                        <div>
                          <strong
                            style={{
                              fontSize: '12.5px',
                              color: 'var(--text-main)',
                              display: 'block'
                            }}
                          >
                            Em Atenção
                          </strong>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-light)' }}>
                            Dados não validados/confirmados, salas sem aparelho ou chamado ativo
                            comum.
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span
                          className="legend-dot status-critica-dot"
                          style={{
                            backgroundColor: 'var(--color-red)',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            flexShrink: 0,
                            marginTop: '5px'
                          }}
                        ></span>
                        <div>
                          <strong
                            style={{
                              fontSize: '12.5px',
                              color: 'var(--text-main)',
                              display: 'block'
                            }}
                          >
                            Situação Crítica
                          </strong>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-light)' }}>
                            Possui chamados críticos/altos, cobertura &lt; 30% ou pendência crônica
                            inativa.
                          </span>
                        </div>
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-light)',
                        fontStyle: 'italic',
                        marginTop: '16px',
                        marginBottom: 0,
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '10px'
                      }}
                    >
                      A classificação é calculada automaticamente com base nos dados cadastrados,
                      chamados ativos e validações disponíveis.
                    </p>
                  </div>
                </div>

                {/* Right Column: School Executive Dossier (school-dossier-print-scope) */}
                <div ref={dossierRef} className="school-dossier-print-scope">
                  {!selectedSchool ? (
                    <div
                      className="dashboard-section empty-dossier-section"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '64px 24px',
                        textAlign: 'center',
                        minHeight: '400px'
                      }}
                    >
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
                      <h3
                        style={{
                          fontSize: '18px',
                          fontWeight: '800',
                          color: 'var(--text-main)',
                          margin: 0
                        }}
                      >
                        Dossiê Executivo da Unidade
                      </h3>
                      <p
                        style={{
                          fontSize: '13.5px',
                          color: 'var(--text-light)',
                          marginTop: '8px',
                          maxWidth: '380px',
                          lineHeight: '1.5'
                        }}
                      >
                        Selecione uma escola no painel de busca à esquerda para carregar a ficha
                        técnica institucional e o histórico consolidado.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* PRINT ONLY HEADER */}
                      <div className="print-only-header" style={{ marginBottom: '24px' }}>
                        <div
                          style={{
                            textAlign: 'center',
                            borderBottom: '2px solid var(--text-main)',
                            paddingBottom: '12px'
                          }}
                        >
                          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
                            PREFEITURA DA CIDADE DO RIO DE JANEIRO
                          </h2>
                          <p
                            style={{
                              fontSize: '13px',
                              margin: '4px 0 0 0',
                              textTransform: 'uppercase',
                              fontWeight: '700',
                              color: 'var(--text-muted)'
                            }}
                          >
                            3ª Coordenadoria Regional de Educação · GOP Clima
                          </p>
                          <h3
                            style={{
                              fontSize: '16px',
                              fontWeight: '800',
                              marginTop: '12px',
                              color: 'var(--primary)'
                            }}
                          >
                            Dossiê Técnico-Executivo da Unidade Escolar
                          </h3>
                          <p
                            style={{
                              fontSize: '12.5px',
                              color: 'var(--text-light)',
                              margin: '4px 0 0 0'
                            }}
                          >
                            Emitido em {formatDateBrazilian(todayRef().toISOString())} às{' '}
                            {new Date().toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}{' '}
                            · Responsável: GOP / 3ª CRE
                          </p>
                        </div>
                      </div>

                      {/* Cabeçalho do Dossiê */}
                      <div
                        className="dashboard-section dossier-header-section"
                        style={{ padding: '24px' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: '16px'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '250px' }}>
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: '800',
                                color: 'var(--primary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}
                            >
                              Ficha Técnica Consolidada
                            </span>
                            <h2
                              style={{
                                fontSize: '22px',
                                fontWeight: '850',
                                color: 'var(--text-main)',
                                margin: '4px 0 6px 0',
                                lineHeight: '1.2'
                              }}
                            >
                              {selectedSchool.unidade_escolar}
                            </h2>
                            <div
                              style={{
                                display: 'flex',
                                gap: '12px',
                                flexWrap: 'wrap',
                                fontSize: '13px',
                                color: 'var(--text-light)',
                                fontWeight: '600'
                              }}
                            >
                              <span>
                                Designação: <strong>{selectedSchool.designacao}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Código SICI:{' '}
                                <strong>{selectedSchool.sici || 'Não Informado'}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Bairro: <strong>{selectedSchool.bairro}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={handlePrintSchoolDossier}
                              style={{
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-xs)',
                                fontWeight: '700',
                                fontSize: '13px'
                              }}
                              title="Exportar toda a Ficha Consolidada em PDF"
                            >
                              🖨️ Exportar Ficha (PDF)
                            </button>
                          </div>
                        </div>

                        {/* Banner de Situação de Climatização */}
                        <div style={{ marginTop: '20px' }}>
                          {dossier.status === 'critica' && (
                            <div
                              className="dossier-status-banner status-critica"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '16px',
                                borderRadius: 'var(--radius-xs)',
                                backgroundColor: 'var(--color-red-tint)',
                                border: '1px solid var(--color-red)',
                                color: 'var(--color-red)'
                              }}
                            >
                              <span style={{ fontSize: '24px' }}>🚨</span>
                              <div>
                                <strong
                                  style={{
                                    display: 'block',
                                    fontSize: '14.5px',
                                    fontWeight: '800'
                                  }}
                                >
                                  Situação Crítica
                                </strong>
                                <span style={{ fontSize: '13px', opacity: 0.9 }}>
                                  {dossier.reason || 'Unidade possui chamados críticos em aberto ou baixa cobertura de climatização. Exige intervenção imediata.'}
                                </span>
                              </div>
                            </div>
                          )}
                          {dossier.status === 'atencao' && (
                            <div
                              className="dossier-status-banner status-atencao"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '16px',
                                borderRadius: 'var(--radius-xs)',
                                backgroundColor: 'var(--color-amber-tint)',
                                border: '1px solid var(--color-amber)',
                                color: 'var(--color-amber)'
                              }}
                            >
                              <span style={{ fontSize: '24px' }}>⚠️</span>
                              <div>
                                <strong
                                  style={{
                                    display: 'block',
                                    fontSize: '14.5px',
                                    fontWeight: '800'
                                  }}
                                >
                                  Em Atenção
                                </strong>
                                <span style={{ fontSize: '13px', opacity: 0.9 }}>
                                  {dossier.reason || 'Dados pendentes de validação ou demandas ativas de menor severidade em andamento.'}
                                </span>
                              </div>
                            </div>
                          )}
                          {dossier.status === 'regular' && (
                            <div
                              className="dossier-status-banner status-regular"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '16px',
                                borderRadius: 'var(--radius-xs)',
                                backgroundColor: 'var(--color-green-tint)',
                                border: '1px solid var(--color-green)',
                                color: 'var(--color-green)'
                              }}
                            >
                              <span style={{ fontSize: '24px' }}>✓</span>
                              <div>
                                <strong
                                  style={{
                                    display: 'block',
                                    fontSize: '14.5px',
                                    fontWeight: '800'
                                  }}
                                >
                                  Situação Regular
                                </strong>
                                <span style={{ fontSize: '13px', opacity: 0.9 }}>
                                  {dossier.reason || 'Infraestrutura validada, dados confirmados e sem chamados em aberto.'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bloco de Infraestrutura */}
                      <div className="dashboard-section dossier-section">
                        <div className="section-header">
                          <h3>Infraestrutura de Climatização</h3>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '16px',
                            marginBottom: '20px'
                          }}
                        >
                          <div
                            className="dossier-stat-card"
                            style={{
                              padding: '16px',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-xs)',
                              backgroundColor: 'var(--bg-app)'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '12px',
                                color: 'var(--text-light)',
                                fontWeight: '700',
                                textTransform: 'uppercase'
                              }}
                            >
                              Salas de Aula
                            </span>
                            <div
                              style={{
                                fontSize: '22px',
                                fontWeight: '850',
                                color: 'var(--text-main)',
                                marginTop: '4px'
                              }}
                            >
                              {selectedSchool.qtd_salas_de_aula || '0'}
                            </div>
                          </div>
                          <div
                            className="dossier-stat-card"
                            style={{
                              padding: '16px',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-xs)',
                              backgroundColor: 'var(--bg-app)'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '12px',
                                color: 'var(--text-light)',
                                fontWeight: '700',
                                textTransform: 'uppercase'
                              }}
                            >
                              Salas Climatizadas
                            </span>
                            <div
                              style={{
                                fontSize: '22px',
                                fontWeight: '850',
                                color: 'var(--color-green)',
                                marginTop: '4px'
                              }}
                            >
                              {selectedSchool.aparelhos_em_sala || '0'}
                            </div>
                          </div>
                          <div
                            className="dossier-stat-card"
                            style={{
                              padding: '16px',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-xs)',
                              backgroundColor: 'var(--bg-app)'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '12px',
                                color: 'var(--text-light)',
                                fontWeight: '700',
                                textTransform: 'uppercase'
                              }}
                            >
                              Salas sem Aparelho
                            </span>
                            <div
                              style={{
                                fontSize: '22px',
                                fontWeight: '850',
                                color:
                                  Number(selectedSchool.salas_sem_aparelho) > 0
                                    ? 'var(--color-red)'
                                    : 'var(--text-main)',
                                marginTop: '4px'
                              }}
                            >
                              {selectedSchool.salas_sem_aparelho || '0'}
                            </div>
                          </div>
                          <div
                            className="dossier-stat-card"
                            style={{
                              padding: '16px',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-xs)',
                              backgroundColor: 'var(--bg-app)'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '12px',
                                color: 'var(--text-light)',
                                fontWeight: '700',
                                textTransform: 'uppercase'
                              }}
                            >
                              Necessidade Estimada
                            </span>
                            <div
                              style={{
                                fontSize: '22px',
                                fontWeight: '850',
                                color:
                                  Number(selectedSchool.necessidade_aparelhos) > 0
                                    ? 'var(--color-orange)'
                                    : 'var(--text-main)',
                                marginTop: '4px'
                              }}
                            >
                              {selectedSchool.necessidade_aparelhos || '0'} aparelhos
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '24px',
                            flexWrap: 'wrap',
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '20px'
                          }}
                        >
                          {/* Cobertura percentual progress */}
                          <div style={{ flex: 1, minWidth: '220px' }}>
                            {dossier.coveragePercent === null ? (
                              <div
                                style={{
                                  padding: '12px 16px',
                                  backgroundColor: 'var(--bg-app)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 'var(--radius-xs)',
                                  color: 'var(--text-light)',
                                  fontSize: '13px',
                                  fontWeight: '600'
                                }}
                              >
                                ⚠️ <strong>Percentual não calculado</strong>
                                <br />
                                Dados de salas de aula não informados no cadastro.
                              </div>
                            ) : (
                              renderCircularCoverage(selectedSchool)
                            )}
                          </div>

                          {/* Validação de cadastro */}
                          <div
                            style={{
                              flex: 1,
                              minWidth: '220px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <div
                                className={`dossier-validation-badge ${selectedSchool.confirmado_pela_unidade === 'Sim' ? 'badge-confirmed' : 'badge-pending'}`}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  backgroundColor:
                                    selectedSchool.confirmado_pela_unidade === 'Sim'
                                      ? 'var(--color-green-tint)'
                                      : 'var(--color-red-tint)',
                                  color:
                                    selectedSchool.confirmado_pela_unidade === 'Sim'
                                      ? 'var(--color-green)'
                                      : 'var(--color-red)',
                                  border: `1px solid ${selectedSchool.confirmado_pela_unidade === 'Sim' ? 'var(--color-green)' : 'var(--color-red)'}`
                                }}
                              >
                                {selectedSchool.confirmado_pela_unidade === 'Sim'
                                  ? '✓ Confirmado pela Escola'
                                  : '✗ Pendente Escola'}
                              </div>
                              <div
                                className={`dossier-validation-badge ${selectedSchool.validado_pela_gop === 'Sim' ? 'badge-confirmed' : 'badge-pending'}`}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  backgroundColor:
                                    selectedSchool.validado_pela_gop === 'Sim'
                                      ? 'var(--color-green-tint)'
                                      : 'var(--color-red-tint)',
                                  color:
                                    selectedSchool.validado_pela_gop === 'Sim'
                                      ? 'var(--color-green)'
                                      : 'var(--color-red)',
                                  border: `1px solid ${selectedSchool.validado_pela_gop === 'Sim' ? 'var(--color-green)' : 'var(--color-red)'}`
                                }}
                              >
                                {selectedSchool.validado_pela_gop === 'Sim'
                                  ? '✓ Validado pela GOP'
                                  : '✗ Pendente GOP'}
                              </div>
                            </div>
                            <div
                              style={{
                                fontSize: '12.5px',
                                color: 'var(--text-muted)',
                                fontWeight: '600'
                              }}
                            >
                              Endereço:{' '}
                              <span style={{ fontWeight: '500' }}>
                                {selectedSchool.endereco || 'Não informado'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quadro Financeiro Referencial */}
                        <div
                          className="dossier-financial-estimate"
                          style={{
                            marginTop: '20px',
                            padding: '16px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            borderLeft: '4px solid var(--color-orange)'
                          }}
                        >
                          <strong
                            style={{
                              fontSize: '11px',
                              display: 'block',
                              marginBottom: '6px',
                              textTransform: 'uppercase',
                              color: 'var(--text-light)',
                              letterSpacing: '0.5px'
                            }}
                          >
                            💰 Estimativa referencial preliminar, não orçamentária:
                          </strong>
                          <span
                            style={{
                              fontSize: '20px',
                              fontWeight: '900',
                              color: 'var(--color-orange)',
                              display: 'block',
                              marginBottom: '6px'
                            }}
                          >
                            {dossier.investmentEstimate.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              lineHeight: '1.4',
                              display: 'block',
                              fontWeight: '500'
                            }}
                          >
                            * Valor meramente referencial para triagem gerencial. Não substitui orçamento, pesquisa de preços, projeto elétrico ou processo de contratação.
                          </span>
                        </div>

                        {/* POP Action */}
                        <div
                          className={`dossier-pop-action status-${dossier.status}`}
                          style={{
                            marginTop: '20px',
                            padding: '16px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px dashed var(--border-color)',
                            borderLeft: `4px solid ${
                              dossier.status === 'critica'
                                ? 'var(--color-red)'
                                : dossier.status === 'atencao'
                                  ? 'var(--color-amber)'
                                  : 'var(--color-green)'
                            }`
                          }}
                        >
                          <strong
                            style={{
                              fontSize: '12px',
                              display: 'block',
                              marginBottom: '4px',
                              textTransform: 'uppercase',
                              color: 'var(--text-light)',
                              letterSpacing: '0.5px'
                            }}
                          >
                            🎯 Ação Sugerida (Procedimento POP):
                          </strong>
                          <span
                            style={{
                              fontSize: '13.5px',
                              fontWeight: '800',
                              color: 'var(--text-main)'
                            }}
                          >
                            {selectedSchool.acao_sugerida}
                          </span>
                        </div>
                      </div>

                      {/* Bloco de Chamados */}
                      <div className="dashboard-section dossier-section">
                        <div className="section-header">
                          <h3>Chamados e Demandas Vinculadas</h3>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                            gap: '16px',
                            marginBottom: '20px'
                          }}
                        >
                          <div
                            style={{
                              padding: '14px',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-xs)',
                              backgroundColor: 'var(--bg-app)',
                              textAlign: 'center'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-light)',
                                fontWeight: '700',
                                textTransform: 'uppercase'
                              }}
                            >
                              Ativos
                            </span>
                            <div
                              style={{
                                fontSize: '20px',
                                fontWeight: '850',
                                color: 'var(--primary)',
                                marginTop: '4px'
                              }}
                            >
                              {dossier.activeCount}
                            </div>
                          </div>
                          <div
                            style={{
                              padding: '14px',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-xs)',
                              backgroundColor: 'var(--bg-app)',
                              textAlign: 'center'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-light)',
                                fontWeight: '700',
                                textTransform: 'uppercase'
                              }}
                            >
                              Concluídos
                            </span>
                            <div
                              style={{
                                fontSize: '20px',
                                fontWeight: '850',
                                color: 'var(--color-green)',
                                marginTop: '4px'
                              }}
                            >
                              {dossier.closedCount}
                            </div>
                          </div>
                          <div
                            style={{
                              padding: '14px',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-xs)',
                              backgroundColor: 'var(--bg-app)',
                              textAlign: 'center'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-light)',
                                fontWeight: '700',
                                textTransform: 'uppercase'
                              }}
                            >
                              Críticos Ativos
                            </span>
                            <div
                              style={{
                                fontSize: '20px',
                                fontWeight: '850',
                                color:
                                  dossier.criticalCount > 0
                                    ? 'var(--color-red)'
                                    : 'var(--text-main)',
                                marginTop: '4px'
                              }}
                            >
                              {dossier.criticalCount}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            marginBottom: '20px',
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '16px'
                          }}
                        >
                          <div
                            style={{
                              fontSize: '13px',
                              color: 'var(--text-muted)',
                              fontWeight: '600'
                            }}
                          >
                            📢 <strong>Último Andamento:</strong>{' '}
                            <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>
                              {dossier.latestUpdate
                                ? `${formatDateBrazilian(dossier.latestUpdate.data)} - ${dossier.latestUpdate.description}`
                                : 'Nenhum andamento registrado no histórico.'}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              color: 'var(--text-muted)',
                              fontWeight: '600'
                            }}
                          >
                            ⏳ <strong>Chamado Ativo Mais Antigo:</strong>{' '}
                            <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>
                              {dossier.oldestActiveTicket
                                ? `${dossier.oldestActiveTicket.id_chamado} (${formatDateBrazilian(dossier.oldestActiveTicket.data_solicitacao)})`
                                : 'Nenhum chamado ativo pendente.'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div
                            style={{
                              fontSize: '11px',
                              textTransform: 'uppercase',
                              fontWeight: '800',
                              color: 'var(--text-light)',
                              letterSpacing: '0.5px',
                              marginBottom: '4px'
                            }}
                          >
                            Lista de Chamados da Unidade ({dossier.schoolTickets.length}):
                          </div>
                          {dossier.schoolTickets.map((t) => (
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                                    {t.id_chamado}
                                  </strong>
                                  {(() => {
                                    const count = allAttachments.filter(
                                      (a) => a.id_chamado === t.id_chamado
                                    ).length;
                                    if (count > 0) {
                                      return (
                                        <span
                                          style={{
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            padding: '1px 6px',
                                            borderRadius: '4px',
                                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                            color: 'var(--primary)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '3px'
                                          }}
                                          title={`${count} documento(s) anexo(s)`}
                                        >
                                          📎 {count}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                  <span
                                    className={`badge badge-priority-${normalizePriorityClass(t.prioridade)}`}
                                    style={{ fontSize: '9px', padding: '1px 4px' }}
                                  >
                                    {t.prioridade}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: '12.5px',
                                    color: 'var(--text-muted)',
                                    marginTop: '2px',
                                    fontWeight: '500'
                                  }}
                                >
                                  Local: {t.local_demanda} | Responsável: {t.setor_responsavel}
                                </div>
                              </div>
                              <span
                                className="badge badge-status"
                                style={getStatusStyle(t.status_atual)}
                              >
                                {t.status_atual}
                              </span>
                            </div>
                          ))}
                          {dossier.schoolTickets.length === 0 && (
                            <EmptyState
                              iconType="ticket"
                              title="Nenhum chamado cadastrado"
                              description="Registre uma nova demanda no formulário para iniciar o acompanhamento."
                            />
                          )}
                        </div>
                      </div>

                      {/* Bloco de Evidências (Arquivos) */}
                      <div className="dashboard-section dossier-section">
                        <div className="section-header">
                          <h3>Laudos e Evidências Técnicas</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {schoolAttachments.map((anexo) => (
                            <div
                              key={anexo.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 14px',
                                borderRadius: 'var(--radius-xs)',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-app)'
                              }}
                              className="hover-trigger dossier-evidence-row"
                            >
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    flexWrap: 'wrap'
                                  }}
                                >
                                  <strong
                                    className="evidence-filename"
                                    style={{ fontSize: '13px', color: 'var(--text-main)' }}
                                  >
                                    {anexo.nome_original}
                                  </strong>
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: '800',
                                      padding: '1px 6px',
                                      borderRadius: '99px',
                                      backgroundColor: 'var(--primary-light)',
                                      color: 'var(--primary)'
                                    }}
                                  >
                                    {anexo.id_chamado}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: '12px',
                                    color: 'var(--text-muted)',
                                    marginTop: '4px',
                                    fontWeight: '500'
                                  }}
                                >
                                  Tamanho: {(anexo.tamanho_bytes / 1024).toFixed(1)} KB · Enviado
                                  em: {formatDateBrazilian(anexo.criado_em)}
                                </div>
                              </div>

                              <div className="no-print" style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{
                                    padding: '6px 10px',
                                    fontSize: '12.5px',
                                    fontWeight: '700'
                                  }}
                                  onClick={() => {
                                    const { data } = supabaseClient.storage
                                      .from(anexo.bucket)
                                      .getPublicUrl(anexo.storage_path);
                                    window.open(data.publicUrl, '_blank', 'noopener,noreferrer');
                                  }}
                                >
                                  Abrir
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{
                                    padding: '6px 10px',
                                    fontSize: '12.5px',
                                    fontWeight: '700'
                                  }}
                                  onClick={() =>
                                    window.open(
                                      getAttachmentDownloadUrl(supabaseClient, anexo),
                                      '_blank',
                                      'noopener,noreferrer'
                                    )
                                  }
                                >
                                  Baixar
                                </button>
                              </div>
                            </div>
                          ))}
                          {schoolAttachments.length === 0 && (
                            <EmptyState
                              iconType="attachment"
                              title="Nenhum documento vinculado ainda"
                              description="Anexe laudos, fotos ou PDFs para consolidar o histórico da demanda."
                            />
                          )}
                        </div>
                      </div>

                      {/* Bloco de Histórico (Linha do Tempo) */}
                      <div className="dashboard-section dossier-section">
                        <div className="section-header">
                          <h3>Linha do Tempo e Nota Histórica</h3>
                        </div>

                        <div className="timeline">
                          {(() => {
                            const dbEvents = history
                              .filter((h) => matchesSchool(h, selectedSchool))
                              .map((h) => {
                                let docMeta = null;
                                let isDocument = false;
                                let docText = h.observacao || '';

                                if (
                                  h.marco_relevante &&
                                  h.marco_relevante.startsWith('Documento Anexo:')
                                ) {
                                  isDocument = true;
                                  try {
                                    docMeta = JSON.parse(h.observacao);
                                    docText = docMeta.name;
                                  } catch {
                                    docText = h.observacao || '';
                                  }
                                }

                                return {
                                  id: h.id_evento || `db-${Math.random()}`,
                                  data: h.data,
                                  autor: h.responsavel_registro || 'Sistema',
                                  setor: h.setor || 'GOP',
                                  titulo: h.id_chamado
                                    ? `Chamado ${h.id_chamado}: ${h.marco_relevante}`
                                    : h.marco_relevante,
                                  texto: docText,
                                  tipo: 'historico_db',
                                  logType: isDocument ? 'documento' : 'comentario',
                                  docMeta: docMeta
                                };
                              });

                            const localList = schoolLogs[selectedSchool.designacao] || [];
                            const localEvents = localList.map((n) => ({
                              id: n.id,
                              data: n.date,
                              autor: n.user || 'GOP/3ª CRE',
                              setor: 'GOP',
                              titulo:
                                n.type === 'documento'
                                  ? `Documento Anexo: ${n.content}`
                                  : `Anotação Técnica GOP`,
                              texto: n.content,
                              tipo: 'comentario_local',
                              docMeta: n.docMeta,
                              logType: n.type
                            }));

                            const integrated = [...dbEvents, ...localEvents].sort(
                              (a, b) => new Date(b.data) - new Date(a.data)
                            );

                            if (integrated.length === 0) {
                              return (
                                <EmptyState
                                  iconType="history"
                                  title="Sem registros no histórico"
                                  description="Nenhum marco de evento registrado no histórico para esta unidade."
                                />
                              );
                            }

                            return integrated.map((ev) => (
                              <div
                                key={ev.id}
                                className="timeline-event"
                                style={{
                                  borderLeft:
                                    ev.tipo === 'comentario_local'
                                      ? '2px dashed var(--primary)'
                                      : '2px solid var(--border-color)'
                                }}
                              >
                                <div
                                  className="timeline-event-marker"
                                  style={{
                                    backgroundColor:
                                      ev.tipo === 'comentario_local'
                                        ? 'var(--primary)'
                                        : 'var(--border-color)'
                                  }}
                                />
                                <div
                                  className="timeline-event-card"
                                  style={{
                                    borderLeft:
                                      ev.tipo === 'comentario_local'
                                        ? `3px solid ${ev.logType === 'documento' ? 'var(--primary)' : 'var(--color-amber)'}`
                                        : 'none'
                                  }}
                                >
                                  <div className="timeline-event-meta">
                                    <span>📅 {formatDateBrazilian(ev.data)}</span>
                                    <span style={{ fontWeight: 'bold' }}>
                                      👤 {ev.autor} ({ev.setor})
                                    </span>
                                  </div>
                                  <div
                                    className="timeline-event-title"
                                    style={{
                                      color:
                                        ev.tipo === 'comentario_local'
                                          ? 'var(--primary)'
                                          : 'var(--text-main)',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <span>{ev.titulo}</span>
                                    {ev.tipo === 'comentario_local' && (
                                      <button
                                        onClick={() => {
                                          setSchoolLogs((prev) => {
                                            const list = prev[selectedSchool.designacao] || [];
                                            return {
                                              ...prev,
                                              [selectedSchool.designacao]: list.filter(
                                                (item) => item.id !== ev.id
                                              )
                                            };
                                          });
                                          triggerToast('Registro removido!', 'info');
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          color: 'var(--text-light)',
                                          fontSize: '13px',
                                          padding: '0 4px'
                                        }}
                                        title="Remover este registro"
                                        className="no-print"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>

                                  {ev.logType === 'documento' ? (
                                    <div
                                      style={{
                                        marginTop: '6px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          flexWrap: 'wrap'
                                        }}
                                      >
                                        <a
                                          href={ev.docMeta?.url || '#'}
                                          target={ev.docMeta?.url ? '_blank' : undefined}
                                          rel={ev.docMeta?.url ? 'noopener noreferrer' : undefined}
                                          onClick={(e) => {
                                            if (!ev.docMeta?.url) {
                                              e.preventDefault();
                                              triggerToast(
                                                `Visualizando documento local no cache: ${ev.texto} (${ev.docMeta?.size || 'N/A'})`,
                                                'info'
                                              );
                                            }
                                          }}
                                          style={{
                                            color: 'var(--primary)',
                                            textDecoration: 'underline',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                          }}
                                        >
                                          📄 {ev.texto}
                                          <span
                                            style={{
                                              fontSize: '11.5px',
                                              color: 'var(--text-muted)',
                                              fontWeight: '500'
                                            }}
                                          >
                                            ({ev.docMeta?.size || 'N/A'})
                                          </span>
                                        </a>

                                        {ev.docMeta?.storageType === 'cloud' ? (
                                          <span
                                            style={{
                                              fontSize: '10.5px',
                                              fontWeight: '800',
                                              padding: '2px 8px',
                                              borderRadius: '99px',
                                              backgroundColor: 'var(--color-green-tint)',
                                              color: 'var(--color-green)',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px'
                                            }}
                                          >
                                            ☁️ Disponível na Nuvem (Equipe)
                                          </span>
                                        ) : (
                                          <span
                                            style={{
                                              fontSize: '10.5px',
                                              fontWeight: '800',
                                              padding: '2px 8px',
                                              borderRadius: '99px',
                                              backgroundColor: 'var(--color-amber-tint)',
                                              color: 'var(--color-amber)',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px'
                                            }}
                                          >
                                            💻 Salvo Localmente (Navegador)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="timeline-event-desc">{ev.texto}</p>
                                  )}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Notas Operacionais Locais */}
                      <div className="dashboard-section no-print">
                        <div className="section-header">
                          <h3>Anotações Técnicas (Registro Interno GOP)</h3>
                        </div>

                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--text-light)',
                            marginBottom: '12px',
                            fontWeight: '500',
                            lineHeight: '1.45'
                          }}
                        >
                          Adicione anotações, notas de reuniões ou observações locais sobre a
                          climatização desta escola. Estes registros ficam salvos no histórico da
                          unidade.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <textarea
                            rows="3"
                            className="form-control"
                            placeholder="Digite aqui a anotação técnica para a unidade..."
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            style={{ fontSize: '13.5px', padding: '10px 14px' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={handleAddSchoolLog}
                              style={{
                                fontSize: '13px',
                                padding: '8px 16px',
                                fontWeight: '700',
                                borderRadius: 'var(--radius-xs)',
                                cursor: 'pointer'
                              }}
                            >
                              Salvar Anotação
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

        {/* Simulador de Novo Chamado Tab */}
        {currentTab === 'form' && (
          <div className="dashboard-section" style={{ maxWidth: '950px', margin: '0 auto' }}>
            <div
              className="section-header"
              style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}
            >
              <div>
                <h3>
                  <IconForm /> Registrar chamado
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-light)',
                    marginTop: '4px',
                    fontWeight: '500'
                  }}
                >
                  Selecione a unidade escolar, informe o local da demanda e registre a próxima
                  providência inicial.
                </p>
              </div>
            </div>

            {newTicketSuccess ? (
              <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--primary)' }}>
                  <IconCheck />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
                  Demanda Registrada com Sucesso!
                </h3>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    marginBottom: '24px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  O chamado foi gravado com o identificador exclusivo:{' '}
                  <strong style={{ color: 'var(--primary)' }}>{newTicketSuccess}</strong>
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setSelectedEmailTicketId(newTicketSuccess);
                      setCustomEmailBody(
                        buildEmailDraft(
                          emailTemplates,
                          tickets,
                          newTicketSuccess,
                          selectedTemplateIndex
                        )
                      );
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
                {!supabaseClient && (
                  <div
                    className="local-warning-banner"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: 'var(--color-red)',
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                      marginBottom: '24px'
                    }}
                  >
                    <IconWarning />
                    <div>
                      <strong>Atenção: Modo Local Ativo (Sem Conexão Supabase)</strong>
                      <p style={{ margin: '4px 0 0 0', opacity: 0.85, fontSize: '0.82rem' }}>
                        Qualquer chamado criado ou alterado agora ficará salvo apenas na memória
                        temporária do seu navegador e será <strong>totalmente perdido</strong> ao
                        atualizar ou fechar esta página.
                      </p>
                    </div>
                  </div>
                )}

                {/* 1. SEÇÃO DE IDENTIFICAÇÃO */}
                <div className="form-section-title">
                  <IconBuilding />
                  <span>Seção 1: Identificação da Unidade e Demanda</span>
                </div>

                <div className="form-grid form-grid-3-cols">
                  <div className="form-group suggestion-container">
                    <label className="form-label" htmlFor="new-ticket-school-search">
                      Buscar Escola por Nome / Designação *
                    </label>
                    <input
                      id="new-ticket-school-search"
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
                        {searchSchools(schools, formSearchQuery).map((s) => (
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
                    <label className="form-label" htmlFor="new-ticket-designacao">
                      Designação (Preenchido auto)
                    </label>
                    <input
                      id="new-ticket-designacao"
                      type="text"
                      className="form-control"
                      disabled
                      value={formSelectedSchool ? formSelectedSchool.designacao : ''}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="new-ticket-sici">
                      Código SICI (Preenchido auto)
                    </label>
                    <input
                      id="new-ticket-sici"
                      type="text"
                      className="form-control"
                      disabled
                      value={formSelectedSchool ? formSelectedSchool.sici : ''}
                    />
                  </div>
                </div>

                {formSelectedSchool && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--primary-light)',
                      borderLeft: '4px solid var(--primary)',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '20px'
                    }}
                  >
                    📍 <strong>Endereço:</strong> {formSelectedSchool.endereco}, Bairro:{' '}
                    {formSelectedSchool.bairro}
                  </div>
                )}

                {/* 2. SEÇÃO DE DETALHES TÉCNICOS */}
                <div className="form-section-title">
                  <IconSettings />
                  <span>Seção 2: Especificações Técnicas da Solicitação</span>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="new-ticket-tipo">
                      Tipo de Solicitação *
                    </label>
                    <select
                      id="new-ticket-tipo"
                      className="form-control"
                      value={newTicket.tipo_demanda}
                      onChange={(e) => setNewTicket({ ...newTicket, tipo_demanda: e.target.value })}
                    >
                      <option value="Substituição/Instalação de Aparelho">
                        Substituição/Instalação de Aparelho
                      </option>
                      <option value="Nova Instalação">Nova Instalação</option>
                      <option value="Substituição de Aparelho">Substituição de Aparelho</option>
                      <option value="Manutenção Corretiva">Manutenção Corretiva</option>
                      <option value="Manutenção Preventiva">Manutenção Preventiva</option>
                      <option value="Adequação infra/elétrica">Adequação infra/elétrica</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="new-ticket-local">
                      Local Exato da Demanda *
                    </label>
                    <input
                      id="new-ticket-local"
                      type="text"
                      className="form-control"
                      placeholder="Ex: Sala 5, Secretaria, Diretoria"
                      required
                      value={newTicket.local_demanda}
                      onChange={(e) =>
                        setNewTicket({ ...newTicket, local_demanda: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="new-ticket-aparelho">
                      Tipo de Equipamento
                    </label>
                    <select
                      id="new-ticket-aparelho"
                      className="form-control"
                      value={newTicket.tipo_aparelho}
                      onChange={(e) =>
                        setNewTicket({ ...newTicket, tipo_aparelho: e.target.value })
                      }
                    >
                      <option value="Split">Split</option>
                      <option value="Janela">Janela</option>
                      <option value="Split e Janela">Split e Janela</option>
                      <option value="Não Possui">Não Possui</option>
                      <option value="Não Sabe Informar">Não Sabe Informar</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="new-ticket-btu-existente">
                      BTU Existente
                    </label>
                    <input
                      id="new-ticket-btu-existente"
                      type="text"
                      className="form-control"
                      placeholder="Ex: 12000"
                      value={newTicket.btu_existente}
                      onChange={(e) =>
                        setNewTicket({ ...newTicket, btu_existente: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="new-ticket-btu-pretendido">
                      BTU Pretendido
                    </label>
                    <input
                      id="new-ticket-btu-pretendido"
                      type="text"
                      className="form-control"
                      placeholder="Ex: 18000"
                      value={newTicket.btu_pretendido}
                      onChange={(e) =>
                        setNewTicket({ ...newTicket, btu_pretendido: e.target.value })
                      }
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
                    <label className="form-label" htmlFor="new-ticket-prioridade">
                      Prioridade Inicial *
                    </label>
                    <select
                      id="new-ticket-prioridade"
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
                    <label className="form-label" htmlFor="new-ticket-status">
                      Status Inicial *
                    </label>
                    <select
                      id="new-ticket-status"
                      className="form-control"
                      value={newTicket.status_atual}
                      onChange={(e) => setNewTicket({ ...newTicket, status_atual: e.target.value })}
                    >
                      <option value={STATUSES.RECEBIDO}>{STATUSES.RECEBIDO}</option>
                      <option value={STATUSES.VISTORIA}>{STATUSES.VISTORIA}</option>
                      <option value={STATUSES.AGUARDANDO_ORCAMENTO}>{STATUSES.AGUARDANDO_ORCAMENTO}</option>
                      <option value={STATUSES.SUSPENSO}>{STATUSES.SUSPENSO}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="new-ticket-setor">
                      Setor Responsável Atual *
                    </label>
                    <select
                      id="new-ticket-setor"
                      className="form-control"
                      value={newTicket.setor_responsavel}
                      onChange={(e) =>
                        setNewTicket({ ...newTicket, setor_responsavel: e.target.value })
                      }
                    >
                      <option value={DOMAIN_SECTORS.GOP}>{DOMAIN_SECTORS.GOP}</option>
                      <option value={DOMAIN_SECTORS.CPS}>{DOMAIN_SECTORS.CPS}</option>
                      <option value={DOMAIN_SECTORS.GIN}>{DOMAIN_SECTORS.GIN}</option>
                      <option value={DOMAIN_SECTORS.CTO}>{DOMAIN_SECTORS.CTO}</option>
                      <option value={DOMAIN_SECTORS.UNIDADE_ESCOLAR}>{DOMAIN_SECTORS.UNIDADE_ESCOLAR}</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group form-group-full">
                    <label className="form-label" htmlFor="new-ticket-providencia">
                      Próxima Providência GOP *
                    </label>
                    <input
                      id="new-ticket-providencia"
                      type="text"
                      className="form-control"
                      required
                      value={newTicket.proxima_providencia}
                      onChange={(e) =>
                        setNewTicket({ ...newTicket, proxima_providencia: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label" htmlFor="new-ticket-observacoes">
                      Observações de Campo
                    </label>
                    <textarea
                      id="new-ticket-observacoes"
                      className="form-control"
                      rows="3"
                      placeholder="Adicione informações adicionais recebidas..."
                      value={newTicket.observacoes}
                      onChange={(e) => setNewTicket({ ...newTicket, observacoes: e.target.value })}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    marginTop: '20px'
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentTab('dashboard')}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <span className="spin" style={{ display: 'inline-flex' }}>
                        <IconRefresh />
                      </span>
                    ) : (
                      <IconPlus />
                    )}
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
                <h3>
                  <IconMail /> Comunicações
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-light)',
                    marginTop: '4px',
                    fontWeight: '500'
                  }}
                >
                  Escolha um chamado e um modelo para gerar uma minuta de e-mail com os dados já
                  preenchidos.
                </p>
              </div>
            </div>

            <div className="email-flow-steps" aria-label="Fluxo de geração da minuta">
              <div className="email-flow-step">
                <span>Passo 1</span>
                <strong>Selecionar chamado</strong>
              </div>
              <div className="email-flow-step">
                <span>Passo 2</span>
                <strong>Escolher modelo</strong>
              </div>
              <div className="email-flow-step">
                <span>Passo 3</span>
                <strong>Revisar e copiar</strong>
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
                    {tickets.map((t) => (
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
                        <div
                          className="template-item-title"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <IconMail /> {tp.tipo}
                        </div>
                        <div className="template-item-meta">Etapa operacional: {tp.etapa}</div>
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
                      {customEmailBody.split('\n')[0]?.replace('Assunto: ', '') ||
                        'Comunicação Oficial'}
                    </span>
                  </div>
                  <div className="email-preview-field">
                    <span className="email-preview-field-label">Destinatário:</span>
                    <span className="email-preview-field-value">
                      Setor Parceiro / Unidade Escolar
                    </span>
                  </div>
                </div>

                {/* Abas de Visualização (Visualização formatada vs Editar texto do e-mail) */}
                <div
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    borderTopLeftRadius: 'var(--radius-sm)',
                    borderTopRightRadius: 'var(--radius-sm)',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setEmailTab('preview')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: emailTab === 'preview' ? 'var(--bg-card)' : 'transparent',
                      border: 'none',
                      borderBottom: emailTab === 'preview' ? '3px solid var(--primary)' : 'none',
                      color: emailTab === 'preview' ? 'var(--primary)' : 'var(--text-light)',
                      fontWeight: '800',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      transition: 'var(--transition)'
                    }}
                  >
                    Visualização formatada
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailTab('edit')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: emailTab === 'edit' ? 'var(--bg-card)' : 'transparent',
                      border: 'none',
                      borderBottom: emailTab === 'edit' ? '3px solid var(--primary)' : 'none',
                      color: emailTab === 'edit' ? 'var(--primary)' : 'var(--text-light)',
                      fontWeight: '800',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      transition: 'var(--transition)'
                    }}
                  >
                    Editar texto do e-mail
                  </button>
                </div>

                {emailTab === 'preview' ? (
                  <div
                    className="email-preview-body rich-email-body"
                    style={{
                      overflowY: 'auto',
                      maxHeight: '420px',
                      minHeight: '300px',
                      backgroundColor: 'var(--bg-card)'
                    }}
                  >
                    {renderRichEmail(
                      customEmailBody,
                      tickets.find((t) => t.id_chamado === selectedEmailTicketId)
                    )}
                  </div>
                ) : (
                  <textarea
                    className="email-preview-body plain-email-body"
                    value={customEmailBody}
                    onChange={(e) => setCustomEmailBody(e.target.value)}
                    style={{ minHeight: '300px' }}
                  />
                )}

                <div className="email-preview-actions">
                  <span
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-light)',
                      marginRight: 'auto',
                      alignSelf: 'center',
                      fontWeight: '600'
                    }}
                  >
                    {emailTab === 'preview'
                      ? "💡 Para alterar a minuta, use a aba 'Editar texto do e-mail'."
                      : '💡 Edite o texto na caixa acima antes de copiar.'}
                  </span>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      navigator.clipboard.writeText(customEmailBody);
                      triggerToast('Texto copiado para a área de transferência!');
                    }}
                    disabled={!selectedEmailTicketId}
                    style={!selectedEmailTicketId ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
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
            <div
              className="section-header"
              style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}
            >
              <div>
                <h3>
                  <IconDatabase /> Administração dos Dados
                </h3>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: 'var(--text-light)',
                    marginTop: '4px',
                    fontWeight: '500'
                  }}
                >
                  Acompanhe a situação da base usada pelo sistema. As ações técnicas ficam separadas
                  para evitar uso acidental.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <div
                className={`admin-status-card ${cloudConnected ? 'admin-status-ok' : 'admin-status-off'}`}
              >
                <div className="admin-status-icon">
                  {cloudConnected ? <IconCloud /> : <IconWarning />}
                </div>
                <div>
                  <strong>
                    {cloudConnected ? 'Base online ativa' : 'Base online não conectada'}
                  </strong>
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
                      Use esta área somente durante implantação ou manutenção. Usuários da rotina
                      diária não precisam preencher URL, chave ou SQL.
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
                        <label className="form-label">
                          Supabase Project API Key (Anon / Public) *
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Digite a chave anon do projeto Supabase..."
                          required
                          value={supabaseKey}
                          onChange={(e) => setSupabaseKey(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ alignSelf: 'flex-start', marginTop: '8px' }}
                        disabled={cloudLoading}
                      >
                        {cloudLoading ? <IconRefresh /> : <IconCloud />}
                        <span>{cloudLoading ? 'Conectando...' : 'Conectar base online'}</span>
                      </button>
                    </form>

                    <details className="admin-sql-details">
                      <summary>Ver instruções SQL de configuração</summary>
                      <ol>
                        <li>
                          Use o SQL Editor do Supabase apenas na configuração inicial ou em
                          manutenção controlada.
                        </li>
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
  tipo_aparelho TEXT DEFAULT 'Split',
  btu_existente TEXT,
  btu_pretendido TEXT,
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
);

-- 4. Tabela de Anexos
CREATE TABLE IF NOT EXISTS anexos_chamado (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_chamado TEXT REFERENCES chamados(id_chamado) ON DELETE CASCADE,
  designacao TEXT REFERENCES escolas(designacao) ON DELETE CASCADE,
  unidade_escolar TEXT,
  bucket TEXT DEFAULT 'gop-anexos',
  storage_path TEXT UNIQUE,
  nome_original TEXT,
  mime_type TEXT,
  tamanho_bytes BIGINT,
  descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
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
                      Estas ações podem afetar a base usada pelo site. Use apenas em manutenção
                      controlada, quando houver certeza sobre a base correta.
                    </p>
                    <div className="admin-advanced-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={handleSyncLocalToCloud}
                        disabled={true}
                        title="Sincronização local para nuvem desativada por segurança."
                      >
                        <IconRefresh />
                        <span>Enviar base local (Desativado)</span>
                      </button>
                      <button
                        className="btn btn-secondary btn-danger"
                        onClick={handleDisconnectCloud}
                      >
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
        <div
          className="modal-overlay"
          onClick={() => {
            if (!isSavingTicket && !isSavingHistory) setShowEditModal(false);
          }}
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-header">
              <div>
                <h2
                  className="modal-title-group"
                  id="modal-title"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <IconList />
                  <span>Ficha do Chamado {editingTicket.id_chamado}</span>
                  <button
                    className="btn-copy-summary"
                    onClick={() =>
                      handleCopySummary(
                        `Chamado: ${editingTicket.id_chamado}\nUnidade: ${editingTicket.unidade_escolar}\nStatus: ${editingTicket.status_atual}\nSetor Responsável: ${editingTicket.setor_responsavel}\nPrioridade: ${editingTicket.prioridade}\nÚltima Providência: ${editingTicket.proxima_providencia}\nObservações: ${editingTicket.observacoes}`,
                        'chamado'
                      )
                    }
                    title="Copiar resumo completo do chamado"
                    aria-label="Copiar resumo do chamado"
                    style={{ marginLeft: '4px' }}
                  >
                    <IconCopy />
                  </button>
                </h2>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-light)',
                    marginTop: '4px',
                    fontWeight: '500'
                  }}
                >
                  {editingTicket.unidade_escolar} · Designação: {editingTicket.designacao}
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => {
                  if (!isSavingTicket && !isSavingHistory) setShowEditModal(false);
                }}
                disabled={isSavingTicket || isSavingHistory}
                aria-label="Fechar ficha do chamado"
              >
                <IconClose />
              </button>
            </div>

            <div className="modal-body">
              {/* Two column detail lookup layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                {/* Left side: Editors */}
                <div>
                  <h4
                    style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      color: 'var(--primary)',
                      marginBottom: '16px',
                      borderBottom: '1px solid var(--border-color)',
                      paddingBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <IconDatabase /> Atualização Administrativa da GOP
                  </h4>

                  {!supabaseClient && (
                    <div
                      className="local-warning-banner"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: 'var(--color-red)',
                        fontSize: '0.78rem',
                        lineHeight: '1.3',
                        marginBottom: '12px'
                      }}
                    >
                      <IconWarning />
                      <div>
                        <strong>Edição Bloqueada — Modo Local Ativo.</strong> Conecte a base online
                        (Supabase) para editar e salvar alterações permanentes.
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-ticket-status">
                        Status do Chamado (12 Etapas POP) *
                      </label>
                      <select
                        id="edit-ticket-status"
                        className="form-control"
                        value={editingTicket.status_atual}
                        onChange={(e) =>
                          setEditingTicket({ ...editingTicket, status_atual: e.target.value })
                        }
                        disabled={!supabaseClient || isSavingTicket}
                      >
                        {STATUS_LIST.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-ticket-setor">
                        Setor Responsável Atual *
                      </label>
                      <select
                        id="edit-ticket-setor"
                        className="form-control"
                        value={editingTicket.setor_responsavel}
                        onChange={(e) =>
                          setEditingTicket({ ...editingTicket, setor_responsavel: e.target.value })
                        }
                        disabled={!supabaseClient || isSavingTicket}
                      >
                        {SECTOR_LIST.map((sector) => (
                          <option key={sector} value={sector}>
                            {sector}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-ticket-prioridade">
                        Prioridade *
                      </label>
                      <select
                        id="edit-ticket-prioridade"
                        className="form-control"
                        value={editingTicket.prioridade}
                        onChange={(e) =>
                          setEditingTicket({ ...editingTicket, prioridade: e.target.value })
                        }
                        disabled={!supabaseClient || isSavingTicket}
                      >
                        {PRIORITY_LIST.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-ticket-providencia">
                        Próxima Providência (O que falta fazer) *
                      </label>
                      <input
                        id="edit-ticket-providencia"
                        type="text"
                        className="form-control"
                        required
                        value={editingTicket.proxima_providencia}
                        onChange={(e) =>
                          setEditingTicket({
                            ...editingTicket,
                            proxima_providencia: e.target.value
                          })
                        }
                        disabled={!supabaseClient || isSavingTicket}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-ticket-movimentacao">
                        Última Movimentação Relevante
                      </label>
                      <input
                        id="edit-ticket-movimentacao"
                        type="text"
                        className="form-control"
                        value={editingTicket.ultima_movimentacao || ''}
                        onChange={(e) =>
                          setEditingTicket({
                            ...editingTicket,
                            ultima_movimentacao: e.target.value
                          })
                        }
                        disabled={!supabaseClient || isSavingTicket}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
                      <div
                        className="form-group"
                        style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}
                      >
                        <input
                          type="checkbox"
                          id="c_cto"
                          checked={editingTicket.comunicacao_cto === 'Sim'}
                          onChange={(e) =>
                            setEditingTicket({
                              ...editingTicket,
                              comunicacao_cto: e.target.checked ? 'Sim' : 'Não'
                            })
                          }
                          disabled={!supabaseClient || isSavingTicket}
                        />
                        <label
                          htmlFor="c_cto"
                          className="form-label"
                          style={{ cursor: 'pointer', margin: 0 }}
                        >
                          Comunicação CTO?
                        </label>
                      </div>

                      <div className="form-group">
                        <label
                          htmlFor="edit-ticket-validation"
                          className="sr-only"
                          style={{ display: 'none' }}
                        >
                          Validação
                        </label>
                        <select
                          id="edit-ticket-validation"
                          className="form-control"
                          style={{ padding: '4px 10px', fontSize: '13px' }}
                          value={editingTicket.informacao_validada}
                          onChange={(e) =>
                            setEditingTicket({
                              ...editingTicket,
                              informacao_validada: e.target.value
                            })
                          }
                          disabled={!supabaseClient || isSavingTicket}
                        >
                          <option value="Sim">Validada</option>
                          <option value="Pendente de Vistoria">Pendente de Vistoria</option>
                          <option value="Não validada">Não Validada</option>
                          <option value="Não procede">Não procede</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-ticket-observacoes">
                        Observações Gerais
                      </label>
                      <textarea
                        id="edit-ticket-observacoes"
                        className="form-control"
                        rows="8"
                        value={editingTicket.observacoes}
                        onChange={(e) =>
                          setEditingTicket({ ...editingTicket, observacoes: e.target.value })
                        }
                        style={{ fontSize: '13px', lineHeight: '1.5', padding: '12px' }}
                        disabled={!supabaseClient || isSavingTicket}
                      />
                    </div>
                  </div>
                </div>

                {/* Right side: Summary & Timeline */}
                <div>
                  <h4
                    style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      color: 'var(--secondary)',
                      marginBottom: '16px',
                      borderBottom: '1px solid var(--border-color)',
                      paddingBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px'
                    }}
                  >
                    🏢 Ficha Técnica da Demanda (Editável)
                  </h4>

                  <div
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      marginBottom: '20px'
                    }}
                  >
                    <div className="form-group" style={{ margin: 0 }}>
                      <label
                        className="form-label"
                        htmlFor="edit-ticket-local"
                        style={{
                          fontWeight: '700',
                          fontSize: '11px',
                          color: 'var(--text-light)',
                          marginBottom: '4px'
                        }}
                      >
                        Local Exato
                      </label>
                      <input
                        id="edit-ticket-local"
                        type="text"
                        className="form-control"
                        style={{ padding: '6px 10px', fontSize: '13px', height: '32px' }}
                        value={editingTicket.local_demanda || ''}
                        onChange={(e) =>
                          setEditingTicket({ ...editingTicket, local_demanda: e.target.value })
                        }
                        disabled={!supabaseClient || isSavingTicket}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label
                        className="form-label"
                        htmlFor="edit-ticket-tipo"
                        style={{
                          fontWeight: '700',
                          fontSize: '11px',
                          color: 'var(--text-light)',
                          marginBottom: '4px'
                        }}
                      >
                        Tipo de Solicitação
                      </label>
                      <select
                        id="edit-ticket-tipo"
                        className="form-control"
                        style={{ padding: '4px 10px', fontSize: '13px', height: '32px' }}
                        value={editingTicket.tipo_demanda || 'Substituição/Instalação de Aparelho'}
                        onChange={(e) =>
                          setEditingTicket({ ...editingTicket, tipo_demanda: e.target.value })
                        }
                        disabled={!supabaseClient || isSavingTicket}
                      >
                        <option value="Substituição/Instalação de Aparelho">
                          Substituição/Instalação de Aparelho
                        </option>
                        <option value="Nova Instalação">Nova Instalação</option>
                        <option value="Substituição de Aparelho">Substituição de Aparelho</option>
                        <option value="Manutenção Corretiva">Manutenção Corretiva</option>
                        <option value="Manutenção Preventiva">Manutenção Preventiva</option>
                        <option value="Adequação infra/elétrica">Adequação infra/elétrica</option>
                      </select>
                    </div>

                    <div
                      style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px' }}
                    >
                      <div className="form-group" style={{ margin: 0 }}>
                        <label
                          className="form-label"
                          htmlFor="edit-ticket-aparelho"
                          style={{
                            fontWeight: '700',
                            fontSize: '11px',
                            color: 'var(--text-light)',
                            marginBottom: '4px'
                          }}
                        >
                          Aparelho
                        </label>
                        <select
                          id="edit-ticket-aparelho"
                          className="form-control"
                          style={{ padding: '4px 10px', fontSize: '13px', height: '32px' }}
                          value={editingTicket.tipo_aparelho || 'Split'}
                          onChange={(e) =>
                            setEditingTicket({ ...editingTicket, tipo_aparelho: e.target.value })
                          }
                          disabled={!supabaseClient || isSavingTicket}
                        >
                          <option value="Split">Split</option>
                          <option value="Janela">Janela</option>
                          <option value="Split e Janela">Split e Janela</option>
                          <option value="Não Possui">Não Possui</option>
                          <option value="Não Sabe Informar">Não Sabe Informar</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label
                          className="form-label"
                          htmlFor="edit-ticket-btu-existente"
                          style={{
                            fontWeight: '700',
                            fontSize: '11px',
                            color: 'var(--text-light)',
                            marginBottom: '4px'
                          }}
                        >
                          BTU atual
                        </label>
                        <input
                          id="edit-ticket-btu-existente"
                          type="text"
                          className="form-control"
                          style={{ padding: '6px 10px', fontSize: '13px', height: '32px' }}
                          placeholder="Existente"
                          value={editingTicket.btu_existente || ''}
                          onChange={(e) =>
                            setEditingTicket({ ...editingTicket, btu_existente: e.target.value })
                          }
                          disabled={!supabaseClient || isSavingTicket}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label
                          className="form-label"
                          htmlFor="edit-ticket-btu-pretendido"
                          style={{
                            fontWeight: '700',
                            fontSize: '11px',
                            color: 'var(--text-light)',
                            marginBottom: '4px'
                          }}
                        >
                          BTU pretendido
                        </label>
                        <input
                          id="edit-ticket-btu-pretendido"
                          type="text"
                          className="form-control"
                          style={{ padding: '6px 10px', fontSize: '13px', height: '32px' }}
                          placeholder="Pretendido"
                          value={editingTicket.btu_pretendido || ''}
                          onChange={(e) =>
                            setEditingTicket({ ...editingTicket, btu_pretendido: e.target.value })
                          }
                          disabled={!supabaseClient || isSavingTicket}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label
                        className="form-label"
                        htmlFor="edit-ticket-aptidao"
                        style={{
                          fontWeight: '700',
                          fontSize: '11px',
                          color: 'var(--text-light)',
                          marginBottom: '4px'
                        }}
                      >
                        Aptidão Técnica
                      </label>
                      <select
                        id="edit-ticket-aptidao"
                        className="form-control"
                        style={{ padding: '4px 10px', fontSize: '13px', height: '32px' }}
                        value={editingTicket.resultado_aptidao || 'Pendente'}
                        onChange={(e) =>
                          setEditingTicket({ ...editingTicket, resultado_aptidao: e.target.value })
                        }
                        disabled={!supabaseClient || isSavingTicket}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Apta">Apta</option>
                        <option value="Apta parcialmente">Apta parcialmente</option>
                        <option value="Não apta">Não apta</option>
                      </select>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        fontWeight: '600',
                        marginTop: '4px',
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '8px'
                      }}
                    >
                      <div>Abertura: {formatDateBrazilian(editingTicket.criado_em) || 'N/A'}</div>
                      <div>
                        Alterado: {formatDateBrazilian(editingTicket.modificado_em) || 'Sem mov.'}
                      </div>
                    </div>

                    <div
                      className="inactivity-warning-row"
                      style={{
                        color: 'var(--color-orange)',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px'
                      }}
                    >
                      <IconClock />
                      <span>
                        Sem movimentação há {getInactivityDays(editingTicket.modificado_em)} dias.
                      </span>
                    </div>
                  </div>

                  {/* Seção de Anexos do Chamado */}
                  <h4
                    style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      color: 'var(--primary)',
                      marginBottom: '16px',
                      borderBottom: '1px solid var(--border-color)',
                      paddingBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    📎 Documentos do chamado ({ticketAttachments.length})
                  </h4>
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      marginBottom: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12.5px',
                          color: 'var(--text-light)',
                          fontWeight: '500'
                        }}
                      >
                        Laudos técnicos, termos ou fotos da vistoria.
                      </span>
                      {supabaseClient ? (
                        <>
                          <input
                            id="ticket-attachment"
                            type="file"
                            accept="application/pdf,image/png,image/jpeg,image/webp"
                            onChange={handleUploadTicketAttachment}
                            style={{ display: 'none' }}
                            disabled={attachmentUploading}
                          />
                          <label
                            htmlFor="ticket-attachment"
                            className={`btn ${attachmentUploading ? 'btn-secondary' : 'btn-primary'}`}
                            style={{
                              fontSize: '12.5px',
                              padding: '6px 12px',
                              cursor: attachmentUploading ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: '700',
                              margin: 0
                            }}
                          >
                            {attachmentUploading ? 'Enviando...' : '📎 Anexar documento'}
                          </label>
                        </>
                      ) : (
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--color-orange)',
                            fontWeight: '700'
                          }}
                        >
                          ⚠️ Conecte ao Supabase para anexar
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        marginTop: '4px'
                      }}
                    >
                      {ticketAttachments.map((anexo) => (
                        <div
                          key={anexo.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-xs)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-card)',
                            transition: 'border-color 0.2s'
                          }}
                          className="hover-trigger"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '18px' }}>
                              {anexo.mime_type?.includes('pdf') ? '📄' : '🖼️'}
                            </span>
                            <div>
                              <div
                                style={{
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  color: 'var(--text-main)',
                                  maxWidth: '180px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {anexo.nome_original}
                              </div>
                              <div
                                style={{
                                  fontSize: '11.5px',
                                  color: 'var(--text-muted)',
                                  marginTop: '2px'
                                }}
                              >
                                {(anexo.tamanho_bytes / 1024).toFixed(1)} KB ·{' '}
                                {formatDateBrazilian(anexo.criado_em)}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '700' }}
                              onClick={() =>
                                window.open(
                                  getAttachmentPublicUrl(supabaseClient, anexo),
                                  '_blank',
                                  'noopener,noreferrer'
                                )
                              }
                            >
                              Abrir
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '700' }}
                              onClick={() =>
                                window.open(
                                  getAttachmentDownloadUrl(supabaseClient, anexo),
                                  '_blank',
                                  'noopener,noreferrer'
                                )
                              }
                            >
                              Baixar
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                color: 'var(--color-red, #ef4444)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onClick={() => handleDeleteTicketAttachment(anexo)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                      {ticketAttachments.length === 0 && (
                        <EmptyState
                          iconType="attachment"
                          title="Nenhum documento vinculado ainda"
                          description="Anexe laudos, fotos ou PDFs para consolidar o histórico da demanda."
                        />
                      )}
                    </div>
                  </div>

                  <h4
                    style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      color: 'var(--text-main)',
                      marginBottom: '16px',
                      borderBottom: '1px solid var(--border-color)',
                      paddingBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px'
                    }}
                  >
                    ⏳ Linha de Tempo do Chamado
                  </h4>

                  <div
                    className="timeline"
                    style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '6px' }}
                  >
                    {history
                      .filter((h) => h.id_chamado === editingTicket.id_chamado)
                      .map((h) => (
                        <div key={h.id_evento} className="timeline-event">
                          <div className="timeline-event-marker" />
                          <div
                            className="timeline-event-card"
                            style={{ padding: '8px 10px', position: 'relative' }}
                          >
                            <div
                              className="timeline-event-meta"
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap'
                              }}
                            >
                              <span
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <IconCalendar style={{ width: '13px', height: '13px' }} />{' '}
                                {formatDateBrazilian(h.data)}
                              </span>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 'bold'
                                }}
                              >
                                <IconUser style={{ width: '13px', height: '13px' }} />{' '}
                                {h.responsavel_registro}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '12.5px',
                                fontWeight: 'bold',
                                marginTop: '2px',
                                color: 'var(--text-main)'
                              }}
                            >
                              {h.marco_relevante}
                            </div>
                            <p
                              style={{
                                fontSize: '13px',
                                color: 'var(--text-muted)',
                                marginTop: '4px',
                                lineHeight: '1.35'
                              }}
                            >
                              {h.observacao}
                            </p>
                          </div>
                        </div>
                      ))}
                    {history.filter((h) => h.id_chamado === editingTicket.id_chamado).length ===
                      0 && (
                      <EmptyState
                        iconType="history"
                        title="Sem registros de histórico"
                        description="Nenhum evento ou comentário registrado para este chamado."
                        style={{ padding: '18px 12px' }}
                      />
                    )}
                  </div>

                  {supabaseClient && (
                    <div
                      style={{
                        marginTop: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '12px'
                      }}
                    >
                      <label
                        htmlFor="new-ticket-comment"
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: 'var(--text-light)',
                          textTransform: 'uppercase'
                        }}
                      >
                        ✍ Registrar Observação Adicional
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <textarea
                          id="new-ticket-comment"
                          className="form-control"
                          rows="2"
                          placeholder="Digite aqui uma observação técnica ou retificação..."
                          style={{
                            fontSize: '13px',
                            padding: '8px',
                            minHeight: '50px',
                            resize: 'vertical'
                          }}
                          value={newTicketComment}
                          onChange={(e) => setNewTicketComment(e.target.value)}
                          disabled={isSavingHistory}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{
                            alignSelf: 'flex-end',
                            height: '36px',
                            padding: '0 16px',
                            fontSize: '13px',
                            whiteSpace: 'nowrap'
                          }}
                          onClick={async () => {
                            if (await handleAddTicketHistoryEvent(newTicketComment)) {
                              setNewTicketComment('');
                            }
                          }}
                          disabled={isSavingHistory}
                        >
                          {isSavingHistory ? 'Registrando...' : 'Registrar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedEmailTicketId(editingTicket.id_chamado);
                  setCustomEmailBody(
                    buildEmailDraft(
                      emailTemplates,
                      tickets,
                      editingTicket.id_chamado,
                      selectedTemplateIndex
                    )
                  );
                  setCurrentTab('email');
                  setShowEditModal(false);
                }}
                style={{ marginRight: 'auto' }}
              >
                <IconMail />
                <span>Minutar E-mail</span>
              </button>
              {!supabaseClient && (
                <div
                  style={{
                    color: 'hsl(38, 92%, 50%)',
                    fontSize: '11px',
                    fontWeight: '700',
                    textAlign: 'right',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px',
                    marginRight: '12px',
                    alignItems: 'flex-end'
                  }}
                >
                  <span>⚠ Edição bloqueada em modo local</span>
                  <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: '500' }}>
                    Conecte a base online para salvar.
                  </span>
                </div>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (!isSavingTicket && !isSavingHistory) setShowEditModal(false);
                }}
                disabled={isSavingTicket || isSavingHistory}
              >
                Fechar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={saveEditedTicket}
                disabled={!supabaseClient || isSavingTicket || isSavingHistory}
                style={
                  !supabaseClient || isSavingTicket || isSavingHistory
                    ? { opacity: 0.5, cursor: 'not-allowed' }
                    : {}
                }
              >
                {isSavingTicket ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <IconCheck />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <Analytics />
    </div>
  );
}
