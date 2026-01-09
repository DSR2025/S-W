document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  let scrollAmount = 0;
  const images = gallery.querySelectorAll('img');
  let totalWidth = 0;

  images.forEach(img => {
    const gap = 24;
    totalWidth += img.offsetWidth + gap;
  });

  function autoScroll() {
    const step = 474; // шаг прокрутки
    scrollAmount += step;

    if(scrollAmount >= totalWidth - gallery.offsetWidth){
      scrollAmount = 0; // возвращаемся в начало
    }

    gallery.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });
  }

  setInterval(autoScroll, 2500);
});