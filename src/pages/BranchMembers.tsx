import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showError } from '@/utils/toast';
import Header from '@/components/Header'; // Import the new Header component

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
  guild_rank: string; // Added guild_rank
  social_rank: number; // Added social_rank
}

const BranchMembers = () => {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [branchMembers, setBranchMembers] = useState<Character[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [currentCharacterName, setCurrentCharacterName] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranchMembers = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        // First, get the current user's active character to determine their branch
        const { data: userCharacter, error: userCharError } = await supabase
          .from('characters')
          .select('name, branch')
          .eq('user_id', session.user.id)
          .is('retired_at', null)
          .single();

        if (userCharError && userCharError.code !== 'PGRST116') {
          throw userCharError;
        }

        if (!userCharacter || !userCharacter.branch) {
          setCurrentBranch(null);
          setCurrentCharacterName(null);
          setLoading(false);
          return;
        }

        setCurrentBranch(userCharacter.branch);
        setCurrentCharacterName(userCharacter.name);

        // Now, fetch all active characters in the same branch, excluding the current user's character
        const { data: membersData, error: membersError } = await supabase
          .from('characters')
          .select('*')
          .eq('branch', userCharacter.branch)
          .is('retired_at', null)
          .neq('user_id', session.user.id) // Exclude the current user's character
          .order('name', { ascending: true });

        if (membersError) {
          throw membersError;
        }

        setBranchMembers(membersData || []);
      } catch (error: any) {
        showError(`Error fetching branch members: ${error.message}`);
        setBranchMembers([]);
        setCurrentBranch(null);
        setCurrentCharacterName(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBranchMembers();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading branch members...</p>
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
              You need to be logged in to view branch members.
            </p>
            <Button asChild>
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentBranch) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 text-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">No Active Character Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need an active character to view branch members. Please create one.
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-20 p-4"> {/* Added pt-20 for header spacing */}
      <Header /> {/* Add the Header component */}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {currentBranch} Branch Members
          </h1>
        </div>

        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          Hello {currentCharacterName}! Here are the other active members of your branch:
        </p>

        {branchMembers.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">No other active members found in your branch.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branchMembers.map((member) => (
              <Card key={member.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{member.name}</CardTitle>
                  <CardDescription>
                    {member.race.charAt(0).toUpperCase() + member.race.slice(1)} - {member.guild.charAt(0).toUpperCase() + member.guild.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-gray-700 dark:text-gray-300">Rank: {member.guild_rank.charAt(0).toUpperCase() + member.guild_rank.slice(1)}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Social Rank: {member.social_rank}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Crowns: {member.crowns}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Pennies: {member.pennies}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Joined: {new Date(member.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchMembers;