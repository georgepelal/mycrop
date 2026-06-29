import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth, isMockFirebase } from "../lib/firebase";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fallback profile only if mock firebase config is used
const mockUser = {
  uid: "mock-agronomist-george",
  email: "georgepelal@gmail.com",
  displayName: "George Pelal",
  photoURL: "🌱",
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: []
} as unknown as FirebaseUser;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockFirebase) {
      const cached = localStorage.getItem("mycrop_session_user");
      if (cached === "active") {
        setUser(mockUser);
      } else {
        setUser(mockUser); // Default logged in for sandbox
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    if (isMockFirebase) {
      localStorage.setItem("mycrop_session_user", "active");
      setUser(mockUser);
      return;
    }
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.error("Auth login fail", e);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (isMockFirebase) {
      localStorage.setItem("mycrop_session_user", "active");
      setUser(mockUser);
      return;
    }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    if (isMockFirebase) {
      localStorage.setItem("mycrop_session_user", "active");
      setUser(mockUser);
      return;
    }
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    if (name && credential.user) {
      await updateProfile(credential.user, {
        displayName: name,
        photoURL: "🌱"
      });
      // Force refreshing the user state
      setUser({ ...credential.user, displayName: name, photoURL: "🌱" });
    }
  };

  const loginWithGoogle = async () => {
    if (isMockFirebase) {
      localStorage.setItem("mycrop_session_user", "active");
      setUser(mockUser);
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Google login fail", e);
      throw e;
    }
  };

  const logout = async () => {
    if (isMockFirebase) {
      localStorage.removeItem("mycrop_session_user");
      setUser(null);
      return;
    }
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithEmail, signUpWithEmail, loginWithGoogle, logout, isMock: isMockFirebase }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
