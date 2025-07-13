import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showError } from '@/utils/toast';
import { Link } from 'react-router-dom';

interface MarketplaceItem {
  id: string;
  name: string;
  description: string | null;
  crowns: number; // Changed from price
  pennies: number; // Changed from price
  seller_id: string;
  listed_at: string;
}

const Marketplace = () => {
  const { session } = useSession();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCharacter, setHasCharacter] = useState(false);

  useEffect(() => {
    const checkCharacterAndFetchItems = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Check if the user has an active character
        const { data: character, error: characterError } = await supabase
          .from('characters')
          .select('id')
          .eq('user_id', session.user.id)
          .is('retired_at', null)
          .single();

        if (characterError && characterError.code !== 'PGRST116') {
          throw characterError;
        }

        if (character) {
          setHasCharacter(true);
          // Fetch marketplace items if character exists
          const { data: marketplaceItems, error: itemsError } = await supabase
            .from('marketplace_items')
            .select('*')
            .order('listed_at', { ascending: false });

          if (itemsError) {
            throw itemsError;
          }
          setItems(marketplaceItems || []);
        } else {
          setHasCharacter(false);
        }
      } catch (error: any) {
        showError(`Error loading marketplace: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    checkCharacterAndFetchItems();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading marketplace...</p>
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
              You need to be logged in to access the marketplace.
            </p>
            <Button asChild>
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasCharacter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 text-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">No Active Character</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need an active character to access the marketplace.
            </p>
            <Button asChild>
              <Link to="/create-character">Create Character</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-4">
          <Button asChild variant="outline">
            <Link to="/home">Home</Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Marketplace
        </h1>
        {items.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">No items currently listed in the marketplace.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>
                    {item.crowns} Crowns, {item.pennies} Pennies
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {item.description || 'No description provided.'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Listed on: {new Date(item.listed_at).toLocaleDateString()}
                  </p>
                </CardContent>
                {/* Add buy/interact button here later */}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;