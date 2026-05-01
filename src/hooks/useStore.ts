import { create } from "zustand";
import { User as FirebaseUser } from "firebase/auth";

export type UserRole =
  | "admin"
  | "designer"
  | "marketer"
  | "sales"
  | "finance"
  | "pending";

export type ThemeMode = "light" | "dark" | "system";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  photoURL: string;
  role: UserRole;
  createdAt: number;
}

interface AppState {
  currentUser: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  theme: ThemeMode;
  setCurrentUser: (user: FirebaseUser | null) => void;
  setAppUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useStore = create<AppState>((set) => ({
  currentUser: null,
  appUser: null,
  loading: true,
  theme: (localStorage.getItem("theme") as ThemeMode) || "system",
  setCurrentUser: (user) => set({ currentUser: user }),
  setAppUser: (user) => set({ appUser: user }),
  setLoading: (loading) => set({ loading }),
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    set({ theme });
  },
}));
