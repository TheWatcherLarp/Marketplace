import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showError } from '@/utils/toast';

// Define interfaces for data
interface Character {
  id: string;
  name: string;
  race: string;
  guild: string;
  branch: string; // Added branch
  created_at: string;
  retired_at: string | null;
  crowns: number;
  pennies: number;
}

interface MarketplaceItem {
  id: string;
  name: string;
  description: string | null;
  crowns: number;
  pennies: number;
  seller_id: string;
  listed_at: string;
  category: string; // Added category
  quantity: number; // Added quantity
}

const HomePage = () => {
  const { session } = useSession();
  const [character, setCharacter] = useState<Character | null>(null);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch active character
        const { data: charData, error: charError } = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', session.user.id)
          .is('retired_at', null)
          .single();

        if (charError && charError.code !== 'PGRST116') { // PGRST116 means no rows found
          throw charError;
        }
        setCharacter(charData || null);

        // Fetch a few latest marketplace items
        const { data: itemsData, error: itemsError } = await supabase
          .from('marketplace_items')
          .select('*')
          .order('listed_at', { ascending: false })
          .limit(3);

        if (itemsError) {
          throw itemsError;
        }
        setMarketplaceItems(itemsData || []);

      } catch (error: any) {
        showError(`Error loading home data: ${error.message}`);
        setCharacter(null);
        setMarketplaceItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading home page data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center mb-6">
        <CardHeader>
          <CardTitle className="text-3xl">Hello, Adventurer!</CardTitle>
          <CardDescription>Choose your path.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {character ? (
            <>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Your Active Character:</h3>
              <p className="text-lg text-gray-700 dark:text-gray-300">Name: {character.name}</p>
              <p className="text-md text-gray-600 dark:text-gray-400">
                Race: {typeof character.race === 'string' && character.race
                  ? character.race.charAt(0).toUpperCase() + character.race.slice(1)
                  : 'N/A'}
              </p>
              <p className="text-md text-gray-600 dark:text-gray-400">
                Guild: {typeof character.guild === 'string' && character.guild
                  ? character.guild.charAt(0).toUpperCase() + character.guild.slice(1)
                  : 'N/A'}
              </p>
              <p className="text-md text-gray-600 dark:text-gray-400">Branch: {character.branch || 'N/A'}</p> {/* Display branch */}
              <p className="text-md text-gray-600 dark:text-gray-400">Crowns: {character.crowns}</p>
              <p className="text-md text-gray-600 dark:text-gray-400">Pennies: {character.pennies}</p>
              <Button asChild className="w-full">
                <Link to="/character-inventory">View Character Inventory</Link>
              </Button>
            </>
          ) : (
            <Button asChild className="w-full">
              <Link to="/create-character">Create New Character</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Latest Marketplace Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {marketplaceItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {marketplaceItems.map((item) => (
                <div key={item.id} className="border p-3 rounded-md bg-gray-50 dark:bg-gray-700">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{item.name} (x{item.quantity})</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{item.crowns} Crowns, {item.pennies} Pennies</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Category: {item.category.charAt(0).toUpperCase() + item.category.slice(1)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description || 'No description.'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No items currently listed.</p>
          )}
          <Button asChild className="w-full" variant="outline">
            <Link to="/marketplace">Explore Full Marketplace</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;