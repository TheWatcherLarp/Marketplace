import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { Link } from 'react-router-dom';

const races = ['human', 'elf', 'half elf', 'dwarf', 'halfling'];
const guilds = ['mercenary', 'scout'];
const branches = ['Portsmouth', 'Guildford'];

const generateRandomName = () => {
  const prefixes = ['Ael', 'Bor', 'Cael', 'Dra', 'Elara', 'Fen', 'Gareth', 'Hael', 'Isolde', 'Jor'];
  const suffixes = ['dan', 'ian', 'wyn', 'dor', 'iel', 'ric', 'mond', 'lyn', 'us', 'a'];
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return randomPrefix + randomSuffix;
};

const GenerateCharacters = () => {
  const { session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleGenerateCharacters = async () => {
    if (!session?.user?.id) {
      showError('You must be logged in to generate characters.');
      return;
    }

    setLoading(true);
    const charactersToInsert = [];

    for (let i = 0; i < 10; i++) {
      const randomRace = races[Math.floor(Math.random() * races.length)];
      const randomGuild = guilds[Math.floor(Math.random() * guilds.length)];
      const randomBranch = branches[Math.floor(Math.random() * branches.length)];
      const randomCrowns = Math.floor(Math.random() * 50) + 10; // 10-59 crowns
      const randomPennies = Math.floor(Math.random() * 12); // 0-11 pennies

      charactersToInsert.push({
        user_id: session.user.id,
        name: generateRandomName(),
        race: randomRace,
        guild: randomGuild,
        branch: randomBranch,
        crowns: randomCrowns,
        pennies: randomPennies,
      });
    }

    try {
      const { error } = await supabase
        .from('characters')
        .insert(charactersToInsert);

      if (error) {
        throw error;
      }

      showSuccess('10 random characters generated and added successfully!');
    } catch (error: any) {
      showError(`Error generating characters: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Generate Random Characters</CardTitle>
          <CardDescription>
            Click the button below to add 10 new random characters to your account.
            These characters will be associated with your current user ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerateCharacters} disabled={loading} className="w-full">
            {loading ? 'Generating...' : 'Generate 10 Characters'}
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/home">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateCharacters;