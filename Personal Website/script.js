// Main interactive behaviours: lightbox accessibility, form handling, back-to-top
(function () {
  // --- Lightbox / modal for project screenshots with focus-trap ---
  const thumbs = Array.from(document.querySelectorAll('.thumb'));
  const lightbox = document.getElementById('lightbox');
  const lbImg = lightbox.querySelector('.lightbox-img');
  const lbCaption = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');
  const focusableSelector = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let currentIndex = -1;
  let lastFocused = null;

  function getLightboxFocusable() {
    return Array.from(lightbox.querySelectorAll(focusableSelector)).filter(el => el.offsetParent !== null);
  }

  const openAt = (index) => {
    if (index < 0 || index >= thumbs.length) return;
    const thumb = thumbs[index];
    const full = thumb.dataset.full || thumb.src;
    lbImg.src = full;
    lbImg.alt = thumb.alt || 'Project screenshot';
    lbCaption.textContent = thumb.getAttribute('alt') || `Image ${index + 1}`;
    currentIndex = index;
    lastFocused = document.activeElement;
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-modal', 'true');
    // focus first meaningful control
    const focusables = getLightboxFocusable();
    if (focusables.length) focusables[0].focus();
  };

  const close = () => {
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.classList.remove('open');
    lightbox.removeAttribute('aria-modal');
    lbImg.src = '';
    currentIndex = -1;
    // restore focus to where it was
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  };

  const showPrev = () => openAt((currentIndex - 1 + thumbs.length) % thumbs.length);
  const showNext = () => openAt((currentIndex + 1) % thumbs.length);

  thumbs.forEach((el, i) => {
    el.addEventListener('click', (e) => { e.preventDefault(); openAt(i); });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAt(i); }
    });
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', showPrev);
  nextBtn.addEventListener('click', showNext);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  // keyboard handling and focus trap
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); showPrev(); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); showNext(); return; }
    if (e.key === 'Tab') {
      const focusables = getLightboxFocusable();
      if (!focusables.length) { e.preventDefault(); return; }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  // --- Contact form handling (Formspree + mailto fallback) ---
  const form = document.getElementById('contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      if (!submitBtn) return;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      const action = form.action;
      try {
        const formData = new FormData(form);
        const res = await fetch(action, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          status.textContent = 'Thanks — your message has been sent.';
          form.reset();
          setTimeout(() => status.textContent = '', 6000);
        } else {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Network response was not ok');
        }
      } catch (err) {
        // mailto fallback
        const name = encodeURIComponent(form.elements['name']?.value || '');
        const email = encodeURIComponent(form.elements['email']?.value || '');
        const message = encodeURIComponent(form.elements['message']?.value || '');
        const subject = encodeURIComponent('Portfolio contact from ' + (name || email || 'visitor'));
        const body = encodeURIComponent(`Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0A${message}`);
        const mailto = `mailto:${form.querySelector('.contact-fallback a')?.getAttribute('href')?.replace('mailto:','') || 'hello@example.com'}?subject=${subject}&body=${body}`;
        status.innerHTML = 'Could not send online. <a href="' + mailto + '">Send via email</a>'; 
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send message';
      }
    });
  }

  // --- Back to top button ---
  const backBtn = document.getElementById('back-to-top');
  if (backBtn) {
    const toggle = () => { backBtn.classList.toggle('visible', window.scrollY > 320); };
    window.addEventListener('scroll', toggle);
    toggle();
    backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Enable smooth scrolling for anchors
  try { document.documentElement.style.scrollBehavior = 'smooth'; } catch (e) {}

})();

// Simple scroll observer to add .is-visible to sections as they enter the viewport
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const sections = document.querySelectorAll('.section');
  if (!('IntersectionObserver' in window)) {
    sections.forEach(s => s.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  sections.forEach(s => io.observe(s));
})();
