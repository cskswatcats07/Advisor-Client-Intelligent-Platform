import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AdvisorUser } from "../shared/advisor-types";
import type { ApiSession } from "../shared/api/client";

interface AuthState {
  session: ApiSession | null;
  user: AdvisorUser | null;
  setAuth: (session: ApiSession, user: AdvisorUser) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ApiSession | null>(null);
  const [user, setUser] = useState<AdvisorUser | null>(null);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user,
      setAuth: (nextSession, nextUser) => {
        setSession(nextSession);
        setUser(nextUser);
      },
      clearAuth: () => {
        setSession(null);
        setUser(null);
      },
    }),
    [session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider.");
  return ctx;
}
