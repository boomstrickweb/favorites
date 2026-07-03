import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  userId: string
  title: string
  body: string
  data?: Record<string, string>
}

async function getAccessToken(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000)
  const expiry = now + 3600

  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: expiry,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  }

  // Remove header and footer from private key and fix newlines
  const pemHeader = "-----BEGIN PRIVATE KEY-----"
  const pemFooter = "-----END PRIVATE KEY-----"
  const pemContents = privateKey
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "")

  const binaryDerString = atob(pemContents)
  const binaryDer = new Uint8Array(binaryDerString.length)
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i)
  }

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  )

  const jwt = await create({ alg: "RS256", typ: "JWT" }, payload, key)

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  })

  const data = await response.json()
  return data.access_token
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, title, body, data: extraData, actorId, type } = await req.json() as any

    // If actorId and type are provided, we can fetch the actor's username and build the message
    let finalTitle = title;
    let finalBody = body;

    if (actorId && type && (!title || !body)) {
      const { data: actorProfile } = await supabaseClient
        .from('profiles')
        .select('username')
        .eq('id', actorId)
        .single()
      
      const actorUsername = actorProfile?.username || 'Someone';

      if (type === 'follow') {
        finalTitle = 'New Follower';
        finalBody = `${actorUsername} started following you`;
      } else if (type === 'like') {
        finalTitle = 'New Like';
        finalBody = `${actorUsername} liked your post`;
      } else if (type === 'comment') {
        finalTitle = 'New Comment';
        finalBody = `${actorUsername} commented on your post`;
      }
    }

    if (!userId || !finalTitle || !finalBody) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Get user's FCM token
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.fcm_token) {
      console.log(`No FCM token found for user ${userId}`)
      return new Response(JSON.stringify({ success: false, message: 'No FCM token found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') || 'favorites-c8305'
    const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL')
    const FIREBASE_PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY')

    if (!FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
       return new Response(JSON.stringify({ error: 'Firebase configuration missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const accessToken = await getAccessToken(FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)

    const isExpoPushToken = profile.fcm_token.startsWith('ExponentPushToken') || profile.fcm_token.startsWith('ExpoPushToken')
    
    // Build data object for the notification
    const notificationData = {
      ...(extraData || {}),
      actorId: actorId || '',
      type: type || '',
    }

    if (isExpoPushToken) {
      const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          to: profile.fcm_token,
          title: finalTitle,
          body: finalBody,
          data: notificationData,
          sound: 'default',
        }),
      })
      const expoResult = await expoResponse.json()
      console.log('Expo Result:', expoResult)
      return new Response(JSON.stringify(expoResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: profile.fcm_token,
            notification: {
              title: finalTitle,
              body: finalBody,
            },
            data: notificationData,
            android: {
              notification: {
                click_action: "OPEN_APP",
                sound: "default",
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: "default",
                  badge: 1,
                },
              },
            },
          },
        }),
      }
    )

    const fcmResult = await fcmResponse.json()
    console.log('FCM Result:', fcmResult)

    return new Response(JSON.stringify(fcmResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Error sending notification:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
