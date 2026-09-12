const API_BASE = '/api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('agriToken') || ''}`,
});

const ensureFarmerAuth = () => {
  const user = JSON.parse(localStorage.getItem('agriUser') || 'null');
  const token = localStorage.getItem('agriToken');

  if (!user || !token || user.role !== 'farmer') {
    window.location.href = './login.html';
    return null;
  }

  return user;
};

const renderFarmerDashboard = async () => {
  const user = ensureFarmerAuth();
  if (!user) return;

  const label = document.getElementById('user-label');
  if (label) label.textContent = `Welcome, ${user.name}`;

  try {
    const response = await fetch(`${API_BASE}/farmers/dashboard/me`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to load dashboard');

    document.getElementById('total-products').textContent = result.summary?.totalProducts || 0;
    document.getElementById('total-sales').textContent = `₹${Number(result.summary?.totalSales || 0).toLocaleString('en-IN')}`;
    document.getElementById('active-orders').textContent = result.summary?.activeOrders || 0;
    document.getElementById('total-revenue').textContent = `₹${Number(result.summary?.totalRevenue || 0).toLocaleString('en-IN')}`;

    const productList = document.getElementById('product-list');
    if (productList) {
      productList.innerHTML = (result.products || []).length
        ? (result.products || []).map((product) => `
            <div class="list-item">
              <div class="list-item-header">
                <strong>${product.name}</strong>
                <span class="status-pill ${product.availability ? 'delivered' : ''}">${product.availability ? 'Available' : 'Out of stock'}</span>
              </div>
              <p>${product.category} • ${product.location}</p>
              <p>₹${Number(product.price).toLocaleString('en-IN')} / ${product.unit}</p>
              <div class="product-actions">
                <button class="btn btn-secondary" data-edit-product="${product._id}">Edit</button>
                <button class="btn btn-primary" data-delete-product="${product._id}">Delete</button>
              </div>
            </div>
          `).join('')
        : '<p class="empty-state">No products added yet.</p>';
    }

    const orderList = document.getElementById('order-list');
    if (orderList) {
      orderList.innerHTML = (result.orders || []).length
        ? (result.orders || []).map((order) => `
            <div class="list-item">
              <div class="list-item-header">
                <strong>Order #${order._id.slice(-6)}</strong>
                <span class="status-pill ${order.status.toLowerCase()}">${order.status}</span>
              </div>
              <p>${order.items.map((item) => `${item.quantity} x ${item.product.name}`).join(', ')}</p>
              <p>Total: ₹${Number(order.totalAmount).toLocaleString('en-IN')}</p>
              <p>Delivery: ${order.deliverySlot}</p>
              <div class="product-actions">
                <button class="btn btn-secondary" data-status-order="${order._id}" data-status="Confirmed">Confirm</button>
                <button class="btn btn-primary" data-status-order="${order._id}" data-status="Delivered">Mark Delivered</button>
              </div>
            </div>
          `).join('')
        : '<p class="empty-state">No incoming orders yet.</p>';
    }

    const farmerProfileForm = document.getElementById('farmer-profile-form');
    if (farmerProfileForm) {
      const currentFarmer = await fetchFarmerProfile();
      document.getElementById('farm-name').value = currentFarmer.farmName || '';
      document.getElementById('farm-location').value = currentFarmer.location || '';
      document.getElementById('farm-method').value = currentFarmer.farmingMethod || 'Organic';
      document.getElementById('farm-crops').value = (currentFarmer.cropTypes || []).join(', ');
      document.getElementById('farm-bio').value = currentFarmer.bio || '';
    }
  } catch (error) {
    console.error(error);
    const productList = document.getElementById('product-list');
    if (productList) productList.innerHTML = '<p class="empty-state">Could not load your dashboard.</p>';
  }
};

const fetchFarmerProfile = async () => {
  const user = JSON.parse(localStorage.getItem('agriUser') || 'null');
  if (!user) return {};

  const response = await fetch(`${API_BASE}/farmers/${user.id}`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  return result;
};

const openProductModal = () => {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('hidden');
};

const closeProductModal = () => {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.add('hidden');
};

const saveProfile = async () => {
  const user = ensureFarmerAuth();
  if (!user) return;

  const payload = {
    farmName: document.getElementById('farm-name').value,
    location: document.getElementById('farm-location').value,
    farmingMethod: document.getElementById('farm-method').value,
    cropTypes: document.getElementById('farm-crops').value.split(',').map((crop) => crop.trim()).filter(Boolean),
    bio: document.getElementById('farm-bio').value,
  };

  try {
    const response = await fetch(`${API_BASE}/farmers/${user.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Unable to update profile');
    }

    renderFarmerDashboard();
  } catch (error) {
    console.error(error);
  }
};

const addProduct = async (event) => {
  event.preventDefault();
  const user = ensureFarmerAuth();
  if (!user) return;

  const payload = {
    name: document.getElementById('product-name').value,
    category: document.getElementById('product-category').value,
    price: Number(document.getElementById('product-price').value),
    unit: document.getElementById('product-unit').value,
    stock: Number(document.getElementById('product-stock').value),
    location: document.getElementById('product-location').value,
    harvestDate: document.getElementById('product-harvest').value,
    isOrganic: document.getElementById('product-organic').value === 'true',
    image: document.getElementById('product-image').value || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    description: document.getElementById('product-description').value,
    availability: true,
  };

  try {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to add product');

    event.target.reset();
    closeProductModal();
    renderFarmerDashboard();
  } catch (error) {
    console.error(error);
  }
};

const deleteProduct = async (productId) => {
  const user = ensureFarmerAuth();
  if (!user) return;

  try {
    const response = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }

    renderFarmerDashboard();
  } catch (error) {
    console.error(error);
  }
};

const updateOrderStatus = async (orderId, status) => {
  const user = ensureFarmerAuth();
  if (!user) return;

  try {
    const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Unable to update order');
    }

    renderFarmerDashboard();
  } catch (error) {
    console.error(error);
  }
};

const bindFarmerActions = () => {
  document.getElementById('add-product-btn')?.addEventListener('click', openProductModal);
  document.getElementById('close-product-modal')?.addEventListener('click', closeProductModal);
  document.getElementById('save-profile-btn')?.addEventListener('click', saveProfile);
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('agriToken');
    localStorage.removeItem('agriUser');
    window.location.href = './login.html';
  });

  document.getElementById('product-form')?.addEventListener('submit', addProduct);

  document.addEventListener('click', (event) => {
    const deleteTarget = event.target.closest('[data-delete-product]');
    if (deleteTarget) {
      deleteProduct(deleteTarget.getAttribute('data-delete-product'));
    }

    const statusTarget = event.target.closest('[data-status-order]');
    if (statusTarget) {
      updateOrderStatus(statusTarget.getAttribute('data-status-order'), statusTarget.getAttribute('data-status'));
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  bindFarmerActions();
  renderFarmerDashboard();
});
