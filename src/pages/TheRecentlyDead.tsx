import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { showError } from '@/utils/toast';
import Header from '@/components/Header';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface DeadCharacter {
  id: string;
  name: string;
  race: string;
  guild: string;
  branch: string;
  died_at: string;
  crowns: number;
  pennies: number;
}

const TheRecentlyDead = () => {
  const { session } = useSession();
  const [deadCharacters, setDeadCharacters] = useState<DeadCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeadCharacters = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('dead_characters')
          .select('*')
          .order('died_at', { ascending: false })
          .limit(20);

        if (error) {
          throw error;
        }

        setDeadCharacters(data || []);
      } catch (error: any) {
        showError(`Error fetching recently dead characters: ${error.message}`);
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
        <p className="text-gray-700 dark:text-gray-300">Loading the recently dead...</p>
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
              You need to be logged in to view this page.
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-20 p-4">
      <Header />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          The Recently Dead
        </h1>

        {deadCharacters.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">No characters have passed away recently.</p>
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

export default TheRecentlyDead;