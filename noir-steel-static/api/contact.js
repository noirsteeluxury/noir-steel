const RESEND_URL = 'https://api.resend.com/emails';

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}
function esc(value) {
  return clean(value, 4000).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 160;
}
async function sendEmail(apiKey, payload) {
  const response = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Błąd usługi pocztowej');
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Dozwolona jest tylko metoda POST.' });
  const origin = req.headers.origin || '';
  if (origin && !/^https:\/\/(www\.)?noirsteel\.pl$/i.test(origin) && !/^https?:\/\/localhost(?::\d+)?$/i.test(origin)) {
    return res.status(403).json({ error: 'Nieprawidłowe źródło formularza.' });
  }
  const body = req.body || {};
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

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

  if (!name || !phone || !validEmail(email) || body.consent !== true) {
    return res.status(400).json({ error: 'Sprawdź imię, telefon, e-mail oraz zgodę na kontakt.' });
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Formularz nie został jeszcze aktywowany. Skontaktuj się telefonicznie.' });

  const to = process.env.CONTACT_TO || 'kontakt@noirsteel.pl';
  const from = process.env.CONTACT_FROM || 'Noir Steel <formularz@send.noirsteel.pl>';
  const rows = [
    ['Imię', name], ['Telefon', phone], ['E-mail', email], ['Planowany wymiar', size || 'Nie podano'],
    ['Rodzaj', type || 'Nie podano'], ['Sposób rozkładania', mechanism || 'Nie podano'],
    ['Kształt blatu', shape || 'Nie podano'], ['Miasto dostawy', city || 'Nie podano']
  ].map(([k,v]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e8e2d8;font-weight:bold">${esc(k)}</td><td style="padding:8px 12px;border-bottom:1px solid #e8e2d8">${esc(v)}</td></tr>`).join('');

  try {
    await sendEmail(apiKey, {
      from, to: [to], reply_to: email,
      subject: `Nowe zapytanie Noir Steel — ${name}${city ? `, ${city}` : ''}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#121211"><h1 style="font-family:Georgia,serif;font-weight:400">Nowe zapytanie ze strony Noir Steel</h1><table style="width:100%;border-collapse:collapse">${rows}</table><h2 style="font-family:Georgia,serif;font-weight:400;margin-top:28px">Wiadomość</h2><p style="white-space:pre-wrap;line-height:1.65">${esc(message || 'Brak dodatkowej wiadomości.')}</p><p style="font-size:12px;color:#777;margin-top:30px">Źródło: ${esc(page || 'noirsteel.pl')}</p></div>`
    });
    await sendEmail(apiKey, {
      from, to: [email], reply_to: to,
      subject: 'Dziękujemy za kontakt z Noir Steel',
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#121211"><p style="letter-spacing:.22em;font-size:12px">NOIR STEEL</p><h1 style="font-family:Georgia,serif;font-weight:400">Dziękujemy za przesłanie zapytania.</h1><p style="line-height:1.7">Otrzymaliśmy Twoją wiadomość i odpowiemy najszybciej, jak to możliwe. Zwykle kontaktujemy się w ciągu 24 godzin w dni robocze.</p><p style="line-height:1.7">W pilnej sprawie zadzwoń: <a href="tel:+48508951101">508 951 101</a>.</p><p style="margin-top:32px">Noir Steel<br><a href="https://noirsteel.pl">noirsteel.pl</a></p></div>`
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(502).json({ error: 'Nie udało się wysłać wiadomości. Spróbuj ponownie lub skontaktuj się telefonicznie.' });
  }
};
