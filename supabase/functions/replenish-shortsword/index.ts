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
      console.error('Error checking for existing item:', selectError);
      throw selectError;
    }

    if (existingItems && existingItems.length > 0) {
      // Item exists, check quantity
      const existingItem = existingItems[0];
      if (existingItem.quantity === 0) {
        // If quantity is 0, replenish it to 1
        const { error: updateError } = await supabaseClient
          .from('marketplace_items')
          .update({ quantity: 1 })
          .eq('id', existingItem.id);

        if (updateError) {
          console.error('Error replenishing item quantity:', updateError);
          throw updateError;
        }
        console.log(`Replenished quantity for ${itemName}.`);
      } else {
        console.log(`${itemName} already exists and has quantity > 0.`);
      }
    } else {
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
        console.error('Error inserting new item:', insertError);
        throw insertError;
      }
      console.log(`Inserted new ${itemName} into marketplace.`);
    }

    return new Response(JSON.stringify({ message: `${itemName} replenishment check complete.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in replenish-shortsword edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});