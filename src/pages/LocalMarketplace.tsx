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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  crowns: number;
  pennies: number;
  branch: string;
  user_id: string; // Added user_id for filtering
}

const LocalMarketplace = () => {
  const { session } = useSession();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchLocalMarketItems = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch current user's active character to get their branch
      const { data: character, error: characterError } = await supabase
        .from('characters')
        .select('id, name, crowns, pennies, branch, user_id')
        .eq('user_id', session.user.id)
        .is('retired_at', null)
        .single();

      if (characterError && characterError.code !== 'PGRST116') {
        throw characterError;
      }

      if (!character) {
        setActiveCharacter(null);
        setLoading(false);
        return;
      }

      setActiveCharacter(character);

      // Fetch all active characters to map user/character IDs to branches
      const { data: allActiveCharacters, error: allActiveCharactersError } = await supabase
        .from('characters')
        .select('id, user_id, name, branch')
        .is('retired_at', null);

      if (allActiveCharactersError) throw allActiveCharactersError;

      const characterIdToBranchMap = new Map<string, string>();
      const userIdToBranchMap = new Map<string, string>();
      const characterIdToNameMap = new Map<string, string>();
      const userIdToNameMap = new Map<string, string>();

      (allActiveCharacters || []).forEach(char => {
        characterIdToBranchMap.set(char.id, char.branch);
        userIdToBranchMap.set(char.user_id, char.branch);
        characterIdToNameMap.set(char.id, char.name);
        userIdToNameMap.set(char.user_id, char.name);
      });

      // Fetch all marketplace items
      let query = supabase
        .from('marketplace_items')
        .select('*, seller_character_id');

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data: marketplaceItems, error: itemsError } = await query.order('listed_at', { ascending: false });

      if (itemsError) {
        throw itemsError;
      }

      // Filter items to only show those from the same branch
      const filteredItems = (marketplaceItems || []).filter(item => {
        const sellerBranch = item.seller_character_id
          ? characterIdToBranchMap.get(item.seller_character_id)
          : userIdToBranchMap.get(item.seller_id);
        return sellerBranch === character.branch;
      });

      const enrichedItems = filteredItems.map(item => ({
        ...item,
        sellerCharacterName: item.seller_character_id ? characterIdToNameMap.get(item.seller_character_id) || 'Unknown Adventurer' : userIdToNameMap.get(item.seller_id) || 'Unknown Adventurer',
        crafterCharacterName: item.crafter_user_id ? userIdToNameMap.get(item.crafter_user_id) || 'Unknown Crafter' : 'Unknown Crafter',
      }));

      setItems(enrichedItems);

    } catch (error: any) {
      showError(`Error loading local marketplace: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalMarketItems();
  }, [session, selectedCategory]);

  const handleBuyItem = async (item: MarketplaceItem) => {
    if (!activeCharacter) {
      showError('You need an active character to buy items.');
      return;
    }

    setIsBuying(true);
    try {
      const { data, error } = await supabase.functions.invoke('buy-item', {
        body: JSON.stringify({
          marketplace_item_id: item.id,
          buyer_character_id: activeCharacter.id,
        }),
      });

      if (error) {
        throw error;
      }

      showSuccess(data.message || `Successfully purchased ${item.name}!`);
      fetchLocalMarketItems(); // Refresh the list
    } catch (error: any) {
      showError(`Failed to buy item: ${error.message}`);
    } finally {
      setIsBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading local marketplace...</p>
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
              You need to be logged in to access the local marketplace.
            </p>
            <Button asChild>
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeCharacter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 text-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">No Active Character</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need an active character to access the local marketplace.
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {activeCharacter.branch} Branch Market
          </h1>
          <div className="flex items-center space-x-4">
            {activeCharacter && (
              <div className="text-gray-700 dark:text-gray-300 text-sm">
                Your Funds: {activeCharacter.crowns} Crowns, {activeCharacter.pennies} Pennies
              </div>
            )}
            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="weapons">Weapons</SelectItem>
                <SelectItem value="armour">Armour</SelectItem>
                <SelectItem value="misc">Misc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">No items currently listed in your branch's market.</p>
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
                    Sold By: {item.sellerCharacterName}
                  </p>
                  {item.crafterCharacterName && item.crafterCharacterName !== item.sellerCharacterName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Crafted By: {item.crafterCharacterName}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Listed on: {new Date(item.listed_at).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="w-full"
                        disabled={isBuying || item.seller_id === session?.user?.id} // Disable if buying or if it's the current user's item
                      >
                        {item.seller_id === session?.user?.id ? 'Your Item' : 'Buy Item'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to buy "{item.name}" for {item.crowns} Crowns and {item.pennies} Pennies?
                          <br />
                          Your current balance: {activeCharacter?.crowns} Crowns, {activeCharacter?.pennies} Pennies.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isBuying}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleBuyItem(item)} disabled={isBuying}>
                          {isBuying ? 'Purchasing...' : 'Confirm Purchase'}
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