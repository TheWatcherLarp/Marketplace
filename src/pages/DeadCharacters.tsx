import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showError } from '@/utils/toast';

interface DeadCharacter {
  id: string;
  user_id: string;
  name: string;
  race: string;
  guild: string;
  branch: string;
  created_at: string;
  died_at: string;
  crowns: number;
  pennies: number;
  ownerName?: string; // Added for displaying the owner's name
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const DeadCharacters = () => {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [deadCharacters, setDeadCharacters] = useState<DeadCharacter[]>([]);

  useEffect(() => {
    const fetchDeadCharacters = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all dead characters
        const { data: charactersData, error: charactersError } = await supabase
          .from('dead_characters')
          .select('*')
          .order('died_at', { ascending: false });

        if (charactersError) {
          throw charactersError;
        }

        // Fetch all profiles to get user names
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name');

        if (profilesError) {
          throw profilesError;
        }

        const profileMap = new Map<string, string>();
        (profilesData || []).forEach((profile: Profile) => {
          const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
          profileMap.set(profile.id, fullName || 'Unknown User');
        });

        // Enrich dead characters with owner names
        const enrichedDeadCharacters = (charactersData || []).map(character => ({
          ...character,
          ownerName: profileMap.get(character.user_id) || 'Unknown User',
        }));

        setDeadCharacters(enrichedDeadCharacters);
      } catch (error: any) {
        showError(`Error fetching deceased characters: ${error.message}`);
        setDeadCharacters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeadCharacters();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading deceased characters...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 text-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need to be logged in to view deceased characters.
            </p>
            <Button asChild>
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            All Deceased Characters
          </h1>
          <Button asChild variant="outline">
            <Link to="/home">Home</Link>
          </Button>
        </div>

        {deadCharacters.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">No deceased characters found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deadCharacters.map((character) => (
              <Card key={character.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{character.name}</CardTitle>
                  <CardDescription>
                    {character.race.charAt(0).toUpperCase() + character.race.slice(1)} - {character.guild.charAt(0).toUpperCase() + character.guild.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-gray-700 dark:text-gray-300">Branch: {character.branch || 'N/A'}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Crowns: {character.crowns}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Pennies: {character.pennies}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Owner: {character.ownerName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created: {new Date(character.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Died: {new Date(character.died_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeadCharacters;