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

async function sendTelegram(env, { name, phone, position, exp, intro }) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('Telegram not configured (missing secret)');

  const text = [
    '🧑‍💼 오너서클 — 오너자문사 지원',
    '',
    `성함: ${name}`,
    `연락처: ${phone}`,
    `직책/회사 규모: ${position}`,
    `실전 경험: ${exp.length ? exp.join(', ') : '(선택 안 함)'}`,
    `자기소개: ${intro || '(작성 안 함)'}`,
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

async function sendFormspree({ name, phone, position, exp, intro }, siteUrl) {
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
      phone,
      position,
      experience: exp.join(', '),
      intro,
      _subject: '오너서클 — 오너자문사 지원',
    }),
  });
  if (!res.ok) {
    throw new Error(`Formspree send failed: ${res.status} ${await res.text()}`);
  }
}

export async function handleApply(request, env) {
  const origin = request.headers.get('Origin');
  console.log(`[apply] incoming request, origin=${origin}`);

  if (request.method !== 'POST') {
    return jsonResponse(false, 'Method not allowed', 405, origin);
  }

  let data;
  try {
    data = await request.json();
  } catch (err) {
    console.error('[apply] JSON parse failed', err);
    return jsonResponse(false, '잘못된 요청입니다.', 400, origin);
  }

  const name = String(data.name || '').trim();
  const phone = String(data.phone || '').trim();
  const position = String(data.position || '').trim();
  const intro = String(data.intro || '').trim();
  const exp = Array.isArray(data.exp) ? data.exp.map(String) : [];

  if (!name || !phone || !position || !intro) {
    console.warn('[apply] missing required field', {
      name: !!name, phone: !!phone, position: !!position, intro: !!intro,
    });
    return jsonResponse(false, '필수 항목이 누락되었습니다.', 400, origin);
  }

  const siteUrl = new URL(request.url).origin;
  const payload = { name, phone, position, exp, intro };
  const results = await Promise.allSettled([
    sendTelegram(env, payload),
    sendFormspree(payload, siteUrl),
  ]);

  const [telegramResult, formspreeResult] = results;
  console.log(`[apply] telegram=${telegramResult.status} formspree=${formspreeResult.status}`);

  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length === results.length) {
    failures.forEach(f => console.error('[apply] both channels failed:', f.reason?.message || f.reason));
    return jsonResponse(false, '전송에 실패했습니다.', 502, origin);
  }
  if (failures.length > 0) {
    failures.forEach(f => console.error('[apply] one channel failed:', f.reason?.message || f.reason));
  }

  return jsonResponse(true, 'ok', 200, origin);
}
