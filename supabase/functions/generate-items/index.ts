import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ItemTemplate {
  name: string;
  description: string;
  minCrowns: number;
  maxCrowns: number;
  minPennies: number;
  maxPennies: number;
}

const itemTemplates: ItemTemplate[] = [
  { name: "Iron Sword", description: "A sturdy sword, good for beginners.", minCrowns: 5, maxCrowns: 15, minPennies: 0, maxPennies: 11 },
  { name: "Leather Armor", description: "Light and flexible protection.", minCrowns: 8, maxCrowns: 20, minPennies: 0, maxPennies: 11 },
  { name: "Healing Potion", description: "Restores a small amount of health.", minCrowns: 1, maxCrowns: 3, minPennies: 0, maxPennies: 11 },
  { name: "Wooden Shield", description: "A basic shield for defense.", minCrowns: 3, maxCrowns: 10, minPennies: 0, maxPennies: 11 },
  { name: "Magic Scroll", description: "Contains a minor spell.", minCrowns: 10, maxCrowns: 30, minPennies: 0, maxPennies: 11 },
  { name: "Gold Ring", description: "A simple, elegant ring.", minCrowns: 15, maxCrowns: 40, minPennies: 0, maxPennies: 11 },
  { name: "Traveler's Cloak", description: "Keeps you warm on long journeys.", minCrowns: 4, maxCrowns: 12, minPennies: 0, maxPennies: 11 },
  { name: "Enchanted Dagger", description: "A sharp blade with a faint glow.", minCrowns: 20, maxCrowns: 50, minPennies: 0, maxPennies: 11 },
  { name: "Mysterious Orb", description: "Pulsates with an unknown energy.", minCrowns: 30, maxCrowns: 70, minPennies: 0, maxPennies: 11 },
  { name: "Dragon Scale", description: "A rare and valuable material.", minCrowns: 50, maxCrowns: 100, minPennies: 0, maxPennies: 11 },
  { name: "Elven Bow", description: "A finely crafted bow, light and accurate.", minCrowns: 25, maxCrowns: 60, minPennies: 0, maxPennies: 11 },
  { name: "Dwarven Axe", description: "Heavy and powerful, ideal for close combat.", minCrowns: 18, maxCrowns: 45, minPennies: 0, maxPennies: 11 },
  { name: "Goblin Ear", description: "A gruesome trophy, surprisingly valuable.", minCrowns: 2, maxCrowns: 8, minPennies: 0, maxPennies: 11 },
  { name: "Phoenix Feather", description: "Said to bring good fortune and rebirth.", minCrowns: 75, maxCrowns: 150, minPennies: 0, maxPennies: 11 },
  { name: "Map to Lost Treasure", description: "A tattered map hinting at forgotten riches.", minCrowns: 40, maxCrowns: 90, minPennies: 0, maxPennies: 11 },
];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const sellerId = user.id;
    const { count = 5 } = await req.json(); // Default to generating 5 items

    const itemsToInsert = [];
    for (let i = 0; i < count; i++) {
      const template = itemTemplates[getRandomInt(0, itemTemplates.length - 1)];
      const crowns = getRandomInt(template.minCrowns, template.maxCrowns);
      const pennies = getRandomInt(template.minPennies, template.maxPennies);

      itemsToInsert.push({
        name: template.name,
        description: template.description,
        crowns: crowns,
        pennies: pennies,
        seller_id: sellerId,
      });
    }

    const { error } = await supabaseClient
      .from('marketplace_items')
      .insert(itemsToInsert);

    if (error) {
      console.error('Error inserting marketplace items:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: `${count} random items added to marketplace.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in generate-items edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});