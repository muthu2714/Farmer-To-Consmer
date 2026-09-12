const API_BASE = '/api';

const getUser = () => JSON.parse(localStorage.getItem('agriUser') || 'null');
const getToken = () => localStorage.getItem('agriToken');

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken() || ''}`,
});

const ensureAdminAuth = () => {
  const user = getUser();
  if (!user || !getToken() || user.role !== 'admin') {
    window.location.href = './login.html';
    return null;
  }

  return user;
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const renderDashboard = async () => {
  const user = ensureAdminAuth();
  if (!user) return;

  document.getElementById('user-label').textContent = `Welcome, ${user.name}`;

  try {
    const summaryResponse = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    const summary = await summaryResponse.json();

    if (!summaryResponse.ok) throw new Error(summary.message || 'Dashboard failed');

    document.getElementById('total-farmers').textContent = summary.totalFarmers || 0;
    document.getElementById('total-consumers').textContent = summary.totalConsumers || 0;
    document.getElementById('total-products').textContent = summary.totalProducts || 0;
    document.getElementById('total-orders').textContent = summary.totalOrders || 0;
    document.getElementById('total-revenue').textContent = formatCurrency(summary.revenue || 0);

    const farmersResponse = await fetch(`${API_BASE}/admin/farmers`, {
      headers: getAuthHeaders(),
    });
    const farmers = await farmersResponse.json();

    const farmerList = document.getElementById('admin-farmer-list');
    farmerList.innerHTML = farmers.map((farmer) => `
      <div class="list-item">
        <div class="list-item-header">
          <strong>${farmer.name}</strong>
          <span class="status-pill ${farmer.isVerified ? 'delivered' : ''}">${farmer.isVerified ? 'Approved' : 'Pending'}</span>
        </div>
        <p>${farmer.location}</p>
        <p>${farmer.cropTypes.join(', ')}</p>
        <div class="product-actions">
          <button class="btn btn-primary" data-approve-farmer="${farmer._id}" data-approved="true">Approve</button>
          <button class="btn btn-secondary" data-approve-farmer="${farmer._id}" data-approved="false">Reject</button>
        </div>
      </div>
    `).join('');

    const ordersResponse = await fetch(`${API_BASE}/admin/orders`, {
      headers: getAuthHeaders(),
    });
    const orders = await ordersResponse.json();
    const orderList = document.getElementById('admin-order-list');
    orderList.innerHTML = orders.map((order) => `
      <div class="list-item">
        <div class="list-item-header">
          <strong>Order #${order._id.slice(-6)}</strong>
          <span class="status-pill ${order.status.toLowerCase()}">${order.status}</span>
        </div>
        <p>Consumer: ${order.consumer?.name || 'Unknown'}</p>
        <p>Total: ${formatCurrency(order.totalAmount)}</p>
        <p>Delivery: ${order.deliverySlot}</p>
      </div>
    `).join('');

    const analyticsResponse = await fetch(`${API_BASE}/admin/analytics`, {
      headers: getAuthHeaders(),
    });
    const analytics = await analyticsResponse.json();

    renderAnalyticsChart(analytics);
  } catch (error) {
    console.error(error);
  }
};

const renderAnalyticsChart = (analytics) => {
  const canvas = document.getElementById('analytics-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const barColors = ['#2d6a4f', '#5fa56b', '#9bcf8a', '#d9e9c0', '#f7b267'];
  const categoryData = analytics.categoryStats || [];
  const labels = categoryData.map((item) => item._id);
  const values = categoryData.map((item) => item.count);

  const width = canvas.width;
  const height = canvas.height;
  const padding = 30;
  const maxValue = Math.max(...values, 1);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#f5faf6';
  ctx.fillRect(0, 0, width, height);

  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;
  const barWidth = chartWidth / Math.max(values.length, 1) * 0.7;

  labels.forEach((label, index) => {
    const barHeight = (values[index] / maxValue) * chartHeight;
    const x = padding + index * (chartWidth / Math.max(values.length, 1)) + 15;
    const y = height - padding - barHeight;

    ctx.fillStyle = barColors[index % barColors.length];
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = '#163b2f';
    ctx.font = '12px sans-serif';
    ctx.fillText(label, x, height - 10);
  });
};

const approveFarmer = async (farmerId, approved) => {
  const user = ensureAdminAuth();
  if (!user) return;

  try {
    const response = await fetch(`${API_BASE}/admin/farmers/${farmerId}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ approved }),
    });

    if (!response.ok) {
      throw new Error('Unable to update farmer approval');
    }

    renderDashboard();
  } catch (error) {
    console.error(error);
  }
};

const bindAdminActions = () => {
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('agriToken');
    localStorage.removeItem('agriUser');
    window.location.href = './login.html';
  });

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-approve-farmer]');
    if (target) {
      approveFarmer(target.getAttribute('data-approve-farmer'), target.getAttribute('data-approved') === 'true');
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  bindAdminActions();
  renderDashboard();
});
