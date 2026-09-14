import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, KYCStatus } from '../types';
import { supabase, isRealSupabaseConnected } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: { email: string; username: string; password?: string; role?: UserRole; country?: string; phoneNumber?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  submitKYC: (docType: string, docNumber: string) => Promise<void>;
  toggle2FA: () => void;
  refreshUserData: () => Promise<void>;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('png_hub_auth_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return null;
  });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('png_hub_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('png_hub_auth_user');
    }
  }, [currentUser]);

  // Initial load: check Supabase auth or fetch current profile
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        if (isRealSupabaseConnected) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch profile from Supabase profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              const mappedUser: User = {
                id: profile.id,
                email: profile.email || session.user.email || '',
                username: profile.username || profile.email?.split('@')[0] || 'Trader',
                role: profile.role || 'user',
                kycStatus: profile.kyc_status || 'unverified',
                kycDocumentType: profile.kyc_document_type,
                kycDocumentNumber: profile.kyc_document_number,
                kycSubmittedAt: profile.kyc_submitted_at,
                kycVerifiedAt: profile.kyc_verified_at,
                isFrozen: profile.is_frozen || false,
                twoFactorEnabled: profile.two_factor_enabled || false,
                totalTrades: profile.total_trades || 0,
                completionRate: profile.completion_rate || 100,
                positiveReviews: profile.positive_reviews || 0,
                negativeReviews: profile.negative_reviews || 0,
                phoneNumber: profile.phone_number,
                country: profile.country || 'Papua New Guinea',
                createdAt: profile.created_at || new Date().toISOString()
              };
              setCurrentUser(mappedUser);
            }
          }
        } else if (currentUser?.id) {
          // Re-fetch from server to verify user is still valid and has fresh stats
          const res = await fetch(`/api/users/${currentUser.id}`);
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data);
          }
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Fetch all registered users (for admin & marketplace references)
  const refreshUsersList = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch (e) {
      console.error("Failed to load user registry:", e);
    }
  };

  useEffect(() => {
    refreshUsersList();
  }, [currentUser]);

  const refreshUserData = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (e) {
      console.error("Error refreshing user data:", e);
    }
  };

  const login = async (email: string, password = 'password123'): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const isOwnerAdmin = cleanEmail === 'adminsp247@gmail.com';

      // 1. Try Supabase Auth if real Supabase is connected
      if (isRealSupabaseConnected) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          });
          if (!error && data?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profile) {
              const mappedUser: User = {
                id: profile.id,
                email: profile.email || data.user.email || cleanEmail,
                username: profile.username || (isOwnerAdmin ? 'AdminSP247' : 'Trader'),
                role: (profile.role === 'admin' || isOwnerAdmin) ? 'admin' : 'user',
                kycStatus: isOwnerAdmin ? 'verified' : (profile.kyc_status || 'unverified'),
                isFrozen: profile.is_frozen || false,
                twoFactorEnabled: isOwnerAdmin ? true : (profile.two_factor_enabled || false),
                totalTrades: profile.total_trades || 0,
                completionRate: profile.completion_rate || 100,
                positiveReviews: profile.positive_reviews || 0,
                negativeReviews: profile.negative_reviews || 0,
                country: profile.country || 'Papua New Guinea',
                createdAt: profile.created_at || new Date().toISOString()
              };
              setCurrentUser(mappedUser);
              setIsLoading(false);
              return { success: true };
            }
          }
        } catch (supabaseErr) {
          console.warn("[Supabase Auth] Falling back to server authority:", supabaseErr);
        }
      }

      return { success: false, error: "Login failed via Supabase" };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Network error during login" };
    }
  };

  const signup = async (userData: {
    email: string;
    username: string;
    password?: string;
    role?: UserRole;
    country?: string;
    phoneNumber?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const password = userData.password || 'password123';

      const cleanEmail = userData.email.trim().toLowerCase();
      const isOwnerAdmin = cleanEmail === 'adminsp247@gmail.com';
      const assignedRole = (userData.role === 'admin' || isOwnerAdmin) ? 'admin' : 'user';

      // 1. If real Supabase connected, create user via Supabase Auth
      if (isRealSupabaseConnected) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                username: userData.username,
                role: assignedRole,
                country: userData.country || 'Papua New Guinea',
                phone_number: userData.phoneNumber
              }
            }
          });
          if (!error && data.user) {
             return { success: true };
          } else {
             return { success: false, error: error?.message || "Signup failed" };
          }
        } catch (supabaseErr) {
          console.warn("[Supabase Auth] Fallback on signup:", supabaseErr);
        }
      }

      return { success: false, error: "Signup failed via Supabase" };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Network error during sign up" };
    }
  };

  const logout = async () => {
    if (isRealSupabaseConnected) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem('png_hub_auth_user');
  };

  const submitKYC = async (docType: string, docNumber: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: docType, documentNumber: docNumber })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error("KYC submission error:", e);
    }
  };

  const toggle2FA = () => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      twoFactorEnabled: !currentUser.twoFactorEnabled
    };
    setCurrentUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        login,
        signup,
        logout,
        submitKYC,
        toggle2FA,
        refreshUserData,
        isLoading,
        isAdmin: currentUser?.email?.toLowerCase() === 'adminsp247@gmail.com'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
