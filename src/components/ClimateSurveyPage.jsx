import { useMemo, useState, useEffect } from 'react';
import { Building2, Plus, Save, Snowflake, Trash2, Wifi, WifiOff } from 'lucide-react';
import dbData from '../data/db.json';
import {
  APPLIANCE_STATUS_OPTIONS,
  DEFAULT_APPLIANCE_TYPE_OPTIONS,
  DEFAULT_BTU_OPTIONS,
  ENVIRONMENT_TYPE_OPTIONS,
  buildDisplayName,
  createEnvironment,
  normalizeSurvey,
  resizeAppliances,
  validateSurvey
} from '../lib/climateSurvey.js';
import {
  createFirebaseClient,
  isFirebaseConfigured,
  readFirebaseConfig
} from '../infrastructure/firebase/firebaseClient.js';
import { createFirestorePersistence } from '../infrastructure/firebase/firestorePersistence.js';
import '../styles/climate-survey.css';

const QUANTITY_OPTIONS = Array.from({ length: 11 }, (_, index) => String(index));

const uniqueTextValues = (values) =>
  [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { numeric: true })
  );

function getTechnicalSuggestions() {
  const tickets = Array.isArray(dbData?.chamados) ? dbData.chamados : [];
  return {
    applianceTypes: uniqueTextValues([
      ...DEFAULT_APPLIANCE_TYPE_OPTIONS,
      ...tickets.map((ticket) => ticket.tipo_aparelho)
    ]),
    btu: uniqueTextValues([
      ...DEFAULT_BTU_OPTIONS,
      ...tickets.flatMap((ticket) => [ticket.btu_existente, ticket.btu_pretendido])
    ])
  };
}

function loadLocalSurvey(storageKey, school) {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      const validation = validateSurvey(parsed);
      if (validation.success) return validation.data;
    }
  } catch (error) {
    console.warn('Rascunho local de climatização inválido:', error);
  }

  return {
    designacao: school.designacao,
    unidade_escolar: school.unidade_escolar,
    ambientes: [createEnvironment()]
  };
}

function ApplianceCard({ environmentId, appliance, index, onChange, btuOptions, typeOptions }) {
  const prefix = `${environmentId}-${appliance.id}`;

  return (
    <section className="climate-survey-appliance" data-appliance-index={index}>
      <div className="climate-survey-appliance-title">
        <Snowflake size={19} aria-hidden="true" />
        <h3>Aparelho {index + 1}</h3>
      </div>

      <div className="climate-survey-field climate-survey-field--full">
        <label htmlFor={`${prefix}-modelo`}>Modelo / marca</label>
        <input
          id={`${prefix}-modelo`}
          type="text"
          value={appliance.modelo_marca}
          onChange={(event) => onChange('modelo_marca', event.target.value)}
          placeholder="Digite ou selecione se já conhecer"
          autoComplete="off"
        />
      </div>

      <div className="climate-survey-field-grid">
        <div className="climate-survey-field">
          <label htmlFor={`${prefix}-btu`}>Capacidade (BTU)</label>
          <input
            id={`${prefix}-btu`}
            type="text"
            inputMode="numeric"
            list="climate-survey-btu-options"
            value={appliance.capacidade_btu}
            onChange={(event) => onChange('capacidade_btu', event.target.value)}
            placeholder="Ex.: 12000"
            autoComplete="off"
          />
        </div>

        <div className="climate-survey-field">
          <label htmlFor={`${prefix}-tipo`}>Tipo do aparelho</label>
          <input
            id={`${prefix}-tipo`}
            type="text"
            list="climate-survey-type-options"
            value={appliance.tipo}
            onChange={(event) => onChange('tipo', event.target.value)}
            placeholder="Ex.: Split"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="climate-survey-field climate-survey-field--full">
        <label htmlFor={`${prefix}-situacao`}>Situação</label>
        <select
          id={`${prefix}-situacao`}
          value={appliance.situacao}
          onChange={(event) => onChange('situacao', event.target.value)}
          className={
            appliance.situacao === 'Funcionando'
              ? 'is-working'
              : appliance.situacao === 'Precisa de manutenção'
                ? 'needs-maintenance'
                : ''
          }
        >
          {APPLIANCE_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="climate-survey-field climate-survey-field--full">
        <label htmlFor={`${prefix}-observacoes`}>Observações</label>
        <textarea
          id={`${prefix}-observacoes`}
          rows="3"
          value={appliance.observacoes}
          onChange={(event) => onChange('observacoes', event.target.value)}
          placeholder="Opcional"
        />
      </div>

      <datalist id="climate-survey-btu-options">
        {btuOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="climate-survey-type-options">
        {typeOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </section>
  );
}

export default function ClimateSurveyPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const designacao = params.get('levantamento')?.trim() || '';
  const school = useMemo(
    () => (dbData?.escolas || []).find((candidate) => candidate.designacao === designacao),
    [designacao]
  );
  const storageKey = `gop_climate_survey_${designacao}`;
  const suggestions = useMemo(() => getTechnicalSuggestions(), []);

  const [survey, setSurvey] = useState(() =>
    school
      ? loadLocalSurvey(storageKey, school)
      : { designacao, unidade_escolar: '', ambientes: [] }
  );
  const [activeEnvironmentId, setActiveEnvironmentId] = useState(
    () => survey.ambientes[0]?.id || ''
  );
  const [persistence, setPersistence] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [connectionLabel, setConnectionLabel] = useState('Rascunho local');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!school) return undefined;

    const config = readFirebaseConfig(import.meta.env);
    if (!isFirebaseConfigured(config)) return undefined;

    let active = true;
    const loadRemote = async () => {
      try {
        const { db } = createFirebaseClient(config);
        const gateway = createFirestorePersistence(db);
        const remote = await gateway.loadClimateSurvey(designacao);
        if (!active) return;
        setPersistence(gateway);
        setConnectionLabel('Base online disponível');
        if (remote) {
          const validation = validateSurvey(remote);
          if (validation.success) {
            setSurvey(validation.data);
            setActiveEnvironmentId(validation.data.ambientes[0]?.id || '');
            localStorage.setItem(storageKey, JSON.stringify(validation.data));
          }
        }
      } catch (error) {
        console.warn('Levantamento Firestore indisponível; mantendo rascunho local.', error);
        if (active) setConnectionLabel('Rascunho local');
      }
    };

    loadRemote();
    return () => {
      active = false;
    };
  }, [designacao, school, storageKey]);

  if (!school) {
    return (
      <main className="climate-survey-page">
        <section className="climate-survey-shell climate-survey-error">
          <Snowflake size={36} />
          <h1>Prontuário de Climatização</h1>
          <p>O link não identifica uma unidade escolar válida.</p>
        </section>
      </main>
    );
  }

  const activeEnvironment =
    survey.ambientes.find((environment) => environment.id === activeEnvironmentId) ||
    survey.ambientes[0];

  const updateEnvironment = (environmentId, updater) => {
    setSurvey((current) => ({
      ...current,
      ambientes: current.ambientes.map((environment) =>
        environment.id === environmentId ? updater(environment) : environment
      )
    }));
  };

  const updateEnvironmentField = (field, value) => {
    if (!activeEnvironment) return;
    updateEnvironment(activeEnvironment.id, (environment) => {
      const next = { ...environment, [field]: value };
      if (field === 'tipo' || field === 'identificacao') {
        next.nome_exibicao = buildDisplayName(next);
      }
      return next;
    });
  };

  const updateQuantity = (value) => {
    if (!activeEnvironment) return;
    const count = Number.parseInt(value, 10) || 0;
    updateEnvironment(activeEnvironment.id, (environment) => ({
      ...environment,
      quantidade_aparelhos: count,
      aparelhos: resizeAppliances(environment.aparelhos, count)
    }));
  };

  const updateAppliance = (applianceId, field, value) => {
    if (!activeEnvironment) return;
    updateEnvironment(activeEnvironment.id, (environment) => ({
      ...environment,
      aparelhos: environment.aparelhos.map((appliance) =>
        appliance.id === applianceId ? { ...appliance, [field]: value } : appliance
      )
    }));
  };

  const addEnvironment = () => {
    const environment = createEnvironment();
    setSurvey((current) => ({
      ...current,
      ambientes: [...current.ambientes, environment]
    }));
    setActiveEnvironmentId(environment.id);
    setSaveMessage('');
  };

  const removeActiveEnvironment = () => {
    if (!activeEnvironment || survey.ambientes.length <= 1) return;
    const next = survey.ambientes.filter((environment) => environment.id !== activeEnvironment.id);
    setSurvey((current) => ({ ...current, ambientes: next }));
    setActiveEnvironmentId(next[0]?.id || '');
    setSaveMessage('');
  };

  const saveSurvey = async () => {
    const validation = validateSurvey(survey);
    if (!validation.success) {
      setSaveMessage(validation.error.issues[0]?.message || 'Revise o levantamento antes de salvar.');
      return;
    }

    setIsSaving(true);
    try {
      const localRecord = normalizeSurvey({
        ...validation.data,
        atualizado_em: new Date().toISOString()
      });
      localStorage.setItem(storageKey, JSON.stringify(localRecord));
      setSurvey(localRecord);

      if (persistence) {
        const remoteRecord = await persistence.saveClimateSurvey(localRecord);
        localStorage.setItem(storageKey, JSON.stringify(remoteRecord));
        setSurvey(remoteRecord);
        setSaveMessage('Levantamento salvo na base online.');
      } else {
        setSaveMessage('Levantamento salvo neste navegador.');
      }
    } catch (error) {
      console.error('Falha ao salvar levantamento:', error);
      setSaveMessage('Não foi possível salvar na base online. O rascunho ficou salvo neste navegador.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="climate-survey-page">
      <div className="climate-survey-shell">
        <header className="climate-survey-header">
          <div className="climate-survey-title-icon" aria-hidden="true">
            <Snowflake size={28} />
          </div>
          <div>
            <p className="climate-survey-eyebrow">3ª CRE · GOP</p>
            <h1>Prontuário de Climatização</h1>
            <p>Levantamento por ambientes</p>
          </div>
          <div className="climate-survey-connection" title={connectionLabel}>
            {persistence ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{connectionLabel}</span>
          </div>
        </header>

        <section className="climate-survey-school" aria-label="Unidade escolar">
          <Building2 size={22} aria-hidden="true" />
          <div>
            <span>Unidade escolar</span>
            <strong>{school.unidade_escolar}</strong>
          </div>
          <small>Designação {school.designacao}</small>
        </section>

        <nav className="climate-survey-environment-nav" aria-label="Ambientes cadastrados">
          <div className="climate-survey-environment-tabs">
            {survey.ambientes.map((environment) => (
              <button
                type="button"
                key={environment.id}
                className={environment.id === activeEnvironment?.id ? 'is-active' : ''}
                onClick={() => setActiveEnvironmentId(environment.id)}
              >
                {environment.nome_exibicao || 'Novo ambiente'}
              </button>
            ))}
          </div>
          <button type="button" className="climate-survey-add-environment" onClick={addEnvironment}>
            <Plus size={17} /> Novo ambiente
          </button>
        </nav>

        {activeEnvironment && (
          <section className="climate-survey-form-card">
            <div className="climate-survey-environment-fields">
              <div className="climate-survey-field">
                <label htmlFor="survey-environment-type">Tipo de ambiente</label>
                <input
                  id="survey-environment-type"
                  list="climate-survey-environment-options"
                  value={activeEnvironment.tipo}
                  onChange={(event) => updateEnvironmentField('tipo', event.target.value)}
                  autoComplete="off"
                />
                <datalist id="climate-survey-environment-options">
                  {ENVIRONMENT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>

              <div className="climate-survey-field">
                <label htmlFor="survey-environment-id">Identificação do ambiente</label>
                <input
                  id="survey-environment-id"
                  type="text"
                  value={activeEnvironment.identificacao}
                  onChange={(event) => updateEnvironmentField('identificacao', event.target.value)}
                  placeholder="Ex.: 101, A, Bloco B"
                  autoComplete="off"
                />
              </div>

              <div className="climate-survey-field climate-survey-quantity-field">
                <label htmlFor="survey-appliance-quantity">Quantidade de aparelhos</label>
                <select
                  id="survey-appliance-quantity"
                  value={String(activeEnvironment.quantidade_aparelhos)}
                  onChange={(event) => updateQuantity(event.target.value)}
                >
                  {QUANTITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="climate-survey-current-environment">
              <span>Ambiente em preenchimento</span>
              <strong>{activeEnvironment.nome_exibicao || 'Novo ambiente'}</strong>
              {survey.ambientes.length > 1 && (
                <button type="button" onClick={removeActiveEnvironment}>
                  <Trash2 size={15} /> Excluir ambiente
                </button>
              )}
            </div>

            {activeEnvironment.aparelhos.length === 0 ? (
              <div className="climate-survey-empty-appliances">
                <Snowflake size={28} aria-hidden="true" />
                <p>Este ambiente foi informado com 0 aparelhos.</p>
                <span>Altere a quantidade acima caso exista equipamento instalado.</span>
              </div>
            ) : (
              <div className="climate-survey-appliance-grid">
                {activeEnvironment.aparelhos.map((appliance, index) => (
                  <ApplianceCard
                    key={appliance.id}
                    environmentId={activeEnvironment.id}
                    appliance={appliance}
                    index={index}
                    btuOptions={suggestions.btu}
                    typeOptions={suggestions.applianceTypes}
                    onChange={(field, value) => updateAppliance(appliance.id, field, value)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="climate-survey-footer">
          <div className="climate-survey-save-feedback" role="status" aria-live="polite">
            {saveMessage}
          </div>
          <button
            type="button"
            className="climate-survey-save"
            onClick={saveSurvey}
            disabled={isSaving}
          >
            <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar levantamento'}
          </button>
        </footer>
      </div>
    </main>
  );
}
