import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("❌ Не найдены TELEGRAM_TOKEN или TELEGRAM_CHAT_ID в .env");
  process.exit(1);
}

// ===== middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== static (твоя вёрстка) =====
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// ===== корень сайта (надежно) =====
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ===== health check =====
app.get("/health", (req, res) => {
  res.json({ status: "ok", port: PORT, marker: "SERVER_OK" });
});

// ===== отправка формы в Telegram =====
app.post("/send", async (req, res) => {
  try {
    // Поля строго под твою форму:
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
      consent === true || consent === "true" || consent === "on" || consent === 1 || consent === "1";

    if (!consentOk) {
      return res.status(400).json({
        success: false,
        error: "Необходимо согласие на обработку данных",
      });
    }

    const msg = [
      "📩 Новая бронь",
      "",
      `👤 Имя: ${fullName}`,
      `📞 Телефон: ${phone}`,
      `👥 Гостей: ${guests}`,
      `📍 Адрес: ${address}`,
      `📅 Дата: ${date}`,
      `⏰ Время: ${time}`,
      `💬 Комментарий: ${comment?.trim() ? comment.trim() : "—"}`,
    ].join("\n");

    const telegramURL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

    const tgResp = await fetch(telegramURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: msg,
      }),
    });

    const tgData = await tgResp.json();

    if (!tgResp.ok || !tgData.ok) {
      console.error("❌ Telegram API error:", tgData);
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
});