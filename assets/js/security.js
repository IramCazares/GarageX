window.isAuthenticated = function () {
  return !!localStorage.getItem('user');
};

window.protectRoute = function (path) {
  const publicRoutes = ['/', '/login', '/register'];
  if (!publicRoutes.includes(path) && !isAuthenticated()) {
    alert('Acceso denegado');
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

window.getUserRole = function () {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.role || null;
};

window.hasRole = function (requiredRole) {
  const userRole = getUserRole();
  return userRole === requiredRole;
};

window.protectRouteByRole = function (requiredRole) {
  if (!isAuthenticated()) {
    window.location.hash = '/login';
    return false;
  }

  if (!hasRole(requiredRole)) {
    alert('Acceso denegado');
    window.location.hash = '/';
    return false;
  }

  return true;
};
