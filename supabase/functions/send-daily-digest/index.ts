import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  sentiment: string;
  published_at: string;
  url: string | null;
}

const categoryLabels: Record<string, string> = {
  politics: 'Siyaset',
  economy: 'Ekonomi',
  technology: 'Teknoloji',
  sports: 'Spor',
  health: 'Sağlık',
  world: 'Dünya',
  entertainment: 'Eğlence',
  education: 'Eğitim',
  science: 'Bilim',
  environment: 'Çevre',
  automotive: 'Otomotiv',
  crypto: 'Kripto',
  finance: 'Finans',
  realestate: 'Emlak',
  agriculture: 'Tarım',
};

const sentimentEmojis: Record<string, string> = {
  positive: '😊',
  neutral: '😐',
  negative: '😔',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get users who want daily digest
    const { data: emailPrefs, error: prefsError } = await supabase
      .from('email_preferences')
      .select('user_id')
      .eq('daily_digest', true);

    if (prefsError) throw prefsError;

    if (!emailPrefs || emailPrefs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users subscribed to daily digest" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get today's top news
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: news, error: newsError } = await supabase
      .from('news')
      .select('id, title, summary, source, category, sentiment, published_at, url')
      .gte('published_at', yesterday.toISOString())
      .order('published_at', { ascending: false })
      .limit(10);

    if (newsError) throw newsError;

    if (!news || news.length === 0) {
      return new Response(
        JSON.stringify({ message: "No news to send" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user emails
    const userIds = emailPrefs.map(p => p.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email')
      .in('user_id', userIds);

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No user emails found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate email HTML
    const newsHtml = (news as NewsItem[]).map(item => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <span style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
            ${categoryLabels[item.category] || item.category}
          </span>
          <span style="font-size: 14px;">
            ${sentimentEmojis[item.sentiment] || '😐'}
          </span>
        </div>
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">
          ${item.title}
        </h3>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
          ${item.summary.substring(0, 150)}...
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; color: #9ca3af;">
            ${item.source}
          </span>
          ${item.url ? `<a href="${item.url}" style="font-size: 12px; color: #3b82f6;">Devamını Oku →</a>` : ''}
        </div>
      </div>
    `).join('');

    const emailTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 24px;">📰 Günlük Haber Özeti</h1>
            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
              ${new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #374151;">
              Son 24 Saatin Öne Çıkan Haberleri
            </h2>
            ${newsHtml}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="font-size: 12px; color: #9ca3af;">
                Bu e-postayı almak istemiyorsanız, profil ayarlarınızdan bildirim tercihlerinizi güncelleyebilirsiniz.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails to all subscribed users
    const emailPromises = profiles.map(async (profile) => {
      if (!profile.email) return null;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "HaberAnalizör <onboarding@resend.dev>",
            to: [profile.email],
            subject: `📰 Günlük Haber Özeti - ${new Date().toLocaleDateString('tr-TR')}`,
            html: emailTemplate,
          }),
        });

        const result = await res.json();

        // Update last_digest_sent_at
        await supabase
          .from('email_preferences')
          .update({ last_digest_sent_at: new Date().toISOString() })
          .eq('user_id', profile.user_id);

        return { email: profile.email, success: res.ok, id: result.id };
      } catch (error: any) {
        console.error(`Failed to send to ${profile.email}:`, error);
        return { email: profile.email, success: false, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r?.success).length;

    return new Response(
      JSON.stringify({ 
        message: `Sent ${successful} digest emails`,
        results: results.filter(Boolean)
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending daily digest:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
