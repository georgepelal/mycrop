import { createContext } from "react";
import { User as FirebaseUser } from "firebase/auth";

export interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isMock: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
