import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

export type UserRole = 'owner' | 'waiter' | 'superadmin';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  restaurantOwner: User | null;
  userRole: UserRole;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  getRestaurantId: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [restaurantOwner, setRestaurantOwner] = useState<User | null>(null);

  // Determine effective role
  const getUserRole = (userData: User | null): UserRole => {
    if (!userData) return 'owner';
    const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'natnaeltsegaye70@gmail.com';
    if (userData.email === superAdminEmail) return 'superadmin';
    if (userData.role === 'waiter') return 'waiter';
    return 'owner';
  };

  const userRole = getUserRole(user);

  // For waiters, get the restaurant owner's userId for querying data
  const getRestaurantId = (): string => {
    if (user?.role === 'waiter' && user.restaurantId) {
      return user.restaurantId;
    }
    return user?.id || '';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const userData = { id: fbUser.uid, ...userDoc.data() } as User;
            setUser(userData);

            // If waiter, also fetch restaurant owner profile for context
            if (userData.role === 'waiter' && userData.restaurantId) {
              try {
                const ownerDoc = await getDoc(doc(db, 'users', userData.restaurantId));
                if (ownerDoc.exists()) {
                  setRestaurantOwner({ id: ownerDoc.id, ...ownerDoc.data() } as User);
                }
              } catch (err) {
                console.error('Error fetching restaurant owner profile:', err);
              }
            } else {
              setRestaurantOwner(null);
            }
          }
        } catch (error) {
          console.error('Error fetching user data in auth state change:', error);
        }
      } else {
        setUser(null);
        setRestaurantOwner(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Verify Firestore profile exists
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        // Sign out if profile is missing to prevent broken auth state
        await signOut(auth);
        return { success: false, error: 'User profile not found. Please register again.' };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email: string, password: string, userData: Partial<User>) => {
    try {
      // 1. Create auth account
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      const newUser: User = {
        id: fbUser.uid,
        email,
        name: userData.name || '',
        businessName: userData.businessName || '',
        created_at: new Date().toISOString(),
        subscription: 'free',
        role: 'owner',
        settings: {
          currency: 'USD',
          language: 'en',
          theme: 'light',
          notifications: true,
        },
        ...userData,
      };

      // 2. Set doc in Firestore first
      await setDoc(doc(db, 'users', fbUser.uid), newUser);
      
      // 3. Update state in Context immediately
      setUser(newUser);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setRestaurantOwner(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      restaurantOwner,
      userRole,
      login,
      register,
      logout,
      getRestaurantId
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
