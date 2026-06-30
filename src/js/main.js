// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    function closeNav() {
      mainNav.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    }

    navToggle.addEventListener('click', function() {
      const open = mainNav.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    // Close the menu when a link is chosen
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeNav);
    });
  }

  // Quote form: expand on CTA click (intent event) + submit (lead event).
  // Two-step funnel — "open" is a top-of-funnel signal, "submit" is the real lead.
  (function initQuoteForm() {
    const wrap = document.querySelector('.quote-form-wrap');
    const form = document.getElementById('quote-form');
    const triggers = document.querySelectorAll('.js-quote-trigger');
    if (!wrap || !form || !triggers.length) return;

    const ENDPOINT = 'https://api.justcanvass.ca/api/public/lead';

    // Capture Google Ads click id for later conversion association; carry source url.
    const params = new URLSearchParams(window.location.search);
    const gclid = params.get('gclid') || params.get('wbraid') || params.get('gbraid') || '';
    const gclidField = form.querySelector('input[name="gclid"]');
    if (gclidField && gclid) gclidField.value = gclid;
    const srcField = form.querySelector('input[name="source_url"]');
    if (srcField) srcField.value = window.location.href;

    // Live-format Canadian postal codes: uppercase + space after the 3rd char (A1A 1A1)
    const postcode = form.querySelector('input[name="postcode"]');
    if (postcode) {
      postcode.addEventListener('input', function() {
        const raw = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        this.value = raw.length > 3 ? raw.slice(0, 3) + ' ' + raw.slice(3) : raw;
      });
    }

    // Estimated value of a submitted quote request — used for value-based bidding
    // on the "sale" tier. Real average lead value (CAD): ~avg customer value ×
    // lead-to-customer close rate. Revisit as conversion data accrues.
    const LEAD_VALUE = 100;

    // --- Tier 2 — ACTIVE INTEREST: form opened (fires at most once per page load) ---
    // Meta custom event + GA "lead start". Mark generate_lead_start as a SECONDARY
    // conversion in Google Ads (informs bidding, doesn't drive it).
    let openedFired = false;
    function fireOpenEvent(location) {
      if (openedFired) return;
      openedFired = true;
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead_start', { cta_location: location || 'unknown' });
      }
      if (typeof fbq === 'function') {
        fbq('trackCustom', 'QuoteFormOpened', { content_name: 'Quote & Demo', cta_location: location || 'unknown' });
      }
    }

    function openForm() {
      if (!wrap.hasAttribute('hidden')) return;
      wrap.hidden = false;
      requestAnimationFrame(() => wrap.classList.add('is-open'));
    }

    triggers.forEach(trigger => {
      trigger.addEventListener('click', function() {
        openForm();
        fireOpenEvent(this.dataset.cta);
        const section = document.getElementById('quote');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          const first = form.querySelector('input[name="name"]');
          if (first) first.focus({ preventScroll: true });
        }, 400);
      });
    });

    // --- Event 2: form submitted (the real Lead) ---
    const statusEl = form.querySelector('.quote-form__status');

    function setStatus(msg, kind) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.className = 'quote-form__status' + (kind ? ' is-' + kind : '');
    }

    // Unique id per lead so the browser event and any server-side (CAPI / Enhanced
    // Conversions) upload of the same lead DEDUPLICATE instead of double-counting.
    function makeEventId() {
      if (window.crypto && crypto.randomUUID) return 'lead_' + crypto.randomUUID();
      return 'lead_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    }

    // Identity attached to the conversion so Meta/Google can match it to the ad click
    // even when cookies are blocked (Advanced Matching / Enhanced Conversions). Platforms
    // hash these client-side; we just normalize. GA4 itself never receives PII.
    function userData(data) {
      const email = (data.email || '').trim().toLowerCase();
      const parts = (data.name || '').trim().split(/\s+/);
      const firstName = (parts[0] || '').toLowerCase();
      const lastName = (parts.length > 1 ? parts[parts.length - 1] : '').toLowerCase();
      const zip = (data.postcode || '').replace(/\s+/g, '').toLowerCase();
      return { email, firstName, lastName, zip };
    }

    // --- Tier 3 — "SALE" / high-intent: request submitted (the real conversion) ---
    // Carries a value so value-based bidding optimizes toward it, plus hashed-able
    // identity for match rate. Mark the Google Ads 'conversion' below as PRIMARY.
    function fireLeadEvent(data, eventId) {
      const u = userData(data);

      if (typeof gtag === 'function') {
        // Enhanced Conversions: Google hashes this before sending.
        gtag('set', 'user_data', {
          email: u.email,
          address: { first_name: u.firstName, last_name: u.lastName, postal_code: u.zip, country: 'CA' }
        });
        gtag('event', 'generate_lead', {
          cta_location: 'quote_form',
          position: data.position,
          value: LEAD_VALUE,
          currency: 'CAD',
          transaction_id: eventId
        });
        // Google Ads PRIMARY conversion — replace AW-…/LABEL with your real conversion label:
        // gtag('event', 'conversion', { send_to: 'AW-1742065915/XXXXXXXX', value: LEAD_VALUE, currency: 'CAD', transaction_id: eventId });
      }

      if (typeof fbq === 'function') {
        // Manual Advanced Matching: re-init with identity (Pixel hashes it), then track.
        fbq('init', '1879916476013854', { em: u.email, fn: u.firstName, ln: u.lastName, zp: u.zip, country: 'ca' });
        fbq('track', 'Lead',
          { content_name: 'Quote & Demo', value: LEAD_VALUE, currency: 'CAD' },
          { eventID: eventId });
      }
    }

    function showThanks() {
      form.innerHTML = '<div class="quote-form__thanks"><h3>Thanks — your request is in.</h3>' +
        '<p>We\'ll reply within one business day with a tailored quote and a demo time.</p></div>';
    }

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Honeypot: a filled hidden field means a bot — pretend success, send nothing.
      const hp = form.querySelector('.quote-form__hp input');
      if (hp && hp.value) { showThanks(); return; }

      if (!form.checkValidity()) { form.reportValidity(); return; }

      const submitBtn = form.querySelector('.quote-form__submit');
      submitBtn.disabled = true;
      setStatus('Sending…', '');

      const data = Object.fromEntries(new FormData(form).entries());
      delete data.company; // honeypot field, never sent
      data.event_id = makeEventId(); // shared dedup key for browser + server-side events

      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('bad status ' + res.status);
        fireLeadEvent(data, data.event_id);
        showThanks();
      } catch (err) {
        console.error('lead submit failed', err);
        submitBtn.disabled = false;
        setStatus('Something went wrong — please email hello@justcanvass.ca and we\'ll sort it out.', 'error');
      }
    });
  })();

  // Image carousel functionality
  const carouselItems = document.querySelectorAll('.carousel-item');
  let currentIndex = 0;
  
  function rotateCarousel() {
    // Remove active class from all items
    carouselItems.forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to next item
    currentIndex = (currentIndex + 1) % carouselItems.length;
    carouselItems[currentIndex].classList.add('active');
  }
  
  // Set interval to rotate carousel every 3 seconds (skip when there's only one slide)
  if (carouselItems.length > 1) {
    setInterval(rotateCarousel, 3000);
  }
  
  // Update copyright year
  const copyrightYear = document.getElementById('copyright-year');
  if (copyrightYear) {
    copyrightYear.textContent = new Date().getFullYear();
  }

  // Copy-to-clipboard buttons
  document.querySelectorAll('.copy-email').forEach(button => {
    let resetTimer;

    button.addEventListener('click', async function() {
      const text = this.getAttribute('data-copy');

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for non-secure contexts / older browsers
          const temp = document.createElement('textarea');
          temp.value = text;
          temp.style.position = 'fixed';
          temp.style.opacity = '0';
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          document.body.removeChild(temp);
        }

        this.classList.add('is-copied');
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => this.classList.remove('is-copied'), 2000);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    });
  });

  console.log('Just Canvass marketing page loaded!');
}); 