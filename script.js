(() => {
  const loader = document.querySelector('.loader');
  const loaderNumber = document.querySelector('.loader-number');
  const startedAt = performance.now();
  let loaderFinished = false;

  const countLoader = now => {
    const progress = Math.min(1, (now - startedAt) / 1350);
    loaderNumber.textContent = String(Math.round(progress * 100)).padStart(2, '0');
    if (progress < 1) window.requestAnimationFrame(countLoader);
  };
  window.requestAnimationFrame(countLoader);

  const finishLoader = () => {
    if (loaderFinished) return;
    loaderFinished = true;
    const remaining = Math.max(0, 1250 - (performance.now() - startedAt));
    window.setTimeout(() => loader.classList.add('done'), remaining);
  };

  window.addEventListener('load', finishLoader, { once: true });
  window.setTimeout(finishLoader, 1800);

  const revealTargets = document.querySelectorAll(
    '.section-kicker, .manifesto-title, .manifesto-text, .landscape-word, .landscape-note, .route-head, .route-card, .quote-mark, .quote-section blockquote, .quote-section > p, .finale-content > *'
  );
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

  revealTargets.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 5, 4) * 75}ms`;
    revealObserver.observe(element);
  });

  const hero = document.querySelector('.hero-image');
  const heroCopy = document.querySelector('.hero-title-wrap');
  const landscape = document.querySelector('.landscape-photo');
  const finale = document.querySelector('.finale-image');
  const atlas = document.querySelector('.scroll-atlas');
  const routeProgress = document.querySelector('.atlas-route-progress');
  const traveler = document.querySelector('.atlas-traveler');
  const mapPercent = document.querySelector('.atlas-percent');
  const currentName = document.querySelector('.atlas-current-name');
  const stopLinks = [...document.querySelectorAll('.atlas-stop-list a')];
  const pins = [...document.querySelectorAll('.atlas-pins circle')];
  const sectionStops = stopLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const stopNames = ['НАЧАЛО', 'ОСТРОВ', 'БЕРЕГ', 'МАРШРУТ', 'ПАУЗА', 'ФИНИШ'];
  const pathLength = routeProgress.getTotalLength();

  routeProgress.style.strokeDasharray = pathLength;
  routeProgress.style.strokeDashoffset = pathLength;

  let scrollFrame = false;
  const updateScrollWorld = () => {
    const y = window.scrollY;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pageProgress = Math.max(0, Math.min(1, y / maxScroll));
    const point = routeProgress.getPointAtLength(pathLength * pageProgress);

    routeProgress.style.strokeDashoffset = pathLength * (1 - pageProgress);
    traveler.setAttribute('cx', point.x);
    traveler.setAttribute('cy', point.y);
    mapPercent.textContent = `${String(Math.round(pageProgress * 100)).padStart(2, '0')}%`;

    let activeStop = 0;
    sectionStops.forEach((section, index) => {
      if (section.getBoundingClientRect().top < window.innerHeight * 0.48) activeStop = index;
    });
    stopLinks.forEach((link, index) => link.classList.toggle('active', index === activeStop));
    pins.forEach((pin, index) => pin.classList.toggle('active', index === activeStop));
    currentName.textContent = stopNames[activeStop] || stopNames[0];
    atlas.style.setProperty('--atlas-progress', pageProgress);

    if (hero && y < window.innerHeight * 1.15) {
      const heroProgress = Math.min(1, y / window.innerHeight);
      hero.style.backgroundPosition = `center calc(48% + ${y * 0.12}px)`;
      heroCopy.style.transform = `translate3d(0, ${y * 0.13}px, 0)`;
      heroCopy.style.opacity = String(1 - heroProgress * 0.72);
    }

    if (landscape) {
      const bounds = landscape.parentElement.getBoundingClientRect();
      const progress = (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height);
      landscape.style.transform = `scale(1.12) translate3d(0, ${(progress - 0.5) * -58}px, 0)`;
    }

    if (finale) {
      const bounds = finale.parentElement.getBoundingClientRect();
      const progress = (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height);
      finale.style.transform = `scale(1.06) translate3d(0, ${(progress - 0.5) * -44}px, 0)`;
    }

    scrollFrame = false;
  };

  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = true;
    window.requestAnimationFrame(updateScrollWorld);
  }, { passive: true });
  window.addEventListener('resize', updateScrollWorld, { passive: true });
  updateScrollWorld();

  const track = document.querySelector('.route-track');
  const cards = [...document.querySelectorAll('.route-card')];
  const sliderProgress = document.querySelector('.progress-track i');
  const sliderCurrent = document.querySelector('.slider-progress span');
  const previousButton = document.querySelector('.prev');
  const nextButton = document.querySelector('.next');
  const sliderWindow = document.querySelector('.slider-window');
  let cardIndex = 0;

  const cardStride = () => cards[0].getBoundingClientRect().width + 18;
  const visibleCardCount = () => Math.min(cards.length, Math.max(1, Math.floor(
    (track.parentElement.clientWidth + 18) / cardStride()
  )));
  const maxTranslate = () => Math.max(
    0,
    cards.length * cards[0].getBoundingClientRect().width + (cards.length - 1) * 18 - track.parentElement.clientWidth
  );
  const maxCardIndex = () => Math.max(0, cards.length - visibleCardCount());

  const updateSlider = () => {
    cardIndex = Math.max(0, Math.min(cardIndex, maxCardIndex()));
    const offset = Math.min(cardStride() * cardIndex, maxTranslate());
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    const visibleCards = visibleCardCount();
    sliderProgress.style.width = `${((cardIndex + visibleCards) / cards.length) * 100}%`;
    sliderCurrent.textContent = String(cardIndex + 1).padStart(2, '0');
    previousButton.disabled = cardIndex === 0;
    nextButton.disabled = cardIndex >= maxCardIndex();
    cards.forEach((card, index) => {
      if (index === cardIndex) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
    });
  };

  nextButton.addEventListener('click', () => { cardIndex += 1; updateSlider(); });
  previousButton.addEventListener('click', () => { cardIndex -= 1; updateSlider(); });
  sliderWindow.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      cardIndex += 1;
      updateSlider();
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      cardIndex -= 1;
      updateSlider();
    }
  });
  window.addEventListener('resize', updateSlider);

  let pointerStart = 0;
  let pointerLast = 0;
  let lastMoveAt = 0;
  let pointerVelocity = 0;
  let trackStart = 0;
  let dragging = false;

  track.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button,a')) return;
    pointerStart = event.clientX;
    pointerLast = event.clientX;
    lastMoveAt = performance.now();
    pointerVelocity = 0;
    trackStart = -Math.min(cardStride() * cardIndex, maxTranslate());
    dragging = true;
    track.classList.add('dragging');
    track.setPointerCapture(event.pointerId);
  });

  track.addEventListener('pointermove', event => {
    if (!dragging) return;
    const lowerBound = -maxTranslate();
    const stride = cardStride();
    const now = performance.now();
    const elapsed = Math.max(1, now - lastMoveAt);
    const instantVelocity = (event.clientX - pointerLast) / elapsed;
    pointerVelocity = pointerVelocity * 0.58 + instantVelocity * 0.42;
    pointerLast = event.clientX;
    lastMoveAt = now;

    const rawOffset = trackStart + event.clientX - pointerStart;
    let offset = rawOffset;
    if (rawOffset > 0) offset = Math.min(92, rawOffset * 0.24);
    if (rawOffset < lowerBound) offset = lowerBound - Math.min(92, (lowerBound - rawOffset) * 0.24);
    track.style.transform = `translate3d(${offset}px, 0, 0)`;
    const pressure = Math.min(1, Math.abs(event.clientX - pointerStart) / stride);
    track.style.setProperty('--swipe-saturation', (0.76 + pressure * 0.22).toFixed(2));
  });

  const finishDrag = event => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('dragging');
    const distance = event.clientX - pointerStart;
    if (Math.abs(distance) < 6) {
      track.style.removeProperty('--swipe-saturation');
      updateSlider();
      return;
    }
    const stride = cardStride();
    const momentum = Math.max(-stride * 0.85, Math.min(stride * 0.85, pointerVelocity * 190));
    let nextIndex = cardIndex + Math.round((-distance - momentum) / stride);

    if (Math.abs(distance) > stride * 0.22 && nextIndex === cardIndex) {
      nextIndex += distance < 0 ? 1 : -1;
    }

    cardIndex = nextIndex;
    track.style.removeProperty('--swipe-saturation');
    updateSlider();
  };

  track.addEventListener('pointerup', finishDrag);
  track.addEventListener('pointercancel', finishDrag);
  updateSlider();
})();

