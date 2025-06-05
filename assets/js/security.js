window.isAuthenticated = function () {
  return !!localStorage.getItem('user');
};

window.protectRoute = function (path) {
  const publicRoutes = ['/', '/login', '/register'];
  if (!publicRoutes.includes(path) && !isAuthenticated()) {
    window.location.hash = '/login';
    return false;
  }
  return true;
};

window.loginUser = function (data) {
  localStorage.setItem('user', JSON.stringify(data));
};

window.logoutUser = function () {
  localStorage.removeItem('user');
  window.location.hash = '/login';
};
