import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { limit = 50 } = await req.json().catch(() => ({}));

    console.log(`Starting recategorization for ${limit} news items...`);

    // Fetch news to recategorize
    const { data: newsItems, error: fetchError } = await supabase
      .from("news")
      .select("id, title, summary, category")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch news: ${fetchError.message}`);
    }

    if (!newsItems || newsItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No news to recategorize", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${newsItems.length} news items to process`);

    const results: { id: string; oldCategory: string; newCategory: string; updated: boolean }[] = [];
    let processedCount = 0;
    let updatedCount = 0;

    for (const news of newsItems) {
      try {
        // Call analyze-sentiment function
        const analyzeResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-sentiment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            title: news.title,
            summary: news.summary,
          }),
        });

        if (!analyzeResponse.ok) {
          console.error(`Failed to analyze news ${news.id}: ${analyzeResponse.status}`);
          continue;
        }

        const analysis = await analyzeResponse.json();
        const newCategory = analysis.category;

        if (newCategory && newCategory !== news.category) {
          // Update the news category
          const { error: updateError } = await supabase
            .from("news")
            .update({
              category: newCategory,
              sentiment: analysis.sentiment,
              sentiment_score: analysis.sentiment_score,
              keywords: analysis.keywords,
            })
            .eq("id", news.id);

          if (updateError) {
            console.error(`Failed to update news ${news.id}: ${updateError.message}`);
          } else {
            console.log(`Updated news ${news.id}: ${news.category} -> ${newCategory}`);
            updatedCount++;
            results.push({
              id: news.id,
              oldCategory: news.category,
              newCategory,
              updated: true,
            });
          }
        } else {
          results.push({
            id: news.id,
            oldCategory: news.category,
            newCategory: newCategory || news.category,
            updated: false,
          });
        }

        processedCount++;

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing news ${news.id}:`, error);
      }
    }

    console.log(`Completed: processed ${processedCount}, updated ${updatedCount}`);

    return new Response(
      JSON.stringify({
        message: `Recategorization complete`,
        processed: processedCount,
        updated: updatedCount,
        results: results.filter((r) => r.updated),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Recategorization error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
