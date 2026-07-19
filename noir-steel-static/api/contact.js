const RESEND_URL = 'https://api.resend.com/emails';
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const rateBuckets = globalThis.__noirRateBuckets || new Map();
globalThis.__noirRateBuckets = rateBuckets;

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function esc(value) {
  return clean(value, 5000).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 160;
}

function validRequestId(value) {
  return /^[a-zA-Z0-9_-]{16,100}$/.test(value);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getClientIp(req) {
  return clean(req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || 'unknown', 80);
}

function checkRateLimit(ip) {
  const now = Date.now();
  const active = (rateBuckets.get(ip) || []).filter(timestamp => now - timestamp < WINDOW_MS);
  if (active.length >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - (now - active[0])) / 1000));
    return { allowed: false, retryAfter };
  }
  active.push(now);
  rateBuckets.set(ip, active);
  return { allowed: true, retryAfter: 0 };
}

async function sendEmail(apiKey, payload, idempotencyKey) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(RESEND_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return data;
      const error = new Error(data.message || 'Błąd usługi pocztowej');
      error.status = response.status;
      if (response.status !== 429 && response.status < 500) throw error;
      lastError = error;
    } catch (error) {
      lastError = error;
      if (error.status && error.status !== 429 && error.status < 500) throw error;
    }
    if (attempt === 0) await sleep(650);
  }
  throw lastError || new Error('Błąd usługi pocztowej');
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Dozwolona jest tylko metoda POST.' });
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > 30000) return res.status(413).json({ error: 'Wiadomość jest zbyt duża.' });

  const origin = req.headers.origin || '';
  const allowedOrigin = /^https:\/\/(www\.)?noirsteel\.pl$/i.test(origin) || /^https?:\/\/localhost(?::\d+)?$/i.test(origin);
  if (origin && !allowedOrigin) return res.status(403).json({ error: 'Nieprawidłowe źródło formularza.' });

  const body = req.body || {};
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const startedAt = Number(body.started_at || 0);
  const elapsed = Date.now() - startedAt;
  if (!startedAt || elapsed < 2500 || elapsed > 2 * 60 * 60 * 1000) {
    return res.status(400).json({ error: 'Sesja formularza wygasła. Odśwież stronę i spróbuj ponownie.' });
  }

  const requestId = clean(body.request_id, 100);
  if (!validRequestId(requestId)) return res.status(400).json({ error: 'Nieprawidłowy identyfikator formularza.' });

  const limit = checkRateLimit(getClientIp(req));
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    return res.status(429).json({ error: 'Wysłano zbyt wiele zapytań. Spróbuj ponownie za kilka minut.' });
  }

  const name = clean(body.name, 80);
  const phone = clean(body.phone, 30);
  const email = clean(body.email, 160).toLowerCase();
  const size = clean(body.size, 80);
  const type = clean(body.type, 80);
  const mechanism = clean(body.mechanism, 100);
  const shape = clean(body.shape, 100);
  const city = clean(body.city, 100);
  const message = clean(body.message, 3000);
  const page = clean(body.page, 300);

  if (!name || phone.replace(/\D/g, '').length < 7 || !validEmail(email) || body.consent !== true) {
    return res.status(400).json({ error: 'Sprawdź imię, telefon, e-mail oraz zgodę na kontakt.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Formularz nie został jeszcze aktywowany. Zadzwoń pod numer 508 951 101.' });

  const to = process.env.CONTACT_TO_EMAIL || 'kontakt@noirsteel.pl';
  const from = process.env.CONTACT_FROM_EMAIL || 'Noir Steel <formularz@noirsteel.pl>';
  const rows = [
    ['Imię', name], ['Telefon', phone], ['E-mail', email], ['Planowany wymiar', size || 'Nie podano'],
    ['Rodzaj', type || 'Nie podano'], ['Sposób rozkładania', mechanism || 'Nie podano'],
    ['Kształt blatu', shape || 'Nie podano'], ['Miasto dostawy', city || 'Nie podano']
  ];
  const tableRows = rows.map(([key, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e8e2d8;font-weight:bold">${esc(key)}</td><td style="padding:8px 12px;border-bottom:1px solid #e8e2d8">${esc(value)}</td></tr>`).join('');
  const plainRows = rows.map(([key, value]) => `${key}: ${value}`).join('\n');

  try {
    await sendEmail(apiKey, {
      from,
      to: [to],
      reply_to: email,
      subject: `Nowe zapytanie Noir Steel — ${name}${city ? `, ${city}` : ''}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#121211"><p style="letter-spacing:.22em;font-size:12px">NOIR STEEL</p><h1 style="font-family:Georgia,serif;font-weight:400">Nowe zapytanie ze strony</h1><table style="width:100%;border-collapse:collapse">${tableRows}</table><h2 style="font-family:Georgia,serif;font-weight:400;margin-top:28px">Wiadomość</h2><p style="white-space:pre-wrap;line-height:1.65">${esc(message || 'Brak dodatkowej wiadomości.')}</p><p style="font-size:12px;color:#777;margin-top:30px">Źródło: ${esc(page || 'noirsteel.pl')}<br>ID zapytania: ${esc(requestId)}</p></div>`,
      text: `Nowe zapytanie ze strony Noir Steel\n\n${plainRows}\n\nWiadomość:\n${message || 'Brak dodatkowej wiadomości.'}\n\nŹródło: ${page || 'noirsteel.pl'}\nID zapytania: ${requestId}`
    }, `lead/${requestId}`);

    try {
      await sendEmail(apiKey, {
        from,
        to: [email],
        reply_to: to,
        subject: 'Dziękujemy za kontakt z Noir Steel',
        html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#121211"><p style="letter-spacing:.22em;font-size:12px">NOIR STEEL</p><h1 style="font-family:Georgia,serif;font-weight:400">Dziękujemy za przesłanie zapytania.</h1><p style="line-height:1.7">Otrzymaliśmy Twoją wiadomość. Odpowiemy najszybciej, jak to możliwe — zwykle w ciągu 24 godzin w dni robocze.</p><p style="line-height:1.7">W pilnej sprawie zadzwoń: <a href="tel:+48508951101">508 951 101</a>.</p><p style="margin-top:32px">Noir Steel<br><a href="https://noirsteel.pl">noirsteel.pl</a></p></div>`,
        text: 'Dziękujemy za przesłanie zapytania do Noir Steel. Otrzymaliśmy Twoją wiadomość i odpowiemy najszybciej, jak to możliwe. W pilnej sprawie zadzwoń: 508 951 101.'
      }, `confirmation/${requestId}`);
    } catch (confirmationError) {
      console.error('Confirmation email error:', confirmationError);
    }

    return res.status(200).json({ ok: true, request_id: requestId });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(502).json({ error: 'Nie udało się wysłać wiadomości. Spróbuj ponownie lub skontaktuj się telefonicznie.' });
  }
};
