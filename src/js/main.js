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

  // GA4 lead tracking on quote/demo CTAs
  document.querySelectorAll('[data-cta]').forEach(el => {
    el.addEventListener('click', function() {
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', { cta_location: this.dataset.cta });
      }
    });
  });

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