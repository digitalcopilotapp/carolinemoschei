import { MetaApiError, parseMetaError, isTransientError } from '../errors/meta-error.js';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

export interface MetaRequestOptions {
  /** HTTP method */
  method?: 'GET' | 'POST' | 'DELETE';
  /** URL path after the version (e.g. '/me' or '/act_123/campaigns') */
  path: string;
  /** Query parameters for GET, form body for POST */
  params?: Record<string, unknown>;
  /** Override access token (defaults to the one set via setAccessToken) */
  accessToken?: string;
}

export interface MetaPaginatedResponse<T> {
  data: T[];
  paging?: {
    cursors?: { before?: string; after?: string };
    next?: string;
    previous?: string;
  };
}

/** Response headers relevant for rate limiting */
export interface MetaRateLimitHeaders {
  appUsage?: string;
  accountUsage?: string;
  businessUseCaseUsage?: string;
}

/** Callback to receive rate limit headers after each request */
export type RateLimitCallback = (headers: MetaRateLimitHeaders) => void;

let _accessToken: string | null = null;
let _rateLimitCallback: RateLimitCallback | null = null;

/** Set the default access token for all requests */
export function setAccessToken(token: string) {
  _accessToken = token;
}

/** Get the current access token */
export function getAccessToken(): string | null {
  return _accessToken;
}

/** Register a callback to receive rate limit headers */
export function onRateLimitHeaders(cb: RateLimitCallback) {
  _rateLimitCallback = cb;
}

/** Extract rate limit headers from a fetch Response */
function extractRateLimitHeaders(response: Response): MetaRateLimitHeaders {
  return {
    appUsage: response.headers.get('x-app-usage') ?? undefined,
    accountUsage: response.headers.get('x-ad-account-usage') ?? undefined,
    businessUseCaseUsage:
      response.headers.get('x-business-use-case-usage') ?? undefined,
  };
}

/** Sleep helper */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Make a request to the Meta Graph API with retry logic */
export async function metaRequest<T = unknown>(
  options: MetaRequestOptions
): Promise<T> {
  const token = options.accessToken ?? _accessToken;
  if (!token) {
    throw new Error(
      'Access token not set. Configure META_SYSTEM_USER_TOKEN or authenticate via OAuth.'
    );
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await executeRequest<T>(options, token);
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES && isTransientError(error)) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

async function executeRequest<T>(
  options: MetaRequestOptions,
  token: string
): Promise<T> {
  const { method = 'GET', path, params } = options;
  const url = new URL(`${GRAPH_API_BASE}${path}`);

  const fetchOptions: RequestInit = {
    method,
    headers: {} as Record<string, string>,
  };

  if (method === 'GET') {
    // Add params as query string
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(
            key,
            typeof value === 'string' ? value : JSON.stringify(value)
          );
        }
      }
    }
    url.searchParams.set('access_token', token);
  } else {
    // POST/DELETE: send as form-encoded body
    const body = new URLSearchParams();
    body.set('access_token', token);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          body.set(
            key,
            typeof value === 'string' ? value : JSON.stringify(value)
          );
        }
      }
    }
    fetchOptions.body = body.toString();
    (fetchOptions.headers as Record<string, string>)['Content-Type'] =
      'application/x-www-form-urlencoded';
  }

  const response = await fetch(url.toString(), fetchOptions);

  // Extract and forward rate limit headers
  const rateLimitHeaders = extractRateLimitHeaders(response);
  if (_rateLimitCallback) {
    _rateLimitCallback(rateLimitHeaders);
  }

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = { error: { message: await response.text() } };
    }
    throw parseMetaError(response.status, body);
  }

  return (await response.json()) as T;
}

/** Fetch all pages of a paginated endpoint */
export async function metaPaginatedRequest<T>(
  options: MetaRequestOptions,
  maxPages = 10
): Promise<T[]> {
  const allData: T[] = [];
  let currentPath = options.path;
  let currentParams = { ...options.params };
  let pagesLoaded = 0;

  while (pagesLoaded < maxPages) {
    const response = await metaRequest<MetaPaginatedResponse<T>>({
      ...options,
      path: currentPath,
      params: currentParams,
    });

    if (response.data) {
      allData.push(...response.data);
    }

    pagesLoaded++;

    // Check if there's a next page
    if (!response.paging?.next) break;

    // Parse the next URL to extract path and params
    const nextUrl = new URL(response.paging.next);
    currentPath = nextUrl.pathname.replace(`/${GRAPH_API_VERSION}`, '');
    currentParams = Object.fromEntries(nextUrl.searchParams.entries());
    // Remove access_token from params since metaRequest adds it
    delete currentParams.access_token;
  }

  return allData;
}

export { MetaApiError };
