import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verificar sesión activa al cargar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Escuchar cambios de estado en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const logout = () => {
    return supabase.auth.signOut();
  };

  // Determinar si el usuario tiene rol de Administrador
  // Es admin si en metadata su rol es 'admin', o si su email contiene 'admin' o 'junta'
  const [demoAdminOverride, setDemoAdminOverride] = useState(true); // Habilitado por defecto para facilitar pruebas

  const isAdmin = Boolean(
    user && (
      user.app_metadata?.role === 'admin' || 
      user.user_metadata?.role === 'admin' || 
      user.email?.toLowerCase().includes('admin') || 
      user.email?.toLowerCase().includes('junta') ||
      demoAdminOverride
    )
  );

  const toggleAdminRole = () => {
    setDemoAdminOverride(prev => !prev);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, toggleAdminRole, demoAdminOverride }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);