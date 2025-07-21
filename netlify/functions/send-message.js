const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 400, body: JSON.stringify({ message: "Некоректний запит." }) };
    }
    
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
        return { statusCode: 500, body: JSON.stringify({ message: "Помилка конфігурації сервера." }) };
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    try {
        const data = JSON.parse(event.body);

        // Определяем, это заказ или сообщение с формы контактов
        if (data.type === 'order') {
            // Это заказ. Просто отправляем готовое сообщение.
            const text = data.message;
            
            await sendTelegramMessage(BOT_TOKEN, CHAT_ID, text);

        } else {
            // Это сообщение с формы контактов (со статической капчей)
            const { name, email, message, captchaQuestion, captchaAnswer } = data;

            const match = captchaQuestion.match(/(\d+)\s*\+\s*(\d+)/);
            if (!match) {
                return { statusCode: 400, body: JSON.stringify({ message: "Некоректний формат капчі." }) };
            }

            const num1 = parseInt(match[1], 10);
            const num2 = parseInt(match[2], 10);
            const correctAnswer = num1 + num2;

            if (parseInt(captchaAnswer, 10) !== correctAnswer) {
                return { statusCode: 403, body: JSON.stringify({ message: "Невірна відповідь на капчу." }) };
            }
            
            const text = `
Нове повідомлення з сайту *ZAZcustom*:

👤 **Ім'я:** ${name}
📧 **Email:** ${email}

📝 **Повідомлення:**
${message}
            `;

            await sendTelegramMessage(BOT_TOKEN, CHAT_ID, text);
        }

        return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };

    } catch (error) {
        console.error('Server-side Error:', error.message);
        return { statusCode: 500, body: JSON.stringify({ message: 'Внутрішня помилка сервера.' }) };
    }
};

// Вспомогательная функция для отправки сообщения, чтобы не дублировать код
async function sendTelegramMessage(token, chatId, text) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error("Telegram API Error:", errorBody.description);
        throw new Error('Помилка при відправці повідомлення в Telegram.');
    }
}