/**
 * Chaves da tabela Setting. Ficam separadas do módulo `server` porque o painel
 * do Product Manager (componente de cliente) também precisa referenciá-las.
 */
export const BRAND_KEY = 'brand';
export const CONTENT_KEY = 'content';

/** Cookie httpOnly que faz o app inteiro ler o rascunho em vez do publicado. */
export const PREVIEW_COOKIE = 'bs_preview';
