import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError } from '@/utils/toast';

interface Character {
  id: string;
  name: string;
  created_at: string;
}

const CharacterInventory = () => {
  const { session } = useSession();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharacter = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          throw error;
        }

        setCharacter(data || null);
      } catch (error: any) {
        showError(`Error fetching character: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading character data...</p>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">No Character Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              It seems you don't have a character yet. Please create one!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome, {character.name}!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            This is your character inventory page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Character ID: {character.id}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created On: {new Date(character.created_at).toLocaleDateString()}
          </p>
          {/* Add more inventory details here later */}
        </CardContent>
      </Card>
    </div>
  );
};

export default CharacterInventory;