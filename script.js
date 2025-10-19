// --- STATE & CONFIG ---
// This is the critical line that has been updated.
const API_URL = 'https://elegantcollectionnew-backend.onrender.com/api'; // <-- REPLACE WITH YOUR ACTUAL RENDER URL

let cart = [];
const products = [
    {id: 1, name: "Classic Leather Watch", price: 24999, description: "Elegant timepiece with genuine leather strap", category: "watches", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=500&q=80"},
    {id: 2, name: "Premium Fountain Pen", price: 12499, description: "Handcrafted fountain pen with gold-plated nib", category: "accessories", image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=500&q=80"},
    {id: 3, name: "Leather Wallet", price: 7499, description: "Full-grain leather bifold wallet", category: "leather", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=500&q=80"},
    {id: 4, name: "Designer Sunglasses", price: 9999, description: "Premium acetate frame sunglasses with UV protection", category: "accessories", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=500&q=80"}
];

// --- DOM ELEMENTS ---
const productsGrid = document.getElementById('products');
const cartItemsEl = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const authContainer = document.getElementById('auth-container');
const authModal = document.getElementById('auth-modal');
const loginFormContainer = document.getElementById('login-form-container');
const signupFormContainer = document.getElementById('signup-form-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const signupPasswordInput = document.getElementById('signup-password');
const strengthBar = document.querySelector('.strength-bar');
const toastEl = document.getElementById('toast');
const searchInput = document.getElementById('search-input');
const searchSuggestions = document.getElementById('search-suggestions');
const categoryButtons = document.querySelectorAll('.category-btn');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    displayProducts(products);
    checkLoginState();
    setupEventListeners();
});

// --- EVENT LISTENERS ---
function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    signupPasswordInput.addEventListener('input', updatePasswordStrength);

    // Category filtering
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterProducts(category);
        });
    });

    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('focus', () => searchSuggestions.classList.add('active'));
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchSuggestions.classList.remove('active');
        }
    });
}

// --- AUTHENTICATION & UI ---
function checkLoginState() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
        updateUIAfterLogin(user.name);
    } else {
        updateUIAfterLogout();
    }
}

function updateUIAfterLogin(name) {
    authContainer.innerHTML = `
        <p class="user-welcome">Welcome, <span>${name}</span></p>
        <button class="logout-btn" onclick="logout()">Logout</button>
    `;
    closeAuthModal();
}

function updateUIAfterLogout() {
    authContainer.innerHTML = `
        <a href="#" class="auth-link" onclick="showAuthModal('login')">Sign In / Register</a>
    `;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateUIAfterLogout();
    showToast('You have been logged out.', 'success');
}

async function handleLogin(e) {
    e.preventDefault();
    clearErrors();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        document.getElementById('login-generic-error').textContent = 'Please fill in all fields.';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        updateUIAfterLogin(data.user.name);
        showToast(data.message, 'success');

    } catch (error) {
        document.getElementById('login-generic-error').textContent = error.message;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    if (!validateSignup()) return;
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        showToast(data.message, 'success');
        showLoginForm();
        loginForm.reset();
        signupForm.reset();

    } catch (error) {
        document.getElementById('signup-generic-error').textContent = error.message;
    }
}

// --- AUTH MODAL & FORM UI ---
function showAuthModal(form = 'login') {
    authModal.style.display = 'flex';
    if (form === 'login') showLoginForm();
    else showSignupForm();
}

function closeAuthModal() {
    authModal.style.display = 'none';
    clearErrors();
    loginForm.reset();
    signupForm.reset();
}

function showLoginForm() {
    loginFormContainer.style.display = 'block';
    signupFormContainer.style.display = 'none';
    clearErrors();
}

function showSignupForm() {
    loginFormContainer.style.display = 'none';
    signupFormContainer.style.display = 'block';
    clearErrors();
}

// --- VALIDATION & HELPERS ---
function validateSignup() {
    clearErrors();
    let isValid = true;
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (!name) {
        document.getElementById('signup-name-error').textContent = 'Name is required.';
        isValid = false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        document.getElementById('signup-email-error').textContent = 'Please enter a valid email.';
        isValid = false;
    }
    if (password.length < 8) {
        document.getElementById('signup-password-error').textContent = 'Password must be at least 8 characters.';
        isValid = false;
    }
    if (password !== confirmPassword) {
        document.getElementById('signup-confirm-password-error').textContent = 'Passwords do not match.';
        isValid = false;
    }
    return isValid;
}

function updatePasswordStrength() {
    const password = signupPasswordInput.value;
    let strength = 0;
    if (password.length > 7) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;

    strengthBar.style.width = (strength / 4) * 100 + '%';
    if (strength < 2) strengthBar.style.backgroundColor = '#e74c3c';
    else if (strength < 4) strengthBar.style.backgroundColor = '#f39c12';
    else strengthBar.style.backgroundColor = '#2ecc71';
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
}

function showToast(message, type = 'success') {
    toastEl.textContent = message;
    toastEl.className = `toast show ${type}`;
    setTimeout(() => {
        toastEl.className = toastEl.className.replace('show', '');
    }, 3000);
}

// --- E-COMMERCE LOGIC (RESTORED TO ORIGINAL) ---
function displayProducts(productsToShow) {
    productsGrid.innerHTML = productsToShow.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <div class="product-header">
                    <span class="product-category">${product.category}</span>
                    <h3>${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                </div>
                <div class="product-footer">
                    <div class="product-price">₹${product.price.toLocaleString('en-IN')}</div>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                        <i class="fas fa-shopping-cart"></i>
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterProducts(category) {
    const filteredProducts = category === 'all' 
        ? products 
        : products.filter(product => product.category === category);
    displayProducts(filteredProducts);
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const suggestions = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
    );

    if (searchTerm && suggestions.length > 0) {
        searchSuggestions.innerHTML = suggestions.map(product => `
            <div class="suggestion-item" onclick="selectProduct(${product.id})">
                ${product.name}
            </div>
        `).join('');
        searchSuggestions.classList.add('active');
    } else {
        searchSuggestions.classList.remove('active');
    }
}

function selectProduct(productId) {
    const product = products.find(p => p.id === productId);
    searchInput.value = product.name;
    searchSuggestions.classList.remove('active');
    displayProducts([product]);
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCart();
}

function updateCart() {
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartItemsEl.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.name}</h4>
                <div class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">×</button>
        </div>
    `).join('');
    cartTotal.textContent = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('en-IN');
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        updateCart();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
}

function proceedToCheckout() {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Please log in to proceed to checkout.', 'error');
        showAuthModal('login');
        return;
    }
    if (cart.length === 0) {
        showToast('Your cart is empty.', 'error');
        return;
    }
    showToast('Redirecting to checkout...', 'success');
}

