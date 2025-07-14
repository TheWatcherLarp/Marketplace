import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { showError } from '@/utils/toast';

// Define interfaces for Character and CharacterPermit
interface Character {
  id: string;
  name: string;
  race: string;
  guild: string;
  branch: string;
  created_at: string;
  retired_at: string | null;
  crowns: number;
  pennies: number;
  guild_rank: string;
  user_id: string;
  social_rank: number; // Added social_rank
}

interface CharacterPermit {
  id: string;
  character_id: string;
  permit_type: string;
  created_at: string;
}

interface SessionContextType {
  session: Session | null;
  activeCharacter: Character | null;
  activeCharacterPermits: string[];
  loadingSession: boolean;
  refreshCharacter: () => Promise<void>; // Added refreshCharacter function
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [activeCharacterPermits, setActiveCharacterPermits] = useState<string[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchCharacterData = useCallback(async (userId: string) => {
    try {
      const { data: character, error: charError } = await supabase
        .from('characters')
        .select('id, name, race, guild, branch, created_at, retired_at, crowns, pennies, guild_rank, user_id, social_rank')
        .eq('user_id', userId)
        .is('retired_at', null)
        .single();

      if (charError && charError.code !== 'PGRST116') { // PGRST116 means no rows found
        throw charError;
      }

      setActiveCharacter(character || null);

      if (character) {
        const { data: permitsData, error: permitsError } = await supabase
          .from('character_permits')
          .select('permit_type')
          .eq('character_id', character.id);

        if (permitsError) {
          throw permitsError;
        }
        setActiveCharacterPermits(permitsData?.map(p => p.permit_type) || []);
      } else {
        setActiveCharacterPermits([]);
      }
    } catch (error: any) {
      console.error('Error fetching character or permits in SessionContextProvider:', error.message);
      showError(`Failed to load character data: ${error.message}`);
      setActiveCharacter(null);
      setActiveCharacterPermits([]);
    }
  }, []);

  const refreshCharacter = useCallback(async () => {
    if (session?.user?.id) {
      await fetchCharacterData(session.user.id);
    } else {
      setActiveCharacter(null);
      setActiveCharacterPermits([]);
    }
  }, [session, fetchCharacterData]);

  useEffect(() => {
    const handleAuthAndCharacterCheck = async () => {
      setLoadingSession(true);
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);

      if (initialSession?.user?.id) {
        await fetchCharacterData(initialSession.user.id);
      } else {
        setActiveCharacter(null);
        setActiveCharacterPermits([]);
      }
      setLoadingSession(false);
    };

    handleAuthAndCharacterCheck();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user?.id) {
        await fetchCharacterData(currentSession.user.id);
      } else {
        setActiveCharacter(null);
        setActiveCharacterPermits([]);
      }
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchCharacterData]);

  useEffect(() => {
    const currentPath = location.pathname;
    const isLoginPage = currentPath === '/login';
    const isCreateCharacterPage = currentPath === '/create-character';
    const allowedAuthPaths = ['/', '/home', '/character-inventory', '/marketplace', '/branch-members', '/the-recently-dead', '/local-marketplace', '/blacksmith'];

    if (loadingSession) return;

    if (session) {
      if (activeCharacter) {
        if (!allowedAuthPaths.includes(currentPath)) {
          navigate('/home');
        }
      } else { // session exists, but no activeCharacter
        if (!isCreateCharacterPage) {
          navigate('/create-character');
        }
      }
    } else { // no session
      if (!isLoginPage) {
        navigate('/login');
      }
    }
  }, [session, activeCharacter, loadingSession, navigate, location.pathname]);

  if (loadingSession) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg text-gray-700 dark:text-gray-300">
        Loading application...
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{ session, activeCharacter, activeCharacterPermits, loadingSession, refreshCharacter }}>
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