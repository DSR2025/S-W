function qs(id) {
  return document.getElementById(id);
}

const dateInput = qs("dateInput");
const untilInput = qs("untilInput");
const allDayCheckbox = qs("allDayCheckbox");

const saveAllDayBtn = qs("saveAllDayBtn");
const saveUntilBtn = qs("saveUntilBtn");
const clearBtn = qs("clearBtn");

const statusBox = qs("statusBox");

function setStatus(type, html) {
  statusBox.classList.remove("ok", "warn");
  if (type) statusBox.classList.add(type);
  statusBox.innerHTML = html;
}

function fmtRule(rule) {
  if (!rule) return `<b>Ограничений нет</b>. Бронь доступна весь день.`;

  if (rule.closedAllDay) {
    return `⛔ <b>Закрыто на весь день</b>. Бронь не принимается.`;
  }

  if (rule.closedUntil) {
    return `📌 <b>Закрыто до ${rule.closedUntil}</b>. Бронь доступна <b>с ${rule.closedUntil}</b>.`;
  }

  return `<b>Ограничений нет</b>. Бронь доступна весь день.`;
}

async function loadRule(date) {
  if (!date) {
    setStatus("", "Выбери дату.");
    return;
  }

  try {
    setStatus("", "Загрузка...");
    const resp = await fetch(`/api/admin/availability?date=${encodeURIComponent(date)}`);
    const data = await resp.json();

    if (!resp.ok || !data.ok) {
      setStatus("warn", `Ошибка загрузки. Проверь сервер. (${data?.error || "unknown"})`);
      return;
    }

    const rule = data.rule;

    // синхронизация UI
    if (!rule) {
      allDayCheckbox.checked = false;
      // untilInput оставим как есть (по умолчанию 21:00)
      setStatus("ok", fmtRule(null));
      return;
    }

    allDayCheckbox.checked = Boolean(rule.closedAllDay);

    if (rule.closedUntil) {
      untilInput.value = rule.closedUntil;
    }

    setStatus(rule.closedAllDay ? "warn" : "ok", fmtRule(rule));
  } catch (e) {
    console.error(e);
    setStatus("warn", "Ошибка соединения с сервером.");
  }
}

async function saveRule(payload) {
  if (!payload?.date) {
    setStatus("warn", "Сначала выбери дату.");
    return;
  }

  try {
    setStatus("", "Сохранение...");
    const resp = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok || !data.ok) {
      setStatus("warn", `Ошибка сохранения. (${data?.error || "unknown"})`);
      return;
    }

    const rule = data.rule || null;
    setStatus(rule?.closedAllDay ? "warn" : "ok", fmtRule(rule));
  } catch (e) {
    console.error(e);
    setStatus("warn", "Ошибка соединения с сервером.");
  }
}

// ===== events =====
dateInput?.addEventListener("change", () => {
  loadRule(dateInput.value);
});

allDayCheckbox?.addEventListener("change", () => {
  // просто UX: если выбрали allDay — можно не трогать until
  if (allDayCheckbox.checked) {
    setStatus("warn", "⛔ Режим: закрыть дату полностью. Нажми “Сохранить: закрыть дату”.");
  } else {
    setStatus("ok", "Режим: можно закрыть до времени или снять ограничения.");
  }
});

saveAllDayBtn?.addEventListener("click", () => {
  const date = dateInput.value;
  if (!date) return setStatus("warn", "Выбери дату.");

  saveRule({ date, mode: "allDay" });
});

saveUntilBtn?.addEventListener("click", () => {
  const date = dateInput.value;
  if (!date) return setStatus("warn", "Выбери дату.");

  const closedUntil = untilInput.value;
  if (!closedUntil) return setStatus("warn", "Выбери время.");

  saveRule({ date, mode: "until", closedUntil });
});

clearBtn?.addEventListener("click", () => {
  const date = dateInput.value;
  if (!date) return setStatus("warn", "Выбери дату.");

  saveRule({ date, mode: "none" });
});

// ===== initial =====
setStatus("", "Выбери дату.");
