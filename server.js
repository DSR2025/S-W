import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("❌ Не найдены TELEGRAM_TOKEN или TELEGRAM_CHAT_ID в .env");
  process.exit(1);
}

if (!ADMIN_USER || !ADMIN_PASS) {
  console.error("❌ Не найдены ADMIN_USER или ADMIN_PASS в .env");
  process.exit(1);
}

// ===== middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== static (твоя вёрстка) =====
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// ===== AVAILABILITY STORAGE =====
const dataDir = path.join(__dirname, "data");
const availabilityPath = path.join(dataDir, "availability.json");

// Создаём data/availability.json если нет
async function ensureAvailabilityFile() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.access(availabilityPath);
  } catch {
    await fs.writeFile(availabilityPath, JSON.stringify({}, null, 2), "utf-8");
  }
}

async function readAvailability() {
  await ensureAvailabilityFile();
  const raw = await fs.readFile(availabilityPath, "utf-8");
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

async function writeAvailability(obj) {
  await ensureAvailabilityFile();
  await fs.writeFile(availabilityPath, JSON.stringify(obj, null, 2), "utf-8");
}

// ===== HELPERS =====
function normalizeDateKey(d) {
  // ожидаем YYYY-MM-DD
  if (typeof d !== "string") return "";
  const s = d.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
}

function normalizeTimeKey(t) {
  // ожидаем HH:MM
  if (typeof t !== "string") return "";
  const s = t.trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s) ? s : "";
}

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Правило:
 * - если closedAllDay true → запрещено
 * - если closedUntil "21:00" → запрещено, если time < 21:00
 *   (ВКЛЮЧАЯ 21:00 РАЗРЕШЕНО)
 *
 * Возвращает:
 * { ok: true }
 * или
 * { ok: false, reason, message, nextAvailableTime }
 */
function checkAvailability(rule, date, time) {
  // если правила нет — всё можно
  if (!rule) return { ok: true };

  if (rule.closedAllDay === true) {
    return {
      ok: false,
      reason: "date_closed",
      message: "Извините, на выбранную дату мест нет.",
      nextAvailableTime: null,
      date,
    };
  }

  const closedUntil = typeof rule.closedUntil === "string" ? rule.closedUntil : null;

  // Если time ещё не выбран — просто говорим подсказку
  if (!time) {
    if (closedUntil) {
      return {
        ok: false,
        reason: "time_restricted_no_time",
        message: `На эту дату бронь доступна после ${closedUntil}.`,
        nextAvailableTime: closedUntil,
        date,
      };
    }
    return { ok: true };
  }

  if (closedUntil) {
    const t = timeToMinutes(time);
    const u = timeToMinutes(closedUntil);

    if (t < u) {
      return {
        ok: false,
        reason: "closed_until",
        message: `Извините, мест нет до ${closedUntil}. Есть посадка с ${closedUntil}.`,
        nextAvailableTime: closedUntil,
        date,
      };
    }
  }

  return { ok: true };
}

async function sendTelegram(text) {
  const telegramURL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const tgResp = await fetch(telegramURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
    }),
  });

  const tgData = await tgResp.json().catch(() => ({}));
  if (!tgResp.ok || !tgData.ok) {
    console.error("❌ Telegram API error:", tgData);
    return false;
  }
  return true;
}

// ===== BASIC AUTH =====
function basicAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Panel"');
    return res.status(401).send("Auth required");
  }

  const base64 = header.replace("Basic ", "");
  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  const [user, pass] = decoded.split(":");

  if (user === ADMIN_USER && pass === ADMIN_PASS) return next();

  res.setHeader("WWW-Authenticate", 'Basic realm="Admin Panel"');
  return res.status(401).send("Invalid credentials");
}

// ===== корень сайта (надежно) =====
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ✅ КРАСИВЫЙ URL ДЛЯ ФРАНШИЗЫ
// /franchise -> public/fransh.html
app.get("/franchise", (req, res) => {
  res.sendFile(path.join(publicDir, "fransh.html"));
});

// (опционально, но полезно) если кто-то откроет старый адрес /fransh.html
// — отправляем на красивый /franchise
app.get("/fransh.html", (req, res) => {
  res.redirect(301, "/franchise");
});

// ===== ADMIN PAGE =====
app.get("/admin", basicAuth, (req, res) => {
  // создадим файл на следующем шаге: public/admin.html
  res.sendFile(path.join(publicDir, "admin.html"));
});

// ===== PUBLIC AVAILABILITY API (для клиента) =====
// можно дергать хоть при выборе даты/времени, хоть на submit
app.get("/api/availability", async (req, res) => {
  try {
    const date = normalizeDateKey(req.query.date || "");
    const time = normalizeTimeKey(req.query.time || ""); // может быть пусто

    if (!date) {
      return res.status(400).json({ ok: false, error: "Bad date" });
    }

    const all = await readAvailability();
    const rule = all[date] || null;

    const result = checkAvailability(rule, date, time || null);
    return res.json(result);
  } catch (e) {
    console.error("❌ /api/availability error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// ===== ADMIN API (для админки) =====
app.get("/api/admin/availability", basicAuth, async (req, res) => {
  try {
    const date = normalizeDateKey(req.query.date || "");
    if (!date) return res.status(400).json({ ok: false, error: "Bad date" });

    const all = await readAvailability();
    const rule = all[date] || null;

    return res.json({ ok: true, date, rule });
  } catch (e) {
    console.error("❌ /api/admin/availability GET error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// body: { date, mode: "none"|"allDay"|"until", closedUntil?: "HH:MM" }
app.post("/api/admin/availability", basicAuth, async (req, res) => {
  try {
    const date = normalizeDateKey(req.body.date || "");
    const mode = (req.body.mode || "").toString();

    if (!date) return res.status(400).json({ ok: false, error: "Bad date" });

    const all = await readAvailability();

    // none → снять ограничения
    if (mode === "none") {
      const existed = Boolean(all[date]);
      delete all[date];
      await writeAvailability(all);

      if (existed) {
        await sendTelegram(
          `✅ Ограничения сняты\n📅 Дата: ${date}\nБронь доступна весь день.`
        );
      } else {
        await sendTelegram(
          `ℹ️ Ограничения не были установлены\n📅 Дата: ${date}\nНечего снимать.`
        );
      }

      return res.json({ ok: true, date, rule: null });
    }

    if (mode === "allDay") {
      all[date] = { closedAllDay: true, closedUntil: null };
      await writeAvailability(all);

      await sendTelegram(
        `⛔ Ограничения обновлены\n📅 Дата: ${date}\nЗакрыто на весь день (бронь не принимается).`
      );

      return res.json({ ok: true, date, rule: all[date] });
    }

    if (mode === "until") {
      const closedUntil = normalizeTimeKey(req.body.closedUntil || "");
      if (!closedUntil) {
        return res.status(400).json({ ok: false, error: "Bad time" });
      }

      all[date] = { closedAllDay: false, closedUntil };
      await writeAvailability(all);

      await sendTelegram(
        `📌 Ограничения обновлены\n📅 Дата: ${date}\nМест нет до ${closedUntil}.\n✅ С ${closedUntil} бронь доступна.`
      );

      return res.json({ ok: true, date, rule: all[date] });
    }

    return res.status(400).json({ ok: false, error: "Bad mode" });
  } catch (e) {
    console.error("❌ /api/admin/availability POST error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// ===== health check =====
app.get("/health", (req, res) => {
  res.json({ status: "ok", port: PORT, marker: "SERVER_OK" });
});

// ===== отправка формы в Telegram =====
app.post("/send", async (req, res) => {
  try {
    const {
      fullName,
      phone,
      guests,
      address,
      date,
      time,
      comment,
      consent,
    } = req.body;

    // Мини-валидация обязательных полей
    if (!fullName || !phone || !guests || !address || !date || !time) {
      return res.status(400).json({
        success: false,
        error: "Заполните обязательные поля",
      });
    }

    // consent может прийти как "on" (если отправка form-encoded)
    // или true/false (если JSON). Проверяем мягко.
    const consentOk =
      consent === true ||
      consent === "true" ||
      consent === "on" ||
      consent === 1 ||
      consent === "1";

    if (!consentOk) {
      return res.status(400).json({
        success: false,
        error: "Необходимо согласие на обработку данных",
      });
    }

    // ===== ПРОВЕРКА ДОСТУПНОСТИ НА СЕРВЕРЕ (обязательно) =====
    const dateKey = normalizeDateKey(date);
    const timeKey = normalizeTimeKey(time);

    if (!dateKey || !timeKey) {
      return res.status(400).json({
        success: false,
        error: "Некорректная дата или время",
      });
    }

    const all = await readAvailability();
    const rule = all[dateKey] || null;
    const availability = checkAvailability(rule, dateKey, timeKey);

    if (!availability.ok) {
      // ВАЖНО: фронт сможет показать модалку с текстом
      return res.status(409).json({
        success: false,
        code: availability.reason,
        message: availability.message,
        nextAvailableTime: availability.nextAvailableTime,
      });
    }

    // ===== отправка в Telegram =====
    const msg = [
      "📩 Новая бронь",
      "",
      `👤 Имя: ${fullName}`,
      `📞 Телефон: ${phone}`,
      `👥 Гостей: ${guests}`,
      `📍 Адрес: ${address}`,
      `📅 Дата: ${dateKey}`,
      `⏰ Время: ${timeKey}`,
      `💬 Комментарий: ${comment?.trim() ? comment.trim() : "—"}`,
    ].join("\n");

    const ok = await sendTelegram(msg);

    if (!ok) {
      return res.status(502).json({
        success: false,
        error: "Telegram API error",
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ /send error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

// ===== старт =====
app.listen(PORT, () => {
  console.log(`🔥 SERVER LOADED. PORT = ${PORT}`);
  console.log(`✅ Open: http://localhost:${PORT}`);
  console.log(`✅ Franchise: http://localhost:${PORT}/franchise`);
  console.log(`✅ Admin: http://localhost:${PORT}/admin`);
});
