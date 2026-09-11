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
      err.hidden = true; fields.forEach(el => el.disabled = true);
      try {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const result = await res.json().catch(() => ({ ok: false }));
        if (!res.ok || !result.ok) throw new Error(result.message || 'submit failed');
        ok.hidden = false;
      } catch (_) { fields.forEach(el => el.disabled = false); err.hidden = false; }
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
  let seen = false; try { seen = sessionStorage.getItem('oc-intro') === '1'; } catch (_) {}
  if (seen) {
    gsap.fromTo(hero, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
    if (desk) gsap.fromTo(desk, { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' });
  } else {
    const intro = gsap.timeline({ onComplete: () => { try { sessionStorage.setItem('oc-intro', '1'); } catch (_) {} } });
    intro.fromTo('.open__line--1', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .9, ease: 'power2.out', delay: .3 })
      .to('.open__line--1', { opacity: 0, y: -10, duration: .55, ease: 'power2.in' }, '+=.9')
      .fromTo('.open__line--2', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .9, ease: 'power2.out' })
      .to('.open__line--2', { opacity: 0, y: -10, duration: .55, ease: 'power2.in' }, '+=1.5')
      .fromTo(hero, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' });
    if (desk) intro.fromTo(desk, { opacity: 0 }, { opacity: 1, duration: 1.8, ease: 'power2.out' }, '<');
    const skip = () => { if (intro.progress() < 1) intro.progress(1); };
    window.addEventListener('wheel', skip, { once: true, passive: true });
    window.addEventListener('touchstart', skip, { once: true, passive: true });
    window.addEventListener('keydown', skip, { once: true });
  }

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

  /* ---- 인장: 오너 신청 서식이 열릴 때만 내려와 찍힌다 ---- */
  if (S && document.getElementById('paper') && document.getElementById('reply')) {
    const D = isDesktop();
    // 종이로 내려와 자리를 잡고(mix), 종이가 화면에 고정된 동안 눌렀다(press) 떼면 붉은 자국이 남는다.
    gsap.to(S, { mix: 1, ease: 'power1.inOut', scrollTrigger: { trigger: '#reply', start: 'top 95%', end: 'top 2%', scrub: .6 } });
    const paper = document.getElementById('paper');
    let stamped = false;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#reply', start: 'top top', end: () => '+=' + Math.round(window.innerHeight * 0.9),
        pin: true, pinSpacing: true, scrub: .5, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: st => {
          const on = st.progress > .56;
          if (on === stamped) return;
          stamped = on; paper.classList.toggle('is-stamped', on);
          if (on) gsap.fromTo(paper, { y: 0 }, { y: 5, duration: .07, yoyo: true, repeat: 1, ease: 'power1.inOut' });
        }
      }
    });
    tl.to(S, { press: 1, duration: .55, ease: 'power2.in' })
      .to(S, { mix: 0, press: 0, nx: .35, ny: 1.8, s: .6, rx: -.9, ry: .6, rz: .1, duration: .45, ease: 'power2.in' }); // 찍은 뒤 위로 빠져나가 사라진다
  }

  /* 폰트 로딩 후 위치 재계산 */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
