import * as SecureStore from 'expo-secure-store';
import { useState, useEffect, createContext, useContext } from 'react';

const AUTH_TOKEN_KEY = 'auth_token';
const SUPABASE_URL = 'https://ulncfblvuijlgniydjju.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

export async function signIn(email: string, password: string): Promise<string> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Authentication failed');
  }

  const data = await response.json();
  return data.access_token;
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
    throw error;
  }
}

export async function removeToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
}

// Auth hook for components
export function useAuth() {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getToken().then((storedToken) => {
      setTokenState(storedToken);
      setLoading(false);
    });
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    const accessToken = await signIn(email, password);
    await setToken(accessToken);
    setTokenState(accessToken);
  };

  const handleSignOut = async () => {
    await removeToken();
    setTokenState(null);
  };

  return {
    token,
    isAuthenticated: !!token,
    signIn: handleSignIn,
    signOut: handleSignOut,
    loading,
  };
}