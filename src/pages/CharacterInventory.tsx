import React, { useEffect, useState } => 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header'; // Import the new Header component
import { Badge } from '@/components/ui/badge'; // Import Badge component

interface Character {
  id: string;
  name: string;
  race: string;
  guild: string;
  branch: string;
  created_at: string;
  retired_at: string | null;
  crowns: number;
  pennies: number;
  guild_rank: string;
}

interface CharacterItem {
  id: string;
  character_id: string;
  item_name: string;
  quantity: number;
  acquired_at: string;
  crafter_user_id: string | null;
}

interface CharacterPermit {
  id: string;
  character_id: string;
  permit_type: string;
  created_at: string;
}

const CharacterInventory = () => {
  const { session } = useSession();
  const [character, setCharacter] = useState<Character | null>(null);
  const [characterItems, setCharacterItems] = useState<CharacterItem[]>([]);
  const [characterPermits, setCharacterPermits] = useState<CharacterPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingPennies, setIsUpdatingPennies] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [selectedItemToSell, setSelectedItemToSell] = useState<CharacterItem | null>(null);
  const [sellCrowns, setSellCrowns] = useState(0);
  const [sellPennies, setSellPennies] = useState(0);
  const [sellCategory, setSellCategory] = useState('misc');
  const [sellQuantity, setSellQuantity] = useState(1);
  const [isSelling, setIsSelling] = useState(false);
  const [hasBlacksmithPermit, setHasBlacksmithPermit] = useState(false); // New state for blacksmith permit
  const navigate = useNavigate();

  const fetchCharacterAndItems = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: charData, error: charError } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', session.user.id)
        .is('retired_at', null)
        .single();

      if (charError && charError.code !== 'PGRST116') {
        throw charError;
      }

      setCharacter(charData || null);

      if (charData) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('character_items')
          .select('*')
          .eq('character_id', charData.id)
          .order('acquired_at', { ascending: false });

        if (itemsError) {
          throw itemsError;
        }
        setCharacterItems(itemsData || []);

        const { data: permitsData, error: permitsError } = await supabase
          .from('character_permits')
          .select('*')
          .eq('character_id', charData.id);

        if (permitsError) {
          throw permitsError;
        }
        setCharacterPermits(permitsData || []);
        setHasBlacksmithPermit(permitsData?.some(p => p.permit_type === 'blacksmith') || false);

      } else {
        setCharacterItems([]);
        setCharacterPermits([]);
        setHasBlacksmithPermit(false);
      }
    } catch (error: any) {
      showError(`Error fetching character or items: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacterAndItems();
  }, [session]);

  const handleRetireCharacter = async () => {
    if (!character?.id) {
      showError('No character to retire.');
      return;
    }

    try {
      const { error } = await supabase.rpc('retire_character_and_move', {
        p_character_id: character.id,
      });

      if (error) {
        throw error;
      }

      showSuccess(`Character '${character.name}' has been retired.`);
      setCharacter(null);
      navigate('/create-character');
    } catch (error: any) {
      showError(`Failed to retire character: ${error.message}`);
    }
  };

  const handleCharacterDeath = async () => {
    if (!character?.id) {
      showError('No character to declare deceased.');
      return;
    }

    try {
      const { error } = await supabase.rpc('kill_character_and_move', {
        p_character_id: character.id,
      });

      if (error) {
        throw error;
      }

      showSuccess(`Character '${character.name}' has passed away.`);
      setCharacter(null);
      navigate('/create-character');
    } catch (error: any) {
      showError(`Failed to declare character deceased: ${error.message}`);
    }
  };

  const handleAddPennies = async () => {
    if (!character?.id) {
      showError('No active character found.');
      return;
    }

    setIsUpdatingPennies(true);
    try {
      const { data: currentCharacter, error: fetchError } = await supabase
        .from('characters')
        .select('crowns, pennies')
        .eq('id', character.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const newPennies = currentCharacter.pennies + 10;

      const { data, error } = await supabase
        .from('characters')
        .update({ pennies: newPennies })
        .eq('id', character.id)
        .select('*');

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setCharacter(data[0]);
        showSuccess(`Added 10 pennies! Your new balance is ${data[0].crowns} crowns and ${data[0].pennies} pennies.`);
      }
    } catch (error: any) {
      showError(`Failed to add pennies: ${error.message}`);
    } finally {
      setIsUpdatingPennies(false);
    }
  };

  const handleSellItem = async () => {
    if (!selectedItemToSell || !character?.id) {
      showError('No item selected or character not found.');
      return;
    }

    if (sellCrowns < 0 || sellPennies < 0) {
      showError('Price cannot be negative.');
      return;
    }
    if (sellCrowns === 0 && sellPennies === 0) {
      showError('Price cannot be zero.');
      return;
    }
    if (sellPennies >= 12) {
      showError('Pennies must be less than 12. Please convert 12 pennies to 1 Crown.');
      return;
    }
    if (!sellCategory) {
      showError('Please select a category for the item.');
      return;
    }
    if (sellQuantity <= 0 || sellQuantity > selectedItemToSell.quantity) {
      showError(`Quantity to sell must be between 1 and ${selectedItemToSell.quantity}.`);
      return;
    }

    setIsSelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('sell-item', {
        body: JSON.stringify({
          character_item_id: selectedItemToSell.id,
          price_crowns: sellCrowns,
          price_pennies: sellPennies,
          category: sellCategory,
          quantity_to_sell: sellQuantity,
        }),
      });

      if (error) {
        throw error;
      }

      showSuccess(data.message || 'Item(s) successfully listed on marketplace!');
      setShowSellDialog(false);
      setSelectedItemToSell(null);
      setSellCrowns(0);
      setSellPennies(0);
      setSellCategory('misc');
      setSellQuantity(1);
      fetchCharacterAndItems();
    } catch (error: any) {
      showError(`Failed to sell item: ${error.message}`);
    } finally {
      setIsSelling(false);
    }
  };

  const handleGrantBlacksmithPermit = async () => {
    if (!character?.id) {
      showError('No active character found.');
      return;
    }

    try {
      const { error } = await supabase
        .from('character_permits')
        .insert({ character_id: character.id, permit_type: 'blacksmith' });

      if (error) {
        throw error;
      }

      showSuccess('Blacksmith Permit granted!');
      fetchCharacterAndItems(); // Re-fetch to update the UI
    } catch (error: any) {
      showError(`Failed to grant permit: ${error.message}`);
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-20 p-4">
      <Header />
      <div className="max-w-md mx-auto">
        <Card className="w-full mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome, {character.name}!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              This is your character inventory page.
            </p>
            <p className="text-md text-gray-700 dark:text-gray-300 mt-2">
              Race: {typeof character.race === 'string' && character.race
                ? character.race.charAt(0).toUpperCase() + character.race.slice(1)
                : 'N/A'}
            </p>
            <p className="text-md text-gray-700 dark:text-gray-300 mt-2">
              Guild: {typeof character.guild === 'string' && character.guild
                ? character.guild.charAt(0).toUpperCase() + character.guild.slice(1)
                : 'N/A'}
            </p>
            <p className="text-md text-gray-700 dark:text-gray-300 mt-2">
              Rank: {typeof character.guild_rank === 'string' && character.guild_rank
                ? character.guild_rank.charAt(0).toUpperCase() + character.guild_rank.slice(1)
                : 'N/A'}
            </p>
            <p className="text-md text-gray-700 dark:text-gray-300 mt-2">
              Branch: {character.branch || 'N/A'}
            </p>
            <p className="text-md text-gray-700 dark:text-gray-300 mt-2">
              Crowns: {character.crowns}
            </p>
            <p className="text-md text-gray-700 dark:text-gray-300 mt-2">
              Pennies: {character.pennies}
            </p>
            <div className="mt-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Permits:</h4>
              {characterPermits.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">No permits acquired.</p>
              ) : (
                <div className="flex flex-wrap justify-center gap-2">
                  {characterPermits.map((permit) => (
                    <Badge key={permit.id} variant="secondary" className="capitalize">
                      {permit.permit_type} Permit
                    </Badge>
                  ))}
                </div>
              )}
              {character.guild === 'blacksmith' && !hasBlacksmithPermit && (
                <Button onClick={handleGrantBlacksmithPermit} className="mt-4 w-full">
                  Grant Blacksmith Permit
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Character ID: {character.id}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Created On: {new Date(character.created_at).toLocaleDateString()}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">Retire Character</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will move your character to the retired characters archive. You will no longer be able to use this character.
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">Character Death</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Character Death</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to declare your character deceased? This action will move your character to the dead characters archive, and they will no longer be playable.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCharacterDeath}>
                    Confirm Death
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Your Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            {characterItems.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400">Your inventory is empty.</p>
            ) : (
              <div className="space-y-4">
                {characterItems.map((item) => (
                  <div key={item.id} className="border p-3 rounded-md bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{item.item_name} (x{item.quantity})</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Acquired on: {new Date(item.acquired_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItemToSell(item);
                        setSellQuantity(1);
                        setShowSellDialog(true);
                      }}
                    >
                      Sell
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sell Item Dialog */}
      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell {selectedItemToSell?.item_name}</DialogTitle>
            <DialogDescription>
              Set the price, category, and quantity to sell for your item.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="crowns" className="text-right">
                Crowns
              </label>
              <Input
                id="crowns"
                type="number"
                value={sellCrowns}
                onChange={(e) => setSellCrowns(Math.max(0, parseInt(e.target.value) || 0))}
                className="col-span-3"
                min="0"
                disabled={isSelling}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="pennies" className="text-right">
                Pennies
              </label>
              <Input
                id="pennies"
                type="number"
                value={sellPennies}
                onChange={(e) => setSellPennies(Math.max(0, parseInt(e.target.value) || 0))}
                className="col-span-3"
                min="0"
                disabled={isSelling}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="category" className="text-right">
                Category
              </label>
              <Select onValueChange={setSellCategory} value={sellCategory} disabled={isSelling}>
                <SelectTrigger id="category" className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weapons">Weapons</SelectItem>
                  <SelectItem value="armour">Armour</SelectItem>
                  <SelectItem value="misc">Misc</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="sellQuantity" className="text-right">
                Quantity to Sell
              </label>
              <Input
                id="sellQuantity"
                type="number"
                value={sellQuantity}
                onChange={(e) => setSellQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, selectedItemToSell?.quantity || 1)))}
                className="col-span-3"
                min="1"
                max={selectedItemToSell?.quantity || 1}
                disabled={isSelling}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSellDialog(false)} disabled={isSelling}>
              Cancel
            </Button>
            <Button onClick={handleSellItem} disabled={isSelling}>
              {isSelling ? 'Listing...' : 'List Item(s)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CharacterInventory;