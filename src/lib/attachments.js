const BUCKET = 'gop-anexos';

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function safeFileName(name) {
  return String(name || 'arquivo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

export async function uploadTicketAttachment(supabaseClient, ticket, file, descricao = '') {
  if (!supabaseClient) throw new Error('Base online não conectada.');
  if (!ticket?.id_chamado) throw new Error('Chamado inválido.');
  if (!file) throw new Error('Selecione um arquivo.');
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Use PDF, JPG, PNG ou WEBP.');
  if (file.size > MAX_FILE_SIZE) throw new Error('Arquivo maior que 10 MB.');

  const fileId = crypto.randomUUID();
  const fileName = safeFileName(file.name);
  const storagePath = `chamados/${ticket.id_chamado}/${fileId}-${fileName}`;

  // 1. Upload físico para o Bucket
  const { error: uploadError } = await supabaseClient.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  // 2. Gravação do registro de metadados na tabela
  const record = {
    id_chamado: ticket.id_chamado,
    designacao: ticket.designacao,
    unidade_escolar: ticket.unidade_escolar,
    bucket: BUCKET,
    storage_path: storagePath,
    nome_original: file.name,
    mime_type: file.type,
    tamanho_bytes: file.size,
    descricao,
  };

  const { data, error } = await supabaseClient
    .from('anexos_chamado')
    .insert(record)
    .select('*')
    .single();

  // Em caso de falha de gravação de metadados, remove o arquivo físico para evitar "órfãos"
  if (error) {
    await supabaseClient.storage.from(BUCKET).remove([storagePath]);
    throw error;
  }

  return data;
}

export async function listTicketAttachments(supabaseClient, idChamado) {
  const { data, error } = await supabaseClient
    .from('anexos_chamado')
    .select('*')
    .eq('id_chamado', idChamado)
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function listSchoolAttachments(supabaseClient, designacao) {
  const { data, error } = await supabaseClient
    .from('anexos_chamado')
    .select('*')
    .eq('designacao', designacao)
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteTicketAttachment(supabaseClient, attachment) {
  if (!supabaseClient) throw new Error('Base online não conectada.');
  if (!attachment) throw new Error('Anexo inválido.');

  // 1. Exclui o arquivo físico no Storage
  const { error: storageError } = await supabaseClient.storage
    .from(attachment.bucket)
    .remove([attachment.storage_path]);

  if (storageError) throw storageError;

  // 2. Exclui o registro lógico no banco
  const { error: dbError } = await supabaseClient
    .from('anexos_chamado')
    .delete()
    .eq('id', attachment.id);

  if (dbError) throw dbError;
  return true;
}

export function getAttachmentPublicUrl(supabaseClient, attachment) {
  const { data } = supabaseClient.storage
    .from(attachment.bucket)
    .getPublicUrl(attachment.storage_path);

  return data.publicUrl;
}

export function getAttachmentDownloadUrl(supabaseClient, attachment) {
  const { data } = supabaseClient.storage
    .from(attachment.bucket)
    .getPublicUrl(attachment.storage_path);

  return `${data.publicUrl}?download=${encodeURIComponent(attachment.nome_original)}`;
}
