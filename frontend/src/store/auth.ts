import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, StudentProfile } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  profile: StudentProfile | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setProfile: (profile: StudentProfile) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      profile: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, profile: null, isAuthenticated: false }),
      setProfile: (profile) => set({ profile }),
    }),
    { name: "edugraph-auth" }
  )
);
