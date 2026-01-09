document.addEventListener('DOMContentLoaded', () => {

  /********** ЯЗЫКОВОЙ ПЕРЕКЛЮЧАТЕЛЬ **********/
  const wrapper = document.querySelector(".header_language_wrapper");
  const button = wrapper.querySelector(".language_btn");
  const currentLangSpan = wrapper.querySelector(".current_lang");
  const menu = wrapper.querySelector(".language_menu");
  const items = menu.querySelectorAll("li");
  let currentLang = currentLangSpan.textContent.trim();

  // Показ / скрытие меню
  button.addEventListener("click", () => {
    wrapper.classList.toggle("active");
    updateMenu();
  });

  // Выбор языка
  items.forEach(item => {
    item.addEventListener("click", () => {
      currentLang = item.dataset.lang;
      currentLangSpan.textContent = currentLang;
      wrapper.classList.remove("active");
      updateMenu();
    });
  });

  // Фильтрация меню — скрываем текущий язык
  function updateMenu() {
    items.forEach(item => {
      item.style.display = item.dataset.lang === currentLang ? "none" : "block";
    });
  }

  // Закрытие при клике вне меню
  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      wrapper.classList.remove("active");
    }
  });

  updateMenu();

  /********** РАСКРЫВАЮЩИЕСЯ СЕКЦИИ **********/
  const physicsWrappers = document.querySelectorAll('.prod_settings_physics_btn_wrapper');

  physicsWrappers.forEach(wrapper => {
    const btn = wrapper.querySelector('.prod_settings_btn');
    const svg = btn.querySelector('svg');
    const nextSection = wrapper.nextElementSibling;

    btn.addEventListener('click', (e) => {
      e.preventDefault();

      if (
        nextSection &&
        (
          nextSection.classList.contains('table-wrapper') ||
          nextSection.classList.contains('prod_terms_use_wrapper') ||
          nextSection.classList.contains('prod_gidroiz_use') ||
          nextSection.classList.contains('tech-specs-wrapper')
        )
      ) {
        nextSection.classList.toggle('active');
        wrapper.classList.toggle('active');
        svg.classList.toggle('rotated');
      }
    });
  });

  /********** ПЕРЕКЛЮЧЕНИЕ КОНТЕНТА **********/
  const buttons = document.querySelectorAll('.prod_nav_btn');
  const mastikaContent = document.querySelector('.prod_content_mastika');
  const gidroContent = document.querySelector('.prod_content_gidroiz');
  const mobileLeftBtn = document.querySelector('.button_left_wrapper');
  const mobileRightBtn = document.querySelector('.button_right_wrapper');
  const nameMastika = document.querySelector('.name_mastika');
  const nameGidro = document.querySelector('.name_gidroiz');

  function showContent(target) {
    buttons.forEach(b => b.classList.remove('active'));

    if (target === 'mastika') {
      mastikaContent.style.display = 'block';
      gidroContent.style.display = 'none';
      document.querySelector('.mastika_btn').classList.add('active');

      mobileLeftBtn.style.display = 'none';
      mobileRightBtn.style.display = 'block';

      nameMastika.style.display = 'block';
      nameGidro.style.display = 'none';
    } else if (target === 'gidro') {
      mastikaContent.style.display = 'none';
      gidroContent.style.display = 'block';
      document.querySelector('.gidro_btn').classList.add('active');

      mobileRightBtn.style.display = 'none';
      mobileLeftBtn.style.display = 'block';

      nameMastika.style.display = 'none';
      nameGidro.style.display = 'block';
    }
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showContent(btn.dataset.target);
    });
  });

  mobileLeftBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showContent('mastika');
  });

  mobileRightBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showContent('gidro');
  });

  showContent('mastika');

  /********** ФОРМА И МОДАЛЬНОЕ ОКНО **********/
  const form = document.getElementById('form');
  const inputs = form.querySelectorAll('.contacts__inp, .custom_checkbox_input');
  const modal = document.getElementById('successModal');
  const closeBtn = modal.querySelector('.modal-close');
  const tel = document.getElementById('tel');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.classList.add('touched');

    if (!form.checkValidity()) return;

    const checkbox = form.querySelector('#checkbox');
    if (!checkbox.checked) {
      alert('Пожалуйста, подтвердите согласие на обработку данных.');
      return;
    }

    const formData = new FormData(form);

    fetch('send.php', {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          modal.style.display = 'flex';
          form.reset();
          form.classList.remove('touched');
        } else {
          alert(data.message || 'Ошибка при отправке формы. Попробуйте ещё раз.');
        }
      })
      .catch(err => console.error('Ошибка:', err));
  });

  inputs.forEach(input => {
    input.addEventListener('blur', () => {
      form.classList.add('touched');
    });
  });

  tel.addEventListener('input', () => {
    if (!/^\+?\d*$/.test(tel.value)) {
      tel.setCustomValidity('Только цифры');
    } else {
      tel.setCustomValidity('');
    }
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

}); // --- DOMContentLoaded END ---

/********** БУРГЕР-МЕНЮ **********/
const burgerMenu = document.getElementById('burgerMenu');
const sidebar = document.getElementById('sidebar');
const burgerClose = document.querySelector('.burger_close');
const overlay = document.getElementById('overlay');
const burgerLinks = document.querySelectorAll('.header_nav_link_burger'); // все ссылки внутри меню

function toggleMenu() {
  burgerMenu.classList.toggle('active');
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
}

function closeMenu() {
  burgerMenu.classList.remove('active');
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
}

burgerMenu.addEventListener('click', toggleMenu);

burgerClose.addEventListener('click', (e) => {
  e.preventDefault();
  closeMenu();
});

overlay.addEventListener('click', closeMenu);

// Закрываем меню при клике на ссылку внутри бургер-меню
burgerLinks.forEach(link => {
  link.addEventListener('click', () => {
    closeMenu();
  });
});

document.addEventListener('click', (e) => {
  if (
    !sidebar.contains(e.target) &&
    !burgerMenu.contains(e.target) &&
    overlay.classList.contains('active')
  ) {
    closeMenu();
  }
});
/********** GSAP АНИМАЦИИ **********/
document.addEventListener('DOMContentLoaded', function () {
  gsap.registerPlugin(ScrollTrigger);

  // HEADER
  gsap.set(['.header_logo_wrapper', '.header_nav_wrapper', '.header_language_wrapper'], { opacity: 0, y: -20 });
  const headerTl = gsap.timeline();
  headerTl.to('.header_logo_wrapper', { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" })
    .to('.header_nav_wrapper', { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.4")
    .to('.header_language_wrapper', { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.4");

  // HERO
  gsap.set(['.hero_name_wrapper', '.hero_card_wrapper', '.hero_button_main_wrapper'], { opacity: 0, y: 30 });
  const heroTl = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: "top 80%", toggleActions: "play none none reverse" } });
  heroTl.to('.hero_name_wrapper', { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" })
    .to('.hero_card_wrapper', { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.4")
    .to('.hero_button_main_wrapper', { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.2 }, "-=0.5");

  // ABOUT
  const aboutEls = ['.about_title', '.about_company_descr', '.about_story_card', '.about_advantages_card', '.about_advantages_img', '.about_advantages_img2', '.about_advantages_img3', '.about_team_card', '.about_team_img', '.about_team_img2', '.about_production_wrapper', '.prod_btn', '.about_partners_card', '.about_location_card', '.about_location_img', '.about_location_img2'];
  gsap.set(aboutEls, { opacity: 0, y: 30 });
  aboutEls.forEach((el, i) => {
    gsap.to(el, { scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" }, opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: i * 0.1 });
  });

  // PROD
  gsap.set('.prod', { opacity: 0, y: 50 });
  gsap.to('.prod', { scrollTrigger: { trigger: '.prod', start: "top 80%", toggleActions: "play none none reverse" }, opacity: 1, y: 0, duration: 1, ease: "power3.out" });

  // FORM_BACK
  gsap.set(['.form_back_title', '.form_back_descr', '#form'], { opacity: 0, y: 30 });
  const formBackTl = gsap.timeline({ scrollTrigger: { trigger: '.form_back', start: "top 80%", toggleActions: "play none none reverse" } });
  formBackTl.to('.form_back_title', { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" })
    .to('.form_back_descr', { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.4")
    .to('#form', { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.5");

  // FOOTER
  gsap.set('.footer', { opacity: 0, y: 50 });
  gsap.to('.footer', { scrollTrigger: { trigger: '.footer', start: "top 90%", toggleActions: "play none none reverse" }, opacity: 1, y: 0, duration: 1, ease: "power3.out" });
});