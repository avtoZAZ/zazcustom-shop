document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ЛОГИКА КОРЗИНЫ (ГЛОБАЛЬНАЯ) ---
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCartCounter() {
        const cartLink = document.getElementById('cart-link');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartLink) {
            cartLink.textContent = `Корзина (${totalItems})`;
        }
    }

    // --- 2. ЛОГИКА ДОБАВЛЕНИЯ В КОРЗИНУ (для всех страниц) ---
    const addToCartButtons = document.querySelectorAll('.btn-buy, .btn-buy-lg');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const productCard = event.target.closest('[data-id]');
            if (!productCard) return;

            let selectedSize = 'M';
            const sizeSelector = productCard.querySelector('.size-selector .active');
            
            if (sizeSelector) {
                selectedSize = sizeSelector.textContent;
            } else {
                const firstSizeButton = productCard.querySelector('.size-selector .size-btn');
                if (firstSizeButton) {
                    selectedSize = firstSizeButton.textContent;
                }
            }

            let imageUrl = '';
            const imageInContainer = productCard.querySelector('.product-image-container .product-image-primary');
            if (imageInContainer) {
                imageUrl = imageInContainer.src;
            } else {
                const mainImage = productCard.querySelector('.main-product-image') || productCard.querySelector('.product-image');
                if (mainImage) {
                    imageUrl = mainImage.src;
                }
            }

            const product = {
                id: productCard.dataset.id,
                name: productCard.dataset.name,
                price: parseFloat(productCard.dataset.price),
                image: imageUrl,
                url: productCard.dataset.url
            };

            const cartItemId = `${product.id}_${selectedSize}`;
            const existingItem = cart.find(item => item.cartId === cartItemId);

            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({ ...product, size: selectedSize, quantity: 1, cartId: cartItemId });
            }

            saveCart();
            updateCartCounter();
            alert(`"${product.name}" (Розмір: ${selectedSize}) додано до корзини!`);
        });
    });

    // --- 3. ЛОГИКА ТОЛЬКО ДЛЯ СТРАНИЦЫ КОРЗИНЫ ---
    if (document.body.classList.contains('cart-page')) {
        const cartItemsContainer = document.getElementById('cart-items-container');
        const cartSummary = document.getElementById('cart-summary');
        const emptyCartMessage = document.getElementById('empty-cart-message');
        const cartTotalPriceEl = document.getElementById('cart-total-price');
        const orderForm = document.getElementById('order-form');

        function renderCart() {
            cartItemsContainer.innerHTML = '';
            if (cart.length === 0) {
                cartSummary.style.display = 'none';
                emptyCartMessage.style.display = 'block';
                return;
            }
            cartSummary.style.display = 'block';
            emptyCartMessage.style.display = 'none';
            let totalPrice = 0;
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                totalPrice += itemTotal;
                const cartItemEl = document.createElement('div');
                cartItemEl.className = 'cart-item';
                cartItemEl.innerHTML = `
                    <a href="${item.url}" class="cart-item-link">
                        <img src="${item.image || 'https://via.placeholder.com/100x120/1a1a1a/e0e0e0?text=ZAZ'}" alt="${item.name}" class="cart-item-image">
                    </a>
                    <div class="cart-item-info">
                        <a href="${item.url}" class="cart-item-link">
                            <h3 class="cart-item-title">${item.name}</h3>
                        </a>
                        <p class="cart-item-size">Розмір: ${item.size}</p>
                        <p class="cart-item-price">${item.price} грн</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" data-cart-id="${item.cartId}" data-action="decrease">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-cart-id="${item.cartId}" data-action="increase">+</button>
                    </div>
                    <p class="cart-item-total-price">${itemTotal} грн</p>
                    <button class="cart-item-remove" data-cart-id="${item.cartId}">×</button>
                `;
                cartItemsContainer.appendChild(cartItemEl);
            });
            cartTotalPriceEl.textContent = totalPrice;
        }

        cartItemsContainer.addEventListener('click', (event) => {
            const target = event.target;
            const cartId = target.dataset.cartId;
            if (!cartId) return;
            if (target.classList.contains('cart-item-remove')) {
                cart = cart.filter(item => item.cartId !== cartId);
            }
            if (target.classList.contains('quantity-btn')) {
                const item = cart.find(item => item.cartId === cartId);
                const action = target.dataset.action;
                if (item) {
                    if (action === 'increase') {
                        item.quantity++;
                    } else if (action === 'decrease') {
                        if (item.quantity > 1) {
                            item.quantity--;
                        } else {
                            cart = cart.filter(item => item.cartId !== cartId);
                        }
                    }
                }
            }
            saveCart();
            renderCart();
            updateCartCounter();
        });
        
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const orderStatus = document.getElementById('order-status');
            const submitButton = document.querySelector('#order-form button');
            const customerName = document.getElementById('customer-name').value;
            const customerPhone = document.getElementById('customer-phone').value;
            const customerComment = document.getElementById('customer-comment').value;

            let orderMessage = `🚨 *Нове замовлення з сайту ZAZcustom!* 🚨\n\n`;
            orderMessage += `👤 **Клієнт:** ${customerName}\n`;
            orderMessage += `📞 **Телефон:** ${customerPhone}\n`;
            orderMessage += `💬 **Коментар:** ${customerComment || 'Немає'}\n\n`;
            orderMessage += `---
🛒 **Склад замовлення:**\n`;
            
            let total = 0;
            cart.forEach(item => {
                orderMessage += `\n- ${item.name}\n`;
                orderMessage += `  *Розмір:* ${item.size}\n`;
                orderMessage += `  *Кількість:* ${item.quantity}\n`;
                orderMessage += `  *Ціна:* ${item.price} грн\n`;
                total += item.price * item.quantity;
            });

            orderMessage += `\n---\n💰 **Загальна сума:** *${total} грн*`;
            
            orderStatus.textContent = "Відправка...";
            orderStatus.style.color = 'var(--text-color)';
            submitButton.disabled = true;
            
            try {
                const response = await fetch('/api/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: orderMessage, type: 'order' })
                });

                if (response.ok) {
                    orderStatus.textContent = "✅ Замовлення успішно відправлено!";
                    orderStatus.style.color = 'lightgreen';
                    cart = [];
                    saveCart();
                    renderCart();
                    updateCartCounter();
                    orderForm.reset();
                } else {
                    const result = await response.json();
                    orderStatus.textContent = `Помилка: ${result.message || 'невідома помилка сервера'}`;
                    orderStatus.style.color = 'red';
                }
            } catch (error) {
                console.error("Order submission error:", error);
                orderStatus.textContent = 'Помилка мережі.';
                orderStatus.style.color = 'red';
            } finally {
                 submitButton.disabled = false;
            }
        });

        renderCart();
    }
    
    // --- 4. ЛОГИКА ДЛЯ СТРАНИЦЫ ТОВАРА (ВЫБОР РАЗМЕРА) ---
    const sizeSelectorContainer = document.querySelector('.product-info .size-selector');
    if (sizeSelectorContainer) {
        sizeSelectorContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('size-btn')) {
                sizeSelectorContainer.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    }

    // --- 5. ЛОГИКА ДЛЯ СТРАНИЦЫ КОНТАКТОВ (СТАТИЧЕСКАЯ КАПЧА) ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        const captchaLabel = document.getElementById('captcha-label');
        const statusMessage = document.getElementById('form-status');
        const submitButton = document.getElementById('submit-btn');

        function generateCaptcha() {
            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            if (captchaLabel) {
                captchaLabel.textContent = `Перевірка: Скільки буде ${num1} + ${num2}?`;
            }
        }
        generateCaptcha();

        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            const captchaQuestion = captchaLabel.textContent;
            const captchaAnswer = formData.get('captcha');

            submitButton.disabled = true;
            statusMessage.textContent = 'Відправка...';
            statusMessage.style.color = 'var(--text-color)';

            try {
                const response = await fetch('/api/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message, captchaQuestion, captchaAnswer, type: 'contact' }),
                });

                const result = await response.json();

                if (response.ok) {
                    statusMessage.textContent = 'Повідомлення успішно відправлено!';
                    statusMessage.style.color = 'lightgreen';
                    contactForm.reset();
                    generateCaptcha();
                } else {
                    statusMessage.textContent = `Помилка: ${result.message}`;
                    statusMessage.style.color = 'red';
                    generateCaptcha();
                }

            } catch (error) {
                console.error('Contact form error:', error);
                statusMessage.textContent = 'Помилка мережі. Спробуйте пізніше.';
                statusMessage.style.color = 'red';
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    // --- ОБЩАЯ ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ЛЮБОЙ СТРАНИЦЫ ---
    updateCartCounter();
});