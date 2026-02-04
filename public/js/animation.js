// Scroll reveal animation (IntersectionObserver)
// Simple, elegant, premium — works on Main + Franchise

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

  // Собираем элементы + убираем дубли
  const targets = Array.from(new Set(document.querySelectorAll(selector)));

  if (!targets.length) return;

  // Add base reveal + gentle stagger
  targets.forEach((el, index) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
  });

  // Directions for menu columns (only if exists)
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
      threshold: 0.12,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  targets.forEach((el) => observer.observe(el));
}

document.addEventListener("DOMContentLoaded", initScrollReveal);