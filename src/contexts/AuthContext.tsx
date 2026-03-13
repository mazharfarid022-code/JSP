import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  workerData: any | null;
  loading: boolean;
  setAdminState: (isAdmin: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAdmin: false,
  workerData: null,
  loading: true,
  setAdminState: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [workerData, setWorkerData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch worker data
        try {
          const docRef = doc(db, 'Workers', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setWorkerData(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching worker data", error);
        }
      } else {
        setWorkerData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const setAdminState = (adminState: boolean) => {
    setIsAdmin(adminState);
  };

  const value = {
    currentUser,
    isAdmin,
    workerData,
    loading,
    setAdminState,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
