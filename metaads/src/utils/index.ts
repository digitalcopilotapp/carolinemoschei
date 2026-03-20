export {
  metaRequest,
  metaPaginatedRequest,
  setAccessToken,
  getAccessToken,
  onRateLimitHeaders,
  MetaApiError,
} from './meta-client.js';

export type {
  MetaRequestOptions,
  MetaPaginatedResponse,
  MetaRateLimitHeaders,
  RateLimitCallback,
} from './meta-client.js';
