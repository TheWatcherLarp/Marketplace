import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showError, showSuccess } from '@/utils/toast';

const CreateCharacter = () => {
  const [characterName, setCharacterName] = useState('');
  const [race, setRace] = useState('');
  const [guild, setGuild] = useState('');
  const [branch, setBranch] = useState(''); // New state for branch
  const [loading, setLoading] = useState(true);
  const [hasExistingCharacter, setHasExistingCharacter] = useState(false);
  const navigate = useNavigate();
  const { session } = useSession();

  useEffect(() => {
    const checkExistingCharacter = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data: character, error } = await supabase
          .from('characters')
          .select('id')
          .eq('user_id', session.user.id)
          .is('retired_at', null)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (character) {
          setHasExistingCharacter(true);
          showError('You already have an active character. Redirecting to inventory.');
          navigate('/character-inventory');
        }
      } catch (error: any) {
        showError(`Error checking existing character: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    checkExistingCharacter();
  }, [session, navigate]);

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      showError('User not logged in.');
      return;
    }
    if (hasExistingCharacter) {
      showError('You already have an active character.');
      return;
    }
    if (!characterName.trim()) {
      showError('Character name cannot be empty.');
      return;
    }
    if (!race) {
      showError('Please select a character race.');
      return;
    }
    if (!guild) {
      showError('Please select a character guild.');
      return;
    }
    if (!branch) { // New validation for branch
      showError('Please select a branch.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('characters')
        .insert({ user_id: session.user.id, name: characterName.trim(), race: race, guild: guild, branch: branch, crowns: 10 }) // Include branch and set initial crowns
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        showSuccess(`Character '${characterName}' created successfully!`);
        navigate('/character-inventory');
      }
    } catch (error: any) {
      showError(`Error creating character: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Checking for existing character...</p>
      </div>
    );
  }

  if (hasExistingCharacter) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Your Character</CardTitle>
          <CardDescription className="text-center">
            Give your adventure a name!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCharacter} className="space-y-4">
            <div>
              <label htmlFor="characterName" className="sr-only">Character Name</label>
              <Input
                id="characterName"
                type="text"
                placeholder="Enter character name"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                disabled={loading}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="characterRace" className="sr-only">Character Race</label>
              <Select onValueChange={setRace} value={race} disabled={loading}>
                <SelectTrigger id="characterRace" className="w-full">
                  <SelectValue placeholder="Select a race" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="human">Human</SelectItem>
                  <SelectItem value="elf">Elf</SelectItem>
                  <SelectItem value="half elf">Half Elf</SelectItem>
                  <SelectItem value="dwarf">Dwarf</SelectItem>
                  <SelectItem value="halfling">Halfling</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="characterGuild" className="sr-only">Character Guild</label>
              <Select onValueChange={setGuild} value={guild} disabled={loading}>
                <SelectTrigger id="characterGuild" className="w-full">
                  <SelectValue placeholder="Select a guild" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mercenary">Mercenary</SelectItem>
                  <SelectItem value="scout">Scout</SelectItem>
                  <SelectItem value="blacksmith">Blacksmith</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div> {/* New Select for Branch */}
              <label htmlFor="characterBranch" className="sr-only">Branch</label>
              <Select onValueChange={setBranch} value={branch} disabled={loading}>
                <SelectTrigger id="characterBranch" className="w-full">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bath">Bath</SelectItem>
                  <SelectItem value="Black Country">Black Country</SelectItem>
                  <SelectItem value="Bristol">Bristol</SelectItem>
                  <SelectItem value="Cardiff">Cardiff</SelectItem>
                  <SelectItem value="Derby">Derby</SelectItem>
                  <SelectItem value="Edinburgh">Edinburgh</SelectItem>
                  <SelectItem value="Glasgow">Glasgow</SelectItem>
                  <SelectItem value="Guildford">Guildford</SelectItem>
                  <SelectItem value="Hull">Hull</SelectItem>
                  <SelectItem value="Leeds">Leeds</SelectItem>
                  <SelectItem value="Maidenhead">Maidenhead</SelectItem>
                  <SelectItem value="Newcastle">Newcastle</SelectItem>
                  <SelectItem value="Norwich">Norwich</SelectItem>
                  <SelectItem value="Nottingham">Nottingham</SelectItem>
                  <SelectItem value="Peterborough">Peterborough</SelectItem>
                  <SelectItem value="Plymouth">Plymouth</SelectItem>
                  <SelectItem value="Portsmouth">Portsmouth</SelectItem>
                  <SelectItem value="Sheffield">Sheffield</SelectItem>
                  <SelectItem value="St Helens">St Helens</SelectItem>
                  <SelectItem value="Stockport">Stockport</SelectItem>
                  <SelectItem value="Tees Valley">Tees Valley</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Character'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCharacter;