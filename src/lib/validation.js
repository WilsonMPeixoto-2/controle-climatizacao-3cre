import { z } from 'zod';
import { STATUS_LIST, normalizeStatus } from '../domain/statuses.js';
import { SECTOR_LIST, normalizeSector } from '../domain/sectors.js';
import { PRIORITY_LIST, normalizePriority } from '../domain/priorities.js';
import { APTIDAO_LIST, normalizeAptidao } from '../domain/aptidao.js';

const requiredText = (message) =>
  z.preprocess((value) => (value == null ? '' : String(value).trim()), z.string().min(1, message));

const statusValidator = z.preprocess(
  (value) => normalizeStatus(value),
  z.string().refine((val) => STATUS_LIST.includes(val), { message: 'Escolha o status atual.' })
);

const sectorValidator = z.preprocess(
  (value) => normalizeSector(value),
  z.string().refine((val) => SECTOR_LIST.includes(val), { message: 'Escolha o setor responsável.' })
);

const priorityValidator = z.preprocess(
  (value) => normalizePriority(value),
  z.string().refine((val) => PRIORITY_LIST.includes(val), { message: 'Escolha a prioridade.' })
);

const aptidaoValidator = z.preprocess(
  (value) => normalizeAptidao(value),
  z.string().refine((val) => APTIDAO_LIST.includes(val), { message: 'Informe a aptidão técnica.' })
);

const optionalDate = z
  .preprocess((value) => (value == null ? '' : String(value).trim()), z.string())
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: 'Data inválida. Revise o registro antes de salvar.'
  });

const selectedSchoolSchema = z
  .object({
    designacao: requiredText('Selecione uma unidade escolar.'),
    unidade_escolar: requiredText('Selecione uma unidade escolar.')
  })
  .passthrough();

const selectedSchoolInputSchema = z.preprocess((value) => value ?? {}, selectedSchoolSchema);

export const createTicketSchema = z
  .object({
    school: selectedSchoolInputSchema,
    local_demanda: requiredText('Informe o local da demanda.'),
    tipo_demanda: requiredText('Escolha o tipo de solicitação.'),
    status_atual: statusValidator,
    setor_responsavel: sectorValidator,
    proxima_providencia: requiredText('Informe a próxima providência.'),
    prioridade: priorityValidator,
    informacao_validada: requiredText('Informe a validação da informação.'),
    resultado_aptidao: aptidaoValidator
  })
  .passthrough();

export const editTicketSchema = z
  .object({
    id_chamado: requiredText('Chamado sem código. Recarregue a página e tente novamente.'),
    unidade_escolar: requiredText(
      'Chamado sem unidade escolar. Recarregue a página e tente novamente.'
    ),
    designacao: requiredText(
      'Chamado sem designação da unidade. Recarregue a página e tente novamente.'
    ),
    local_demanda: requiredText('Informe o local da demanda.'),
    tipo_demanda: requiredText('Escolha o tipo de solicitação.'),
    status_atual: statusValidator,
    setor_responsavel: sectorValidator,
    proxima_providencia: requiredText('Informe a próxima providência.'),
    ultima_movimentacao: z.preprocess(
      (value) => (value == null ? '' : String(value).trim()),
      z.string()
    ),
    prioridade: priorityValidator,
    informacao_validada: requiredText('Informe a validação da informação.'),
    resultado_aptidao: aptidaoValidator,
    criado_em: optionalDate,
    modificado_em: optionalDate
  })
  .passthrough();


export function firstValidationMessage(
  result,
  fallback = 'Revise os campos obrigatórios antes de salvar.'
) {
  if (result.success) return '';
  return result.error.issues[0]?.message || fallback;
}
