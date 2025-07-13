import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showError, showSuccess } from '@/utils/toast';

const GenerateMarketplaceItems = () => {
  const { session } = useSession();
  const [numItems, setNumItems] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleGenerateItems = async () => {
    if (!session?.user?.id) {
      showError('You must be logged in to generate items.');
      return;
    }
    if (numItems <= 0) {
      showError('Please enter a positive number of items to generate.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-items', {
        body: JSON.stringify({ count: numItems }),
      });

      if (error) {
        throw error;
      }

      showSuccess(data.message || `Successfully generated ${numItems} items!`);
    } catch (error: any) {
      showError(`Failed to generate items: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 text-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need to be logged in to generate marketplace items.
            </p>
            <Button asChild>
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Generate Marketplace Items</CardTitle>
          <CardDescription>
            Add some random medieval items to the marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <label htmlFor="numItems" className="text-lg">Number of items:</label>
            <Input
              id="numItems"
              type="number"
              value={numItems}
              onChange={(e) => setNumItems(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="w-24 text-center"
              disabled={loading}
            />
          </div>
          <Button onClick={handleGenerateItems} disabled={loading} className="w-full">
            {loading ? 'Generating...' : 'Generate Items'}
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/home">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateMarketplaceItems;