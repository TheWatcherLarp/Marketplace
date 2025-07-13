import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showError } from '@/utils/toast';

const HomePage = () => {
  const { session } = useSession();
  const [hasCharacter, setHasCharacter] = useState(false);
  const [loadingCharacter, setLoadingCharacter] = useState(true);

  useEffect(() => {
    const checkCharacter = async () => {
      if (!session?.user?.id) {
        setHasCharacter(false);
        setLoadingCharacter(false);
        return;
      }

      try {
        const { data: character, error } = await supabase
          .from('characters')
          .select('id')
          .eq('user_id', session.user.id)
          .is('retired_at', null)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          throw error;
        }

        setHasCharacter(!!character);
      } catch (error: any) {
        showError(`Error checking character: ${error.message}`);
        setHasCharacter(false);
      } finally {
        setLoadingCharacter(false);
      }
    };

    checkCharacter();
  }, [session]);

  if (loadingCharacter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading home page...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl">Welcome, Adventurer!</CardTitle>
          <CardDescription>Choose your path.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasCharacter ? (
            <>
              <Button asChild className="w-full">
                <Link to="/character-inventory">View Character Inventory</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link to="/marketplace">Explore Marketplace</Link>
              </Button>
            </>
          ) : (
            <Button asChild className="w-full">
              <Link to="/create-character">Create New Character</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;