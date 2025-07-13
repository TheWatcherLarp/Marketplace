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
    // Create a Supabase client with the service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role key
    );

    const { name, crowns, pennies, category, quantity } = await req.json();

    if (!name || crowns === undefined || pennies === undefined || !category || quantity === undefined || quantity <= 0) {
      return new Response(JSON.stringify({ error: 'Missing or invalid required parameters (name, crowns, pennies, category, quantity).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const itemsToInsert = [];
    for (let i = 0; i < quantity; i++) {
      itemsToInsert.push({
        name: name,
        crowns: crowns,
        pennies: pennies,
        category: category,
        seller_id: null, // System-stocked item, no specific seller user
        seller_character_id: null, // System-stocked item, no specific seller character
        crafter_user_id: null, // System-stocked item, no specific crafter
      });
    }

    const { error } = await supabaseClient
      .from('marketplace_items')
      .insert(itemsToInsert);

    if (error) {
      console.error('Error inserting items into marketplace:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: `${quantity} ${name}(s) successfully added to marketplace.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in add-shop-item edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});