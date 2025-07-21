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

            // --- ИСПРАВЛЕНИЕ: РАЗМЕР ПО УМОЛЧАНИЮ ---
            let selectedSize = 'M'; // По умолчанию ставим "M"
            const sizeSelector = productCard.querySelector('.size-selector .active');
            if (sizeSelector) {
                // Если активный размер найден, используем его
                selectedSize = sizeSelector.textContent;
            } else {
                // Если мы на странице товара, но размер не выбран, ищем первую кнопку размера
                const firstSizeButton = productCard.querySelector('.size-selector .size-btn');
                if (firstSizeButton && !sizeSelector) {
                    selectedSize = firstSizeButton.textContent;
                }
                // Если мы в каталоге, где нет кнопок, размер останется "One Size" (если поменять выше) или "M"
            }
            // Для товаров без выбора размера (например, аксессуары) можно установить значение по умолчанию "One Size"
            if (!productCard.querySelector('.size-selector')) {
                selectedSize = 'One Size';
            }

            const product = {
                id: productCard.dataset.id,
                name: productCard.dataset.name,
                price: parseFloat(productCard.dataset.price),
                image: productCard.querySelector('.product-image-primary')?.src || productCard.querySelector('.main-product-image')?.src || productCard.querySelector('.product-image')?.src
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
                    <img src="${item.image || 'https://via.placeholder.com/100x120/1a1a1a/e0e0e0?text=ZAZ'}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h3 class="cart-item-title">${item.name}</h3>
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

        // --- ИСПРАВЛЕНИЕ: ВОЗВРАЩАЕМ ПРОСТОЙ И НАДЕЖНЫЙ ОБРАБОТЧИК СОБЫТИЙ ---
        cartItemsContainer.addEventListener('click', (event) => {
            const target = event.target;
            const cartId = target.dataset.cartId;

            // Если кликнули не на кнопку с data-cart-id, ничего не делаем
            if (!cartId) return;

            // Логика удаления
            if (target.classList.contains('cart-item-remove')) {
                cart = cart.filter(item => item.cartId !== cartId);
            }

            // Логика изменения количества
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
                            // Если количество 1 и нажимаем "-", удаляем товар
                            cart = cart.filter(item => item.cartId !== cartId);
                        }
                    }
                }
            }

            // После любого действия сохраняем и перерисовываем корзину
            saveCart();
            renderCart();
            updateCartCounter();
        });
        
        // Логика отправки заказа (остается без изменений)
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (весь код отправки формы)
        });

        renderCart(); // Первая отрисовка корзины
    }
    
    // --- 4. ЛОГИКА ДЛЯ ВЫБОРА РАЗМЕРА (без изменений) ---
    const sizeSelectorContainer = document.querySelector('.size-selector');
    if (sizeSelectorContainer) {
        sizeSelectorContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('size-btn')) {
                sizeSelectorContainer.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    }

    // --- ОБЩАЯ ИНИЦИАЛИЗАЦИЯ ---
    updateCartCounter();
});