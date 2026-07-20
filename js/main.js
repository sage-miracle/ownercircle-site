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

  /* ---- Recruit form: client-side only (no backend wired up) ---- */
  const handleForm = (form) => {
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const success = form.querySelector('.form__success');
      form.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
      if (success) success.hidden = false;
    });
  };
  handleForm(document.getElementById('recruitForm'));

  /* ---- CTA form: submits to /api/submit (Telegram + email) ---- */
  const ctaForm = document.getElementById('ctaForm');
  if (ctaForm) {
    ctaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!ctaForm.checkValidity()) {
        ctaForm.reportValidity();
        return;
      }

      const successEl = ctaForm.querySelector('.form__success');
      const errorEl = ctaForm.querySelector('.form__error');
      const fields = ctaForm.querySelectorAll('input, textarea, button');

      const data = new FormData(ctaForm);
      const payload = {
        name: data.get('name') || '',
        company: data.get('company') || '',
        phone: data.get('phone') || '',
        concern: data.get('concern') || '',
      };

      if (errorEl) errorEl.hidden = true;
      fields.forEach(el => el.disabled = true);

      try {
        const res = await fetch('/api/submit', {
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
  }

})();
