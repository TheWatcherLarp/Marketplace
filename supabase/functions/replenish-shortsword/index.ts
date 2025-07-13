import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Replenish Shortsword function invoked.');

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // No auth header needed for this function as it's for public marketplace replenishment
    );

    const itemName = 'Shortsword';
    const itemCrowns = 4;
    const itemPennies = 6;
    const itemCategory = 'weapons';
    const itemDescription = 'A basic, well-balanced shortsword, ideal for new adventurers.';

    console.log(`Checking for existing '${itemName}' in marketplace...`);
    // Check if the item exists with the specified price and is an NPC item (seller_id IS NULL)
    const { data: existingItems, error: selectError } = await supabaseClient
      .from('marketplace_items')
      .select('id, quantity')
      .eq('name', itemName)
      .eq('crowns', itemCrowns)
      .eq('pennies', itemPennies)
      .eq('category', itemCategory)
      .is('seller_id', null);

    if (selectError) {
      console.error('Error checking for existing item:', selectError.message);
      throw selectError;
    }

    if (existingItems && existingItems.length > 0) {
      const existingItem = existingItems[0];
      console.log(`Found existing '${itemName}' with ID: ${existingItem.id}, Quantity: ${existingItem.quantity}`);
      if (existingItem.quantity === 0) {
        console.log(`Quantity is 0, replenishing '${itemName}' to 1.`);
        // If quantity is 0, replenish it to 1
        const { error: updateError } = await supabaseClient
          .from('marketplace_items')
          .update({ quantity: 1 })
          .eq('id', existingItem.id);

        if (updateError) {
          console.error('Error replenishing item quantity:', updateError.message);
          throw updateError;
        }
        console.log(`Successfully replenished quantity for '${itemName}'.`);
      } else {
        console.log(`'${itemName}' already exists and has quantity > 0. No replenishment needed.`);
      }
    } else {
      console.log(`'${itemName}' not found as an NPC item. Inserting new item.`);
      // Item does not exist, insert it
      const { error: insertError } = await supabaseClient
        .from('marketplace_items')
        .insert({
          name: itemName,
          description: itemDescription,
          crowns: itemCrowns,
          pennies: itemPennies,
          seller_id: null, // Signifies NPC item
          category: itemCategory,
          quantity: 1,
        });

      if (insertError) {
        console.error('Error inserting new item:', insertError.message);
        throw insertError;
      }
      console.log(`Successfully inserted new '${itemName}' into marketplace.`);
    }

    return new Response(JSON.stringify({ message: `${itemName} replenishment check complete.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in replenish-shortsword edge function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});