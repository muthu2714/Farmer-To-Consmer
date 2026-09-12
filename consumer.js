const API_BASE = '/api';

const getUser = () => JSON.parse(localStorage.getItem('agriUser') || 'null');
const getToken = () => localStorage.getItem('agriToken');

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken() || ''}`,
});

const ensureConsumerAuth = () => {
  const user = getUser();
  if (!user || !getToken() || user.role !== 'consumer') {
    window.location.href = './login.html';
    return null;
  }

  return user;
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

let cart = [];

const addToCart = (product) => {
  const existing = cart.find((item) => item._id === product._id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  renderCart();
};

const removeFromCart = (productId) => {
  cart = cart.filter((item) => item._id !== productId);
  renderCart();
};

const renderCart = () => {
  const cartItems = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  if (!cartItems || !totalEl) return;

  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty-state">Your cart is empty.</p>';
    totalEl.textContent = '0';
    return;
  }

  cartItems.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div>
        <strong>${item.name}</strong>
        <p>${item.quantity} x ${formatCurrency(item.price)}</p>
      </div>
      <button class="btn btn-secondary" data-remove-cart="${item._id}">Remove</button>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + Number(item.price * item.quantity), 0);
  totalEl.textContent = total.toLocaleString('en-IN');
};

const loadProducts = async () => {
  const container = document.getElementById('consumer-products');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE}/products`);
    const products = await response.json();

    const search = (localStorage.getItem('agri-search') || '').trim();
    const filtered = products.filter((product) => {
      const categoryFilter = document.getElementById('category-filter')?.value || '';
      const organicFilter = document.getElementById('organic-filter')?.value || '';
      const searchFilter = document.getElementById('product-search')?.value || '';

      const matchesSearch = !searchFilter && !search ? true : product.name.toLowerCase().includes((searchFilter || search).toLowerCase());
      const matchesCategory = !categoryFilter || product.category === categoryFilter;
      const matchesOrganic = !organicFilter || String(product.isOrganic) === organicFilter;
      return matchesSearch && matchesCategory && matchesOrganic;
    });

    container.innerHTML = filtered.length
      ? filtered.map((product) => `
          <article class="product-card">
            <img src="${product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'}" alt="${product.name}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';" />
            <div class="product-body">
              <div class="product-badges">
                <span class="product-badge">${product.category}</span>
                <span class="product-badge">${product.isOrganic ? 'Organic' : 'Conventional'}</span>
              </div>
              <h3>${product.name}</h3>
              <p>${product.location}</p>
              <div class="product-meta">
                <span class="product-price">${formatCurrency(product.price)}</span>
                <span>${product.unit}</span>
              </div>
              <div class="product-actions">
                <button class="btn btn-primary" data-add-cart="${product._id}">Add to cart</button>
              </div>
            </div>
          </article>
        `).join('')
      : '<p class="empty-state">No products match your filters.</p>';
  } catch (error) {
    container.innerHTML = '<p class="empty-state">Could not load the products.</p>';
  }
};

const loadOrders = async () => {
  const container = document.getElementById('consumer-orders');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE}/orders`, {
      headers: getAuthHeaders(),
    });
    const orders = await response.json();

    container.innerHTML = (orders || []).length
      ? orders.map((order) => `
          <div class="list-item">
            <div class="list-item-header">
              <strong>Order #${order._id.slice(-6)}</strong>
              <span class="status-pill ${order.status.toLowerCase()}">${order.status}</span>
            </div>
            <p>${order.items.map((item) => `${item.quantity} x ${item.product ? item.product.name : 'Product'}`).join(', ')}</p>
            <p>Delivery: ${order.deliverySlot}</p>
            <p>Total: ${formatCurrency(order.totalAmount)}</p>
          </div>
        `).join('')
      : '<p class="empty-state">No orders placed yet.</p>';
  } catch (error) {
    container.innerHTML = '<p class="empty-state">Unable to load order history.</p>';
  }
};

const placeOrder = async () => {
  const user = ensureConsumerAuth();
  if (!user) return;

  if (!cart.length) {
    alert('Your cart is empty.');
    return;
  }

  const payload = {
    items: cart.map((item) => ({
      product: item._id,
      quantity: item.quantity,
    })),
    deliverySlot: document.getElementById('delivery-slot')?.value || '2026-09-12 10:00 AM - 12:00 PM',
  };

  try {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to place order');
    }

    cart = [];
    renderCart();
    loadOrders();
  } catch (error) {
    alert(error.message || 'Could not place order.');
  }
};

const handleProductActions = (event) => {
  const addCartTarget = event.target.closest('[data-add-cart]');
  if (addCartTarget) {
    const productId = addCartTarget.getAttribute('data-add-cart');
    fetch(`${API_BASE}/products/${productId}`)
      .then((res) => res.json())
      .then((product) => addToCart(product))
      .catch(() => alert('Unable to add the product to cart.'));
  }

  const removeCartTarget = event.target.closest('[data-remove-cart]');
  if (removeCartTarget) {
    removeFromCart(removeCartTarget.getAttribute('data-remove-cart'));
  }
};

const bindConsumerEvents = () => {
  const user = ensureConsumerAuth();
  if (!user) return;

  document.getElementById('user-label').textContent = `Welcome, ${user.name}`;
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('agriToken');
    localStorage.removeItem('agriUser');
    localStorage.removeItem('agri-search');
    window.location.href = './login.html';
  });

  document.getElementById('apply-filters')?.addEventListener('click', loadProducts);
  document.getElementById('product-search')?.addEventListener('input', loadProducts);
  document.getElementById('category-filter')?.addEventListener('change', loadProducts);
  document.getElementById('organic-filter')?.addEventListener('change', loadProducts);
  document.getElementById('checkout-btn')?.addEventListener('click', placeOrder);
  document.addEventListener('click', handleProductActions);
};

document.addEventListener('DOMContentLoaded', async () => {
  const user = ensureConsumerAuth();
  if (!user) return;

  bindConsumerEvents();
  renderCart();
  await loadProducts();
  await loadOrders();
});
