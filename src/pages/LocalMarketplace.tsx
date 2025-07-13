import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { Link } from 'react-router-dom';
import Header from '@/components/Header';

interface MarketplaceItem {
  id: string;
  name: string;
  crowns: number;
  pennies: number;
  seller_id: string;
  seller_character_id: string | null;
  listed_at: string;
  category: string;
  sellerCharacterName?: string;
  crafter_user_id: string | null;
  crafterCharacterName?: string;
}

interface Character {
  id: string;
  name: string;
}

const LocalMarketplace = () => {
  const { session } = useSession();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCharacter, setHasCharacter] = useState(false);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [isDelisting, setIsDelisting] = useState(false);

  const fetchPlayerListedItems = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: character, error: characterError } = await supabase
        .from('characters')
        .select('id, name')
        .eq('user_id', session.user.id)
        .is('retired_at', null)
        .single();

      if (characterError && characterError.code !== 'PGRST116') {
        throw characterError;
      }

      if (character) {
        setHasCharacter(true);
        setActiveCharacter(character);

        const { data: marketplaceItems, error: itemsError } = await supabase
          .from('marketplace_items')
          .select('*, seller_character_id')
          .eq('seller_id', session.user.id) // Filter by current user's ID
          .order('listed_at', { ascending: false });

        if (itemsError) {
          throw itemsError;
        }

        const { data: allCharactersData, error: allCharactersError } = await supabase
          .from('characters')
          .select('user_id, name, id');

        const { data: retiredCharactersData, error: retiredCharactersError } = await supabase
          .from('retired_characters')
          .select('user_id, name, id');

        const { data: deadCharactersData, error: deadCharactersError } = await supabase
          .from('dead_characters')
          .select('user_id, name, id');

        if (allCharactersError) throw allCharactersError;
        if (retiredCharactersError) throw retiredCharactersError;
        if (deadCharactersError) throw deadCharactersData;

        const userToCharacterNameMap = new Map<string, string>();
        const characterIdToCharacterNameMap = new Map<string, string>();
        
        [...(allCharactersData || []), ...(retiredCharactersData || []), ...(deadCharactersData || [])].forEach(char => {
          userToCharacterNameMap.set(char.user_id, char.name);
          characterIdToCharacterNameMap.set(char.id, char.name);
        });

        const enrichedItems = (marketplaceItems || []).map(item => ({
          ...item,
          sellerCharacterName: item.seller_character_id ? characterIdToCharacterNameMap.get(item.seller_character_id) || 'Unknown Adventurer' : userToCharacterNameMap.get(item.seller_id) || 'Unknown Adventurer',
          crafterCharacterName: item.crafter_user_id ? userToCharacterNameMap.get(item.crafter_user_id) || 'Unknown Crafter' : 'Unknown Crafter',
        }));
        
        setItems(enrichedItems);

      } else {
        setHasCharacter(false);
        setActiveCharacter(null);
      }
    } catch (error: any) {
      showError(`Error loading local marketplace: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerListedItems();
  }, [session]);

  const handleDelistItem = async (item: MarketplaceItem) => {
    if (!activeCharacter) {
      showError('You need an active character to delist items.');
      return;
    }

    setIsDelisting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delist-item', {
        body: JSON.stringify({
          marketplace_item_id: item.id,
        }),
      });

      if (error) {
        throw error;
      }

      showSuccess(data.message || `Successfully delisted ${item.name} and returned to inventory!`);
      fetchPlayerListedItems(); // Refresh the list
    } catch (error: any) {
      showError(`Failed to delist item: ${error.message}`);
    } finally {
      setIsDelisting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading your listed items...</p>
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
              You need to be logged in to access your local marketplace.
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
              You need an active character to access your local marketplace.
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-20 p-4">
      <Header />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          {activeCharacter?.name}'s Local Marketplace Listings
        </h1>

        {items.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">You have no items currently listed on the marketplace.</p>
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Category: {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Listed on: {new Date(item.listed_at).toLocaleDateString()}
                  </p>
                  {item.crafterCharacterName && item.crafterCharacterName !== item.sellerCharacterName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Crafted By: {item.crafterCharacterName}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full" disabled={isDelisting}>
                        Delist Item
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Delist</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delist "{item.name}"? It will be returned to your character's inventory.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDelisting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelistItem(item)} disabled={isDelisting}>
                          {isDelisting ? 'Delisting...' : 'Confirm Delist'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalMarketplace;