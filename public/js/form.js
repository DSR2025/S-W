const form = document.querySelector(".booking_form");

/* =========================
   MODAL HELPERS
========================= */
function openModal(modal) {
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

const successModal = document.querySelector("#successModal");

// ✅ элементы модалки + логика для кнопки "Поставить HH:MM"
const modalTitleEl = document.querySelector("#successModalTitle");
const modalTextEl = successModal?.querySelector(".modal__text");
const modalSetTimeBtn = successModal?.querySelector("[data-set-time]");
let modalNextTime = null;

function setModalContent({ title, text, nextTime }) {
  if (modalTitleEl) modalTitleEl.textContent = title;
  if (modalTextEl) modalTextEl.innerHTML = text; // innerHTML из-за <br>

  modalNextTime = nextTime || null;

  if (modalSetTimeBtn) {
    if (modalNextTime) {
      modalSetTimeBtn.hidden = false;
      modalSetTimeBtn.textContent = `Поставить ${modalNextTime}`;
    } else {
      modalSetTimeBtn.hidden = true;
      modalSetTimeBtn.textContent = "Поставить время";
    }
  }
}

if (successModal) {
  successModal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeModal(successModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && successModal.classList.contains("is-open")) {
      closeModal(successModal);
    }
  });
}

/* =========================
   FORM LOGIC
========================= */
if (form) {
  const requiredNames = ["fullName", "phone", "guests", "address", "date", "time"];
  const getField = (name) => form.querySelector(`[name="${name}"]`);

  // ✅ Галочка только для этих полей (НЕ для address/select и НЕ для consent)
  const tickFields = new Set(["fullName", "phone", "guests", "date", "time"]);

  /* ===== UI helpers ===== */
  const setError = (el) => {
    el.classList.add("booking_form_error");
    el.classList.remove("booking_form_success");
  };

  const setSuccess = (el) => {
    const name = el.getAttribute("name");
    if (tickFields.has(name)) {
      el.classList.add("booking_form_success");
    } else {
      el.classList.remove("booking_form_success");
    }
    el.classList.remove("booking_form_error");
  };

  const clearState = (el) => {
    el.classList.remove("booking_form_error", "booking_form_success");
  };

  const setCursorToEnd = (el) => {
    const len = el.value.length;
    el.setSelectionRange(len, len);
  };

  /* =========================
     DATE LIMITS (today .. today+12 months)
  ========================= */
  const dateInput = getField("date");

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function toISODate(d) {
    // local date -> YYYY-MM-DD (без UTC-сдвигов)
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function addMonthsSafe(date, months) {
    // корректно добавляет месяцы: 31 января + 1 мес = 28/29 февраля
    const d = new Date(date);
    const day = d.getDate();

    d.setDate(1);
    d.setMonth(d.getMonth() + months);

    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));

    return d;
  }

  function setDateMinMax() {
    if (!dateInput) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = addMonthsSafe(today, 12);

    dateInput.min = toISODate(today);
    dateInput.max = toISODate(maxDate);

    // если уже стоит дата вне диапазона — сбросим и покажем ошибку
    if (dateInput.value) {
      const v = dateInput.value; // YYYY-MM-DD
      if (v < dateInput.min || v > dateInput.max) {
        dateInput.value = "";
        setError(dateInput);
      }
    }
  }

  // поставим ограничения сразу
  setDateMinMax();

  // на всякий случай — если вкладка была открыта долго и наступил новый день
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") setDateMinMax();
  });

  // красивое сообщение браузера (по желанию)
  if (dateInput) {
    dateInput.addEventListener("invalid", () => {
      dateInput.setCustomValidity(`Выберите дату от ${dateInput.min} до ${dateInput.max}`);
    });
    dateInput.addEventListener("input", () => dateInput.setCustomValidity(""));
  }

  /* ✅ кнопка "Поставить HH:MM" */
  if (modalSetTimeBtn) {
    modalSetTimeBtn.addEventListener("click", () => {
      if (!modalNextTime) return;

      const timeField = getField("time");
      if (timeField) {
        timeField.value = modalNextTime;
        timeField.dispatchEvent(new Event("input", { bubbles: true }));
        timeField.dispatchEvent(new Event("change", { bubbles: true }));
      }

      closeModal(successModal);
    });
  }

  /* =========================
     PHONE MASK +7 (___) ___-__-__
  ========================= */
  const phoneInput = getField("phone");

  function extractDigits10(value) {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("7")) digits = digits.slice(1);
    return digits.slice(0, 10);
  }

  function formatRuPhone(digits10) {
    if (digits10.length === 0) return "+7 ";

    const p1 = digits10.slice(0, 3);
    const p2 = digits10.slice(3, 6);
    const p3 = digits10.slice(6, 8);
    const p4 = digits10.slice(8, 10);

    let out = "+7 (" + p1;
    if (digits10.length >= 3) out += ")";
    if (digits10.length > 3) out += " " + p2;
    if (digits10.length > 6) out += "-" + p3;
    if (digits10.length > 8) out += "-" + p4;

    return out;
  }

  if (phoneInput) {
    const ensurePrefix = () => {
      if (!phoneInput.value.trim()) {
        phoneInput.value = "+7 ";
        clearState(phoneInput);
        setCursorToEnd(phoneInput);
      }
    };

    phoneInput.addEventListener("focus", ensurePrefix);
    phoneInput.addEventListener("click", ensurePrefix);

    phoneInput.addEventListener("keydown", (e) => {
      const allowedKeys = ["ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
      if (allowedKeys.includes(e.key)) return;

      if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) return;

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();

        const start = phoneInput.selectionStart ?? 0;
        const end = phoneInput.selectionEnd ?? 0;

        if (start === 0 && end === phoneInput.value.length) {
          phoneInput.value = "";
          clearState(phoneInput);
          return;
        }

        let d10 = extractDigits10(phoneInput.value);
        if (d10.length === 0) {
          phoneInput.value = "";
          clearState(phoneInput);
          return;
        }

        d10 = d10.slice(0, -1);
        phoneInput.value = formatRuPhone(d10);
        setCursorToEnd(phoneInput);
        validateField("phone");
        return;
      }

      if (!/\d/.test(e.key)) e.preventDefault();
    });

    phoneInput.addEventListener("input", () => {
      const d10 = extractDigits10(phoneInput.value);
      phoneInput.value = formatRuPhone(d10);
      setCursorToEnd(phoneInput);
      validateField("phone");
    });

    phoneInput.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text");
      const d10 = extractDigits10(text);
      phoneInput.value = formatRuPhone(d10);
      setCursorToEnd(phoneInput);
      validateField("phone");
    });

    phoneInput.addEventListener("blur", () => {
      const d10 = extractDigits10(phoneInput.value);
      if (d10.length === 0) {
        phoneInput.value = "";
        clearState(phoneInput);
      } else {
        validateField("phone");
      }
    });
  }

  /* =========================
     VALIDATION
  ========================= */
  const isNonEmpty = (v) => v.trim().length > 0;
  const isValidGuests = (v) => Number(v) >= 1;
  const isValidRuPhone = (v) => extractDigits10(v).length === 10;

  const isValidBookingDate = (v) => {
    if (!v) return false;

    const [y, m, d] = v.split("-").map(Number);
    if (!y || !m || !d) return false;

    const picked = new Date(y, m - 1, d);
    picked.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = addMonthsSafe(today, 12);

    return picked >= today && picked <= maxDate;
  };

  const validateField = (name) => {
    const el = getField(name);
    if (!el) return true;

    const value = el.value ?? "";
    let ok = true;

    if (name === "phone") ok = isValidRuPhone(value);
    else if (name === "guests") ok = isValidGuests(value);
    else if (name === "date") ok = isValidBookingDate(value);
    else ok = isNonEmpty(value);

    ok ? setSuccess(el) : setError(el);
    return ok;
  };

  ["fullName", "guests", "address", "date", "time"].forEach((name) => {
    const el = getField(name);
    if (!el) return;
    ["input", "change", "blur"].forEach((evt) =>
      el.addEventListener(evt, () => validateField(name))
    );
  });

  /* =========================
     CONSENT CHECKBOX
  ========================= */
  const consentInput = getField("consent");
  const consentText = form.querySelector(".custom_checkbox_text");

  const setConsentState = () => {
    if (!consentInput || !consentText) return;
    consentText.classList.remove("checkbox_error", "checkbox_success");
    consentInput.checked
      ? consentText.classList.add("checkbox_success")
      : consentText.classList.add("checkbox_error");
  };

  if (consentInput) consentInput.addEventListener("change", setConsentState);

  /* =========================
     SUBMIT
  ========================= */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // на всякий случай обновим границы даты перед проверкой
    setDateMinMax();

    let ok = true;

    requiredNames.forEach((name) => {
      if (!validateField(name)) ok = false;
    });

    if (!consentInput?.checked) {
      setConsentState();
      ok = false;
    } else {
      setConsentState();
    }

    if (!ok) return;

    const data = Object.fromEntries(new FormData(form).entries());
    if (!("consent" in data)) data.consent = false;

    try {
      const resp = await fetch("/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await resp.json().catch(() => ({}));

      // ✅ УСПЕХ
      if (resp.ok && result.success) {
        form.reset();

        requiredNames.forEach((n) => {
          const el = getField(n);
          if (el) clearState(el);
        });

        consentText?.classList.remove("checkbox_error", "checkbox_success");

        setModalContent({
          title: "Заявка на бронирование столика в ресторане «Сулугуни и вино» успешно отправлена!",
          text: "В ближайшее время мы перезвоним Вам<br>для подтверждения бронирования.",
          nextTime: null,
        });

        openModal(successModal);
        return;
      }

      // ✅ НЕТ МЕСТ (сервер вернул 409)
      if (resp.status === 409) {
        const nextTime = result.nextAvailableTime || null;

        if (nextTime) {
          setModalContent({
            title: "Извините, мест нет",
            text: `Мест нет до ${nextTime}.<br>Есть посадка с ${nextTime}.`,
            nextTime,
          });
        } else {
          setModalContent({
            title: "Извините, мест нет",
            text: "На выбранную дату мест нет.<br>Пожалуйста, выберите другую дату.",
            nextTime: null,
          });
        }

        openModal(successModal);
        return;
      }

      // остальные ошибки
      console.error("Ошибка отправки формы:", result);
    } catch (err) {
      console.error("Ошибка соединения", err);
    }
  });
}
