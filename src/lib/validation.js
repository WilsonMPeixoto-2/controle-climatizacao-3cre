import { z } from 'zod';

const requiredText = (message) =>
  z.preprocess(
    (value) => (value == null ? '' : String(value).trim()),
    z.string().min(1, message)
  );

const optionalDate = z
  .preprocess((value) => (value == null ? '' : String(value).trim()), z.string())
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: 'Data inválida. Revise o registro antes de salvar.'
  });

const selectedSchoolSchema = z.object({
  designacao: requiredText('Selecione uma unidade escolar.'),
  unidade_escolar: requiredText('Selecione uma unidade escolar.')
}).passthrough();

const selectedSchoolInputSchema = z.preprocess(
  (value) => value ?? {},
  selectedSchoolSchema
);

export const createTicketSchema = z.object({
  school: selectedSchoolInputSchema,
  local_demanda: requiredText('Informe o local da demanda.'),
  tipo_demanda: requiredText('Escolha o tipo de solicitação.'),
  status_atual: requiredText('Escolha o status atual.'),
  setor_responsavel: requiredText('Escolha o setor responsável.'),
  proxima_providencia: requiredText('Informe a próxima providência.'),
  prioridade: requiredText('Escolha a prioridade.'),
  informacao_validada: requiredText('Informe a validação da informação.'),
  resultado_aptidao: requiredText('Informe a aptidão técnica.')
}).passthrough();

export const editTicketSchema = z.object({
  id_chamado: requiredText('Chamado sem código. Recarregue a página e tente novamente.'),
  unidade_escolar: requiredText('Chamado sem unidade escolar. Recarregue a página e tente novamente.'),
  designacao: requiredText('Chamado sem designação da unidade. Recarregue a página e tente novamente.'),
  local_demanda: requiredText('Informe o local da demanda.'),
  tipo_demanda: requiredText('Escolha o tipo de solicitação.'),
  status_atual: requiredText('Escolha o status atual.'),
  setor_responsavel: requiredText('Escolha o setor responsável.'),
  proxima_providencia: requiredText('Informe a próxima providência.'),
  ultima_movimentacao: requiredText('Informe a última movimentação relevante.'),
  prioridade: requiredText('Escolha a prioridade.'),
  criado_em: optionalDate,
  modificado_em: optionalDate
}).passthrough();

export function firstValidationMessage(result, fallback = 'Revise os campos obrigatórios antes de salvar.') {
  if (result.success) return '';
  return result.error.issues[0]?.message || fallback;
}
