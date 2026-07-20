const FORMSPREE_URL = 'https://formspree.io/f/mzdngggv';

function jsonResponse(ok, message, status = 200) {
  return new Response(JSON.stringify({ ok, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sendTelegram(env, { name, company, phone, concern }) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('Telegram not configured');

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

async function sendFormspree({ name, company, phone, concern }) {
  const res = await fetch(FORMSPREE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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
  if (request.method !== 'POST') {
    return jsonResponse(false, 'Method not allowed', 405);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonResponse(false, '잘못된 요청입니다.', 400);
  }

  const name = String(data.name || '').trim();
  const company = String(data.company || '').trim();
  const phone = String(data.phone || '').trim();
  const concern = String(data.concern || '').trim();

  if (!name || !company || !phone) {
    return jsonResponse(false, '필수 항목이 누락되었습니다.', 400);
  }

  const payload = { name, company, phone, concern };
  const results = await Promise.allSettled([
    sendTelegram(env, payload),
    sendFormspree(payload),
  ]);

  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length === results.length) {
    failures.forEach(f => console.error(f.reason));
    return jsonResponse(false, '전송에 실패했습니다.', 502);
  }
  if (failures.length > 0) {
    failures.forEach(f => console.error(f.reason));
  }

  return jsonResponse(true, 'ok');
}
