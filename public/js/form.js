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
if (successModal) {
  successModal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) closeModal(successModal);
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

  /* ===== UI helpers ===== */
  const setError = (el) => {
    el.classList.add("booking_form_error");
    el.classList.remove("booking_form_success");
  };

  const setSuccess = (el) => {
    el.classList.add("booking_form_success");
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

  const validateField = (name) => {
    const el = getField(name);
    if (!el) return true;

    const value = el.value ?? "";
    let ok = true;

    if (name === "phone") ok = isValidRuPhone(value);
    else if (name === "guests") ok = isValidGuests(value);
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

      const result = await resp.json();

      if (resp.ok && result.success) {
        form.reset();

        requiredNames.forEach((n) => {
          const el = getField(n);
          if (el) clearState(el);
        });
        consentText?.classList.remove("checkbox_error", "checkbox_success");

        // ✅ SHOW SUCCESS MODAL
        openModal(successModal);
      }
    } catch (err) {
      console.error("Ошибка соединения", err);
    }
  });
}