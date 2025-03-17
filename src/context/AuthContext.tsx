
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';

export type User = {
  id: string;
  steamId: string;
  discordName: string;
  isAdmin: boolean;
  isVip?: boolean;
  vipExpiresAt?: string | null;
  avatar?: string | null;
  rank?: string | null;
  quote?: string | null;
  matchesPlayed?: number;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (steamId: string, password: string) => Promise<void>;
  register: (steamId: string, discordName: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ADMIN_STEAM_ID = "76561198262445630";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Initialize user session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get user from localStorage for now (will be replaced with proper auth later)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsAdmin(parsedUser.isAdmin || parsedUser.steamId === ADMIN_STEAM_ID);
          } catch (err) {
            console.error('Failed to parse stored user', err);
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (steamId: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Admin login check
      if (steamId === ADMIN_STEAM_ID && password === 'rinhaapenasparabons') {
        const adminUser = {
          id: '9999',
          steamId: ADMIN_STEAM_ID,
          discordName: 'Administrator',
          isAdmin: true
        };
        
        setUser(adminUser);
        setIsAdmin(true);
        localStorage.setItem('user', JSON.stringify(adminUser));
        
        toast.success("Admin login successful");
        return;
      }

      // Check if user exists in Supabase
      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('*, is_vip, vip_expires_at')
        .eq('steam_id', steamId)
        .single();
      
      if (userError || !dbUser) {
        throw new Error('Invalid Steam ID or password');
      }

      // Check password
      if (dbUser.password !== password) {
        throw new Error('Invalid password');
      }
      
      // Check if VIP status is still valid
      const isVip = dbUser.is_vip && new Date(dbUser.vip_expires_at) > new Date();
      
      // Update user's online status
      const { error: onlineError } = await supabase
        .from('users')
        .update({ is_online: true })
        .eq('id', dbUser.id);

      if (onlineError) {
        console.error('Error updating online status:', onlineError);
      }

      // Create user object
      const loggedInUser = {
        id: dbUser.id,
        steamId: dbUser.steam_id,
        discordName: dbUser.discord_name,
        isAdmin: dbUser.is_admin || false,
        isVip: isVip,
        vipExpiresAt: isVip ? dbUser.vip_expires_at : null,
        avatar: dbUser.avatar,
        rank: dbUser.rank,
        quote: dbUser.quote,
        matchesPlayed: dbUser.matches_played
      };
      
      setUser(loggedInUser);
      setIsAdmin(loggedInUser.isAdmin);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      
      toast.success("Login successful");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    steamId: string, 
    discordName: string, 
    password: string, 
    confirmPassword: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validation
      if (!steamId || !discordName || !password || !confirmPassword) {
        throw new Error('All fields are required');
      }
      
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('steam_id', steamId)
        .maybeSingle();
      
      if (existingUser) {
        throw new Error('A user with this Steam ID already exists');
      }
      
      // Create new user in Supabase
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          steam_id: steamId,
          discord_name: discordName,
          password: password, // In a real app, this would be hashed
          is_admin: false
        })
        .select()
        .single();
      
      if (insertError) {
        throw new Error(insertError.message);
      }
      
      // Log in the new user
      const registeredUser = {
        id: newUser.id,
        steamId: newUser.steam_id,
        discordName: newUser.discord_name,
        isAdmin: newUser.is_admin || false
      };
      
      setUser(registeredUser);
      setIsAdmin(registeredUser.isAdmin);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      
      toast.success("Registration successful");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (user) {
      try {
        // Set user offline
        await supabase
          .from('users')
          .update({ is_online: false })
          .eq('id', user.id);

        // Remove from queue if present
        await supabase
          .from('queue_entries')
          .delete()
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error during logout:', err);
      }
    }

    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('user');
    toast.info("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, register, logout, isAdmin }}
    >
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
