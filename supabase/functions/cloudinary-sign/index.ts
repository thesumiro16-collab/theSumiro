import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Restrict CORS to known origins.
const ALLOWED_ORIGINS = [
  'https://thesumiro.com',
  'https://www.thesumiro.com',
  'https://admin.thesumiro.com',
  'https://thesumiro.vercel.app',
  // Local development
  'http://localhost:5173',
  'http://localhost:4173',
  'http://admin.localhost:5173',
  'http://admin.localhost:4173',
];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
}

/**
 * Verifies the caller is a genuine authenticated, non-anonymous user.
 * Rejects the anon role — the public anon key would otherwise pass gateway verify_jwt.
 */
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
  if (error || !user) return null;

  if (user.role === 'anon' || user.aud === 'anon') return null;
  if (user.is_anonymous) return null;

  return user;
}

/**
 * Generates a Cloudinary signed-upload signature.
 * Signs: folder + timestamp (sorted alphabetically) + API secret — SHA-1.
 * Returns { signature, timestamp, api_key, cloud_name, folder } to the client.
 *
 * Cloudinary defaults to SHA-1 for signature verification. Do NOT switch to
 * SHA-256 here unless you have explicitly enabled SHA-256 in your Cloudinary
 * account settings (Settings → Security → SHA algorithm).
 */
async function buildUploadSignature(params: Record<string, string>, apiSecret: string) {
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + apiSecret;
  const msgBuffer = new TextEncoder().encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  // ── CORS preflight ──────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers });
  }

  // ── Auth gate — every method requires a real signed-in user ────────────
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const cloudName  = Deno.env.get('CLOUDINARY_CLOUD_NAME');
  const apiKey     = Deno.env.get('CLOUDINARY_API_KEY');
  const apiSecret  = Deno.env.get('CLOUDINARY_API_SECRET');
  const folder     = Deno.env.get('CLOUDINARY_FOLDER') || 'sumiro';

  if (!cloudName || !apiKey || !apiSecret) {
    return new Response(JSON.stringify({ error: 'Server configuration missing Cloudinary keys' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  // ── POST — sign a delete (destroy) request ─────────────────────────────
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { public_id } = body;
      if (!public_id) {
        return new Response(JSON.stringify({ error: 'Missing public_id' }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }

      const timestamp = Math.floor(Date.now() / 1000).toString();

      // Destroy signature uses SHA-1 (Cloudinary's legacy requirement for destroy)
      const stringToSign = `public_id=${public_id}&timestamp=${timestamp}${apiSecret}`;
      const msgBuffer    = new TextEncoder().encode(stringToSign);
      const hashBuffer   = await crypto.subtle.digest('SHA-1', msgBuffer);
      const signature    = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const formData = new FormData();
      formData.append('public_id', public_id);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);

      const destroyRes  = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        { method: 'POST', body: formData }
      );

      const destroyData = await destroyRes.json();
      return new Response(JSON.stringify(destroyData), {
        status: destroyRes.status,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
  }

  // ── GET — generate a signed upload token for the client ───────────────
  // Client uses this to upload directly to Cloudinary using a signed request.
  // The API secret never leaves this function.
  // Sign timestamp + folder so uploads land in the configured folder.
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const paramsToSign: Record<string, string> = { folder, timestamp };
  const signature = await buildUploadSignature(paramsToSign, apiSecret);

  return new Response(
    JSON.stringify({
      signature,
      timestamp,
      api_key: apiKey,
      cloud_name: cloudName,
      folder,           // still sent to client so uploads land in the right folder
    }),
    { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
  );
});
