import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate, Link } from 'react-router-dom'; // Import Link

interface Character {
  id: string;
  name: string;
  race: string;
  guild: string;
  created_at: string;
  retired_at: string | null; // Add retired_at to the interface
}

const CharacterInventory = () => {
  const { session } = useSession();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
          .is('retired_at', null) // Only fetch active characters
          .single();

        if (error && error.code !== 'PGRST116') {
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

  const handleRetireCharacter = async () => {
    if (!character?.id) {
      showError('No character to retire.');
      return;
    }

    try {
      const { error } = await supabase
        .from('characters')
        .update({ retired_at: new Date().toISOString() }) // Set retired_at timestamp
        .eq('id', character.id);

      if (error) {
        throw error;
      }

      showSuccess(`Character '${character.name}' has been retired.`);
      setCharacter(null); // Clear character state
      navigate('/create-character'); // Redirect to create character page
    } catch (error: any) {
      showError(`Failed to retire character: ${error.message}`);
    }
  };

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
              It seems you don't have an active character yet. Please create one!
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
          <p className="text-md text-gray-700 dark:text-gray-300 mt-2">
            Race: {character.race.charAt(0).toUpperCase() + character.race.slice(1)}
          </p>
          <p className="text-md text-gray-700 dark:text-gray-300 mt-2">
            Guild: {character.guild.charAt(0).toUpperCase() + character.guild.slice(1)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Character ID: {character.id}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created On: {new Date(character.created_at).toLocaleDateString()}
          </p>
          {/* Add more inventory details here later */}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-6"> {/* Use flex-col and gap for spacing */}
          <Button asChild className="w-full">
            <Link to="/marketplace">Go to Marketplace</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">Retire Character</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will mark your character as retired. You will no longer be able to use this character.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRetireCharacter}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CharacterInventory;