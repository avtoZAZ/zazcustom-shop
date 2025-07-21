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

    // --- 2. ЛОГИКА ДЛЯ ВСЕХ СТРАНИЦ, КРОМЕ КОРЗИНЫ ---
    if (!document.body.classList.contains('cart-page')) {
        const addToCartButtons = document.querySelectorAll('.btn-buy, .btn-buy-lg');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const productCard = event.target.closest('[data-id]');
                if (productCard) {
                    const product = {
                        id: productCard.dataset.id,
                        name: productCard.dataset.name,
                        price: parseFloat(productCard.dataset.price),
                        image: productCard.querySelector('.product-image-primary')?.src || productCard.querySelector('.product-image')?.src
                    };
                    
                    const existingItem = cart.find(item => item.id === product.id);
                    if (existingItem) {
                        existingItem.quantity++;
                    } else {
                        cart.push({ ...product, quantity: 1 });
                    }
                    saveCart();
                    updateCartCounter();
                    alert(`"${product.name}" додано до корзини!`);
                }
            });
        });
    }

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
                cartSummary.classList.add('cart-summary-hidden');
                emptyCartMessage.classList.remove('empty-cart-message-hidden');
                return;
            }

            cartSummary.classList.remove('cart-summary-hidden');
            emptyCartMessage.classList.add('empty-cart-message-hidden');
            
            let totalPrice = 0;

            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                totalPrice += itemTotal;

                const cartItemEl = document.createElement('div');
                cartItemEl.className = 'cart-item';
                cartItemEl.innerHTML = `
                    <img src="${item.image || 'https://via.placeholder.com/100x120'}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h3 class="cart-item-title">${item.name}</h3>
                        <p class="cart-item-price">${item.price} грн</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
                    </div>
                    <button class="cart-item-remove" data-id="${item.id}">Видалити</button>
                `;
                cartItemsContainer.appendChild(cartItemEl);
            });

            cartTotalPriceEl.textContent = totalPrice;
            addCartEventListeners();
        }

        function addCartEventListeners() {
            const removeButtons = document.querySelectorAll('.cart-item-remove');
            removeButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    cart = cart.filter(item => item.id !== id);
                    saveCart();
                    renderCart();
                    updateCartCounter();
                });
            });

            const quantityButtons = document.querySelectorAll('.quantity-btn');
            quantityButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    const action = e.target.dataset.action;
                    const itemInCart = cart.find(item => item.id === id);

                    if (action === 'increase') {
                        itemInCart.quantity++;
                    } else if (action === 'decrease') {
                        if (itemInCart.quantity > 1) {
                            itemInCart.quantity--;
                        } else {
                            cart = cart.filter(item => item.id !== id);
                        }
                    }
                    saveCart();
                    renderCart();
                    updateCartCounter();
                });
            });
        }
        
        // --- ОБРАБОТКА ФОРМЫ ЗАКАЗА ---
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const orderStatus = document.getElementById('order-status');
            
            const customerName = document.getElementById('customer-name').value;
            const customerPhone = document.getElementById('customer-phone').value;
            const customerComment = document.getElementById('customer-comment').value;

            // Формируем красивое сообщение для Telegram
            let orderMessage = `
🚨 *Нове замовлення з сайту ZAZcustom!* 🚨

👤 **Клієнт:** ${customerName}
📞 **Телефон:** ${customerPhone}
💬 **Коментар:** ${customerComment || 'Немає'}

---
🛒 **Склад замовлення:**
`;
            let total = 0;
            cart.forEach(item => {
                orderMessage += `
- ${item.name}
  *Кількість:* ${item.quantity}
  *Ціна:* ${item.price} грн
`;
                total += item.price * item.quantity;
            });

            orderMessage += `
---
💰 **Загальна сума:** *${total} грн*
`;
            
            orderStatus.textContent = "Відправка...";
            
            try {
                const response = await fetch('/api/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // Отправляем ОДНО большое сообщение
                    body: JSON.stringify({ message: orderMessage, type: 'order' })
                });

                if (response.ok) {
                    orderStatus.textContent = "✅ Замовлення успішно відправлено!";
                    cart = []; // Очищаем корзину
                    saveCart();
                    renderCart();
                    updateCartCounter();
                } else {
                    const result = await response.json();
                    orderStatus.textContent = `Помилка: ${result.message}`;
                }
            } catch (error) {
                orderStatus.textContent = 'Помилка мережі.';
            }
        });

        renderCart(); // Первая отрисовка корзины при загрузке страницы
    }

    // --- ОБЩАЯ ИНИЦИАЛИЗАЦИЯ ---
    updateCartCounter();
});