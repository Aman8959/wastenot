// Cart state
let cart = [];
let cartTotal = 0;

// Cart functions
function addToCart(id, name, price, image) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id,
            name,
            price,
            image,
            quantity: 1
        });
    }
    
    updateCart();
    showCartPreview();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCart();
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            updateCart();
        }
    }
}

function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotalElement = document.getElementById('cartTotal');
    
    // Update cart count
    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Update cart items
    cartItems.innerHTML = cart.map(item => `
        <div class="d-flex align-items-center mb-3">
            <img src="assets/images/${item.image}" alt="${item.name}" class="cart-item-image me-3" onerror="this.src='assets/images/default.svg'">
            <div class="flex-grow-1">
                <h6 class="mb-0">${item.name}</h6>
                <div class="d-flex align-items-center">
                    <button class="btn btn-sm btn-outline-secondary me-2" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn btn-sm btn-outline-secondary ms-2" onclick="updateQuantity('${item.id}', 1)">+</button>
                </div>
                <small class="text-muted">${item.quantity} × ₹${item.price}</small>
            </div>
            <button class="btn btn-sm btn-outline-danger ms-2" onclick="removeFromCart('${item.id}')">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `).join('');
    
    // Update cart total
    cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    cartTotalElement.textContent = `₹${cartTotal}`;
}

function showCartPreview() {
    const cartPreview = document.getElementById('cartPreview');
    cartPreview.classList.add('show');
}

function hideCartPreview() {
    const cartPreview = document.getElementById('cartPreview');
    cartPreview.classList.remove('show');
}

function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Update checkout items
    const checkoutItems = document.getElementById('checkoutItems');
    checkoutItems.innerHTML = cart.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <h6 class="mb-0">${item.name}</h6>
                <small class="text-muted">${item.quantity} × ₹${item.price}</small>
            </div>
            <span>₹${item.price * item.quantity}</span>
        </div>
    `).join('');
    
    // Update checkout totals
    document.getElementById('checkoutSubtotal').textContent = `₹${cartTotal}`;
    document.getElementById('checkoutTotal').textContent = `₹${cartTotal + 49}`; // Adding delivery charge
    
    // Show checkout modal
    const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    checkoutModal.show();
    
    // Hide cart preview
    hideCartPreview();
}

function placeOrder() {
    // Validate address form
    const addressForm = document.getElementById('addressForm');
    if (!addressForm.checkValidity()) {
        addressForm.reportValidity();
        return;
    }
    
    // Hide checkout modal
    const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
    checkoutModal.hide();
    
    // Show success modal
    const successModal = new bootstrap.Modal(document.getElementById('orderSuccessModal'));
    successModal.show();
    
    // Clear cart
    cart = [];
    updateCart();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Close cart button
    document.getElementById('closeCart').addEventListener('click', hideCartPreview);
    
    // Continue shopping button
    document.getElementById('continueShopping').addEventListener('click', hideCartPreview);
    
    // Cart button in navbar
    document.getElementById('cartButton').addEventListener('click', (e) => {
        e.preventDefault();
        showCartPreview();
    });
}); 