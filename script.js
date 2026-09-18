document.documentElement.classList.add('js-ready');

const header = document.querySelector('.site-header');
const year = document.querySelector('#current-year');
const revealElements = document.querySelectorAll('.reveal');
const whatsappLinks = document.querySelectorAll('.whatsapp-link');
const clientsCarousel = document.querySelector('.clients-carousel');
const clientsViewport = document.querySelector('.clients-viewport');
const clientsTrack = document.querySelector('.clients-track');

if (year) year.textContent = new Date().getFullYear();

// Mantém o menu visível após a primeira dobra.
const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 90);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

// Animações sutis, sem dependências, desativadas automaticamente para quem prefere menos movimento.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

// Carrossel central com arraste, encaixe e repetição infinita.
if (clientsCarousel && clientsViewport && clientsTrack) {
  const sourceSlides = Array.from(clientsTrack.children).map((slide) => slide.cloneNode(true));
  const brandCount = sourceSlides.length;
  const carouselFragment = document.createDocumentFragment();

  for (let group = 0; group < 5; group += 1) {
    sourceSlides.forEach((sourceSlide) => {
      const slide = sourceSlide.cloneNode(true);
      if (group !== 2) {
        slide.setAttribute('aria-hidden', 'true');
        const image = slide.querySelector('img');
        if (image) image.alt = '';
      }
      carouselFragment.appendChild(slide);
    });
  }

  clientsTrack.replaceChildren(carouselFragment);

  const slides = Array.from(clientsTrack.children);
  let activeIndex = brandCount * 2;
  let currentTranslate = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartTranslate = 0;
  let dragStartIndex = activeIndex;
  let autoplayTimer = 0;

  const stopAutoplay = () => {
    window.clearTimeout(autoplayTimer);
    autoplayTimer = 0;
  };

  const scheduleAutoplay = () => {
    stopAutoplay();
    if (isDragging) return;
    autoplayTimer = window.setTimeout(() => {
      goToSlide(activeIndex + 1);
      scheduleAutoplay();
    }, 3000);
  };

  const updateActiveSlide = (index) => {
    activeIndex = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, slideIndex) => {
      const distance = Math.abs(slideIndex - activeIndex);
      slide.classList.toggle('is-active', distance === 0);
      slide.classList.toggle('is-near', distance === 1);
    });
  };

  const translateForSlide = (index) => {
    const slide = slides[index];
    return clientsViewport.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2);
  };

  const renderCarousel = () => {
    clientsTrack.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
  };

  const goToSlide = (index, animate = true) => {
    updateActiveSlide(index);
    clientsTrack.classList.toggle('no-transition', !animate);
    currentTranslate = translateForSlide(activeIndex);
    renderCarousel();

    if (!animate) {
      clientsTrack.getBoundingClientRect();
      clientsTrack.classList.remove('no-transition');
    }
  };

  const nearestSlide = () => {
    const viewportCenter = clientsViewport.clientWidth / 2 - currentTranslate;
    let nearestIndex = 0;
    let shortestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(slideCenter - viewportCenter);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  };

  const renderedTranslate = () => {
    const transform = window.getComputedStyle(clientsTrack).transform;
    if (!transform || transform === 'none') return currentTranslate;
    try {
      return new DOMMatrixReadOnly(transform).m41;
    } catch {
      return currentTranslate;
    }
  };

  clientsCarousel.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    stopAutoplay();
    isDragging = true;
    currentTranslate = renderedTranslate();
    dragStartX = event.clientX;
    dragStartTranslate = currentTranslate;
    dragStartIndex = nearestSlide();
    clientsCarousel.classList.add('is-dragging');
    clientsCarousel.setPointerCapture(event.pointerId);
    renderCarousel();
  });

  clientsCarousel.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    if (event.pointerType === 'mouse') event.preventDefault();
    currentTranslate = dragStartTranslate + event.clientX - dragStartX;
    renderCarousel();
    updateActiveSlide(nearestSlide());
  });

  const stopDragging = (event) => {
    if (!isDragging) return;
    const dragDistance = event.type === 'pointercancel' ? 0 : event.clientX - dragStartX;
    let targetIndex = nearestSlide();

    if (Math.abs(dragDistance) > 42 && targetIndex === dragStartIndex) {
      targetIndex += dragDistance < 0 ? 1 : -1;
    }

    isDragging = false;
    clientsCarousel.classList.remove('is-dragging');
    if (clientsCarousel.hasPointerCapture(event.pointerId)) clientsCarousel.releasePointerCapture(event.pointerId);
    goToSlide(targetIndex);
    scheduleAutoplay();
  };

  clientsCarousel.addEventListener('pointerup', stopDragging);
  clientsCarousel.addEventListener('pointercancel', stopDragging);
  clientsCarousel.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    stopAutoplay();
    goToSlide(activeIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    scheduleAutoplay();
  });

  clientsTrack.addEventListener('transitionend', (event) => {
    if (event.target !== clientsTrack || event.propertyName !== 'transform') return;
    const logicalIndex = ((activeIndex % brandCount) + brandCount) % brandCount;
    const middleIndex = brandCount * 2 + logicalIndex;
    if (middleIndex !== activeIndex) goToSlide(middleIndex, false);
  });

  window.addEventListener('resize', () => {
    const logicalIndex = ((activeIndex % brandCount) + brandCount) % brandCount;
    goToSlide(brandCount * 2 + logicalIndex, false);
  });

  goToSlide(activeIndex, false);
  scheduleAutoplay();
}

function trackWhatsApp(location) {

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'whatsapp_click', cta_location: location });
}

whatsappLinks.forEach((link) => {
  link.addEventListener('click', () => trackWhatsApp(link.dataset.location || 'nao_identificado'));
});
