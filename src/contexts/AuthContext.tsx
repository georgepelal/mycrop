import React, { useState, useEffect } from "react";
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
import { AuthContext } from "./authContextValue";


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No Firebase configuration: nobody is signed in. Tools that only need a
    // location keep working; saving fields is unavailable and says so.
    if (isMockFirebase) {
      setUser(null);
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
      throw new Error("Sign-in is unavailable: this deployment has no Firebase configuration.");
    }
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.error("Auth login fail", e);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (isMockFirebase) {
      throw new Error("Sign-in is unavailable: this deployment has no Firebase configuration.");
    }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    if (isMockFirebase) {
      throw new Error("Sign-in is unavailable: this deployment has no Firebase configuration.");
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
      throw new Error("Sign-in is unavailable: this deployment has no Firebase configuration.");
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
