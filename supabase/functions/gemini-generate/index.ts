import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://thesumiro.com',
  'https://www.thesumiro.com',
  'https://admin.thesumiro.com',
  'https://thesumiro.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://admin.localhost:5173',
  'http://admin.localhost:4173',
  'http://127.0.0.1:5173',
];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user || user.is_anonymous) return null;
  return user;
}

function buildPrompt(garmentType: string, style: string): string {
  const garments: Record<string, string> = {
    kurta:       'a full-length traditional Indian kurta (long tunic reaching knees)',
    koti:        'a Nehru jacket koti (short sleeveless waistcoat over a kurta)',
    kurta_koti:  'a traditional Indian kurta with a matching Nehru jacket koti waistcoat',
    sherwani:    'a formal Indian sherwani (long formal coat for weddings)',
    bandhgala:   'a tailored Indian bandhgala suit jacket',
  };
  const styles: Record<string, string> = {
    formal:  'formal standing pose, confident expression, hands by sides',
    wedding: 'elegant wedding pose, three-quarter angle, sophisticated',
    casual:  'relaxed casual pose, slight smile, approachable',
  };
  const g = garments[garmentType] || garments.kurta;
  const s = styles[style]         || styles.formal;

  return `High quality professional fashion photograph of a handsome Indian male model, age 30, wearing ${g} made from the fabric shown in the reference image. The garment uses the exact same fabric pattern, colors and texture as the reference. ${s}. Clean white studio background, professional studio lighting, full body shot, sharp focus, 8K fashion photography.`;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers });
  }

  // Auth check
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
  if (!replicateToken) {
    return new Response(JSON.stringify({ error: 'REPLICATE_API_TOKEN not configured' }), {
      status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { imageBase64, mimeType, garmentType, style } = await req.json();
    if (!imageBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: 'Missing imageBase64 or mimeType' }), {
        status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const prompt = buildPrompt(garmentType || 'kurta', style || 'formal');
    const imageDataUri = `data:${mimeType};base64,${imageBase64}`;

    // ── Step 1: Create prediction on Replicate ─────────────────────────
    const createRes = await fetch(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${replicateToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait=60', // wait up to 60s synchronously
        },
        body: JSON.stringify({
          input: {
            prompt,
            image: imageDataUri,
            strength: 0.82,
            num_outputs: 1,
            aspect_ratio: '2:3',
            output_format: 'png',
            guidance_scale: 3.5,
            num_inference_steps: 28,
          },
        }),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      return new Response(JSON.stringify({ error: `Replicate error: ${errText}` }), {
        status: createRes.status, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    let pred = await createRes.json();

    // ── Step 2: Poll until completed (if Prefer:wait didn't finish it) ──
    if (pred.status !== 'succeeded' && pred.status !== 'failed') {
      const predId = pred.id;
      let attempts = 0;
      while (attempts < 20 && pred.status !== 'succeeded' && pred.status !== 'failed') {
        await new Promise(r => setTimeout(r, 4000));
        const pollRes = await fetch(
          `https://api.replicate.com/v1/predictions/${predId}`,
          { headers: { 'Authorization': `Bearer ${replicateToken}` } }
        );
        pred = await pollRes.json();
        attempts++;
      }
    }

    if (pred.status === 'failed') {
      return new Response(JSON.stringify({ error: `Generation failed: ${pred.error}` }), {
        status: 422, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (pred.status !== 'succeeded' || !pred.output) {
      return new Response(JSON.stringify({ error: 'Generation timed out. Try again.' }), {
        status: 504, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const imageUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200, headers: { ...headers, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
