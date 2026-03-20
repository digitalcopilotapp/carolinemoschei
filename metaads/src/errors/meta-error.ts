/** Structured Meta API error with codes and actionable message */
export class MetaApiError extends Error {
  constructor(
    message: string,
    public readonly errorCode: number,
    public readonly errorSubcode: number,
    public readonly fbTraceId: string,
    public readonly httpStatus: number,
    public readonly suggestion: string
  ) {
    super(message);
    this.name = 'MetaApiError';
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      errorCode: this.errorCode,
      errorSubcode: this.errorSubcode,
      httpStatus: this.httpStatus,
      suggestion: this.suggestion,
    };
  }
}

/** Common Meta error codes mapped to Portuguese suggestions */
const ERROR_SUGGESTIONS: Record<number, string> = {
  1: 'Erro desconhecido na API. Tente novamente em alguns segundos.',
  2: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.',
  4: 'Limite de requisições atingido. Aguarde antes de tentar novamente.',
  10: 'Permissão negada. Verifique as permissões do seu token.',
  17: 'Limite de requisições da conta atingido. Aguarde antes de tentar novamente.',
  100: 'Parâmetro inválido na requisição. Verifique os campos enviados.',
  102: 'Sessão inválida. O token pode ter expirado — use auth_oauth_start para renovar.',
  190: 'Token de acesso inválido ou expirado — use auth_oauth_start para renovar.',
  200: 'Permissão insuficiente para esta operação. Verifique as permissões do app.',
  294: 'Erro ao gerenciar a campanha. Verifique se os parâmetros estão corretos.',
  368: 'Ação bloqueada temporariamente por violação de políticas.',
  2635: 'Você não tem permissão para anunciar. Verifique o status da sua conta de anúncios.',
};

const SUBCODE_SUGGESTIONS: Record<number, string> = {
  458: 'Token expirado — use auth_oauth_start para renovar.',
  459: 'Sessão invalidada pelo usuário. Re-autentique com auth_oauth_start.',
  460: 'Senha alterada. Re-autentique com auth_oauth_start.',
  463: 'Token expirado — use auth_oauth_start para renovar.',
  467: 'Token inválido — verifique se o token é correto.',
  1487851: 'Categoria especial de anúncio é obrigatória para esta campanha.',
  1487930: 'O targeting não atende aos requisitos da categoria especial.',
};

/** Parse a Meta Graph API error response into a MetaApiError */
export function parseMetaError(
  httpStatus: number,
  body: unknown
): MetaApiError {
  const err =
    typeof body === 'object' && body !== null && 'error' in body
      ? (body as { error: Record<string, unknown> }).error
      : {};

  const code = typeof err.code === 'number' ? err.code : 0;
  const subcode = typeof err.error_subcode === 'number' ? err.error_subcode : 0;
  const fbTraceId =
    typeof err.fbtrace_id === 'string' ? err.fbtrace_id : '';

  // Build message without exposing tokens
  const rawMessage =
    typeof err.message === 'string'
      ? err.message
      : `Meta API error (HTTP ${httpStatus})`;

  const suggestion =
    SUBCODE_SUGGESTIONS[subcode] ??
    ERROR_SUGGESTIONS[code] ??
    'Verifique os parâmetros e tente novamente.';

  return new MetaApiError(
    rawMessage,
    code,
    subcode,
    fbTraceId,
    httpStatus,
    suggestion
  );
}

/** Check if an error is transient and should be retried */
export function isTransientError(error: unknown): boolean {
  if (error instanceof MetaApiError) {
    // Rate limit
    if (error.errorCode === 4 || error.errorCode === 17) return true;
    // Server errors
    if (error.httpStatus >= 500 && error.httpStatus < 600) return true;
    // HTTP 429
    if (error.httpStatus === 429) return true;
  }
  return false;
}
