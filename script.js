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

            // Определяем выбранный размер
            let selectedSize = 'One Size'; // Размер по умолчанию
            const sizeSelector = productCard.querySelector('.size-selector .active');
            if (sizeSelector) {
                selectedSize = sizeSelector.textContent;
            }

            const product = {
                id: productCard.dataset.id,
                name: productCard.dataset.name,
                price: parseFloat(productCard.dataset.price),
                // Ищем основное фото товара
                image: productCard.querySelector('.product-image-primary')?.src || productCard.querySelector('.main-product-image')?.src || productCard.querySelector('.product-image')?.src
            };

            // Создаем уникальный ID для товара с учетом размера (например, "p1_M")
            const cartItemId = `${product.id}_${selectedSize}`;

            const existingItem = cart.find(item => item.cartId === cartItemId);

            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({ 
                    ...product, 
                    size: selectedSize, 
                    quantity: 1, 
                    cartId: cartItemId // Сохраняем уникальный ID
                });
            }

            saveCart();
            updateCartCounter();
            alert(`"${product.name}" (Розмір: ${selectedSize}) додано до корзини!`);
        });
    });


    // --- 3. ЛОГИКА ТОЛЬКО ДЛЯ СТРАНИЦЫ КОРЗИНЫ ---
    // Убедитесь, что в cart.html у тега body есть класс "cart-page"
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
                // Добавляем вывод размера
                cartItemEl.innerHTML = `
                    <img src="${item.image || 'https://via.placeholder.com/100x120/1a1a1a/e0e0e0?text=ZAZ'}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h3 class="cart-item-title">${item.name}</h3>
                        <p class="cart-item-size">Розмір: ${item.size}</p> <!-- ВОТ ЗДЕСЬ -->
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
            addCartEventListeners();
        }

        function addCartEventListeners() {
            cartItemsContainer.addEventListener('click', (e) => {
                const target = e.target;
                const cartId = target.dataset.cartId;
                if (!cartId) return;

                if (target.classList.contains('cart-item-remove')) {
                    cart = cart.filter(item => item.cartId !== cartId);
                }

                if (target.classList.contains('quantity-btn')) {
                    const itemInCart = cart.find(item => item.cartId === cartId);
                    const action = target.dataset.action;
                    if (action === 'increase') {
                        itemInCart.quantity++;
                    } else if (action === 'decrease') {
                        if (itemInCart.quantity > 1) {
                            itemInCart.quantity--;
                        } else {
                            cart = cart.filter(item => item.cartId !== cartId);
                        }
                    }
                }
                
                saveCart();
                renderCart();
                updateCartCounter();
            });
        }
        
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (логика отправки заказа, будет изменена в следующем шаге)
            const orderStatus = document.getElementById('order-status');
            const customerName = document.getElementById('customer-name').value;
            const customerPhone = document.getElementById('customer-phone').value;
            const customerComment = document.getElementById('customer-comment').value;

            let orderMessage = `🚨 *Нове замовлення з сайту ZAZcustom!* 🚨\n\n👤 **Клієнт:** ${customerName}\n📞 **Телефон:** ${customerPhone}\n💬 **Коментар:** ${customerComment || 'Немає'}\n\n---
🛒 **Склад замовлення:**\n`;
            let total = 0;
            cart.forEach(item => {
                orderMessage += `\n- ${item.name}\n  *Розмір:* ${item.size}\n  *Кількість:* ${item.quantity}\n  *Ціна:* ${item.price} грн\n`; // Добавлен размер
                total += item.price * item.quantity;
            });

            orderMessage += `\n---\n💰 **Загальна сума:** *${total} грн*`;
            
            orderStatus.textContent = "Відправка...";
            orderStatus.style.color = 'var(--text-color)';
            document.querySelector('#order-form button').disabled = true;
            
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
                    orderStatus.textContent = `Помилка: ${result.message}`;
                    orderStatus.style.color = 'red';
                }
            } catch (error) {
                orderStatus.textContent = 'Помилка мережі.';
                orderStatus.style.color = 'red';
            } finally {
                 document.querySelector('#order-form button').disabled = false;
            }
        });

        renderCart();
    }
    
    // --- 4. ЛОГИКА ДЛЯ СТРАНИЦЫ ТОВАРА (ВЫБОР РАЗМЕРА) ---
    const sizeSelectorContainer = document.querySelector('.size-selector');
    if (sizeSelectorContainer) {
        sizeSelectorContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('size-btn')) {
                // Убираем 'active' у всех кнопок-соседей
                sizeSelectorContainer.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
                // Добавляем 'active' только той, на которую кликнули
                e.target.classList.add('active');
            }
        });
    }

    // --- ОБЩАЯ ИНИЦИАЛИЗАЦИЯ ---
    updateCartCounter();
});