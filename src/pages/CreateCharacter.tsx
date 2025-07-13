import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';

const CreateCharacter = () => {
  const [characterName, setCharacterName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useSession();

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

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('characters')
        .insert({ user_id: session.user.id, name: characterName.trim() })
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