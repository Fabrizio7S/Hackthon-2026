import { createContext, useContext, type ReactNode } from 'react';

import type {
  CommunityActions,
  CommunityIdentity,
  SessionActions,
  SessionIdentity,
} from './contracts';

const SessionContext = createContext<
  { identity: SessionIdentity; actions: SessionActions } | undefined
>(undefined);
const CommunityContext = createContext<
  { identity: CommunityIdentity; actions: CommunityActions } | undefined
>(undefined);

export function SessionIdentityProvider({
  value,
  actions,
  children,
}: {
  value: SessionIdentity;
  actions: SessionActions;
  children: ReactNode;
}) {
  return (
    <SessionContext.Provider value={{ identity: value, actions }}>
      {children}
    </SessionContext.Provider>
  );
}

export function CommunityIdentityProvider({
  value,
  actions,
  children,
}: {
  value: CommunityIdentity;
  actions: CommunityActions;
  children: ReactNode;
}) {
  return (
    <CommunityContext.Provider value={{ identity: value, actions }}>
      {children}
    </CommunityContext.Provider>
  );
}

/** Fuente existente de AuthPanel. No crea una segunda suscripción de Auth. */
export function useSessionIdentity(): SessionIdentity {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSessionIdentity requires SessionIdentityProvider');
  return value.identity;
}

/** Fuente existente de CommunityPanel. No vuelve a consultar Supabase. */
export function useCommunityIdentity(): CommunityIdentity {
  const value = useContext(CommunityContext);
  if (!value) throw new Error('useCommunityIdentity requires CommunityIdentityProvider');
  return value.identity;
}

export function useSessionActions(): SessionActions {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSessionActions requires SessionIdentityProvider');
  return value.actions;
}

export function useCommunityActions(): CommunityActions {
  const value = useContext(CommunityContext);
  if (!value) throw new Error('useCommunityActions requires CommunityIdentityProvider');
  return value.actions;
}
