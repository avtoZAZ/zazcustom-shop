// Импортируем 'node-fetch', если его нет по умолчанию в среде выполнения
const fetch = require('node-fetch');

// Получаем секреты из переменных окружения (это настраивается на хостинге)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

exports.handler = async (event) => {
    // Разрешаем запросы только методом POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        const { name, email, message, captchaToken } = data;

        // 1. Проверяем CAPTCHA
        const captchaResponse = await fetch('https://challenges.cloudflare.com/turnstile/v1/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${encodeURIComponent(TURNSTILE_SECRET_KEY)}&response=${encodeURIComponent(captchaToken)}`
        });
        
        const captchaData = await captchaResponse.json();

        if (!captchaData.success) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Перевірка CAPTCHA не пройдена.' })
            };
        }

        // 2. Если CAPTCHA пройдена, форматируем и отправляем сообщение в Telegram
        const text = `
Нове повідомлення з сайту ZAZcustom:

👤 **Ім'я:** ${name}
📧 **Email:** ${email}

📝 **Повідомлення:**
${message}
        `;

        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text,
                parse_mode: 'Markdown'
            })
        });

        if (!telegramResponse.ok) {
            throw new Error('Помилка відправки в Telegram.');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Success' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Внутрішня помилка сервера.' })
        };
    }
};