export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const testEventCode = process.env.META_TEST_EVENT_CODE;
  const storageWebhook = process.env.LEADS_WEBHOOK_URL;

  if (!pixelId || !accessToken) {
    // Não bloqueia a navegação caso o pixel ainda não esteja configurado
    res.status(200).json({ ok: true, warning: 'Meta credentials not configured' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      body = {};
    }
  }

  const {
    event_id: eventId,
    event_name: eventName = 'Lead',
    event_source_url: eventSourceUrl,
    attribution = {}
  } = body || {};

  const eventTime = Math.floor(Date.now() / 1000);
  const clientUserAgent = req.headers['user-agent'] || '';
  const forwardedFor = req.headers['x-forwarded-for'] || '';
  const clientIpAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : String(forwardedFor).split(',')[0].trim();

  const eventsPayload = {
    data: [
      {
        event_name: eventName,
        event_time: eventTime,
        event_id: eventId,
        event_source_url: eventSourceUrl || '',
        action_source: 'website',
        user_data: {
          client_user_agent: clientUserAgent,
          client_ip_address: clientIpAddress || undefined
        },
        custom_data: {
          ...attribution
        }
      }
    ]
  };

  const metaUrl = new URL(`https://graph.facebook.com/v18.0/${pixelId}/events`);
  metaUrl.searchParams.set('access_token', accessToken);
  if (testEventCode) {
    metaUrl.searchParams.set('test_event_code', testEventCode);
  }

  try {
    const response = await fetch(metaUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventsPayload)
    });

    // Armazenamento opcional das UTM em webhook próprio
    if (storageWebhook) {
      const storagePayload = {
        event_id: eventId,
        event_name: eventName,
        event_time: new Date(eventTime * 1000).toISOString(),
        event_source_url: eventSourceUrl || '',
        attribution,
        client_user_agent: clientUserAgent,
        client_ip_address: clientIpAddress || null
      };

      try {
        await fetch(storageWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storagePayload)
        });
      } catch {
        // Falha silenciosa: registro em storage não impede a conversão
      }
    }

    const json = await response.json();
    res.status(200).json({ ok: true, meta: json });
  } catch (error) {
    // Não quebra a experiência do usuário caso a chamada à Meta falhe
    res.status(200).json({ ok: false, error: String(error) });
  }
}


