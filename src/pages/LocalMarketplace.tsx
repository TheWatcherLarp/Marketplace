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
import { Badge } from '@/components/ui/badge'; // Import Badge component

interface StaticShopItem {
  id: string; // Unique identifier for static item
  name: string;
  crowns: number;
  pennies: number;
  category: string;
  description: string;
  quantity: number; // Quantity to add to inventory per purchase
  permit_required: string | null; // Added permit_required
}

interface Character {
  id: string;
  name: string;
  crowns: number;
  pennies: number;
  branch: string;
  user_id: string;
}

interface CharacterPermit {
  id: string;
  character_id: string;
  permit_type: string;
  created_at: string;
}

// Define the static list of items available in the local shop
const staticLocalItems: StaticShopItem[] = [
  {
    id: 'weapon-dagger',
    name: 'Dagger (Up to 18”)',
    crowns: 1,
    pennies: 0,
    category: 'weapons',
    description: 'A small, sharp blade for close combat.',
    quantity: 1,
    permit_required: null,
  },
  {
    id: 'weapon-hatchet',
    name: 'Hatchet (Up to 26”)',
    crowns: 3,
    pennies: 6,
    category: 'weapons',
    description: 'A versatile tool and weapon.',
    quantity: 1,
    permit_required: null,
  },
  {
    id: 'weapon-cudgel',
    name: 'Cudgel (Subdual, Up to 26”)',
    crowns: 2,
    pennies: 0,
    category: 'weapons',
    description: 'A short, heavy club for non-lethal combat.',
    quantity: 1,
    permit_required: null,
  },
  {
    id: 'weapon-club',
    name: 'Club (Subdual, 26” to 36”)',
    crowns: 5,
    pennies: 0,
    category: 'weapons',
    description: 'A longer, heavier club for subduing opponents.',
    quantity: 1,
    permit_required: null,
  },
  {
    id: 'weapon-staff',
    name: 'Staff (Subdual, 2 handed, 36"+)',
    crowns: 7,
    pennies: 0,
    category: 'weapons',
    description: 'A long, two-handed staff for defense and subdual.',
    quantity: 1,
    permit_required: null,
  },
  {
    id: 'weapon-bow',
    name: 'Bow (30lb Max Poundage)',
    crowns: 5,
    pennies: 0,
    category: 'weapons',
    description: 'A light bow, easy to handle for quick shots.',
    quantity: 1,
    permit_required: null,
  },
  {
    id: 'weapon-arrow',
    name: 'Arrow 36”',
    crowns: 0,
    pennies: 1,
    category: 'weapons',
    description: 'A single arrow, 36 inches long.',
    quantity: 1, // Assuming 1 arrow per purchase
    permit_required: null,
  },
  {
    id: 'armour-light-tunic',
    name: 'Light Leather (1AV) Tunic',
    crowns: 1,
    pennies: 0,
    category: 'armour',
    description: 'A basic leather tunic for light protection.',
    quantity: 1,
    permit_required: null,
  },
  {
    id: 'armour-light-sleeves',
    name: 'Light Leather (1AV) Sleeves',
    crowns: 0,
    pennies: 5,
    category: 'armour',
    description: 'Leather sleeves for arm protection.',
    quantity: 1,
    permit_required: null,
  },
  {
    id: 'armour-light-trousers',
    name: 'Light Leather (1AV) Trousers',
    crowns: 0,
    pennies: 6,
    category: 'armour',
    description: 'Leather trousers for leg protection.',
    quantity: 1,
    permit_required: null,
  },
  {
    id: 'armour-light-cap',
    name: 'Light Leather (1AV) Cap',
    crowns: 0,
    pennies: 7,
    category: 'armour',
    description: 'A simple leather cap for head protection.',
    quantity: 1,
    permit_required: null,
  },
  {
    id: 'armour-medium-tunic',
    name: 'Medium Leather (2AV) Tunic',
    crowns: 2,
    pennies: 0,
    category: 'armour',
    description: 'A sturdier leather tunic for better protection.',
    quantity: 1,
    permit_required: null,
  },
  {
    id: 'armour-medium-bracers',
    name: 'Medium Leather (2AV) Bracers',
    crowns: 1,
    pennies: 0,
    category: 'armour',
    description: 'Medium leather bracers for forearm protection.',
    quantity: 1,
    permit_required: null,
  },
  {
    id: 'armour-medium-greaves',
    name: 'Medium Leather (2AV) Greaves',
    crowns: 1,
    pennies: 0,
    category: 'armour',
    description: 'Medium leather greaves for shin protection.',
    quantity: 1,
    permit_required: null,
  },
  {
    id: 'armour-medium-helmet',
    name: 'Medium Leather (2AV) Helmet',
    crowns: 1,
    pennies: 0,
    category: 'armour',
    description: 'A medium leather helmet for head protection.',
    quantity: 1,
    permit_required: null,
  },
  {
    id: 'weapon-shortsword',
    name: 'Shortsword (18” to 26”)',
    crowns: 4,
    pennies: 6,
    category: 'weapons',
    description: 'A versatile short sword for quick strikes.',
    quantity: 1,
    permit_required: 'weapon',
  },
  {
    id: 'weapon-longsword',
    name: 'Longsword (26” to 36”)',
    crowns: 9,
    pennies: 0,
    category: 'weapons',
    description: 'A classic longsword for balanced combat.',
    quantity: 1,
    permit_required: 'weapon',
  },
  {
    id: 'weapon-hand-axe',
    name: 'Hand Axe (26” to 36”)',
    crowns: 7,
    pennies: 0,
    category: 'weapons',
    description: 'A sturdy hand axe, effective in close quarters.',
    quantity: 1,
    permit_required: 'weapon',
  },
  {
    id: 'weapon-small-mace',
    name: 'Small Mace (Blunt, Up to 26”)',
    crowns: 3,
    pennies: 4,
    category: 'weapons',
    description: 'A compact mace for blunt force attacks.',
    quantity: 1,
    permit_required: 'weapon',
  },
  {
    id: 'weapon-mace',
    name: 'Mace (Blunt, 26” to 36”)',
    crowns: 7,
    pennies: 0,
    category: 'weapons',
    description: 'A heavier mace for powerful blunt attacks.',
    quantity: 1,
    permit_required: 'weapon',
  },
  {
    id: 'weapon-crossbow',
    name: 'Crossbow (30lb Max Poundage)',
    crowns: 5,
    pennies: 6,
    category: 'weapons',
    description: 'A powerful crossbow for ranged combat.',
    quantity: 1,
    permit_required: 'weapon',
  },
  {
    id: 'weapon-bolt',
    name: 'Bolt',
    crowns: 0,
    pennies: 1,
    category: 'weapons',
    description: 'A single bolt for a crossbow.',
    quantity: 1,
    permit_required: 'weapon',
  },
  {
    id: 'weapon-half-spear',
    name: 'Half-Spear (up to 36”)',
    crowns: 7,
    pennies: 0,
    category: 'weapons',
    description: 'A shorter spear, good for thrusting and parrying.',
    quantity: 1,
    permit_required: 'weapon',
  },
  {
    id: 'weapon-spear',
    name: 'Spear (2 handed, 36”+)',
    crowns: 13,
    pennies: 0,
    category: 'weapons',
    description: 'A long, two-handed spear for reach and defense.',
    quantity: 1,
    permit_required: 'weapon',
  },
  {
    id: 'shield-small',
    name: 'Small Shield (Up to 26”)',
    crowns: 3,
    pennies: 0,
    category: 'armour', // Shields are often categorized as armour or a separate category
    description: 'A compact shield for basic protection.',
    quantity: 1,
    permit_required: 'weapon', // Assuming shields also require a weapon permit
  },
  {
    id: 'shield-medium',
    name: 'Medium Shield (Under 36”)',
    crowns: 5,
    pennies: 0,
    category: 'armour',
    description: 'A balanced shield offering good protection.',
    quantity: 1,
    permit_required: 'weapon',
  },
  {
    id: 'shield-large',
    name: 'Large Shield (36” +)',
    crowns: 8,
    pennies: 0,
    category: 'armour',
    description: 'A large shield for maximum defense.',
    quantity: 1,
    permit_required: 'weapon',
  },
];

const LocalMarketplace = () => {
  const { session } = useSession();
  const [items, setItems] = useState<StaticShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [activeCharacterPermits, setActiveCharacterPermits] = useState<string[]>([]); // Store permit types
  const [isBuying, setIsBuying] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchCharacterAndSetItems = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch current user's active character
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
        setActiveCharacterPermits([]);
        setLoading(false);
        return;
      }

      setActiveCharacter(character);

      // Fetch character permits
      const { data: permitsData, error: permitsError } = await supabase
        .from('character_permits')
        .select('permit_type')
        .eq('character_id', character.id);

      if (permitsError) {
        throw permitsError;
      }
      setActiveCharacterPermits(permitsData?.map(p => p.permit_type) || []);

      // Filter static items by selected category
      const filteredItems = selectedCategory === 'all'
        ? staticLocalItems
        : staticLocalItems.filter(item => item.category === selectedCategory);
      
      setItems(filteredItems);

    } catch (error: any) {
      showError(`Error loading local marketplace: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacterAndSetItems();
  }, [session, selectedCategory]);

  const handleBuyItem = async (item: StaticShopItem) => {
    if (!activeCharacter) {
      showError('You need an active character to buy items.');
      return;
    }

    // Check if character has the required permit
    if (item.permit_required && item.permit_required !== 'none' && !activeCharacterPermits.includes(item.permit_required)) {
      showError(`You need a ${item.permit_required} permit to purchase this item.`);
      return;
    }

    setIsBuying(true);
    try {
      const totalItemPennies = (item.crowns * 12) + item.pennies;
      const totalBuyerPennies = (activeCharacter.crowns * 12) + activeCharacter.pennies;

      if (totalBuyerPennies < totalItemPennies) {
        showError('Not enough currency to purchase this item.');
        return;
      }

      // Calculate new currency balance
      const newTotalPennies = totalBuyerPennies - totalItemPennies;
      const newCrowns = Math.floor(newTotalPennies / 12);
      const newPennies = newTotalPennies % 12;

      // Update character's currency
      const { error: updateCharError } = await supabase
        .from('characters')
        .update({ crowns: newCrowns, pennies: newPennies })
        .eq('id', activeCharacter.id);

      if (updateCharError) {
        throw updateCharError;
      }

      // Add item to character's inventory, including permit_required
      const { error: insertItemError } = await supabase
        .from('character_items')
        .insert({
          character_id: activeCharacter.id,
          item_name: item.name,
          quantity: item.quantity,
          permit_required: item.permit_required, // Pass permit_required
          // crafter_user_id is null for shop items
        });

      if (insertItemError) {
        throw insertItemError;
      }

      showSuccess(`Successfully purchased ${item.name}!`);
      // Refresh character data to show updated currency
      fetchCharacterAndSetItems();
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
                <SelectItem value="consumable">Consumables</SelectItem>
                <SelectItem value="misc">Misc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">No items available in this category.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const requiresPermit = item.permit_required && item.permit_required !== 'none';
              const hasRequiredPermit = requiresPermit ? activeCharacterPermits.includes(item.permit_required!) : true;

              return (
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
                      {item.description}
                    </p>
                    {requiresPermit && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Requires: <Badge variant="outline" className="capitalize">{item.permit_required} Permit</Badge>
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="w-full"
                          disabled={isBuying || (requiresPermit && !hasRequiredPermit)}
                        >
                          {requiresPermit && !hasRequiredPermit ? `Requires ${item.permit_required} Permit` : 'Buy Item'}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalMarketplace;