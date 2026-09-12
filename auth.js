const API_BASE = '/api';

const setMessage = (elementId, message, type = 'success') => {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = `form-message ${type}`;
};

const saveUserSession = (user, token) => {
  localStorage.setItem('agriToken', token);
  localStorage.setItem('agriUser', JSON.stringify(user));
};

const redirectByRole = (role) => {
  if (role === 'farmer') {
    window.location.href = './farmer-dashboard.html';
  } else if (role === 'admin') {
    window.location.href = './admin-dashboard.html';
  } else {
    window.location.href = './consumer-dashboard.html';
  }
};

const bindRoleToggle = () => {
  const registerRole = document.getElementById('register-role');
  const farmerFields = document.getElementById('farmer-fields');

  if (!registerRole || !farmerFields) return;

  const toggle = () => {
    const isFarmer = registerRole.value === 'farmer';
    farmerFields.classList.toggle('hidden', !isFarmer);
    const locationInput = document.getElementById('register-location');
    if (locationInput) {
      locationInput.required = true;
      locationInput.placeholder = isFarmer ? 'Farm or city location' : 'City or region';
    }
    if (!isFarmer) {
      const farmNameInput = document.getElementById('register-farmName');
      if (farmNameInput) farmNameInput.value = '';
    }
  };

  registerRole.addEventListener('change', toggle);
  toggle();
};

const handleRegister = async (event) => {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());
  const role = data.role || 'consumer';

  const payload = {
    name: data.name,
    email: data.email,
    password: data.password,
    role,
    location: data.location,
    farmName: role === 'farmer' ? data.farmName : undefined,
    cropTypes: role === 'farmer' ? ['Tomato', 'Rice'] : [],
    farmingMethod: role === 'farmer' ? 'Organic' : undefined,
    phone: '',
    profileImage: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80',
  };

  try {
    setMessage('register-message', 'Creating account...', 'success');
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      setMessage('register-message', result.message || 'Registration failed', 'error');
      return;
    }

    saveUserSession(result.user, result.token);
    setMessage('register-message', 'Registered successfully. Redirecting...', 'success');
    redirectByRole(result.user.role);
  } catch (error) {
    setMessage('register-message', 'Unable to register at the moment.', 'error');
  }
};

const handleLogin = async (event) => {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());

  try {
    setMessage('login-message', 'Logging in...', 'success');
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        role: data.role,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      setMessage('login-message', result.message || 'Login failed', 'error');
      return;
    }

    saveUserSession(result.user, result.token);
    setMessage('login-message', 'Login successful. Redirecting...', 'success');
    redirectByRole(result.user.role);
  } catch (error) {
    setMessage('login-message', 'Unable to login right now.', 'error');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  bindRoleToggle();

  const registerForm = document.getElementById('register-form');
  if (registerForm) registerForm.addEventListener('submit', handleRegister);

  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
});
