// Ждем, пока вся HTML-страница полностью загрузится
document.addEventListener('DOMContentLoaded', () => {

    // --- ЛОГИКА КОРЗИНЫ (остается без изменений) ---
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartLink = document.getElementById('cart-link');

    function updateCartCounter() { /*...*/ }
    function saveCart() { /*...*/ }
    function addToCart(product) { /*...*/ }

    const addToCartButtons = document.querySelectorAll('.btn-buy, .btn-buy-lg');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const productCard = event.target.closest('[data-id]');
            if (productCard) {
                const product = {
                    id: productCard.dataset.id,
                    name: productCard.dataset.name,
                    price: parseFloat(productCard.dataset.price),
                };
                addToCart(product);
            }
        });
    });

    const sizeSelector = document.querySelector('.size-selector');
    if (sizeSelector) {
        const sizeButtons = sizeSelector.querySelectorAll('.size-btn');
        sizeButtons.forEach(button => {
            button.addEventListener('click', () => {
                sizeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }
    updateCartCounter();

    // --- НОВАЯ ЛОГИКА ДЛЯ СТАТИЧЕСКОЙ КАПЧИ ---
    const captchaLabel = document.getElementById('captcha-label');
    const contactForm = document.getElementById('contact-form');

    // Эта часть сработает, только если мы на странице контактов
    if (captchaLabel && contactForm) {
        
        // Функция генерации нового вопроса капчи
        function generateCaptcha() {
            const num1 = Math.floor(Math.random() * 10) + 1; // Случайное число от 1 до 10
            const num2 = Math.floor(Math.random() * 10) + 1; // Случайное число от 1 до 10
            captchaLabel.textContent = `Перевірка: Скільки буде ${num1} + ${num2}?`;
        }

        // Генерируем вопрос при загрузке страницы
        generateCaptcha();

        // --- ОБНОВЛЕННАЯ ЛОГИКА ОТПРАВКИ ФОРМЫ ---
        const statusMessage = document.getElementById('form-status');
        const submitButton = document.getElementById('submit-btn');

        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            // Получаем вопрос и ответ пользователя
            const captchaQuestion = captchaLabel.textContent;
            const captchaAnswer = formData.get('captcha');

            submitButton.disabled = true;
            statusMessage.textContent = 'Відправка...';

            try {
                const response = await fetch('/api/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message, captchaQuestion, captchaAnswer }),
                });

                const result = await response.json();

                if (response.ok) {
                    statusMessage.textContent = 'Повідомлення успішно відправлено!';
                    statusMessage.style.color = '#28a745';
                    contactForm.reset();
                    generateCaptcha(); // Генерируем новый вопрос после успешной отправки
                } else {
                    statusMessage.textContent = `Помилка: ${result.message}`;
                    statusMessage.style.color = '#dc3545';
                    generateCaptcha(); // Генерируем новый вопрос даже при ошибке
                }

            } catch (error) {
                console.error('Network error:', error);
                statusMessage.textContent = 'Помилка мережі. Спробуйте пізніше.';
                statusMessage.style.color = '#dc3545';
            } finally {
                submitButton.disabled = false;
            }
        });
    }
});