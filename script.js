document.documentElement.classList.add('js-ready');

const header = document.querySelector('.site-header');
const year = document.querySelector('#current-year');
const revealElements = document.querySelectorAll('.reveal');
const whatsappLinks = document.querySelectorAll('.whatsapp-link');
const leadForm = document.querySelector('#lead-form');
const formStatus = document.querySelector('#form-status');
const phoneInput = document.querySelector('#whatsapp');

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

// Máscara visual simples para WhatsApp brasileiro; o valor continua legível sem JavaScript.
phoneInput?.addEventListener('input', (event) => {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 11);
  let formatted = digits;

  if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;

  event.target.value = formatted;
});

/*
  EVENTO DE CONVERSÃO — WHATSAPP
  Depois que a Google Tag for instalada, remova o comentário do bloco gtag abaixo
  e substitua AW-XXXXXXXXX/CONVERSION_LABEL pelos dados da conta Google Ads.
*/
function trackWhatsApp(location) {
  // gtag('event', 'conversion', {
  //   send_to: 'AW-XXXXXXXXX/CONVERSION_LABEL',
  //   event_category: 'whatsapp',
  //   event_label: location
  // });

  // Evento neutro também pode ser capturado via Google Tag Manager.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'whatsapp_click', cta_location: location });
}

whatsappLinks.forEach((link) => {
  link.addEventListener('click', () => trackWhatsApp(link.dataset.location || 'nao_identificado'));
});

/*
  EVENTO DE CONVERSÃO — FORMULÁRIO
  O formulário usa mailto como placeholder. Na publicação, conecte o atributo action
  do HTML ao CRM ou endpoint real e troque os IDs de conversão abaixo.
*/
leadForm?.addEventListener('submit', () => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'lead_form_submit', form_name: 'contato_comercial' });

  // gtag('event', 'conversion', {
  //   send_to: 'AW-XXXXXXXXX/FORM_CONVERSION_LABEL'
  // });

  if (formStatus) {
    formStatus.textContent = 'Dados validados. Abrindo seu aplicativo de e-mail para concluir o envio…';
  }
});
