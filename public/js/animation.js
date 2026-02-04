function initScrollReveal() {
  const selector = `
    /* MAIN */
    .hero,
    .hero_content,
    .hero_title,
    .hero_descr,
    .hero .standart_btn,
    .about_content,
    .about_top_wrapper,
    .about_bottom_wrapper,
    .about_gallery_wrapper,
    .menu_content,
    .menu_left,
    .menu_right,
    .booking_content,
    .contacts_content,
    .footer_content,

    /* FRANCHISE */
    .fransh,
    .fransh_content,
    .fransh_wrapper,
    .fransh_name_wrapper,
    .fransh_title,
    .fransh_descr,
    .fransh .standart_btn,

    .adv_content,
    .adv_top,
    .adv_top_left,
    .adv_top_right,
    .adv_bottom,
    .adv_bottom_left,
    .adv_bottom_right,

    .concept_content,
    .concept_wrapper_first,
    .concept_wrapper_second,
    .concept_wrapper_third,
    .concept_wrapper_four,

    .package_content,
    .package_main_wrapper,
    .package_sect_wrapper,

    .messengers_content,
    .contacts_bottom_main_wrapper
  `;

  const targets = Array.from(new Set(document.querySelectorAll(selector)));
  if (!targets.length) return;

  targets.forEach((el, index) => {
    el.classList.add("reveal");

    // ✅ исключение для самого низа футера
    if (el.classList.contains("contacts_bottom_main_wrapper")) {
      el.style.transitionDelay = "0ms";
    } else {
      el.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
    }
  });

  document.querySelectorAll(".menu_left").forEach((el) =>
    el.classList.add("reveal--left")
  );
  document.querySelectorAll(".menu_right").forEach((el) =>
    el.classList.add("reveal--right")
  );

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal--show");
        obs.unobserve(entry.target);
      });
    },
    {
      threshold: 0.01,
      rootMargin: "0px 0px 0px 0px",
    }
  );

  targets.forEach((el) => observer.observe(el));

  // ✅ если элемент уже виден при загрузке — показать сразу
  const showIfAlreadyVisible = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;

    targets.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        el.classList.add("reveal--show");
      }
    });
  };

  showIfAlreadyVisible();
  window.addEventListener("load", showIfAlreadyVisible);
}

document.addEventListener("DOMContentLoaded", initScrollReveal);
