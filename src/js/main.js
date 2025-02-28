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
  
  // Set interval to rotate carousel every 3 seconds
  setInterval(rotateCarousel, 3000);
  
  // You can add more JavaScript functionality here
  console.log('JustCanvass marketing page loaded!');
}); 