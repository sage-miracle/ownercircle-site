(() => {
  'use strict';

  /* ---- Sticky nav state ---- */
  const nav = document.getElementById('siteNav');
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 30);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile nav toggle ---- */
  const navToggle = document.getElementById('navToggle');
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
  });
  document.querySelectorAll('.nav__mobile a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---- Scroll reveal ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---- Shared: submit a form to a JSON API endpoint (Telegram + email) ---- */
  const wireApiForm = (form, endpoint, buildPayload) => {
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const successEl = form.querySelector('.form__success');
      const errorEl = form.querySelector('.form__error');
      const fields = form.querySelectorAll('input, textarea, button');

      const payload = buildPayload(new FormData(form));

      if (errorEl) errorEl.hidden = true;
      fields.forEach(el => el.disabled = true);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json().catch(() => ({ ok: false }));
        if (!res.ok || !result.ok) throw new Error(result.message || 'submit failed');
        if (successEl) successEl.hidden = false;
      } catch (err) {
        fields.forEach(el => el.disabled = false);
        if (errorEl) errorEl.hidden = false;
      }
    });
  };

  wireApiForm(document.getElementById('ctaForm'), '/api/submit', (data) => ({
    name: data.get('name') || '',
    company: data.get('company') || '',
    phone: data.get('phone') || '',
    concern: data.get('concern') || '',
  }));

  wireApiForm(document.getElementById('recruitForm'), '/api/apply', (data) => ({
    name: data.get('name') || '',
    phone: data.get('phone') || '',
    position: data.get('position') || '',
    exp: data.getAll('exp'),
    intro: data.get('intro') || '',
  }));

})();
