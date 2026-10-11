import { create } from "zustand/react"

export interface AuthState {
  session: string | null, // FIXME "string" is a placeholder
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
}

export const useAuthState = create<AuthState>((set, get) => ({
  session: null,
  login: async (username: string, password: string) => {},
  logout: async () => {},
  signup: async (username: string, password: string) => {},
}));
