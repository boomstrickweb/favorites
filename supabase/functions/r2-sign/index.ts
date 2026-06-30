// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.621.0"
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.621.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  console.log(`[r2-sign] Received request: ${req.method}`)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Use provided credentials as defaults if environment variables are not set
  const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')
  const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')
  const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT')
  const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME')
  const R2_PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL')

  try {
    let body;
    try {
      const text = await req.text();
      console.log(`[r2-sign] Raw request body: ${text}`);
      if (!text) {
        throw new Error('Empty request body');
      }
      
      let parsed;
      try {
        parsed = JSON.parse(text);
        // If parsed is a string, it means the body was double-encoded
        if (typeof parsed === 'string') {
            console.log(`[r2-sign] Body was double-encoded, parsing again...`);
            parsed = JSON.parse(parsed);
        }
      } catch (e) {
        console.error('[r2-sign] JSON parse error:', e.message);
        throw new Error(`Invalid JSON format: ${e.message}`);
      }
      
      body = parsed;
    } catch (e) {
      console.error('[r2-sign] Error parsing JSON body:', e)
      return new Response(
        JSON.stringify({ error: `Invalid JSON body: ${e.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { filename, contentType, action } = body
    console.log(`[r2-sign] Request data:`, { filename, contentType, action })

    if (action === 'upload' && (!filename || !contentType)) {
        console.error('[r2-sign] Missing required fields for upload in body:', body)
        return new Response(
          JSON.stringify({ error: 'Missing required fields for upload: filename, contentType', received: body }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    if (!action) {
      console.error('[r2-sign] Missing action in body:', body)
      return new Response(
        JSON.stringify({ error: 'Missing required field: action', received: body }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME) {
      console.error('[r2-sign] Missing environment variables:', {
        hasAccessKey: !!R2_ACCESS_KEY_ID,
        hasSecretKey: !!R2_SECRET_ACCESS_KEY,
        hasEndpoint: !!R2_ENDPOINT,
        hasBucket: !!R2_BUCKET_NAME
      })
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: Missing environment variables',
          details: {
            hasAccessKey: !!R2_ACCESS_KEY_ID,
            hasSecretKey: !!R2_SECRET_ACCESS_KEY,
            hasEndpoint: !!R2_ENDPOINT,
            hasBucket: !!R2_BUCKET_NAME
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (action !== 'upload') {
      throw new Error('Only upload action is supported currently')
    }

    console.log(`[r2-sign] Initializing S3Client with endpoint: ${R2_ENDPOINT}`)
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true, // Often needed for R2 and other S3-compatible providers
    })

    const uuid = crypto.randomUUID()
    const key = `chat-media/${uuid}-${filename}`
    console.log(`[r2-sign] Generating signed URL for key: ${key}`)
    
    console.log(`[r2-sign] Creating PutObjectCommand for bucket: ${R2_BUCKET_NAME}`)
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    console.log(`[r2-sign] Calling getSignedUrl...`)
    try {
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
      console.log(`[r2-sign] signedUrl generated (length: ${signedUrl?.length})`)
      const publicUrl = `${R2_PUBLIC_URL}/${key}`

      console.log(`[r2-sign] Successfully generated URLs`)
      return new Response(
        JSON.stringify({ 
          uploadUrl: signedUrl, 
          publicUrl: publicUrl,
          key: key
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } catch (signingError: any) {
      console.error('[r2-sign] Error in getSignedUrl:', signingError)
      throw new Error(`Signing error: ${signingError.message}`)
    }
  } catch (error: any) {
    console.error('[r2-sign] Uncaught error:', error)
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
