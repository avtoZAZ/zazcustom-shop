// Ждем, пока вся HTML-страница полностью загрузится
document.addEventListener('DOMContentLoaded', () => {

    // --- ОСНОВНАЯ ЛОГИКА КОРЗИНЫ ---

    // Пытаемся загрузить корзину из localStorage или создаем пустую, если ее там нет.
    // localStorage - это небольшое хранилище в браузере, которое сохраняет данные даже после закрытия вкладки.
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    const cartLink = document.getElementById('cart-link');

    // Функция: обновить счетчик товаров в шапке
    function updateCartCounter() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartLink) {
            cartLink.textContent = `Корзина (${totalItems})`;
        }
    }

    // Функция: сохранить корзину в localStorage
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // Функция: добавить товар в корзину
    function addToCart(product) {
        // Проверяем, есть ли уже такой товар в корзине
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            // Если есть - просто увеличиваем количество
            existingItem.quantity += 1;
        } else {
            // Если нет - добавляем новый товар с количеством 1
            cart.push({ ...product, quantity: 1 });
        }

        saveCart(); // Сохраняем изменения
        updateCartCounter(); // Обновляем счетчик
        alert(`"${product.name}" додано до корзини!`); // Сообщаем пользователю
    }

    // Находим ВСЕ кнопки "Додати в корзину" на странице
    const addToCartButtons = document.querySelectorAll('.btn-buy, .btn-buy-lg');

    // Добавляем обработчик клика на каждую кнопку
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Находим родительский элемент с данными о товаре
            const productCard = event.target.closest('[data-id]');
            
            if (productCard) {
                const product = {
                    id: productCard.dataset.id,
                    name: productCard.dataset.name,
                    price: parseFloat(productCard.dataset.price),
                    // Можно добавить и картинку, если нужно
                    // image: productCard.querySelector('.product-image')?.src
                };
                addToCart(product);
            }
        });
    });


    // --- ЛОГИКА ДЛЯ СТРАНИЦЫ ТОВАРА (ВЫБОР РАЗМЕРА) ---

    const sizeSelector = document.querySelector('.size-selector');

    if (sizeSelector) { // Этот код сработает, только если мы на странице товара
        const sizeButtons = sizeSelector.querySelectorAll('.size-btn');

        sizeButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Сначала убираем класс 'active' у всех кнопок
                sizeButtons.forEach(btn => btn.classList.remove('active'));
                // Потом добавляем класс 'active' только той, на которую кликнули
                button.classList.add('active');
            });
        });
    }


    // --- ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ---
    updateCartCounter(); // Сразу обновляем счетчик, чтобы показать сохраненные товары

}); // Конец addEventListener
// --- ЛОГИКА ДЛЯ ФОРМЫ КОНТАКТОВ ---

// Ищем форму на странице
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    const statusMessage = document.getElementById('form-status');
    const submitButton = document.getElementById('submit-btn');

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Останавливаем стандартную отправку формы

        const formData = new FormData(contactForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');
        const captchaToken = formData.get('cf-turnstile-response'); // Получаем токен капчи

        // Блокируем кнопку и показываем статус
        submitButton.disabled = true;
        statusMessage.textContent = 'Відправка...';
        statusMessage.style.color = 'var(--text-color)';

        try {
            // Отправляем данные на нашу серверную функцию
            // Путь будет /api/send-message после размещения на хостинге
            const response = await fetch('/api/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    message,
                    captchaToken,
                }),
            });

            if (response.ok) {
                // Если все успешно
                statusMessage.textContent = 'Повідомлення успішно відправлено!';
                statusMessage.style.color = '#28a745'; // Зеленый цвет
                contactForm.reset(); // Очищаем форму
            } else {
                // Если сервер ответил ошибкой
                const errorData = await response.json();
                statusMessage.textContent = `Помилка: ${errorData.message}`;
                statusMessage.style.color = '#dc3545'; // Красный цвет
            }

        } catch (error) {
            // Если произошла ошибка сети
            console.error('Network error:', error);
            statusMessage.textContent = 'Помилка мережі. Спробуйте пізніше.';
            statusMessage.style.color = '#dc3545';
        } finally {
            // В любом случае разблокируем кнопку
            submitButton.disabled = false;
        }
    });
}