// Возвращаем старый, простой способ подключения для node-fetch@2
const fetch = require('node-fetch');

exports.handler = async (event) => {
    // Проверяем, что запрос не пустой
    if (event.httpMethod !== 'POST' || !event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Некоректний запит." })
        };
    }
    
    // Проверяем наличие переменных окружения
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID || !process.env.TURNSTILE_SECRET_KEY) {
        console.error("Помилка конфігурації: відсутні змінні оточення.");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Помилка конфігурації сервера." })
        };
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

    try {
        const data = JSON.parse(event.body);
        const { name, email, message, captchaToken } = data;
        
        let formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', captchaToken);

        const captchaResponse = await fetch('https://challenges.cloudflare.com/turnstile/v1/siteverify', {
            method: 'POST',
            body: formData,
        });
        
        const captchaData = await captchaResponse.json();

        if (!captchaData.success) {
            // В лог можно добавить детали ошибки от Cloudflare
            console.error("Captcha verification failed:", captchaData['error-codes']);
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Перевірка CAPTCHA не пройдена.' })
            };
        }
        
        const text = `
Нове повідомлення з сайту *ZAZcustom*:

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
            const errorBody = await telegramResponse.json();
            console.error("Telegram API Error:", errorBody.description);
            throw new Error('Помилка при відправці повідомлення в Telegram.');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Success' })
        };

    } catch (error) {
        console.error('Server-side Error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Внутрішня помилка сервера.' })
        };
    }
};