(function () {
  'use strict';

  /* ═══════════════════════════════════════════
     ELEMENTS
     ═══════════════════════════════════════════ */
  const slides  = Array.from(document.querySelectorAll('.slide'));
  const navFill = document.querySelector('.nav-fill');
  const navTrack = document.querySelector('.nav-track');
  const TOTAL   = slides.length;

  let activeIndex = 0;
  let numBtns = []; // populated by initProgressNumbers


  /* ═══════════════════════════════════════════
     CLICKABLE SLIDE NUMBERS — inject into nav
     ═══════════════════════════════════════════ */
  function initProgressNumbers() {
    var container = document.getElementById('progress-numbers');
    if (!container) return;

    slides.forEach(function (slide, i) {
      var btn = document.createElement('button');
      btn.className = 'progress-num';
      btn.textContent = String(i + 1).padStart(2, '0');
      btn.setAttribute('aria-label', 'Slide ' + (i + 1));
      btn.setAttribute('type', 'button');

      btn.addEventListener('click', function () {
        goTo(i);
      });

      container.appendChild(btn);
      numBtns.push(btn);
    });
  }


  /* ═══════════════════════════════════════════
     PROGRESS BAR — sync fill + active number
     ═══════════════════════════════════════════ */
  function setProgress(index) {
    activeIndex = index;
    const pct = ((index + 1) / TOTAL) * 100;

    navFill.style.width = pct + '%';
    navTrack.setAttribute('aria-valuenow', index + 1);

    // Sync active number button
    numBtns.forEach(function (btn, i) {
      btn.classList.toggle('is-active', i === index);
      btn.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
  }


  /* ═══════════════════════════════════════════
     INTERSECTION OBSERVER — detect active slide
     Works for both forward and backward scroll
     ═══════════════════════════════════════════ */
  const slideObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const i = slides.indexOf(entry.target);
          setProgress(i);
        }
      });
    },
    {
      // Fire when slide covers >50% of the viewport
      threshold: 0.5
    }
  );

  slides.forEach(function (slide) {
    slideObserver.observe(slide);
  });


  /* ═══════════════════════════════════════════
     PROGRAMMATIC NAVIGATION
     ═══════════════════════════════════════════ */
  function goTo(index) {
    if (index < 0 || index >= TOTAL) return;
    slides[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }


  /* ═══════════════════════════════════════════
     KEYBOARD NAVIGATION
     ↓ / → / Space  → next slide
     ↑ / ←          → previous slide
     Shift+Space     → previous slide
     Home / End      → first / last slide
     ═══════════════════════════════════════════ */
  document.addEventListener('keydown', function (e) {
    // Skip if focus is in an input
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
      case 'PageDown':
        e.preventDefault();
        goTo(activeIndex + 1);
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        goTo(activeIndex - 1);
        break;

      case ' ':
        e.preventDefault();
        goTo(e.shiftKey ? activeIndex - 1 : activeIndex + 1);
        break;

      case 'Home':
        e.preventDefault();
        goTo(0);
        break;

      case 'End':
        e.preventDefault();
        goTo(TOTAL - 1);
        break;
    }
  });


  /* ═══════════════════════════════════════════
     METRIC BARS — animate when outcomes slide
     enters the viewport
     ═══════════════════════════════════════════ */
  const fills = document.querySelectorAll('.metric-fill');

  if (fills.length) {
    const metricObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const fill = entry.target;
            fill.style.width = (parseFloat(fill.dataset.width) || 0) + '%';
            fill.classList.add('animated');
            metricObserver.unobserve(fill);
          }
        });
      },
      { threshold: 0.3 }
    );

    fills.forEach(function (fill) {
      fill.style.width = '0%'; // start collapsed
      metricObserver.observe(fill);
    });
  }


  /* ═══════════════════════════════════════════
     SOLUTION CARDS — interactive item switching
     ═══════════════════════════════════════════ */
  document.querySelectorAll('.solution-nav').forEach(function (nav) {
    nav.addEventListener('click', function (e) {
      var item = e.target.closest('.solution-item');
      if (!item) return;

      var card     = nav.closest('.solution-card');
      var targetId = item.dataset.target;

      nav.querySelectorAll('.solution-item').forEach(function (i) {
        i.classList.remove('is-active');
      });
      item.classList.add('is-active');

      card.querySelectorAll('.solution-panel').forEach(function (p) {
        p.classList.remove('is-active');
      });
      var panel = document.getElementById(targetId);
      if (panel) panel.classList.add('is-active');
    });
  });


  /* ═══════════════════════════════════════════
     FULL-SCREEN IMAGE MODAL
     • Click any image  → opens modal
     • Click modal img  → toggles 2× zoom
     • Click backdrop   → closes
     • Press Escape     → closes
     ═══════════════════════════════════════════ */
  (function initModal() {
    // Build modal DOM once
    var modal    = document.createElement('div');
    modal.className = 'img-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Image preview');
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML =
      '<button class="img-modal__close" aria-label="Close preview">✕</button>' +
      '<img class="img-modal__img" src="" alt="" />' +
      '<span class="img-modal__hint">Click image to zoom · Esc to close</span>';

    document.body.appendChild(modal);

    var modalImg  = modal.querySelector('.img-modal__img');
    var closeBtn  = modal.querySelector('.img-modal__close');

    function openModal(src, alt) {
      modalImg.src = src;
      modalImg.alt = alt || '';
      modalImg.classList.remove('is-zoomed');
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      // Small delay before clearing src so fade-out plays fully
      setTimeout(function () { modalImg.src = ''; }, 300);
    }

    // Wire up every img on the page (excluding the modal img itself)
    document.querySelectorAll('img:not(.img-modal__img)').forEach(function (img) {
      img.addEventListener('click', function () {
        openModal(img.src, img.alt);
      });
    });

    // Click modal image → toggle zoom
    modalImg.addEventListener('click', function (e) {
      e.stopPropagation();
      modalImg.classList.toggle('is-zoomed');
    });

    // Click backdrop (not the image) → close
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    // Close button
    closeBtn.addEventListener('click', closeModal);

    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  })();


  /* ═══════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════ */
  initProgressNumbers(); // must run before setProgress
  setProgress(0);

})();
