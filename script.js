const API_BASE = '/api';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const renderFeaturedProducts = async () => {
  const container = document.getElementById('featured-products');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE}/products`);
    const products = await response.json();

    if (!products.length) {
      container.innerHTML = '<p class="empty-state">No products available yet.</p>';
      return;
    }

    const items = products.slice(0, 4);
    container.innerHTML = items.map((product) => `
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
            <a href="./register.html" class="btn btn-primary">Buy now</a>
          </div>
        </div>
      </article>
    `).join('');
  } catch (error) {
    container.innerHTML = '<p class="empty-state">Unable to load featured products right now.</p>';
  }
};

const renderFeaturedFarmers = async () => {
  const container = document.getElementById('featured-farmers');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE}/farmers`);
    const farmers = await response.json();

    if (!farmers.length) {
      container.innerHTML = '<p class="empty-state">No farmers yet.</p>';
      return;
    }

    const items = farmers.slice(0, 4);
    container.innerHTML = items.map((farmer) => `
      <article class="member-card">
        <img src="${farmer.profileImage || 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80'}" alt="${farmer.name}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80';"/>
        <h3>${farmer.name}</h3>
        <p>${farmer.location}</p>
        <p>${farmer.cropTypes.join(', ') || 'Fresh produce'}</p>
        <span class="status-pill ${farmer.isVerified ? 'delivered' : ''}">${farmer.isVerified ? 'Verified' : 'Pending'}</span>
      </article>
    `).join('');
  } catch (error) {
    container.innerHTML = '<p class="empty-state">Unable to load farmer profiles.</p>';
  }
};

const bindHomeSearch = () => {
  const homeSearchBtn = document.getElementById('home-search-btn');
  const homeSearchInput = document.getElementById('home-search-input');

  if (!homeSearchBtn || !homeSearchInput) return;

  homeSearchBtn.addEventListener('click', () => {
    const keyword = homeSearchInput.value.trim();
    if (!keyword) {
      window.location.href = './register.html';
      return;
    }
    localStorage.setItem('agri-search', keyword);
    window.location.href = './consumer-dashboard.html';
  });
};

const bindMobileMenu = () => {
  const menuToggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('main-nav');
  if (!menuToggle || !menu) return;

  menuToggle.addEventListener('click', () => {
    menu.classList.toggle('open');
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => menu.classList.remove('open'));
  });
};

document.addEventListener('DOMContentLoaded', () => {
  renderFeaturedProducts();
  renderFeaturedFarmers();
  bindHomeSearch();
  bindMobileMenu();
});
