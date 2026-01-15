document.addEventListener('DOMContentLoaded', () => {

  // ==========================
  // 1ая галерея (горизонтальная автопрокрутка)
  // ==========================
  const gallery = document.getElementById('gallery');
  if (gallery) {
    let scrollAmount = 0;
    const images = gallery.querySelectorAll('img');
    let totalWidth = 0;

    images.forEach(img => {
      const gap = 24;
      totalWidth += img.offsetWidth + gap;
    });

    function autoScroll() {
      const step = 474;
      scrollAmount += step;

      if (scrollAmount >= totalWidth - gallery.offsetWidth) scrollAmount = 0;

      gallery.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    }

    setInterval(autoScroll, 2500);
  }

// ==========================
  // 2ая галерея (вертикаль/горизонталь авто)
  // ==========================
  const menuLinks = document.querySelectorAll('.menu_list_link');
  const menuImages = document.querySelectorAll('.menu_image');
  const menuGallery = document.querySelector('.menu_gallery_wrapper');

  if (!menuLinks.length || !menuImages.length || !menuGallery) return;

  let activeIndex = 0;
  let isScrolling = false;

  // Определяем направление по реальному CSS (flex-direction)
  function isHorizontal() {
    const dir = getComputedStyle(menuGallery).flexDirection;
    return dir.includes('row'); // row или row-reverse
  }

  // Берём gap из CSS (чтобы не хардкодить 4/16)
  function getGapPx() {
    const gapStr = getComputedStyle(menuGallery).gap;
    const gap = parseFloat(gapStr);
    return Number.isFinite(gap) ? gap : 0;
  }

  function setActiveClasses(index) {
    menuLinks.forEach(l => l.classList.remove('active'));
    menuImages.forEach(img => img.classList.remove('active'));

    menuLinks[index].classList.add('active');
    menuImages[index].classList.add('active');
  }

  function scrollToIndex(index, smooth = true) {
    const gap = getGapPx();

    if (isHorizontal()) {
      const w = menuImages[0].offsetWidth;
      const left = index * (w + gap);

      menuGallery.scrollTo({
        left,
        behavior: smooth ? 'smooth' : 'auto'
      });
    } else {
      const h = menuImages[0].offsetHeight;
      const top = index * (h + gap);

      menuGallery.scrollTo({
        top,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }

  function activateSlide(index, smooth = true) {
    if (index < 0) index = 0;
    if (index >= menuImages.length) index = menuImages.length - 1;

    activeIndex = index;
    setActiveClasses(activeIndex);
    scrollToIndex(activeIndex, smooth);
  }

  // старт
  activateSlide(0, false);

  // клик по меню
  menuLinks.forEach((link, index) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      activateSlide(index, true);
    });
  });

  // колесо: один шаг = один слайд (и вертикаль, и горизонталь)
  menuGallery.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isScrolling) return;

    const delta = e.deltaY || e.deltaX;

    if (delta > 0) activateSlide(activeIndex + 1, true);
    else activateSlide(activeIndex - 1, true);

    isScrolling = true;
    setTimeout(() => { isScrolling = false; }, 450);
  }, { passive: false });

  // если при ресайзе направление сменилось (вертикаль→горизонталь),
  // то выравниваем текущий слайд под новую ось
  window.addEventListener('resize', () => {
    scrollToIndex(activeIndex, false);
  });

});

