import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, summary, keywords } = await req.json();
    
    if (!title || !summary) {
      return new Response(
        JSON.stringify({ error: "Title and summary are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Aşağıdaki haber metnini analiz et ve akıllı etiketler öner.

Başlık: ${title}
Özet: ${summary}
Mevcut Anahtar Kelimeler: ${keywords?.join(", ") || "Yok"}

Haberin içeriğine göre kullanıcının haberi kategorize etmesine yardımcı olacak etiketler öner.
Etiketler kısa, öz ve anlamlı olmalı.

Yanıtını SADECE şu JSON formatında ver, başka hiçbir şey yazma:
{
  "suggested_tags": [
    { "name": "etiket adı", "color": "#hex renk kodu", "reason": "neden bu etiket önerildi (kısa açıklama)" }
  ],
  "topic_summary": "haberin ana konusu (tek cümle)",
  "related_topics": ["ilgili konu 1", "ilgili konu 2"]
}

Önerilen renkler: #ef4444 (kırmızı), #f97316 (turuncu), #eab308 (sarı), #22c55e (yeşil), #3b82f6 (mavi), #8b5cf6 (mor), #ec4899 (pembe), #06b6d4 (cyan)
Maksimum 5 etiket öner.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Sen bir haber analiz ve etiketleme uzmanısın. Haberleri analiz ederek kullanıcıların haberleri düzenlemesine yardımcı olacak akıllı etiketler önerirsin. Yanıtını her zaman geçerli JSON formatında ver."
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response from AI
    let analysisResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      analysisResult = {
        suggested_tags: [],
        topic_summary: "",
        related_topics: []
      };
    }

    // Validate response
    const suggestedTags = Array.isArray(analysisResult.suggested_tags)
      ? analysisResult.suggested_tags.slice(0, 5).map((tag: any) => ({
          name: typeof tag.name === "string" ? tag.name : "",
          color: typeof tag.color === "string" && tag.color.startsWith("#") ? tag.color : "#3b82f6",
          reason: typeof tag.reason === "string" ? tag.reason : ""
        }))
      : [];

    return new Response(
      JSON.stringify({
        suggested_tags: suggestedTags,
        topic_summary: typeof analysisResult.topic_summary === "string" ? analysisResult.topic_summary : "",
        related_topics: Array.isArray(analysisResult.related_topics) ? analysisResult.related_topics : []
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Auto-tag error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
