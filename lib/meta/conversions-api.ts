import { createHash } from 'crypto'

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

interface MetaConversionEvent {
  eventName: string
  email?: string | null
  phone?: string | null
  fbc?: string | null
  fbp?: string | null
  clientIp?: string | null
  userAgent?: string | null
  sourceUrl?: string
}

/**
 * Envia um evento server-side pra Meta Conversions API.
 * Fica inerte (no-op) até NEXT_PUBLIC_META_PIXEL_ID e META_CONVERSIONS_API_TOKEN
 * estarem configurados — seguro de chamar mesmo sem as variáveis prontas.
 * Nunca lança erro: falha de rede/API aqui não deve travar o fluxo que a chamou.
 */
export async function sendMetaConversionEvent({
  eventName, email, phone, fbc, fbp, clientIp, userAgent, sourceUrl,
}: MetaConversionEvent): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const token = process.env.META_CONVERSIONS_API_TOKEN
  if (!pixelId || !token) return

  const userData: Record<string, unknown> = {}
  if (email) userData.em = [sha256(email)]
  if (phone) userData.ph = [sha256(phone.replace(/\D/g, ''))]
  if (fbc) userData.fbc = fbc
  if (fbp) userData.fbp = fbp
  if (clientIp) userData.client_ip_address = clientIp
  if (userAgent) userData.client_user_agent = userAgent

  try {
    await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: token,
        data: [{
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: sourceUrl,
          user_data: userData,
        }],
      }),
    })
  } catch (err) {
    console.error('[meta-conversions-api] erro ao enviar evento:', err)
  }
}
