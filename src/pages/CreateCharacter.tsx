import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { showError, showSuccess } from '@/utils/toast';

const CreateCharacter = () => {
  const [characterName, setCharacterName] = useState('');
  const [race, setRace] = useState('');
  const [guild, setGuild] = useState('');
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session, refreshCharacter, activeCharacter, loadingSession } = useSession();

  useEffect(() => {
    if (!loadingSession && activeCharacter) {
      navigate('/home');
    }
  }, [loadingSession, activeCharacter, navigate]);

  // Reset guild if the selected race makes the current guild invalid
  useEffect(() => {
    if (race && guild && isGuildDisabledForRace(race, guild)) {
      setGuild('');
    }
  }, [race, guild]);

  const isGuildDisabledForRace = (selectedRace: string, guildValue: string) => {
    switch (selectedRace) {
      case 'dwarf':
        return [
          'guard', 'forester', 'thaumaturgy', 'demonologist', 'enchanter', 'necromancer',
          'griffin knight', 'black knight', 'grey knight'
        ].includes(guildValue);
      case 'elf':
        return [
          'guard', 'forester', 'alchemist', 'demonologist', 'necromancer',
          'griffin knight', 'black knight', 'grey knight'
        ].includes(guildValue);
      case 'half elf':
        return [
          'guard', 'forester', 'alchemist', 'thaumaturgy', 'demonologist', 'enchanter', 'necromancer',
          'griffin knight', 'black knight'
        ].includes(guildValue);
      case 'halfling': // New halfling restrictions
        return [
          'guard', 'forester', 'thaumaturgy', 'demonologist', 'enchanter', 'necromancer',
          'griffin knight', 'black knight', 'grey knight'
        ].includes(guildValue);
      case 'human':
      default:
        return false; // Humans can be any guild, and default case for other races
    }
  };

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      showError('User not logged in.');
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
    if (!branch) {
      showError('Please select a branch.');
      return;
    }
    if (isGuildDisabledForRace(race, guild)) {
      showError(`The selected guild is not available for the ${race} race.`);
      return;
    }

    setLoading(true);

    const fixedGuildRank = 'apprentice'; // All new characters start as apprentice
    const calculatedSocialRank = 2; // All apprentices start with social rank 2

    try {
      const { data: newCharacter, error } = await supabase
        .from('characters')
        .insert({
          user_id: session.user.id,
          name: characterName.trim(),
          race: race,
          guild: guild,
          branch: branch,
          crowns: 10,
          guild_rank: fixedGuildRank, // Always set to 'apprentice'
          pennies: 0,
          social_rank: calculatedSocialRank, // Always set to 2
        })
        .select('id');

      if (error) {
        throw error;
      }

      if (newCharacter && newCharacter.length > 0) {
        const characterId = newCharacter[0].id;
        const permitsToInsert: { character_id: string; permit_type: string }[] = [];

        if (['scout', 'mercenary', 'black knight', 'sentinel', 'griffin knight', 'grey knight'].includes(guild)) {
          permitsToInsert.push({ character_id: characterId, permit_type: 'weapon' });
          permitsToInsert.push({ character_id: characterId, permit_type: 'armour' });
        } else if (guild === 'blacksmith') {
          permitsToInsert.push({ character_id: characterId, permit_type: 'blacksmith' });
        } else if (guild === 'alchemist') {
          permitsToInsert.push({ character_id: characterId, permit_type: 'alchemist' });
        } else if (['thaumaturgy', 'demonologist', 'enchanter', 'necromancer'].includes(guild)) {
          // No specific permit for mage yet, but can be added here if needed
        } else if (['sidhe', 'crowa', 'kharack', 'longstor', 'vleybor', 'rholbor', 'tralda', 'crowan rose'].includes(guild)) {
          // No specific permits for church/religious guilds by default, add if needed
        } else if (['guard', 'forester'].includes(guild)) {
          // No specific permits for Lawman guilds by default, add if needed
        }

        if (permitsToInsert.length > 0) {
          const { error: permitError } = await supabase
            .from('character_permits')
            .insert(permitsToInsert);

          if (permitError) {
            console.error('Error inserting permits:', permitError);
            showError(`Character created, but failed to assign permits: ${permitError.message}`);
          }
        }

        showSuccess(`Character '${characterName}' created successfully as an Apprentice!`);
        await refreshCharacter();
      }
    } catch (error: any) {
      showError(`Error creating character: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingSession || activeCharacter) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Your Character</CardTitle>
          <CardDescription className="text-center">
            Give your adventure a name and choose your starting path! All new characters start as Apprentices.
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
                  <SelectItem value="halfling">Halfling</SelectItem> {/* Added Halfling */}
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
                  <SelectGroup>
                    <SelectLabel>Martial Guilds</SelectLabel>
                    <SelectItem value="mercenary" disabled={isGuildDisabledForRace(race, 'mercenary')}>Mercenary</SelectItem>
                    <SelectItem value="scout" disabled={isGuildDisabledForRace(race, 'scout')}>Scout</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Knights</SelectLabel>
                    <SelectItem value="black knight" disabled={isGuildDisabledForRace(race, 'black knight')}>Black Knight</SelectItem>
                    <SelectItem value="sentinel" disabled={isGuildDisabledForRace(race, 'sentinel')}>Sentinel</SelectItem>
                    <SelectItem value="griffin knight" disabled={isGuildDisabledForRace(race, 'griffin knight')}>Griffin Knight</SelectItem>
                    <SelectItem value="grey knight" disabled={isGuildDisabledForRace(race, 'grey knight')}>Grey Knight</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Crafting Guilds</SelectLabel>
                    <SelectItem value="alchemist" disabled={isGuildDisabledForRace(race, 'alchemist')}>Alchemist</SelectItem>
                    <SelectItem value="blacksmith" disabled={isGuildDisabledForRace(race, 'blacksmith')}>Blacksmith</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Mage Guilds</SelectLabel>
                    <SelectItem value="thaumaturgy" disabled={isGuildDisabledForRace(race, 'thaumaturgy')}>Thaumaturgy</SelectItem>
                    <SelectItem value="demonologist" disabled={isGuildDisabledForRace(race, 'demonologist')}>Demonologist</SelectItem>
                    <SelectItem value="enchanter" disabled={isGuildDisabledForRace(race, 'enchanter')}>Enchanter</SelectItem>
                    <SelectItem value="necromancer" disabled={isGuildDisabledForRace(race, 'necromancer')}>Necromancer</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Church Guilds</SelectLabel>
                    <SelectItem value="sidhe" disabled={isGuildDisabledForRace(race, 'sidhe')}>Sidhe</SelectItem>
                    <SelectItem value="crowa" disabled={isGuildDisabledForRace(race, 'crowa')}>Crowa</SelectItem>
                    <SelectItem value="kharack" disabled={isGuildDisabledForRace(race, 'kharack')}>Kharack</SelectItem>
                    <SelectItem value="longstor" disabled={isGuildDisabledForRace(race, 'longstor')}>Longstor</SelectItem>
                    <SelectItem value="vleybor" disabled={isGuildDisabledForRace(race, 'vleybor')}>Vleybor</SelectItem>
                    <SelectItem value="rholbor" disabled={isGuildDisabledForRace(race, 'rholbor')}>Rholbor</SelectItem>
                    <SelectItem value="tralda" disabled={isGuildDisabledForRace(race, 'tralda')}>Tralda</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Religious Order</SelectLabel>
                    <SelectItem value="crowan rose" disabled={isGuildDisabledForRace(race, 'crowan rose')}>Crowan Rose</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Lawman</SelectLabel>
                    <SelectItem value="guard" disabled={isGuildDisabledForRace(race, 'guard')}>Guard</SelectItem>
                    <SelectItem value="forester" disabled={isGuildDisabledForRace(race, 'forester')}>Forester</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
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