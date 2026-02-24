// --- АДМІН-ПАНЕЛЬ ZAZcustom ---

// HTML-екранування для запобігання XSS
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// SHA-256 через Web Crypto API
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Захешований пароль "zazcustom2025"
const ADMIN_PASSWORD_HASH = 'ca1345a029338478fe2447a40d2b25dc33d84eba4b1c091524bef029a39837b9';

// Стан
let products = [];
let editingProductId = null;

// --- АВТОРИЗАЦІЯ ---
async function checkAuth() {
    const stored = sessionStorage.getItem('admin_auth');
    return stored === ADMIN_PASSWORD_HASH;
}

async function login(password) {
    const hash = await sha256(password);
    if (hash === ADMIN_PASSWORD_HASH) {
        sessionStorage.setItem('admin_auth', hash);
        return true;
    }
    return false;
}

function logout() {
    sessionStorage.removeItem('admin_auth');
    showLogin();
}

// --- ЗАВАНТАЖЕННЯ / ЗБЕРЕЖЕННЯ ТОВАРІВ ---
async function loadAdminProducts() {
    const localData = localStorage.getItem('zazcustom_products');
    if (localData) {
        try {
            products = JSON.parse(localData);
            return;
        } catch(e) {}
    }
    try {
        const response = await fetch('/products.json');
        products = await response.json();
        saveProducts();
    } catch (error) {
        console.error('Помилка завантаження товарів:', error);
        products = [];
    }
}

function saveProducts() {
    localStorage.setItem('zazcustom_products', JSON.stringify(products));
}

// --- CRUD ---
function addProduct(productData) {
    products.push(productData);
    saveProducts();
    renderProductList();
}

function updateProduct(id, productData) {
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...productData };
        saveProducts();
        renderProductList();
    }
}

function deleteProduct(id) {
    if (!confirm('Видалити цей товар?')) return;
    products = products.filter(p => p.id !== id);
    saveProducts();
    renderProductList();
}

function toggleProductActive(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        product.active = !product.active;
        saveProducts();
        renderProductList();
    }
}

// --- ГЕНЕРАЦІЯ ID ---
function generateId() {
    return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

// --- ВІДОБРАЖЕННЯ ---
function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-screen').style.display = 'none';
}

function showAdmin() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-screen').style.display = 'block';
}

function renderProductList() {
    hideProductForm();
    const list = document.getElementById('admin-product-list');
    if (!list) return;

    if (products.length === 0) {
        list.innerHTML = '<p style="color:#888; text-align:center; padding:40px 0;">Товарів ще немає. Додайте перший товар.</p>';
        return;
    }

    list.innerHTML = products.map(product => `
        <div class="admin-product-item">
            <img src="${escapeHtml(product.images && product.images[0] ? product.images[0] : '')}" alt="${escapeHtml(product.name)}" onerror="this.style.display='none'">
            <div class="admin-product-info">
                <h3>${escapeHtml(product.name)}</h3>
                <p>ID: ${escapeHtml(product.id)} | Категорія: ${escapeHtml(product.category)}</p>
            </div>
            <div class="admin-product-price">${escapeHtml(String(product.price))} грн</div>
            <span class="admin-product-status ${product.active ? 'active' : 'inactive'}">
                ${product.active ? 'Активний' : 'Неактивний'}
            </span>
            <div class="admin-product-actions">
                <button class="admin-btn" data-action="edit" data-id="${escapeHtml(product.id)}">Редагувати</button>
                <button class="admin-btn" data-action="toggle" data-id="${escapeHtml(product.id)}">
                    ${product.active ? 'Деактивувати' : 'Активувати'}
                </button>
                <button class="admin-btn danger" data-action="delete" data-id="${escapeHtml(product.id)}">Видалити</button>
            </div>
        </div>
    `).join('');
}

function showProductForm(productId = null) {
    editingProductId = productId;
    const form = document.getElementById('admin-form-container');
    const list = document.getElementById('admin-list-container');
    form.style.display = 'block';
    list.style.display = 'none';

    const formTitle = document.getElementById('form-title');
    const product = productId ? products.find(p => p.id === productId) : null;

    formTitle.textContent = product ? 'Редагувати товар' : 'Додати новий товар';

    // Заповнення полів
    document.getElementById('field-id').value = product ? product.id : generateId();
    document.getElementById('field-name').value = product ? product.name : '';
    document.getElementById('field-price').value = product ? product.price : '';
    document.getElementById('field-category').value = product ? product.category : 'tshirt';
    document.getElementById('field-url').value = product ? product.url : '';
    document.getElementById('field-description').value = product ? product.description || '' : '';
    document.getElementById('field-composition').value = product ? product.composition || '' : '';
    document.getElementById('field-care').value = product ? product.care || '' : '';
    document.getElementById('field-featured').checked = product ? !!product.featured : false;
    document.getElementById('field-active').checked = product ? product.active !== false : true;

    // Розміри
    const allSizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const selectedSizes = product ? (product.sizes || []) : [];
    allSizes.forEach(size => {
        const cb = document.getElementById('size-' + size);
        if (cb) cb.checked = selectedSizes.includes(size);
    });

    // Фото
    const imageFields = document.getElementById('image-fields');
    const images = product ? (product.images || ['']) : [''];
    imageFields.innerHTML = images.map((img, i) => createImageFieldHTML(img, i === 0)).join('');
}

function createImageFieldHTML(value = '', isFirst = false) {
    return `
        <div class="image-field-row">
            <input type="text" placeholder="/img/назва-фото.png" value="${value}">
            ${isFirst ? '' : '<button type="button" onclick="this.closest(\'.image-field-row\').remove()" title="Видалити">×</button>'}
        </div>
    `;
}

function addImageField() {
    const imageFields = document.getElementById('image-fields');
    const newRow = document.createElement('div');
    newRow.innerHTML = createImageFieldHTML('', false);
    imageFields.appendChild(newRow.firstElementChild);
}

function hideProductForm() {
    const form = document.getElementById('admin-form-container');
    const list = document.getElementById('admin-list-container');
    if (form) form.style.display = 'none';
    if (list) list.style.display = 'block';
    editingProductId = null;
}

function saveProductForm() {
    const name = document.getElementById('field-name').value.trim();
    const priceVal = document.getElementById('field-price').value.trim();

    if (!name) {
        alert('Назва товару обов\'язкова!');
        return;
    }
    if (!priceVal || isNaN(parseFloat(priceVal))) {
        alert('Вкажіть коректну ціну!');
        return;
    }

    const allSizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const selectedSizes = allSizes.filter(size => {
        const cb = document.getElementById('size-' + size);
        return cb && cb.checked;
    });

    const imageInputs = document.querySelectorAll('#image-fields .image-field-row input');
    const images = Array.from(imageInputs).map(inp => inp.value.trim()).filter(v => v);

    const productData = {
        id: document.getElementById('field-id').value.trim(),
        name: name,
        price: parseFloat(priceVal),
        category: document.getElementById('field-category').value,
        url: document.getElementById('field-url').value.trim() || ('product-' + document.getElementById('field-id').value.trim() + '.html'),
        description: document.getElementById('field-description').value.trim(),
        composition: document.getElementById('field-composition').value.trim(),
        care: document.getElementById('field-care').value.trim(),
        sizes: selectedSizes,
        images: images,
        featured: document.getElementById('field-featured').checked,
        active: document.getElementById('field-active').checked
    };

    if (editingProductId) {
        updateProduct(editingProductId, productData);
    } else {
        addProduct(productData);
    }
}

// --- ЕКСПОРТ ---
function exportJSON() {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.json';
    a.click();
    URL.revokeObjectURL(url);
}

// --- ІНІЦІАЛІЗАЦІЯ ---
document.addEventListener('DOMContentLoaded', async () => {
    const isAuth = await checkAuth();
    if (isAuth) {
        await loadAdminProducts();
        showAdmin();
        renderProductList();
    } else {
        showLogin();
    }

    // Форма входу
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('admin-password').value;
            const success = await login(password);
            if (success) {
                await loadAdminProducts();
                showAdmin();
                renderProductList();
            } else {
                document.getElementById('login-error').textContent = 'Невірний пароль!';
            }
        });
    }

    // Кнопка "Вийти"
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Кнопка "Додати новий товар"
    const addNewBtn = document.getElementById('add-new-btn');
    if (addNewBtn) {
        addNewBtn.addEventListener('click', () => showProductForm(null));
    }

    // Кнопка "Додати ще фото"
    const addImageBtn = document.getElementById('add-image-btn');
    if (addImageBtn) {
        addImageBtn.addEventListener('click', addImageField);
    }

    // Кнопка "Зберегти"
    const saveBtn = document.getElementById('save-product-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProductForm);
    }

    // Кнопка "Скасувати"
    const cancelBtn = document.getElementById('cancel-product-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideProductForm);
    }

    // Кнопка "Експортувати JSON"
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportJSON);
    }

    // Делегування подій для списку товарів
    const productList = document.getElementById('admin-product-list');
    if (productList) {
        productList.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const id = btn.dataset.id;
            const action = btn.dataset.action;
            if (action === 'edit') showProductForm(id);
            else if (action === 'toggle') toggleProductActive(id);
            else if (action === 'delete') deleteProduct(id);
        });
    }
});
