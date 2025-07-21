const fetch = require('node-fetch');

exports.handler = async (event) => {
    // Проверка метода и тела запроса
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 400, body: JSON.stringify({ message: "Некоректний запит." }) };
    }
    
    // Проверка переменных окружения
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
        return { statusCode: 500, body: JSON.stringify({ message: "Помилка конфігурації сервера." }) };
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    try {
        const data = JSON.parse(event.body);
        const { name, email, message, captchaQuestion, captchaAnswer } = data;

        // --- НОВЫЙ БЛОК ПРОВЕРКИ СТАТИЧЕСКОЙ КАПЧИ ---
        // Извлекаем числа из строки вопроса "Перевірка: Скільки буде 5 + 3?"
        const match = captchaQuestion.match(/(\d+)\s*\+\s*(\d+)/);

        if (!match) {
            // Если не смогли разобрать вопрос - это подозрительно
            return { statusCode: 400, body: JSON.stringify({ message: "Некоректний формат капчі." }) };
        }

        const num1 = parseInt(match[1], 10);
        const num2 = parseInt(match[2], 10);
        const correctAnswer = num1 + num2;

        // Сравниваем правильный ответ с ответом пользователя
        if (parseInt(captchaAnswer, 10) !== correctAnswer) {
            return { statusCode: 403, body: JSON.stringify({ message: "Невірна відповідь на капчу." }) };
        }
        // --- КОНЕЦ БЛОКА ПРОВЕРКИ ---

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