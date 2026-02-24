document.addEventListener('DOMContentLoaded', () => {

    // --- 1. TOAST-СПОВІЩЕННЯ ---
    function showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('show'));
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // --- 2. ЛОГІКА КОРЗИНИ (ГЛОБАЛЬНА) ---
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCartCounter() {
        const cartBadge = document.getElementById('cart-badge');
        if (!cartBadge) return;
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
        if (totalItems > 0) {
            cartBadge.style.display = 'flex';
        } else {
            cartBadge.style.display = 'none';
        }
    }

    // --- 3. ДОДАВАННЯ В КОРЗИНУ ---
    const addToCartButtons = document.querySelectorAll('.btn-buy, .btn-buy-lg');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const productCard = event.target.closest('[data-id]');
            if (!productCard) return;

            let selectedSize = 'M';
            const activeSizeBtn = productCard.querySelector('.size-selector .active');
            if (activeSizeBtn) {
                selectedSize = activeSizeBtn.textContent;
            } else {
                const firstSizeBtn = productCard.querySelector('.size-selector .size-btn');
                if (firstSizeBtn) selectedSize = firstSizeBtn.textContent;
            }

            let imageUrl = '';
            const imageInContainer = productCard.querySelector('.product-image-container .product-image-primary');
            if (imageInContainer) {
                imageUrl = imageInContainer.src;
            } else {
                const mainImage = productCard.querySelector('.main-product-image') || productCard.querySelector('.product-image');
                if (mainImage) imageUrl = mainImage.src;
            }

            const product = {
                id: productCard.dataset.id,
                name: productCard.dataset.name,
                price: parseFloat(productCard.dataset.price),
                image: imageUrl,
                url: productCard.dataset.url || 'product.html'
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

            const badge = document.getElementById('cart-badge');
            if (badge) {
                badge.classList.remove('pulse');
                void badge.offsetWidth;
                badge.classList.add('pulse');
                setTimeout(() => badge.classList.remove('pulse'), 600);
            }

            showToast(`"${product.name}" (Розмір: ${selectedSize}) додано до корзини!`);
        });
    });

    // --- 4. СТОРІНКА КОРЗИНИ ---
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
                            cart = cart.filter(i => i.cartId !== cartId);
                        }
                    }
                }
            }
            saveCart();
            renderCart();
            updateCartCounter();
        });

        if (orderForm) {
            orderForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const orderStatus = document.getElementById('order-status');
                const submitButton = document.querySelector('#order-form button[type="submit"]');
                const customerName = document.getElementById('customer-name').value;
                const customerPhone = document.getElementById('customer-phone').value;
                const customerComment = document.getElementById('customer-comment').value;

                let orderMessage = `🚨 *Нове замовлення з сайту ZAZcustom!* 🚨\n\n`;
                orderMessage += `👤 **Клієнт:** ${customerName}\n`;
                orderMessage += `📞 **Телефон:** ${customerPhone}\n`;
                orderMessage += `💬 **Коментар:** ${customerComment || 'Немає'}\n\n`;
                orderMessage += `---\n🛒 **Склад замовлення:**\n`;

                let total = 0;
                cart.forEach(item => {
                    orderMessage += `\n- ${item.name}\n`;
                    orderMessage += `  *Розмір:* ${item.size}\n`;
                    orderMessage += `  *Кількість:* ${item.quantity}\n`;
                    orderMessage += `  *Ціна:* ${item.price} грн\n`;
                    total += item.price * item.quantity;
                });

                orderMessage += `\n---\n💰 **Загальна сума:** *${total} грн*`;

                orderStatus.textContent = 'Відправка...';
                orderStatus.style.color = 'var(--text-color)';
                submitButton.disabled = true;

                try {
                    const response = await fetch('/api/send-message', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: orderMessage, type: 'order' })
                    });

                    if (response.ok) {
                        orderStatus.textContent = '✅ Замовлення успішно відправлено!';
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
                    console.error('Order submission error:', error);
                    orderStatus.textContent = 'Помилка мережі.';
                    orderStatus.style.color = 'red';
                } finally {
                    submitButton.disabled = false;
                }
            });
        }

        renderCart();
    }

    // --- 5. ВИБІР РОЗМІРУ (СТОРІНКА ТОВАРУ) ---
    const sizeSelectorContainer = document.querySelector('.product-info .size-selector');
    if (sizeSelectorContainer) {
        sizeSelectorContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('size-btn')) {
                sizeSelectorContainer.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    }

    // --- 6. ГАЛЕРЕЯ НА СТОРІНЦІ ТОВАРУ (JS, без :target) ---
    const galleryMainView = document.querySelector('.gallery-main-view');
    if (galleryMainView) {
        const imageWrappers = galleryMainView.querySelectorAll('.gallery-image-wrapper');
        const thumbnailBtns = document.querySelectorAll('.thumbnail-btn');

        function showGalleryImage(index) {
            imageWrappers.forEach((wrapper, i) => {
                wrapper.classList.toggle('active', i === index);
            });
            thumbnailBtns.forEach((btn, i) => {
                btn.classList.toggle('active', i === index);
            });
        }

        if (imageWrappers.length > 0) {
            showGalleryImage(0);
        }

        thumbnailBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => showGalleryImage(index));
        });
    }

    // --- 7. ФІЛЬТРИ КАТАЛОГУ ---
    const filterBar = document.querySelector('.filter-bar');
    const catalogSearch = document.getElementById('catalog-search');
    const catalogSort = document.getElementById('catalog-sort');
    const productGrid = document.querySelector('.product-grid');

    if (filterBar || catalogSearch || catalogSort) {
        const productCards = productGrid ? Array.from(productGrid.querySelectorAll('.product-card')) : [];

        let currentFilter = 'all';
        let currentSearch = '';
        let currentSort = 'default';

        function applyFilters() {
            let visible = productCards.filter(card => {
                const matchCategory = currentFilter === 'all' || card.dataset.category === currentFilter;
                const cardName = (card.dataset.name || card.querySelector('.product-title')?.textContent || '').toLowerCase();
                const matchSearch = cardName.includes(currentSearch.toLowerCase());
                return matchCategory && matchSearch;
            });

            let hidden = productCards.filter(card => !visible.includes(card));

            if (currentSort !== 'default' && productGrid) {
                visible.sort((a, b) => {
                    if (currentSort === 'price-asc') return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
                    if (currentSort === 'price-desc') return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
                    if (currentSort === 'name-asc') {
                        const nameA = a.dataset.name || '';
                        const nameB = b.dataset.name || '';
                        return nameA.localeCompare(nameB, 'uk');
                    }
                    return 0;
                });
                visible.forEach(card => productGrid.appendChild(card));
            }

            productCards.forEach(card => card.classList.remove('hidden'));
            hidden.forEach(card => card.classList.add('hidden'));
        }

        if (filterBar) {
            filterBar.addEventListener('click', (event) => {
                const targetButton = event.target.closest('.filter-btn');
                if (!targetButton) return;
                filterBar.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                targetButton.classList.add('active');
                currentFilter = targetButton.dataset.filter;
                applyFilters();
            });
        }

        if (catalogSearch) {
            catalogSearch.addEventListener('input', (e) => {
                currentSearch = e.target.value;
                applyFilters();
            });
        }

        if (catalogSort) {
            catalogSort.addEventListener('change', (e) => {
                currentSort = e.target.value;
                applyFilters();
            });
        }
    }

    // --- 8. КОНТАКТНА ФОРМА З КАПЧЕЮ ---
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

    // --- 9. SCROLL-TO-TOP ---
    const scrollTopBtn = document.getElementById('scroll-top');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
        });
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- 10. HEADER SCROLL EFFECT ---
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('header-scrolled', window.scrollY > 50);
        });
    }

    // --- 11. SCROLL-АНІМАЦІЇ (INTERSECTION OBSERVER) ---
    const fadeUpElements = document.querySelectorAll('.fade-up');
    if (fadeUpElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        fadeUpElements.forEach(el => observer.observe(el));
    }

    // --- 12. БУРГЕР-МЕНЮ ---
    const burgerMenu = document.getElementById('burger-menu');
    const nav = document.getElementById('nav');

    if (burgerMenu && nav) {
        burgerMenu.addEventListener('click', () => {
            burgerMenu.classList.toggle('active');
            nav.classList.toggle('active');
        });

        nav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                burgerMenu.classList.remove('active');
                nav.classList.remove('active');
            });
        });
    }

    // --- ІНІЦІАЛІЗАЦІЯ ---
    updateCartCounter();
});
