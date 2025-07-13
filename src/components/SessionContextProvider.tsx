import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { showError } from '@/utils/toast';

interface SessionContextType {
  session: Session | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleAuthRedirect = async () => {
      if (loading) return;

      const currentPath = location.pathname;
      const isLoginPage = currentPath === '/login';
      const isCreateCharacterPage = currentPath === '/create-character';
      
      // Define paths that an authenticated user with a character can visit
      const allowedAuthPaths = ['/', '/home', '/character-inventory', '/marketplace'];

      if (session) {
        // User is logged in
        if (session.user?.id) {
          try {
            // Check for an active character (retired_at is NULL)
            const { data: character, error } = await supabase
              .from('characters')
              .select('id')
              .eq('user_id', session.user.id)
              .is('retired_at', null) // Only fetch active characters
              .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
              throw error;
            }

            if (character) {
              // Active character exists, allow navigation to specific pages
              if (!allowedAuthPaths.includes(currentPath)) {
                navigate('/home'); // Redirect to home if on an unauthorized page
              }
            } else {
              // No active character, redirect to create character page if not already there
              if (!isCreateCharacterPage) {
                navigate('/create-character');
              }
            }
          } catch (error: any) {
            showError(`Failed to check character: ${error.message}`);
            // Fallback to home or login if character check fails critically
            navigate('/login');
          }
        } else if (isLoginPage) {
          // Logged in but no user ID (shouldn't happen often), redirect to home
          navigate('/home');
        }
      } else {
        // User is not logged in, redirect to login page if not already there
        if (!isLoginPage) {
          navigate('/login');
        }
      }
    };

    handleAuthRedirect();
  }, [session, loading, navigate, location.pathname]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-lg text-gray-700 dark:text-gray-300">Loading application...</div>;
  }

  return (
    <SessionContext.Provider value={{ session }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};