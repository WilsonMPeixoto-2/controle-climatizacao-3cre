/**
 * Rótulo de situação da programação, não uma declaração de gravação remota.
 * O evento inicial onSnapshot pode proceder do cache local do Firestore;
 * 'ready' significa modo compartilhado disponível, não flush confirmado.
 */
export function visitConnectionLabel(connection) {
  switch (connection?.status) {
    case 'ready': return 'Programação compartilhada · Firestore';
    case 'connecting': return 'Conectando ao Firestore';
    case 'error': return 'Conexão indisponível';
    default: return 'Rascunho neste navegador';
  }
}
