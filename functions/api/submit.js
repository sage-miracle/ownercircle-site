const FORMSPREE_URL = 'https://formspree.io/f/mzdngggv';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function jsonResponse(ok, message, status = 200, origin) {
  return new Response(JSON.stringify({ ok, message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

export function handleOptions(request) {
  const origin = request.headers.get('Origin');
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

async function sendTelegram(env, { name, company, phone, concern }) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('Telegram not configured (missing secret)');

  const text = [
    '📩 오너서클 — 블랙 브리핑 신청',
    '',
    `성함: ${name}`,
    `회사명: ${company}`,
    `연락처: ${phone}`,
    `고민: ${concern || '(작성 안 함)'}`,
  ].join('\n');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    throw new Error(`Telegram send failed: ${res.status} ${await res.text()}`);
  }
}

async function sendFormspree({ name, company, phone, concern }, siteUrl) {
  const res = await fetch(FORMSPREE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Referer': siteUrl,
      'Origin': siteUrl,
    },
    body: JSON.stringify({
      name,
      company,
      phone,
      concern,
      _subject: '오너서클 — 블랙 브리핑 신청',
    }),
  });
  if (!res.ok) {
    throw new Error(`Formspree send failed: ${res.status} ${await res.text()}`);
  }
}

export async function handleSubmit(request, env) {
  const origin = request.headers.get('Origin');
  console.log(`[submit] incoming request, origin=${origin}, ua=${request.headers.get('User-Agent')}`);

  if (request.method !== 'POST') {
    return jsonResponse(false, 'Method not allowed', 405, origin);
  }

  let data;
  try {
    data = await request.json();
  } catch (err) {
    console.error('[submit] JSON parse failed', err);
    return jsonResponse(false, '잘못된 요청입니다.', 400, origin);
  }

  const name = String(data.name || '').trim();
  const company = String(data.company || '').trim();
  const phone = String(data.phone || '').trim();
  const concern = String(data.concern || '').trim();

  if (!name || !company || !phone) {
    console.warn('[submit] missing required field', { name: !!name, company: !!company, phone: !!phone });
    return jsonResponse(false, '필수 항목이 누락되었습니다.', 400, origin);
  }

  const siteUrl = new URL(request.url).origin;
  const payload = { name, company, phone, concern };
  const results = await Promise.allSettled([
    sendTelegram(env, payload),
    sendFormspree(payload, siteUrl),
  ]);

  const [telegramResult, formspreeResult] = results;
  console.log(`[submit] telegram=${telegramResult.status} formspree=${formspreeResult.status}`);

  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length === results.length) {
    failures.forEach(f => console.error('[submit] both channels failed:', f.reason?.message || f.reason));
    return jsonResponse(false, '전송에 실패했습니다.', 502, origin);
  }
  if (failures.length > 0) {
    failures.forEach(f => console.error('[submit] one channel failed:', f.reason?.message || f.reason));
  }

  return jsonResponse(true, 'ok', 200, origin);
}
