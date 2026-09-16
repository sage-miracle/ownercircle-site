/* 스크롤 연출 (GSAP ScrollTrigger), 오프닝, 나브, 폼 */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  const S = window.__sealState;
  const isDesktop = () => matchMedia('(min-width: 900px)').matches;

  /* ---- 나브 ---- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 30);
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  const toggle = document.getElementById('navToggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  });
  document.querySelectorAll('.nav__mobile a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }));

  /* ---- 폼 (텔레그램 + 이메일 API) ---- */
  const wireForm = (form, endpoint, build) => {
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const ok = form.querySelector('.reply__success'), err = form.querySelector('.reply__error');
      const fields = form.querySelectorAll('input, textarea, button');
      const payload = build(new FormData(form));
      const btn = form.querySelector('button[type="submit"]'), btnText = btn ? btn.textContent : '';
      err.hidden = true; form.setAttribute('aria-busy', 'true'); fields.forEach(el => el.disabled = true); if (btn) btn.textContent = '전송 중';
      try {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const result = await res.json().catch(() => ({ ok: false }));
        if (!res.ok || !result.ok) throw new Error(result.message || 'submit failed');
        ok.hidden = false; if (btn) btn.textContent = btnText; form.removeAttribute('aria-busy');
      } catch (_) { fields.forEach(el => el.disabled = false); if (btn) btn.textContent = btnText; form.removeAttribute('aria-busy'); err.hidden = false; }
    });
  };
  wireForm(document.getElementById('ctaForm'), '/api/submit', d => ({
    name: d.get('name') || '', company: d.get('company') || '', phone: d.get('phone') || '', concern: d.get('concern') || ''
  }));
  wireForm(document.getElementById('applyForm'), '/api/apply', d => ({
    name: d.get('name') || '', phone: d.get('phone') || '', position: d.get('position') || '', exp: d.getAll('exp'), intro: d.get('intro') || ''
  }));

  /* ---- 연출 없이 보여주기 (GSAP 없음 / 모션 축소) ---- */
  const showAll = () => {
    document.querySelectorAll('.rv, .rv-stagger > *').forEach(el => el.style.opacity = 1);
    const hero = document.querySelector('.open__hero'); if (hero) hero.style.opacity = 1;
    const desk = document.querySelector('.desk'); if (desk) desk.style.opacity = 1;
    document.querySelectorAll('.ways__list li').forEach(li => li.classList.add('is-active'));
  };
  if (!hasGsap || reduce) { showAll(); return; }

  /* ---- 오프닝: 새벽 두 시 → 질문 → 제목 ---- */
  const hero = document.querySelector('.open__hero');
  const desk = document.querySelector('.desk');
  gsap.fromTo(hero, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
  if (desk) gsap.fromTo(desk, { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' });

  /* ---- 스크롤 리빌 ---- */
  document.querySelectorAll('.rv').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  document.querySelectorAll('.rv-stagger').forEach(el => {
    gsap.fromTo(el.children, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .9, stagger: .11, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });
  if (document.querySelector('.plans')) gsap.fromTo('.plan', { opacity: 0, y: 40, rotateY: -16 }, { opacity: 1, y: 0, rotateY: 0, duration: 1.1, stagger: .14, ease: 'power3.out', scrollTrigger: { trigger: '.plans', start: 'top 80%', once: true } });

  /* ---- 등불이 스크롤을 따라 천천히 흐른다 ---- */
  gsap.to('.lamp', { yPercent: 40, xPercent: -28, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1.2 } });

  /* ---- 히어로: 밤의 사무실 창. 초점 나간 도시 불빛이 흐르고, 등불 빛 속에 먼지가 떠다닌다 ---- */
  (() => {
    const cv = document.getElementById('bokeh'); if (!cv || reduce) return;
    const ctx = cv.getContext('2d'); const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0, h = 0, lights = [], motes = [];
    const R = (a, b) => a + Math.random() * (b - a);
    const size = () => {
      const r = cv.parentElement.getBoundingClientRect(); w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 700 ? 16 : 26, m = w < 700;
      /* 창밖 도시의 불빛: 작고 또렷한 원반, 대부분 따뜻한 빛, 드물게 차가운 흰빛 */
      lights = Array.from({ length: n }, (_, i) => ({
        x: R(w * .4, w * 1.04), y: R(h * .04, h * .92), r: R(m ? 8 : 12, m ? 34 : 62),
        tone: Math.random() < .6 ? 0 : (Math.random() < .8 ? 1 : 2), a: R(.07, .2), ph: R(0, 6.28), sp: R(.08, .22), dx: R(-.04, .04), dy: R(-.03, .03)
      }));
      motes = Array.from({ length: w < 700 ? 40 : 90 }, () => ({ x: R(0, w), y: R(0, h), r: R(.5, 1.6), a: R(.15, .5), vy: R(-.06, -.02), vx: R(-.03, .03), ph: R(0, 6.28) }));
    };
    size(); if ('ResizeObserver' in window) new ResizeObserver(size).observe(cv.parentElement);
    let on = true; if ('IntersectionObserver' in window) new IntersectionObserver(e => { on = e[0].isIntersecting; }).observe(cv);
    let last = performance.now();
    const draw = (now) => {
      requestAnimationFrame(draw); if (!on) return;
      const dt = Math.min(50, now - last); last = now; const s = now / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const L of lights) {
        L.x += L.dx * dt * .06; L.y += L.dy * dt * .06;
        if (L.x < w * .3) L.dx = Math.abs(L.dx); if (L.x > w * 1.1) L.dx = -Math.abs(L.dx);
        if (L.y < -L.r) L.dy = Math.abs(L.dy); if (L.y > h + L.r) L.dy = -Math.abs(L.dy);
        const a = L.a * (.75 + .25 * Math.sin(L.ph + s * L.sp));
        const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
        const c = L.tone === 0 ? '255,190,110' : (L.tone === 1 ? '255,232,196' : '222,224,232');
        g.addColorStop(0, 'rgba(' + c + ',' + (a * .95).toFixed(3) + ')');
        g.addColorStop(.8, 'rgba(' + c + ',' + (a * .9).toFixed(3) + ')');
        g.addColorStop(.94, 'rgba(' + c + ',' + (a * 1.1).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + c + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(L.x, L.y, L.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const m of motes) {
        m.x += m.vx * dt; m.y += m.vy * dt; if (m.y < -4) { m.y = h + 4; m.x = R(0, w); } if (m.x < -4) m.x = w + 4; if (m.x > w + 4) m.x = -4;
        const a = m.a * (.5 + .5 * Math.sin(m.ph + s * .9));
        ctx.fillStyle = 'rgba(255,232,196,' + a.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    requestAnimationFrame(draw);
  })();

  /* ---- BLACK 카드: 펄 도장의 미세한 플레이크. 빛이 스치듯 은은하게 일렁인다 ---- */
  (() => {
    const blk = document.querySelector('.plan--blk');
    if (!blk) return;
    const cv = document.createElement('canvas'); cv.className = 'plan__sparkle'; cv.setAttribute('aria-hidden', 'true'); blk.prepend(cv);
    const ctx = cv.getContext('2d'); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, pts = [];
    const size = () => {
      const r = blk.getBoundingClientRect(); w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = Array.from({ length: Math.round(w * h / 900) }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: .3 + Math.random() * .7,
        ph: Math.random() * Math.PI * 2, sp: .25 + Math.random() * .6,
        c: Math.random() < .45 ? '255,244,222' : (Math.random() < .5 ? '206,222,255' : '255,210,236')
      }));
    };
    size(); if ('ResizeObserver' in window) new ResizeObserver(size).observe(blk);
    let on = true; if ('IntersectionObserver' in window) new IntersectionObserver(e => { on = e[0].isIntersecting; }).observe(blk);
    const draw = (t) => {
      requestAnimationFrame(draw); if (!on) return;
      ctx.clearRect(0, 0, w, h); const s = t / 1000;
      /* 광택 띠가 카드를 천천히 가로지르고, 띠 근처의 플레이크만 살짝 밝아진다 */
      const band = ((s * .09) % 1.6) - .3;
      for (const p of pts) {
        const d = Math.abs((p.x / w) * .7 + (p.y / h) * .3 - band);
        const sheen = Math.max(0, 1 - d / .28);
        const tw = .5 + .5 * Math.sin(p.ph + s * p.sp);
        const al = .06 + tw * .16 + sheen * sheen * .34; 
        ctx.fillStyle = 'rgba(' + p.c + ',' + al.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    };
    requestAnimationFrame(draw);
  })();

  /* ---- 종이 표면의 등불 반사: 커서를 따라 하이라이트가 움직인다 ---- */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('[data-light]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--sx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--sy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      }, { passive: true });
    });
  }

  /* ---- 카드 기울임 ---- */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        gsap.to(card, { rotateY: x * 7, rotateX: -y * 7, transformPerspective: 1400, duration: .5, ease: 'power2.out' });
      });
      card.addEventListener('pointerleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: .8, ease: 'power3.out' }));
    });
  }

  /* ---- 데스크톱 전용: 가로 시트, 스텝 고정 ---- */
  ScrollTrigger.matchMedia({
    '(min-width: 900px)': () => {
      const items = gsap.utils.toArray('.ways__list li');
      const num = document.getElementById('waysNum');
      if (items.length && num) {
        const pad = document.getElementById('notepad');
        const light = i => { // 메모장 위의 등불 빛을 활성 항목으로
          if (!pad) return;
          const r = pad.getBoundingClientRect(), ir = items[i].getBoundingClientRect();
          pad.style.setProperty('--ly', ((ir.top + ir.height / 2 - r.top) / r.height * 100).toFixed(1) + '%');
        };
        let cur = -1;
        const setActive = i => {
          if (i === cur) return; cur = i;
          items.forEach((li, j) => li.classList.toggle('is-active', j === i));
          num.textContent = String(i + 1).padStart(2, '0');
          light(i); setTimeout(() => light(i), 650);
        };
        setActive(0);
        ScrollTrigger.create({
          trigger: '#ways .pin', start: 'top top', end: () => '+=' + items.length * window.innerHeight * 0.55,
          pin: true, scrub: true, anticipatePin: 1,
          onUpdate: st => setActive(Math.min(items.length - 1, Math.floor(st.progress * items.length)))
        });
      }
    },
    '(max-width: 899px)': () => {
      document.querySelectorAll('.ways__list li').forEach(li => li.classList.add('is-active'));
    }
  });

  /* ---- 히어로 책상: 등불 빛이 커서를 따라 계약서를 비춘다 ---- */
  const paperEl = document.getElementById('contractPaper');
  if (paperEl) {
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const setLight = (x, y) => { paperEl.style.setProperty('--lx', x + '%'); paperEl.style.setProperty('--ly', y + '%'); };
    if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
      document.getElementById('open').addEventListener('pointermove', e => {
        const r = paperEl.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        setLight(clamp(x, -.3, 1.3) * 100, clamp(y, -.3, 1.3) * 100);
        gsap.to(paperEl, { rotateY: (clamp(x, 0, 1) - .5) * 9, rotateX: -(clamp(y, 0, 1) - .5) * 9, duration: .7, ease: 'power2.out' });
      }, { passive: true });
    } else {
      const o = { x: 70, y: 30 };
      gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 4.5, ease: 'sine.inOut', onUpdate: () => setLight(o.x, o.y) } })
        .to(o, { x: 32, y: 68 }).to(o, { x: 74, y: 88 }).to(o, { x: 28, y: 24 });
    }
  }

  /* ---- 인장: 신청서가 화면에 자리 잡았을 때 한 번만 내려와 찍고, 위로 사라진다 ---- */
  if (S && document.getElementById('paper') && document.getElementById('reply')) {
    const paper = document.getElementById('paper');
    let played = false;
    const play = () => {
      if (played) return; played = true;
      gsap.timeline()
        .to(S, { mix: 1, duration: .75, ease: 'power2.out' })
        .to(S, { press: 1, duration: .28, ease: 'power3.in' })
        .add(() => { paper.classList.add('is-stamped'); gsap.fromTo(paper, { y: 0 }, { y: 5, duration: .07, yoyo: true, repeat: 1, ease: 'power1.inOut' }); })
        .to(S, { press: 0, duration: .35, ease: 'power2.out' }, '+=.4')
        .to(S, { mix: 0, nx: .35, ny: 1.9, s: .6, duration: .6, ease: 'power2.in' }, '-=.1');
    };
    ScrollTrigger.create({ trigger: '#reply', start: 'top 25%', once: true, onEnter: play });
  }

  /* 폰트 로딩 후 위치 재계산 */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
