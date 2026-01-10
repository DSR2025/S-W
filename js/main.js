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
  // 2ая галерея (вертикальная с peek и плавным скроллом)
  // ==========================
  const menuLinks = document.querySelectorAll('.menu_list_link');
  const menuImages = document.querySelectorAll('.menu_image');
  const menuGallery = document.querySelector('.menu_gallery_wrapper');

  if (!menuLinks.length || !menuImages.length || !menuGallery) return;

  let activeIndex = 0;

  // функция активации слайда с плавным скроллом
  function activateSlide(index) {
    if (index < 0) index = 0;
    if (index >= menuImages.length) index = menuImages.length - 1;

    activeIndex = index;

    menuLinks.forEach(link => link.classList.remove('active'));
    menuImages.forEach(img => img.classList.remove('active'));

    menuLinks[activeIndex].classList.add('active');
    menuImages[activeIndex].classList.add('active');

    // Плавный скролл к верхнему краю с peek снизу
    const gap = 4; // gap между картинками
    const imgHeight = menuImages[0].offsetHeight;

    menuGallery.scrollTo({
      top: index * (imgHeight + gap),
      behavior: 'smooth'
    });
  }

  // активный слайд по умолчанию
  activateSlide(0);

  // клик по меню
  menuLinks.forEach((link, index) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      activateSlide(index);
    });
  });

  // прокрутка колесиком — один слайд
  let isScrolling = false; // блокируем повторный скролл пока идет анимация

  menuGallery.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isScrolling) return;

    if (e.deltaY > 0) {
      activateSlide(activeIndex + 1);
    } else {
      activateSlide(activeIndex - 1);
    }

    isScrolling = true;
    setTimeout(() => { isScrolling = false; }, 400); // задержка = время плавного скролла
  });

});