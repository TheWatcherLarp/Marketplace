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
  const [branch, setBranch] = useState('');
  const [guildRank, setGuildRank] = useState(''); // Reintroduced state for guild rank
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session, refreshCharacter, activeCharacter, loadingSession } = useSession();

  useEffect(() => {
    if (!loadingSession && activeCharacter) {
      navigate('/home');
    }
  }, [loadingSession, activeCharacter, navigate]);

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
    if (!guildRank) { // Validate guild rank selection
      showError('Please select a guild rank.');
      return;
    }

    setLoading(true);

    let calculatedSocialRank = 1; // Default social rank

    if (guild === 'scout' || guild === 'mercenary') {
      if (guildRank === 'apprentice') {
        calculatedSocialRank = 2;
      }
      // Other ranks for scout/mercenary would default to 1 unless specified
    } else if (guild === 'blacksmith') {
      switch (guildRank) {
        case 'apprentice':
          calculatedSocialRank = 2;
          break;
        case 'journeyman':
          calculatedSocialRank = 3;
          break;
        case 'junior guildsman':
          calculatedSocialRank = 4;
          break;
        case 'guildsman':
          calculatedSocialRank = 5;
          break;
        case 'high guildsman':
          calculatedSocialRank = 6;
          break;
        case 'guild senior':
          calculatedSocialRank = 7;
          break;
        case 'master':
          calculatedSocialRank = 8;
          break;
        default:
          calculatedSocialRank = 1; // Fallback for blacksmith if rank not matched
      }
    }

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
          guild_rank: guildRank, // Use the selected guildRank
          pennies: 0,
          social_rank: calculatedSocialRank, // Use the calculated social_rank
        })
        .select('id');

      if (error) {
        throw error;
      }

      if (newCharacter && newCharacter.length > 0) {
        const characterId = newCharacter[0].id;
        const permitsToInsert: { character_id: string; permit_type: string }[] = [];

        if (guild === 'scout' || guild === 'mercenary') {
          permitsToInsert.push({ character_id: characterId, permit_type: 'weapon' });
          permitsToInsert.push({ character_id: characterId, permit_type: 'armour' });
        } else if (guild === 'blacksmith') {
          permitsToInsert.push({ character_id: characterId, permit_type: 'blacksmith' });
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

        showSuccess(`Character '${characterName}' created successfully as a ${guildRank.charAt(0).toUpperCase() + guildRank.slice(1)}!`);
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
            Give your adventure a name and choose your starting path!
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
            {/* Reintroduced Guild Rank Select */}
            <div>
              <label htmlFor="guildRank" className="sr-only">Guild Rank</label>
              <Select onValueChange={setGuildRank} value={guildRank} disabled={loading}>
                <SelectTrigger id="guildRank" className="w-full">
                  <SelectValue placeholder="Select Guild Rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apprentice">Apprentice</SelectItem>
                  <SelectItem value="journeyman">Journeyman</SelectItem>
                  <SelectItem value="junior guildsman">Junior Guildsman</SelectItem>
                  <SelectItem value="guildsman">Guildsman</SelectItem>
                  <SelectItem value="high guildsman">High Guildsman</SelectItem>
                  <SelectItem value="guild senior">Guild Senior</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
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