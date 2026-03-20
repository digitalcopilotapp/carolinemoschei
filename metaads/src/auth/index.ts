import { setAccessToken, metaRequest } from '../utils/meta-client.js';

export interface AuthenticatedUser {
  id: string;
  name: string;
}

export interface ActiveAccount {
  accountId: string;
  name: string;
  currency: string;
  timezone: string;
  status: number;
}

/** Server state for auth and active account */
class ServerState {
  user: AuthenticatedUser | null = null;
  activeAccount: ActiveAccount | null = null;

  setUser(user: AuthenticatedUser) {
    this.user = user;
  }

  setActiveAccount(account: ActiveAccount) {
    this.activeAccount = account;
  }

  getActiveAccountId(): string {
    if (!this.activeAccount) {
      throw new Error(
        'Nenhuma conta de anúncios ativa. Use set_active_account para selecionar uma conta.'
      );
    }
    return this.activeAccount.accountId;
  }
}

export const serverState = new ServerState();

/** Validate System User Token by calling /me */
export async function authenticateWithSystemToken(): Promise<AuthenticatedUser> {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) {
    throw new Error(
      'META_SYSTEM_USER_TOKEN não configurado. Defina a variável de ambiente ou use OAuth.'
    );
  }

  setAccessToken(token);

  const result = await metaRequest<{ id: string; name: string }>({
    path: '/me',
    params: { fields: 'id,name' },
  });

  const user: AuthenticatedUser = { id: result.id, name: result.name };
  serverState.setUser(user);

  return user;
}
