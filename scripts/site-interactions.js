document.addEventListener('DOMContentLoaded', () => {
  const beforeAfterBlocks = document.querySelectorAll('.before-after');

  beforeAfterBlocks.forEach((block) => {
    const after = block.querySelector('.before-after__after');
    const handle = block.querySelector('.before-after__handle');

    if (!after || !handle) return;

    let currentPercentage = 50;

    const setClip = (percentage) => {
      currentPercentage = Math.min(100, Math.max(0, percentage));
      after.style.clipPath = `inset(0 0 0 ${100 - currentPercentage}% )`;
      handle.style.left = `${currentPercentage}%`;
    };

    const updateFromClientX = (clientX) => {
      const bounds = block.getBoundingClientRect();
      const position = ((clientX - bounds.left) / bounds.width) * 100;
      setClip(position);
    };

    block.addEventListener('pointerdown', (event) => {
      block.setPointerCapture(event.pointerId);
      updateFromClientX(event.clientX);
    });

    block.addEventListener('pointermove', (event) => {
      if (event.pressure === 0 && event.buttons === 0) return;
      updateFromClientX(event.clientX);
    });

    block.addEventListener('pointerup', (event) => {
      block.releasePointerCapture(event.pointerId);
    });

    block.addEventListener('mouseenter', () => {
      block.classList.add('is-hovered');
    });

    block.addEventListener('mouseleave', () => {
      block.classList.remove('is-hovered');
      setClip(currentPercentage);
    });

    block.addEventListener('touchstart', (event) => {
      if (event.touches && event.touches.length) {
        updateFromClientX(event.touches[0].clientX);
      }
    }, { passive: true });

    block.addEventListener('touchmove', (event) => {
      if (event.touches && event.touches.length) {
        updateFromClientX(event.touches[0].clientX);
      }
    }, { passive: true });

    setClip(currentPercentage);
  });

  const videoButtons = document.querySelectorAll('.video-lightbox');
  if (videoButtons.length) {
    const createLightbox = (src) => {
      const overlay = document.createElement('div');
      overlay.className = 'video-overlay';
      overlay.innerHTML = `
        <div class="video-overlay__content" role="dialog" aria-modal="true">
          <button class="video-overlay__close" aria-label="Fechar vídeo">×</button>
          <video controls autoplay playsinline>
            <source src="${src}" type="video/mp4">
            Seu navegador não suporta a reprodução deste vídeo.
          </video>
        </div>
      `;
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      const remove = () => {
        overlay.classList.add('is-leaving');
        setTimeout(() => {
          overlay.remove();
          document.body.style.overflow = '';
        }, 200);
      };

      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) remove();
      });
      overlay.querySelector('.video-overlay__close').addEventListener('click', remove);
      document.addEventListener('keydown', function onKey(event) {
        if (event.key === 'Escape') {
          remove();
          document.removeEventListener('keydown', onKey);
        }
      });
    };

    videoButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const source = button.getAttribute('data-video');
        if (source) {
          createLightbox(source);
        }
      });
    });
  }

  const heroVideo = document.querySelector('.hero-video');
  const heroAudioButton = document.querySelector('.hero-audio');

  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.play().catch(() => {});
  }

  if (heroAudioButton && heroVideo) {
    heroAudioButton.addEventListener('click', () => {
      const isMuted = heroVideo.muted;
      heroVideo.muted = !isMuted;
      if (!heroVideo.paused) {
        heroVideo.play().catch(() => {});
      }
      heroAudioButton.classList.toggle('is-active', !heroVideo.muted);
      heroAudioButton.setAttribute('aria-pressed', String(!heroVideo.muted));
      heroAudioButton.querySelector('.hero-audio-icon').classList.toggle('is-active', !heroVideo.muted);
    });
  }

  const heroLaptop = document.querySelector('[data-hero-laptop]');
  if (heroLaptop) {
    const updateTilt = (event) => {
      const rect = heroLaptop.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateX = ((event.clientY - centerY) / rect.height) * -8;
      const rotateY = ((event.clientX - centerX) / rect.width) * 8;
      heroLaptop.style.setProperty('--hero-laptop-tilt-x', `${rotateY}deg`);
      heroLaptop.style.setProperty('--hero-laptop-tilt-y', `${rotateX}deg`);
    };

    const resetTilt = () => {
      heroLaptop.style.setProperty('--hero-laptop-tilt-x', '0deg');
      heroLaptop.style.setProperty('--hero-laptop-tilt-y', '0deg');
    };

    heroLaptop.addEventListener('mousemove', updateTilt);
    heroLaptop.addEventListener('mouseleave', resetTilt);
  }

  const photoshopHero = document.querySelector('[data-photoshop-hero]');
  if (photoshopHero) {
    const frame = photoshopHero.querySelector('[data-photoshop-frame]');
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const updateProgress = () => {
      const heroTop = photoshopHero.offsetTop;
      const heroHeight = photoshopHero.offsetHeight;
      const scrollY = window.scrollY;
      const activationOffset = window.innerHeight * 0.3;
      const span = heroHeight + activationOffset;
      let progress = (scrollY - heroTop + activationOffset) / span;
      progress = clamp(progress, 0, 1);
      if (frame) {
        frame.style.setProperty('--frame-parallax', progress.toFixed(3));
      }
    };

    let tickingFrame = false;
    const onScrollFrame = () => {
      if (!tickingFrame) {
        window.requestAnimationFrame(() => {
          updateProgress();
          tickingFrame = false;
        });
        tickingFrame = true;
      }
    };

    window.addEventListener('scroll', onScrollFrame, { passive: true });
    window.addEventListener('resize', updateProgress);
    window.addEventListener('load', updateProgress, { once: true });
    updateProgress();

    if (frame) {
      const handlePointer = (event) => {
        const rect = frame.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        const maxTiltX = 9;
        const maxTiltY = 7;
        frame.style.setProperty('--frame-tilt-x', `${(x * maxTiltX).toFixed(2)}deg`);
        frame.style.setProperty('--frame-tilt-y', `${(-y * maxTiltY).toFixed(2)}deg`);
      };

      const resetTilt = () => {
        frame.style.setProperty('--frame-tilt-x', '0deg');
        frame.style.setProperty('--frame-tilt-y', '0deg');
      };

      frame.addEventListener('pointermove', handlePointer);
      ['pointerleave', 'pointercancel', 'pointerup'].forEach((evt) => {
        frame.addEventListener(evt, resetTilt);
      });
    }
  }

  const panelCards = document.querySelectorAll('.panel-grid .panel-card');
  if (panelCards.length) {
    const activeClass = 'is-active';
    let currentActive = panelCards[0];
    currentActive.classList.add(activeClass);

    const grid = document.querySelector('.panel-grid');
    let positions = [];
    let boundaries = [];

    const recalcPositions = () => {
      if (!grid) return;
      const base = grid.getBoundingClientRect().top + window.scrollY;
      const cardHeights = Array.from(panelCards, (card) => card.getBoundingClientRect().height);
      positions = Array.from(panelCards, (card, index) => base + card.offsetTop + cardHeights[index] / 2);
      const holdOffset = Math.max(window.innerHeight * 0.2, 200);
      boundaries = positions.slice(0, -1).map((center, idx) => {
        const nextCenter = positions[idx + 1];
        const boundary = center + (nextCenter - center) * 0.5 + holdOffset;
        return Math.min(boundary, nextCenter - 12);
      });
    };

    const updateActivePanel = () => {
      if (!positions.length) return;
      const anchor = window.scrollY + window.innerHeight * 0.35;
      const nearPageEnd = window.scrollY + window.innerHeight >= document.body.scrollHeight - 6;
      let index = boundaries.findIndex((boundary) => anchor < boundary);
      if (index === -1 || nearPageEnd) index = panelCards.length - 1;
      const finalThreshold = positions[positions.length - 1] - window.innerHeight * 0.2;
      if (anchor >= finalThreshold) index = panelCards.length - 1;
      index = Math.max(0, index);

      const nextActive = panelCards[index];
      if (nextActive !== currentActive) {
        currentActive.classList.remove(activeClass);
        nextActive.classList.add(activeClass);
        currentActive = nextActive;
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActivePanel();
          ticking = false;
        });
        ticking = true;
      }
    };

    const onResize = () => {
      recalcPositions();
      updateActivePanel();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('load', onResize, { once: true });
    recalcPositions();
    updateActivePanel();
  }

  const galleryFigures = document.querySelectorAll('.gallery-grid figure');
  if (galleryFigures.length) {
    const revealClass = 'is-revealed';
    const galleryObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(revealClass);
        } else {
          entry.target.classList.remove(revealClass);
        }
      });
    }, {
      threshold: 0.35,
      rootMargin: '0px 0px -5% 0px'
    });

    galleryFigures.forEach((figure) => galleryObserver.observe(figure));
  }

  const faqItems = document.querySelectorAll('.ps-faq-item');
  if (faqItems.length) {
    faqItems.forEach((item) => {
      const toggle = item.querySelector('.ps-faq-toggle');
      const answer = item.querySelector('.ps-faq-answer');
      if (!toggle || !answer) return;

      const setOpen = (isOpen) => {
        item.classList.toggle('is-open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        answer.style.maxHeight = isOpen ? `${answer.scrollHeight}px` : '';
      };

      toggle.addEventListener('click', () => {
        const isOpen = !item.classList.contains('is-open');
        setOpen(isOpen);
      });

      setOpen(false);
    });
  }

  const hotspotSections = document.querySelectorAll('.guide-hotspots');
  hotspotSections.forEach((section) => {
    const tabs = Array.from(section.querySelectorAll('.guide-hotspot-tab'));
    const pins = Array.from(section.querySelectorAll('.guide-hotspot-pin'));
    const images = Array.from(section.querySelectorAll('.guide-hotspot-image'));
    const stage = section.querySelector('.guide-hotspot-stage');

    if (!tabs.length || !images.length) return;

    const animateElement = (element, keyframes, options) => {
      if (!element || !element.animate) return;
      element.animate(keyframes, options);
    };

    const resetTilt = () => {
      if (!stage) return;
      stage.classList.remove('is-tilting');
      stage.style.setProperty('--tilt-x', '0deg');
      stage.style.setProperty('--tilt-y', '0deg');
      stage.style.setProperty('--tilt-scale', '1');
    };

    if (stage) {
      let tiltTimeout;
      const handlePointerMove = (event) => {
        const rect = stage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        const maxTilt = 6;
        stage.classList.add('is-tilting');
        stage.style.setProperty('--tilt-x', `${x * maxTilt}deg`);
        stage.style.setProperty('--tilt-y', `${-y * maxTilt}deg`);
        stage.style.setProperty('--tilt-scale', '1.02');
        clearTimeout(tiltTimeout);
        tiltTimeout = setTimeout(resetTilt, 1600);
      };

      stage.addEventListener('pointermove', handlePointerMove);
      ['pointerleave', 'pointerup', 'pointercancel'].forEach((evt) => {
        stage.addEventListener(evt, resetTilt);
      });
    }

    const setActive = (target, force = false) => {
      if (!target) return;
      const previousTarget = section.dataset.activeTarget || tabs[0]?.dataset.target;
      if (!force && previousTarget === target) return;
      section.dataset.activeTarget = target;

      const previousImage = images.find((img) => img.dataset.target === previousTarget);
      const nextImage = images.find((img) => img.dataset.target === target);

      images.forEach((img) => {
        if (img.dataset.target === target) {
          img.classList.add('is-active');
        } else {
          img.classList.remove('is-active');
        }
        img.classList.remove('is-previous');
      });

      if (previousImage && previousImage !== nextImage) {
        previousImage.classList.add('is-previous');
        window.setTimeout(() => previousImage.classList.remove('is-previous'), 620);
      }

      tabs.forEach((tab) => {
        const isMatch = tab.dataset.target === target;
        tab.classList.toggle('is-active', isMatch);
        tab.setAttribute('aria-pressed', String(isMatch));
      });

      pins.forEach((pin) => {
        const isMatch = pin.dataset.target === target;
        pin.classList.toggle('is-active', isMatch);
        pin.setAttribute('aria-pressed', String(isMatch));
      });

      if (nextImage) {
        animateElement(
          nextImage,
          [
            { transform: 'scale(0.96) translateY(24px)', filter: 'blur(16px)', opacity: 0 },
            { transform: 'scale(1.02) translateY(-12px)', filter: 'blur(6px)', opacity: 0.6 },
            { transform: 'scale(1) translateY(0)', filter: 'blur(0)', opacity: 1 }
          ],
          { duration: 640, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        );
      }

      const nextTab = tabs.find((tab) => tab.dataset.target === target);
      if (nextTab) {
        animateElement(
          nextTab,
          [
            { transform: 'translateY(10px)', opacity: 0.5 },
            { transform: 'translateY(-4px)', opacity: 0.85 },
            { transform: 'translateY(0)', opacity: 1 }
          ],
          { duration: 420, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
        );
      }

      const nextPin = pins.find((pin) => pin.dataset.target === target);
      if (nextPin) {
        animateElement(
          nextPin,
          [
            { transform: 'translate(-50%, -50%) scale(0.8)' },
            { transform: 'translate(-50%, -50%) scale(1.08)' },
            { transform: 'translate(-50%, -50%) scale(1)' }
          ],
          { duration: 360, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
        );
      }
    };

    const handleClick = (event) => {
      const { target } = event.currentTarget.dataset;
      setActive(target);
    };

    tabs.forEach((tab) => tab.addEventListener('click', handleClick));
    pins.forEach((pin) => pin.addEventListener('click', handleClick));

    if (!section.dataset.activeTarget && tabs[0]) {
      section.dataset.activeTarget = tabs[0].dataset.target;
    }

    setActive(section.dataset.activeTarget, true);
  });

  const smokeSelectors = [
    '.section-title',
    '.section-subtitle',
    '.section-eyebrow',
    '.hero-description',
    '.hero-metadata-item',
    '.hero-floating-title',
    '.hero-floating-list li',
    '.hero-floating-cta',
    '.hero-photoshop__title',
    '.hero-photoshop__description',
    '.hero-photoshop__doubt',
    '.hero-photoshop__meta span',
    '.ps-benefit-card',
    '.panel-title',
    '.panel-lead',
    '.panel-list li',
    '.ps-modulo-card',
    '.ps-bonus-card',
    '.ps-pricing-card',
    '.ps-faq-item',
    '.ps-faq-toggle',
    '.timeline-item',
    '.timeline-marker__time',
    '.card-title',
    '.card-description',
    '.testimonial-card',
    '.faq-item',
    '.pricing-card',
    '.pricing-note',
    '.countdown-card',
    '.badge-pill',
    '.stat-card',
    '.cta-band-title',
    '.cta-band-copy span',
    '.workshop-intro p',
    '.guide-hotspot-tab__title',
    '.guide-hotspot-tab__copy',
    '.guide-module-card',
    '.guide-module-title',
    '.guide-module-lead',
    '.guide-module-points li',
    '.hero-photoshop__image',
    '.bio-links-header',
    '.bio-links-avatar',
    '.bio-links-intro > *',
    '.bio-links-bio li',
    '.bio-links-social a',
    '.bio-banner',
    '.bio-banner__content > *',
    '.bio-banner__badge',
    '.bio-banner__cta',
    '.bio-links-card__body > *',
    '.bio-links-cta'
  ];

  const smokeTargets = new Set();
  smokeSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => smokeTargets.add(element));
  });

  smokeTargets.forEach((element) => {
    if (!element.classList.contains('smoke-reveal')) {
      element.classList.add('smoke-reveal');
    }
  });

  if (smokeTargets.size) {
    const smokeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else {
          entry.target.classList.remove('is-visible');
        }
      });
    }, {
      threshold: 0.25,
      rootMargin: '0px 0px -10% 0px'
    });

    smokeTargets.forEach((element) => smokeObserver.observe(element));
  }

  const cards = document.querySelectorAll('.bio-links-card');
  if (cards.length) {
    const cardsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, {
      threshold: 0.01,
      rootMargin: '0px'
    });

    // Check initial visibility and observe
    const initCards = () => {
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight + 100 && rect.bottom > -100;
        if (isVisible) {
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            card.classList.add('is-visible');
          });
        }
        cardsObserver.observe(card);
      });
    };

    // Run immediately and also after a short delay as fallback
    initCards();
    setTimeout(initCards, 200);
  }

  const bioTrack = document.querySelector('[data-bio-track]');
  if (bioTrack) {
    const prevButton = document.querySelector('[data-bio-prev]');
    const nextButton = document.querySelector('[data-bio-next]');
    const dotsWrapper = document.querySelector('[data-bio-dots]');
    const cards = Array.from(bioTrack.querySelectorAll('.bio-links-card'));
    let activeIndex = 0;
    let dots = [];

    const clampIndex = (value) => Math.min(Math.max(value, 0), cards.length - 1);

    const buildDots = () => {
      if (!dotsWrapper) return;
      dotsWrapper.innerHTML = '';
      dots = cards.map((_, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = index === 0 ? 'is-active' : '';
        dot.setAttribute('aria-label', `Ir para o link ${index + 1}`);
        dot.addEventListener('click', () => focusCard(index));
        dotsWrapper.appendChild(dot);
        return dot;
      });
    };

    const setControlsState = () => {
      const isAtStart = activeIndex === 0;
      const isAtEnd = activeIndex === cards.length - 1;

      if (prevButton) {
        prevButton.classList.toggle('is-disabled', isAtStart);
        prevButton.toggleAttribute('disabled', isAtStart);
      }
      if (nextButton) {
        nextButton.classList.toggle('is-disabled', isAtEnd);
        nextButton.toggleAttribute('disabled', isAtEnd);
      }
      dots.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === activeIndex);
      });
    };

    const focusCard = (index, { instant = false } = {}) => {
      activeIndex = clampIndex(index);
      const targetCard = cards[activeIndex];
      if (!targetCard) return;

      const style = window.getComputedStyle(bioTrack);
      const paddingStart = parseFloat(style.paddingLeft || '0');
      const paddingEnd = parseFloat(style.paddingRight || '0');
      const availableWidth = bioTrack.clientWidth - (paddingStart + paddingEnd);
      const offset = targetCard.offsetLeft - paddingStart - (availableWidth - targetCard.clientWidth) / 2;
      const maxScroll = bioTrack.scrollWidth - bioTrack.clientWidth;
      const nextScroll = Math.max(0, Math.min(maxScroll, offset));

      bioTrack.scrollTo({
        left: nextScroll,
        behavior: instant ? 'auto' : 'smooth'
      });
      setControlsState();
    };

    let ticking = false;
    const syncFromScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const trackRect = bioTrack.getBoundingClientRect();
        let nearest = activeIndex;
        let nearestDistance = Number.POSITIVE_INFINITY;
        cards.forEach((card, index) => {
          const cardRect = card.getBoundingClientRect();
          const distance = Math.abs(cardRect.left - trackRect.left);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = index;
          }
        });
        if (nearest !== activeIndex) {
          activeIndex = nearest;
          setControlsState();
        }
        ticking = false;
      });
    };

    buildDots();
    setControlsState();
    focusCard(0, { instant: true });

    prevButton?.addEventListener('click', () => focusCard(activeIndex - 1));
    nextButton?.addEventListener('click', () => focusCard(activeIndex + 1));
    bioTrack.addEventListener('scroll', syncFromScroll, { passive: true });
    window.addEventListener('resize', () => focusCard(activeIndex, { instant: true }));
  }

  const ebookHero = document.querySelector('[data-ebook-hero]');
  if (ebookHero) {
    const bookStage = ebookHero.querySelector('.hero-book-stage');
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const setBookState = () => {
      const viewportHeight = window.innerHeight;
      const heroTop = ebookHero.offsetTop;
      const heroHeight = ebookHero.offsetHeight;
      const scrollY = window.scrollY;
      const activationOffset = viewportHeight * 0.5;
      const span = heroHeight + activationOffset;
      let progress = (scrollY - heroTop + activationOffset) / span;
      progress = clamp(progress, 0, 1);

      const coverAngle = -6 - progress * 150;
      const pageProgress = clamp((progress - 0.18) * 1.35, 0, 1);
      const pageAngle = -25 - pageProgress * 120;

      ebookHero.style.setProperty('--book-progress', progress.toFixed(3));
      ebookHero.style.setProperty('--cover-angle', `${coverAngle}deg`);
      ebookHero.style.setProperty('--page-angle', `${pageAngle}deg`);
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setBookState();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', setBookState);
    window.addEventListener('load', setBookState, { once: true });
    setBookState();

    if (bookStage) {
      let tiltTimeout;
      const resetTilt = () => {
        ebookHero.style.setProperty('--book-tilt-x', '0deg');
        ebookHero.style.setProperty('--book-tilt-y', '0deg');
      };

      bookStage.addEventListener('pointermove', (event) => {
        const rect = bookStage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        const maxTilt = 5.5;
        ebookHero.style.setProperty('--book-tilt-x', `${x * maxTilt}deg`);
        ebookHero.style.setProperty('--book-tilt-y', `${-y * maxTilt}deg`);
        clearTimeout(tiltTimeout);
        tiltTimeout = window.setTimeout(resetTilt, 720);
      });

      ['pointerleave', 'pointercancel', 'pointerup'].forEach((evt) => {
        bookStage.addEventListener(evt, resetTilt);
      });
    }
  }

  const TRACKED_PARAMS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'utm_id',
    'utm_source_platform',
    'utm_creative_format',
    'utm_adset',
    'utm_ad',
    'gclid',
    'fbclid'
  ];
  const ORIGIN_STORAGE_KEY = 'cm_origin_bio_link';
  const COUPON_STORAGE_KEY = 'cm_coupon_profile';
  const initialParams = new URLSearchParams(window.location.search);
  const navLinks = [
    { label: 'Home', href: '/index.html' },
    { label: 'Link da Bio', href: '/pages/links.html' },
    { label: 'Cursos', href: '/pages/curso-de-fotografia-de-celular.html' },
    { label: 'Photoshop', href: '/pages/curso-photoshop.html' },
    { label: 'Presets', href: '/pages/presets.html' },
    { label: 'Workshop', href: '/pages/wsp-2026.html' }
  ];

  const hasBioOrigin = () => window.sessionStorage.getItem(ORIGIN_STORAGE_KEY) === 'bio';

  const setBioOriginFromUrl = () => {
    const fromParam = initialParams.get('origin');
    if (fromParam === 'bio') {
      window.sessionStorage.setItem(ORIGIN_STORAGE_KEY, 'bio');
    } else if (fromParam && fromParam !== 'bio') {
      window.sessionStorage.removeItem(ORIGIN_STORAGE_KEY);
    }
    document.body.classList.toggle('has-bio-origin', hasBioOrigin());
  };

  const buildTrackedUrl = (targetHref, { preserveOrigin = true } = {}) => {
    const targetUrl = new URL(targetHref, window.location.origin);
    TRACKED_PARAMS.forEach((param) => {
      if (initialParams.has(param)) {
        targetUrl.searchParams.set(param, initialParams.get(param));
      }
    });
    if (preserveOrigin && hasBioOrigin() && !targetUrl.searchParams.has('origin')) {
      targetUrl.searchParams.set('origin', 'bio');
    }
    if (targetUrl.origin === window.location.origin) {
      return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
    }
    return targetUrl.toString();
  };

  const buildNavMarkup = (activePath) => navLinks.map((link) => {
    const url = new URL(link.href, window.location.origin);
    const isActive = activePath === url.pathname;
    return `
      <a class="site-global-header__link${isActive ? ' is-active' : ''}" href="${buildTrackedUrl(link.href)}"${isActive ? ' aria-current="page"' : ''}>
        ${link.label}
      </a>
    `;
  }).join('');

  const renderGlobalHeader = () => {
    const placeholder = document.querySelector('[data-site-header]');
    if (!placeholder) return null;

    const activePath = window.location.pathname.replace(/index\.html$/, '/index.html').replace(/\/{2,}/g, '/');
    const header = document.createElement('header');
    header.className = 'site-global-header';
    header.innerHTML = `
      <div class="site-global-header__inner">
        <a class="site-global-header__brand" href="${buildTrackedUrl('/index.html')}">
          Caroline Moschei
        </a>
        <nav class="site-global-header__nav" data-site-nav>
          ${buildNavMarkup(activePath)}
        </nav>
        <button class="site-global-header__toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="site-nav-drawer">
          <span class="sr-only">Abrir menu</span>
          <span class="site-global-header__toggle-bars" aria-hidden="true"></span>
        </button>
      </div>
      <div class="site-global-header__drawer" id="site-nav-drawer" data-site-nav-drawer>
        <nav class="site-global-header__drawer-nav">
          ${buildNavMarkup(activePath)}
        </nav>
      </div>
    `;

    placeholder.replaceWith(header);
    return header;
  };

  const collectAttributionData = () => {
    const params = new URLSearchParams(window.location.search);
    const attribution = {};
    TRACKED_PARAMS.forEach((param) => {
      if (params.has(param)) {
        attribution[param] = params.get(param);
      }
    });
    attribution.origin = params.get('origin') || (hasBioOrigin() ? 'bio' : 'direct');
    attribution.landing_path = window.location.pathname;
    attribution.landing_query = window.location.search || '';
    return attribution;
  };

  const bindNavigationInteractions = (header) => {
    if (!header) return;
    const toggle = header.querySelector('[data-nav-toggle]');
    const drawer = header.querySelector('[data-site-nav-drawer]');
    const drawerLinks = drawer ? Array.from(drawer.querySelectorAll('a')) : [];

    const closeDrawer = () => {
      header.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
      drawer?.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('nav-open');
    };

    const openDrawer = () => {
      header.classList.add('is-open');
      toggle?.setAttribute('aria-expanded', 'true');
      drawer?.setAttribute('aria-hidden', 'false');
      document.body.classList.add('nav-open');
    };

    toggle?.addEventListener('click', () => {
      if (header.classList.contains('is-open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    drawerLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (header.classList.contains('is-open')) {
          closeDrawer();
        }
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 960 && header.classList.contains('is-open')) {
        closeDrawer();
      }
    });

    window.addEventListener('keyup', (event) => {
      if (event.key === 'Escape' && header.classList.contains('is-open')) {
        closeDrawer();
      }
    });
  };

  const decorateBioLinks = () => {
    if (!document.body.classList.contains('page-links')) return;
    const anchors = document.querySelectorAll('.bio-links a[href]');
    anchors.forEach((anchor) => {
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('https://wa.me') || href.startsWith('tel:')) {
        return;
      }
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      url.searchParams.set('origin', 'bio');
      anchor.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
      anchor.dataset.originLink = 'bio';
    });
  };

  const ensureBioReturnButton = () => {
    const existingButton = document.querySelector('[data-bio-return]');
    if (!hasBioOrigin()) {
      existingButton?.remove();
      document.body.classList.remove('with-bio-return');
      return;
    }

    const buildReturnHref = () => buildTrackedUrl('/pages/links.html', { preserveOrigin: true });

    if (existingButton) {
      existingButton.setAttribute('href', buildReturnHref());
      document.body.classList.add('with-bio-return');
      return;
    }

    const button = document.createElement('a');
    button.className = 'bio-return-button';
    button.dataset.bioReturn = '';
    button.href = buildReturnHref();
    button.innerHTML = `
      <span class="bio-return-button__icon" aria-hidden="true">↩</span>
      <span class="bio-return-button__label">Voltar ao Link da Bio</span>
    `;
    document.body.appendChild(button);
    document.body.classList.add('with-bio-return');
  };

  const productCatalog = {
    'curso-mobile': {
      id: 'curso-mobile',
      title: 'Fotografia com Celular',
      benefit: 'Construa fotos premium usando apenas seu smartphone.',
      href: '/pages/curso-de-fotografia-de-celular.html',
      thumbnail: '/assets/raw-site/Foto3.jpg',
      checkout: '/redirect/whatsapp.html?cta=curso-mobile'
    },
    'curso-photoshop': {
      id: 'curso-photoshop',
      title: 'Tratamento de Pele no Photoshop',
      benefit: 'Fluxo completo com IA, actions exclusivas e textura preservada.',
      href: '/pages/curso-photoshop.html',
      thumbnail: '/assets/images/photoshop/curso-photoshop-after.jpg',
      checkout: 'https://pay.hotmart.com/U87081319C?off=ssyv8cln&checkoutMode=10&split=12&hideBillet=1&hideTransf=1&hidePayPal=1'
    },
    'guia-iluminacao': {
      id: 'guia-iluminacao',
      title: 'Guia de Iluminação de Estúdio',
      benefit: 'Diagramas prontos para montar qualquer set com segurança.',
      href: '/pages/guia-iluminacao.html',
      thumbnail: '/assets/images/guide/guia-iluminacao-page-07.jpg',
      checkout: 'https://pay.hotmart.com/D102526427D?checkoutMode=10'
    },
    'guia-corporativo': {
      id: 'guia-corporativo',
      title: 'Guia de Poses Corporativas',
      benefit: '200 poses dirigidas para retratos que transmitem autoridade.',
      href: '/pages/guia-fotografia-corporativa.html',
      thumbnail: '/assets/images/guia-corporativo/banner-desktop.png',
      checkout: 'https://pay.hotmart.com/D101774174K?off=7dh99r7u&checkoutMode=10'
    },
    presets: {
      id: 'presets',
      title: 'Presets Profissionais',
      benefit: 'Packs Lightroom com estética editorial para qualquer luz.',
      href: '/pages/presets.html',
      thumbnail: '/assets/raw-site/Foto6.jpg',
      checkout: '/redirect/whatsapp.html?cta=presets-pack'
    },
    workshop: {
      id: 'workshop',
      title: 'Workshop Presencial 2026',
      benefit: 'Vivência em estúdio com direção ao vivo e mentoria coletiva.',
      href: '/pages/wsp-2026.html',
      thumbnail: '/assets/raw-site/Foto2.jpg',
      checkout: 'https://pay.hotmart.com/V84544920A?off=f08i4kp5&checkoutMode=10'
    }
  };

  const renderRelatedProducts = () => {
    const section = document.querySelector('[data-related-section]');
    if (!section) return;
    const currentId = document.body.dataset.pageProduct;
    const desired = section.dataset.relatedProducts
      ? section.dataset.relatedProducts.split(',').map((id) => id.trim()).filter(Boolean)
      : [];

    const fallback = Object.keys(productCatalog).filter((id) => id !== currentId);
    const relatedIds = (desired.length ? desired : fallback).filter((id) => productCatalog[id]);
    const limitedIds = relatedIds.filter((id) => id !== currentId).slice(0, 5);

    if (!limitedIds.length) {
      section.remove();
      return;
    }

    const cards = limitedIds.map((id) => {
      const product = productCatalog[id];
      const href = buildTrackedUrl(product.href);
      return `
        <article class="related-card">
          <div class="related-card__media">
            <img src="${product.thumbnail}" alt="${product.title}" loading="lazy">
          </div>
          <div class="related-card__body">
            <h3 class="related-card__title">${product.title}</h3>
            <p class="related-card__benefit">${product.benefit}</p>
            <a class="related-card__cta" href="${href}" data-related-link>
              Ver detalhes
            </a>
          </div>
        </article>
      `;
    }).join('');

    section.innerHTML = `
      <div class="related-products__inner">
        <header class="related-products__head">
          <span class="related-products__tag">Produtos relacionados</span>
          <h2 class="related-products__title">Explore outras experiências que potencializam seus resultados</h2>
        </header>
        <div class="related-products__grid">
          ${cards}
        </div>
      </div>
    `;
  };

  const createCouponExperience = () => {
    const productId = document.body.dataset.pageProduct;
    if (!productId || !productCatalog[productId]) return;

    const product = productCatalog[productId];
    const banner = document.createElement('aside');
    banner.className = 'coupon-banner';
    banner.dataset.couponBanner = '';
    banner.innerHTML = `
      <div class="coupon-banner__media">
        <img src="/assets/raw-site/Foto1.jpg" alt="Caroline Moschei sorrindo" loading="lazy">
      </div>
      <div class="coupon-banner__content">
        <p class="coupon-banner__headline">Garanta seu cupom de 50% OFF</p>
        <p class="coupon-banner__copy">Oferta válida por tempo limitado para <strong>${product.title}</strong>.</p>
      </div>
      <button type="button" class="coupon-banner__cta" data-open-coupon>
        Quero meu desconto
      </button>
    `;

    const modal = document.createElement('div');
    modal.className = 'coupon-modal';
    modal.dataset.couponModal = '';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="coupon-modal__overlay" data-coupon-close tabindex="-1"></div>
      <div class="coupon-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="couponModalTitle">
        <button class="coupon-modal__close" type="button" data-coupon-close aria-label="Fechar">
          <span aria-hidden="true">×</span>
        </button>
        <div class="coupon-modal__content">
          <header class="coupon-modal__header">
            <span class="coupon-modal__badge">Cupom 50% OFF</span>
            <h2 class="coupon-modal__title" id="couponModalTitle">Resgate exclusivo para ${product.title}</h2>
            <p class="coupon-modal__subtitle">Complete as etapas e finalize sua inscrição com desconto.</p>
          </header>
          <form class="coupon-form" data-coupon-form novalidate>
            <section class="coupon-step is-active" data-step="1">
              <label class="coupon-field">
                <span class="coupon-field__label">Nome completo</span>
                <input type="text" name="fullName" data-coupon-name autocomplete="name" placeholder="Seu nome e sobrenome" required>
                <span class="coupon-field__hint">Utilize o mesmo nome que aparecerá no checkout.</span>
                <span class="coupon-field__error" data-error-message></span>
              </label>
              <div class="coupon-actions">
                <button type="button" class="coupon-button coupon-button--primary" data-coupon-next>
                  Continuar
                </button>
              </div>
            </section>

            <section class="coupon-step" data-step="2">
              <label class="coupon-field">
                <span class="coupon-field__label">WhatsApp</span>
                <input type="tel" name="whatsapp" data-coupon-phone inputmode="tel" autocomplete="tel" placeholder="+55 (11) 90000-0000" required>
                <div class="coupon-field__meta">
                  <span>DDI: <strong data-phone-ddi>+55</strong></span>
                  <span>DDD: <strong data-phone-ddd>--</strong></span>
                </div>
                <span class="coupon-field__hint">Formatação automática com base no seu país.</span>
                <span class="coupon-field__error" data-error-message></span>
              </label>
              <div class="coupon-actions">
                <button type="button" class="coupon-button coupon-button--ghost" data-coupon-prev>
                  Voltar
                </button>
                <button type="button" class="coupon-button coupon-button--primary" data-coupon-next>
                  Reservar cupom
                </button>
              </div>
            </section>

            <section class="coupon-step" data-step="3">
              <div class="coupon-success">
                <span class="coupon-success__icon" aria-hidden="true">🎉</span>
                <h3 class="coupon-success__title">Cupom reservado!</h3>
                <p class="coupon-success__message">
                  Seu cupom fica reservado pelos próximos 10 minutos. Finalize no checkout para confirmar a oferta.
                </p>
              </div>
              <div class="coupon-actions">
                <button type="button" class="coupon-button coupon-button--primary" data-coupon-finish>
                  Ir para o Checkout
                </button>
                <button type="button" class="coupon-button coupon-button--ghost" data-coupon-close>
                  Fechar
                </button>
              </div>
            </section>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(banner);
    document.body.appendChild(modal);

    const form = modal.querySelector('[data-coupon-form]');
    const steps = Array.from(form.querySelectorAll('.coupon-step'));
    const nameInput = form.querySelector('[data-coupon-name]');
    const phoneInput = form.querySelector('[data-coupon-phone]');
    const ddiTarget = form.querySelector('[data-phone-ddi]');
    const dddTarget = form.querySelector('[data-phone-ddd]');
    const nextButtons = form.querySelectorAll('[data-coupon-next]');
    const prevButton = form.querySelector('[data-coupon-prev]');
    const finishButton = form.querySelector('[data-coupon-finish]');
    const triggers = document.querySelectorAll('[data-open-coupon]');
    const closeElements = modal.querySelectorAll('[data-coupon-close]');
    let currentStep = 0;
    let capturedName = null;
    let capturedPhone = null;

    const readStoredProfile = () => {
      try {
        const rawProfile = window.sessionStorage.getItem(COUPON_STORAGE_KEY);
        return rawProfile ? JSON.parse(rawProfile) : {};
      } catch (error) {
        return {};
      }
    };

    const persistProfile = () => {
      const payload = {};
      if (capturedName) payload.name = capturedName;
      if (capturedPhone) payload.phone = capturedPhone;
      try {
        if (Object.keys(payload).length) {
          window.sessionStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(payload));
        } else {
          window.sessionStorage.removeItem(COUPON_STORAGE_KEY);
        }
      } catch (error) {
        // storage may be unavailable; safely ignore
      }
    };

    const applyPhoneMeta = ({ ddi, ddd } = {}) => {
      ddiTarget.textContent = `+${ddi || '55'}`;
      dddTarget.textContent = ddd || '--';
    };

    const applyStoredProfile = () => {
      const stored = readStoredProfile();
      if (stored.name) {
        capturedName = stored.name;
        nameInput.value = stored.name;
      }
      if (stored.phone && stored.phone.formatted) {
        capturedPhone = stored.phone;
        phoneInput.value = stored.phone.formatted;
        applyPhoneMeta(stored.phone);
      }
    };

    applyStoredProfile();

    const setStep = (index) => {
      currentStep = Math.min(Math.max(index, 0), steps.length - 1);
      steps.forEach((step, loopIndex) => {
        step.classList.toggle('is-active', loopIndex === currentStep);
      });
    };

    const focusCurrentField = () => {
      const activeStep = steps[currentStep];
      const field = activeStep?.querySelector('input');
      if (field) {
        window.requestAnimationFrame(() => field.focus());
      }
    };

    const setError = (input, message) => {
      const field = input.closest('.coupon-field');
      if (!field) return;
      const error = field.querySelector('[data-error-message]');
      if (message) {
        field.classList.add('has-error');
        if (error) error.textContent = message;
      } else {
        field.classList.remove('has-error');
        if (error) error.textContent = '';
      }
    };

    const formatPhoneValue = (rawValue) => {
      const digits = rawValue.replace(/\D/g, '');
      if (!digits) {
        return { formatted: '', ddi: '', ddd: '', number: '' };
      }

      let ddi = '';
      let rest = digits;
      if (rawValue.trim().startsWith('+')) {
        if (digits.length > 10) {
          ddi = digits.slice(0, digits.length - 10);
          rest = digits.slice(-10);
        }
      } else if (digits.length === 11) {
        ddi = '55';
      } else if (digits.length > 11) {
        ddi = digits.slice(0, digits.length - 10);
        rest = digits.slice(-10);
      } else {
        ddi = '55';
      }

      if (ddi === '55' && rest.length > 11) {
        rest = rest.slice(-11);
      }

      let ddd = '';
      let phone = rest;
      if (rest.length >= 10) {
        ddd = rest.slice(0, 2);
        phone = rest.slice(2);
      } else if (rest.length >= 9) {
        ddd = rest.slice(0, 2);
        phone = rest.slice(2);
      }

      const main = phone.length > 4
        ? `${phone.slice(0, phone.length - 4)}-${phone.slice(-4)}`
        : phone;

      const formatted = `+${ddi || '55'}${ddd ? ` (${ddd})` : ''} ${main}`.trim();
      return { formatted, ddi: ddi || '55', ddd, number: phone };
    };

    const validateStep = (index) => {
      if (index === 0) {
        const value = nameInput.value.trim();
        if (value.length < 6 || !value.includes(' ')) {
          setError(nameInput, 'Informe nome e sobrenome.');
          return false;
        }
        setError(nameInput, '');
        capturedName = value;
      persistProfile();
      }

      if (index === 1) {
        const { formatted, ddi, ddd, number } = formatPhoneValue(phoneInput.value);
        if (!number || number.length < 7 || !ddd) {
          setError(phoneInput, 'Digite um WhatsApp válido com DDD.');
          return false;
        }
        setError(phoneInput, '');
        phoneInput.value = formatted;
      applyPhoneMeta({ ddi, ddd });
        capturedPhone = { ddi, ddd, number, formatted };
      persistProfile();
      }

      return true;
    };

    phoneInput.addEventListener('input', () => {
      const { formatted, ddi, ddd } = formatPhoneValue(phoneInput.value);
      if (formatted !== phoneInput.value) {
        phoneInput.value = formatted;
      }
      applyPhoneMeta({ ddi, ddd });
    });

    nextButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (!validateStep(currentStep)) return;
        setStep(currentStep + 1);
        focusCurrentField();
      });
    });

    prevButton?.addEventListener('click', () => {
      setStep(currentStep - 1);
      focusCurrentField();
    });

    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    };

    const openModal = () => {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      setStep(0);
      focusCurrentField();
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        openModal();
      });
    });

    closeElements.forEach((element) => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        closeModal();
      });
    });

    modal.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    });

    finishButton?.addEventListener('click', () => {
      const checkoutAttr = document.body.dataset.hotmartCheckout || product.checkout;
      const checkoutUrl = buildTrackedUrl(checkoutAttr || product.checkout);
      persistProfile();
      const leadEvent = new CustomEvent('coupon:reserved', {
        detail: {
          product: productId,
          name: capturedName,
          phone: capturedPhone,
          checkout: checkoutUrl
        }
      });
      window.dispatchEvent(leadEvent);
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({
          event: 'coupon_reservado',
          product: productId,
          checkout_url: checkoutUrl,
          origin: hasBioOrigin() ? 'bio' : 'direct'
        });
      }
      window.location.href = checkoutUrl;
    });

    setTimeout(() => {
      banner.classList.add('is-visible');
    }, 1800);
  };

  const decorateRelatedLinks = () => {
    document.querySelectorAll('[data-related-link]').forEach((anchor) => {
      anchor.setAttribute('href', buildTrackedUrl(anchor.getAttribute('href') || '#'));
    });
  };

  const propagateOriginToLinks = () => {
    if (!hasBioOrigin()) return;
    const selectors = ['a[href^="/pages/"]', 'a[href^="/index"]'];
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((anchor) => {
        anchor.setAttribute('href', buildTrackedUrl(anchor.getAttribute('href') || '#'));
      });
    });
  };

  const initOrcamentosPage = () => {
    if (!document.body.classList.contains('page-orcamentos')) return;
    const cta = document.querySelector('[data-orcamentos-cta]');
    const status = document.querySelector('[data-orcamentos-status]');
    if (!cta) return;

    const whatsappUrl = '/redirect/whatsapp.html?cta=links-orcamentos';
    const defaultStatusMessage = 'Você será redirecionado para o time de atendimento enquanto registramos os dados da sua campanha.';
    if (status && !status.textContent.trim()) {
      status.textContent = defaultStatusMessage;
    }

    const setLoadingState = (isLoading) => {
      cta.classList.toggle('is-loading', isLoading);
      cta.setAttribute('aria-busy', String(isLoading));
      cta.setAttribute('aria-disabled', String(isLoading));
    };

    const sendMetaEvent = async () => {
      const attribution = collectAttributionData();
      const eventId = (window.crypto && typeof window.crypto.randomUUID === 'function')
        ? window.crypto.randomUUID()
        : `orc-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

      const payload = {
        event_id: eventId,
        event_name: 'Lead',
        event_source_url: window.location.href,
        attribution
      };

      try {
        await fetch('/api/meta-orcamentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        });
      } catch (error) {
        // Falha silenciosa: não bloqueia o redirecionamento
      }
    };

    cta.addEventListener('click', (event) => {
      event.preventDefault();
      if (cta.classList.contains('is-loading')) return;
      setLoadingState(true);
      if (status) {
        status.textContent = 'Conectando você com o time de atendimento no WhatsApp...';
      }

      // Dispara o envio e, em paralelo, redireciona após um pequeno delay de segurança
      sendMetaEvent();
      window.setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 400);
    });
  };

  setBioOriginFromUrl();
  const header = renderGlobalHeader();
  bindNavigationInteractions(header);
  decorateBioLinks();
  ensureBioReturnButton();
  const metaCarousel = document.querySelector('[data-meta-carousel]');
  if (metaCarousel) {
    const items = Array.from(metaCarousel.children);
    if (items.length) {
      items.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.classList.add('is-clone');
        metaCarousel.appendChild(clone);
      });
    }

    const getStepSize = () => {
      const first = metaCarousel.querySelector('.meta-pill');
      if (!first) return metaCarousel.clientWidth;
      const rect = first.getBoundingClientRect();
      const styles = window.getComputedStyle(metaCarousel);
      const gap = parseFloat(styles.columnGap || styles.gap || '0');
      return rect.width + gap;
    };

    let intervalId;
    let resumeTimeout;

    const pauseAuto = () => {
      clearInterval(intervalId);
      clearTimeout(resumeTimeout);
    };

    const startAuto = () => {
      pauseAuto();
      intervalId = setInterval(() => {
        const stepSize = getStepSize();
        const maxScroll = metaCarousel.scrollWidth - metaCarousel.clientWidth;
        if (metaCarousel.scrollLeft + stepSize >= maxScroll - 2) {
          metaCarousel.scrollTo({ left: 0 });
        } else {
          metaCarousel.scrollBy({ left: stepSize, behavior: 'smooth' });
        }
      }, 2600);
    };

    const resumeAuto = () => {
      pauseAuto();
      resumeTimeout = setTimeout(startAuto, 3500);
    };

    metaCarousel.addEventListener('pointerdown', pauseAuto);
    metaCarousel.addEventListener('touchstart', pauseAuto, { passive: true });
    metaCarousel.addEventListener('pointerup', resumeAuto);
    metaCarousel.addEventListener('touchend', resumeAuto, { passive: true });
    metaCarousel.addEventListener('mouseleave', resumeAuto);
    metaCarousel.addEventListener('focusin', pauseAuto);
    metaCarousel.addEventListener('focusout', resumeAuto);

    startAuto();
  }

  const initSnow = () => {
    const layer = document.querySelector('.snow-layer');
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!layer || prefersReducedMotion) return;

    const flakeCount = 40;
    for (let index = 0; index < flakeCount; index += 1) {
      const flake = document.createElement('span');
      flake.className = 'snowflake';
      flake.textContent = '•';
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.fontSize = `${8 + Math.random() * 6}px`;
      flake.style.animationDelay = `${Math.random() * 10}s`;
      flake.style.animationDuration = `${10 + Math.random() * 10}s`;
      flake.style.opacity = `${0.18 + Math.random() * 0.32}`;
      layer.appendChild(flake);
    }
  };

  renderRelatedProducts();
  decorateRelatedLinks();
  propagateOriginToLinks();
  initOrcamentosPage();
  createCouponExperience();
  initSnow();
});
