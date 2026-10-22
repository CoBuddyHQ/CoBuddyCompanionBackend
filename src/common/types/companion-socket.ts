import type { Socket } from 'socket.io';

export interface CompanionSocketIdentity {
  sub: string;
  phone: string;
  accountStatus: string;
}

export function getCompanionSocketIdentity(
  client: Socket,
): CompanionSocketIdentity | null {
  const value: unknown = client.data.companion;
  if (
    !value ||
    typeof value !== 'object' ||
    !('sub' in value) ||
    typeof value.sub !== 'string'
  ) {
    return null;
  }
  if (!('phone' in value) || typeof value.phone !== 'string') return null;
  if (!('accountStatus' in value) || typeof value.accountStatus !== 'string')
    return null;
  return {
    sub: value.sub,
    phone: value.phone,
    accountStatus: value.accountStatus,
  };
}
