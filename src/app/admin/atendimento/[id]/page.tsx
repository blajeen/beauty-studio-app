/**
 * A tela de atendimento é a mesma para quem executa e para quem administra —
 * a diferença de permissão já é resolvida dentro dela. Reaproveitamos em vez
 * de manter duas telas que precisariam evoluir juntas.
 */
export { default, metadata, dynamic } from '@/app/pro/atendimento/[id]/page';
