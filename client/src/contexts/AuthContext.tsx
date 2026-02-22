import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://neqpqpixprzhodrqjllw.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcXBxcGl4cHJ6aG9kcnFqbGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NTAwODQsImV4cCI6MjA4NzEyNjA4NH0.w2wMuCZiLSqRTsMH_NfG-1rZS4M_4_1PiGq0N6uFLkI';

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

export type UserRole = 'user' | 'owner' | 'admin';
export type OwnerStatus = 'none' | 'pending' | 'approved' | 'rejected';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole;
  ownerStatus: OwnerStatus;
  fullName: string;
  profileComplete: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  setupProfile: (fullName: string, role: UserRole) => Promise<void>;
  updateOwnerStatus: (status: OwnerStatus) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin emails — add your admin email(s) here
  const ADMIN_EMAILS = ['shaikmahammadshahidafrid@gmail.com'];

  // Derive role/profile from user metadata
  const isAdminEmail = !!user?.email && ADMIN_EMAILS.includes(user.email);
  const userRole: UserRole = isAdminEmail ? 'admin' : ((user?.user_metadata?.role as UserRole) || 'user');
  const ownerStatus: OwnerStatus = (user?.user_metadata?.ownerStatus as OwnerStatus) || 'none';
  const fullName: string = user?.user_metadata?.full_name || '';
  const profileComplete: boolean = !!user?.user_metadata?.role;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const setupProfile = async (name: string, role: UserRole) => {
    const ownerSt: OwnerStatus = role === 'owner' ? 'pending' : 'none';
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: name, role, ownerStatus: ownerSt },
    });
    if (!error && data.user) {
      setUser(data.user);
      // Register owner in server so admin can see and approve/reject them
      if (role === 'owner') {
        try {
          await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: data.user.id,  // use Supabase user ID as username
              password: data.user.id,
              fullName: name,
              role: 'owner',
              ownerStatus: 'pending',
            }),
          });
        } catch {
          // Non-critical – ignore registration errors
        }
      }
    }
  };

  const updateOwnerStatus = async (status: OwnerStatus) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { ownerStatus: status },
    });
    if (!error && data.user) setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, ownerStatus, fullName, profileComplete, signUp, signIn, signOut, setupProfile, updateOwnerStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export { supabase };