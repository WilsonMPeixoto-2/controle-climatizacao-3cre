import { z } from 'zod';

export const ENVIRONMENT_TYPE_OPTIONS = Object.freeze([
  'Sala de Aula',
  'Sala de Leitura',
  'Biblioteca',
  'Secretaria',
  'Direção',
  'Sala dos Professores',
  'Laboratório',
  'Sala de Informática',
  'Refeitório',
  'Cozinha',
  'Berçário',
  'Sala de Recursos',
  'Sala Multiuso',
  'Depósito'
]);

export const APPLIANCE_STATUS_OPTIONS = Object.freeze([
  'Não informado',
  'Funcionando',
  'Precisa de manutenção'
]);

export const DEFAULT_BTU_OPTIONS = Object.freeze([
  '7000',
  '9000',
  '12000',
  '18000',
  '22000',
  '24000',
  '30000',
  '36000',
  '48000',
  '60000'
]);

export const DEFAULT_APPLIANCE_TYPE_OPTIONS = Object.freeze([
  'Split',
  'Split Hi Wall',
  'Janela',
  'Cassete',
  'Piso Teto'
]);

const createId = (prefix) => {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return `${prefix}-${random}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const cleanText = (value) => String(value ?? '').trim();

export function buildDisplayName({ tipo = '', identificacao = '' } = {}) {
  return [cleanText(tipo), cleanText(identificacao)].filter(Boolean).join(' ');
}

export function createAppliance({ idFactory = () => createId('apr') } = {}) {
  return {
    id: idFactory(),
    modelo_marca: '',
    capacidade_btu: '',
    tipo: '',
    situacao: 'Não informado',
    observacoes: ''
  };
}

export function resizeAppliances(
  appliances = [],
  targetCount = 0,
  { idFactory = () => createId('apr') } = {}
) {
  const parsedCount = Number.parseInt(targetCount, 10);
  const count = Number.isFinite(parsedCount) ? Math.max(0, parsedCount) : 0;
  const current = Array.isArray(appliances) ? appliances : [];

  if (current.length >= count) return current.slice(0, count);

  const resized = [...current];
  while (resized.length < count) {
    resized.push(createAppliance({ idFactory }));
  }
  return resized;
}

export function createEnvironment({ idFactory = () => createId('amb') } = {}) {
  const tipo = 'Sala de Aula';
  return {
    id: idFactory(),
    tipo,
    identificacao: '',
    nome_exibicao: tipo,
    quantidade_aparelhos: 0,
    aparelhos: []
  };
}

const applianceSchema = z.object({
  id: z.string().min(1),
  modelo_marca: z.string(),
  capacidade_btu: z.string(),
  tipo: z.string(),
  situacao: z.enum(APPLIANCE_STATUS_OPTIONS),
  observacoes: z.string()
});

const environmentSchema = z
  .object({
    id: z.string().min(1),
    tipo: z.string().trim().min(1, 'Informe o tipo do ambiente.'),
    identificacao: z.string(),
    nome_exibicao: z.string().trim().min(1, 'Informe o ambiente.'),
    quantidade_aparelhos: z.number().int().min(0).max(50),
    aparelhos: z.array(applianceSchema).max(50)
  })
  .refine((environment) => environment.quantidade_aparelhos === environment.aparelhos.length, {
    message: 'A quantidade de aparelhos deve corresponder aos aparelhos cadastrados.',
    path: ['quantidade_aparelhos']
  });

const surveySchema = z.object({
  designacao: z.string().trim().min(1, 'Unidade escolar sem designação.'),
  unidade_escolar: z.string().trim().min(1, 'Unidade escolar não identificada.'),
  atualizado_em: z.string().optional(),
  ambientes: z.array(environmentSchema).max(100)
});

export function normalizeSurvey(survey = {}) {
  const environments = Array.isArray(survey.ambientes) ? survey.ambientes : [];

  return {
    designacao: cleanText(survey.designacao),
    unidade_escolar: cleanText(survey.unidade_escolar),
    ...(survey.atualizado_em ? { atualizado_em: cleanText(survey.atualizado_em) } : {}),
    ambientes: environments.map((environment) => {
      const appliances = Array.isArray(environment?.aparelhos)
        ? environment.aparelhos.map((appliance) => ({
            id: cleanText(appliance?.id),
            modelo_marca: cleanText(appliance?.modelo_marca),
            capacidade_btu: cleanText(appliance?.capacidade_btu),
            tipo: cleanText(appliance?.tipo),
            situacao: cleanText(appliance?.situacao) || 'Não informado',
            observacoes: cleanText(appliance?.observacoes)
          }))
        : [];

      const tipo = cleanText(environment?.tipo);
      const identificacao = cleanText(environment?.identificacao);
      return {
        id: cleanText(environment?.id),
        tipo,
        identificacao,
        nome_exibicao: buildDisplayName({ tipo, identificacao }),
        quantidade_aparelhos: appliances.length,
        aparelhos: appliances
      };
    })
  };
}

export function validateSurvey(survey) {
  return surveySchema.safeParse(normalizeSurvey(survey));
}
