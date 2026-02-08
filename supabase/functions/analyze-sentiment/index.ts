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
    const { title, summary } = await req.json();
    
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

    const categories = [
      { id: "politics", keywords: ["siyaset", "hükümet", "meclis", "seçim", "milletvekili", "bakan", "cumhurbaşkanı", "parti", "muhalefet", "yasa", "politika"] },
      { id: "economy", keywords: ["ekonomi", "dolar", "euro", "borsa", "faiz", "enflasyon", "merkez bankası", "ihracat", "ithalat", "ticaret"] },
      { id: "technology", keywords: ["teknoloji", "yazılım", "donanım", "yapay zeka", "bilgisayar", "internet", "uygulama", "mobil", "startup", "inovasyon", "dijital"] },
      { id: "sports", keywords: ["spor", "futbol", "basketbol", "maç", "lig", "şampiyon", "takım", "antrenör", "transfer", "gol", "olimpiyat"] },
      { id: "health", keywords: ["sağlık", "hastalık", "tedavi", "hastane", "doktor", "ilaç", "aşı", "corona", "covid", "salgın", "tıp"] },
      { id: "world", keywords: ["dünya", "uluslararası", "savaş", "barış", "nato", "bm", "avrupa", "amerika", "rusya", "çin", "diplomatik"] },
      { id: "entertainment", keywords: ["eğlence", "sinema", "dizi", "film", "sanatçı", "şarkıcı", "konser", "festival", "oyuncu", "müzik"] },
      { id: "education", keywords: ["eğitim", "okul", "üniversite", "öğrenci", "öğretmen", "sınav", "yks", "lgs", "mezuniyet", "burs"] },
      { id: "science", keywords: ["bilim", "uzay", "nasa", "keşif", "araştırma", "deney", "buluş", "gezegen", "ay", "güneş", "fizik"] },
      { id: "environment", keywords: ["çevre", "iklim", "küresel ısınma", "doğa", "orman", "yangın", "deprem", "sel", "afet", "sürdürülebilir"] },
      { id: "automotive", keywords: ["otomotiv", "araba", "araç", "motor", "elektrikli", "tesla", "bmw", "mercedes", "trafik", "sürücü"] },
      { id: "crypto", keywords: ["kripto", "bitcoin", "ethereum", "blockchain", "coin", "token", "madencilik", "cüzdan", "borsa", "nft"] },
      { id: "finance", keywords: ["finans", "banka", "kredi", "yatırım", "hisse", "fon", "sigorta", "emeklilik", "varlık", "portföy"] },
      { id: "realestate", keywords: ["emlak", "konut", "ev", "daire", "kira", "satılık", "kiralık", "inşaat", "gayrimenkul", "arsa"] },
      { id: "agriculture", keywords: ["tarım", "hayvancılık", "çiftçi", "mahsul", "hasat", "tohum", "gübre", "üretici", "tarla", "sera"] },
      { id: "crime", keywords: ["cinayet", "suç", "tutuklama", "gözaltı", "hırsızlık", "soygun", "polis", "mahkeme", "savcılık", "ceza", "suçlu", "şüpheli", "dava", "soruşturma", "adalet"] },
    ];

    const prompt = `Aşağıdaki haber metnini detaylı analiz et.

Başlık: ${title}
Özet: ${summary}

ÖNEMLİ: Haberin GERÇEK KONUSUNA göre kategori belirle. Örneğin:
- Cinayet, soygun, tutuklama, suç haberleri → "crime"
- Siyasi haberler, seçim, hükümet → "politics"  
- Ekonomi, dolar, borsa → "economy"
- Teknoloji, yazılım, yapay zeka → "technology"
- Futbol, basketbol, maç → "sports"
- Sağlık, hastalık, tedavi → "health"
- Uluslararası ilişkiler, dünya haberleri → "world"
- Sinema, dizi, müzik → "entertainment"
- Okul, üniversite, sınav → "education"
- Bilimsel keşifler, uzay → "science"
- İklim, doğa, afetler → "environment"
- Araba, araç, trafik → "automotive"
- Bitcoin, kripto para → "crypto"
- Banka, yatırım → "finance"
- Ev, konut, kira → "realestate"
- Tarım, hayvancılık → "agriculture"

Mümkün kategoriler: politics, economy, technology, sports, health, world, entertainment, education, science, environment, automotive, crypto, finance, realestate, agriculture, crime

Yanıtını SADECE şu JSON formatında ver, başka hiçbir şey yazma:
{
  "category": "en uygun kategori (yukarıdaki listeden)",
  "sentiment": "positive" | "neutral" | "negative",
  "sentiment_score": 0.0 ile 1.0 arası bir sayı (0 = çok negatif, 0.5 = nötr, 1 = çok pozitif),
  "keywords": ["anahtar", "kelime", "listesi"] (maksimum 5 adet)
}`;

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
            content: "Sen bir haber analiz uzmanısın. Verilen haber metinlerini analiz ederek en uygun kategoriyi, duygu durumunu ve anahtar kelimeleri belirlersin. Kategori belirlerken haberin GERÇEK KONUSUNA bak - başlık ve özetteki anahtar kelimeleri dikkatlice incele. Örneğin 'cinayet', 'tutuklama', 'şüpheli' içeren haberler crime kategorisine girmeli. Yanıtını her zaman geçerli JSON formatında ver."
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
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return default values if parsing fails
      analysisResult = {
        category: "world",
        sentiment: "neutral",
        sentiment_score: 0.5,
        keywords: []
      };
    }

    // Validate and normalize the response
    const validCategories = ["politics", "economy", "technology", "sports", "health", "world", "entertainment", "education", "science", "environment", "automotive", "crypto", "finance", "realestate", "agriculture", "crime"];
    const category = validCategories.includes(analysisResult.category)
      ? analysisResult.category
      : "world";

    const validSentiments = ["positive", "neutral", "negative"];
    const sentiment = validSentiments.includes(analysisResult.sentiment) 
      ? analysisResult.sentiment 
      : "neutral";
    
    const sentimentScore = typeof analysisResult.sentiment_score === "number"
      ? Math.max(0, Math.min(1, analysisResult.sentiment_score))
      : 0.5;
    
    const keywords = Array.isArray(analysisResult.keywords)
      ? analysisResult.keywords.slice(0, 5).filter((k: unknown) => typeof k === "string")
      : [];

    return new Response(
      JSON.stringify({
        category,
        sentiment,
        sentiment_score: sentimentScore,
        keywords
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
