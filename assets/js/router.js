const routes = {
  '/': 'routes/login.html',
  '/login': 'routes/login.html',
  '/register': 'routes/register.html',
  '/dashboard': 'routes/dashboard.html',
  '/users': 'routes/users.html'
};

const defaultRoute = 'notfound.html';

const noLayoutRoutes = ['/login', '/register', '/'];

async function loadCommonParts() {
  const [header, footer] = await Promise.all([
    fetch('common/header.html').then(res => res.text()),
    fetch('common/footer.html').then(res => res.text()),
  ]);

  document.getElementById('header').innerHTML = header;
  document.getElementById('footer').innerHTML = footer;

  setupHeader();

}

async function router() {

  const path = location.hash.slice(1) || '/';

  if (!protectRoute(path)) return;
  if (path === '/users' && !protectRouteByRole('admin')) {
    return;
  }


  const routeFile = routes[path] || defaultRoute;

  const showLayout = !noLayoutRoutes.includes(path);

  if (showLayout) {
    await loadCommonParts();
  } else {
    document.getElementById('header').innerHTML = '';
    document.getElementById('footer').innerHTML = '';
  }

  const res = await fetch(routeFile);
  const html = await res.text();
  document.getElementById('app').innerHTML = html;

  setTimeout(() => {
    if (path === '/' || path === '/login') {
      handleLoginForm();
    }
    if (path === '/register') {
      handleRegisterForm();
    }
  }, 0);
}


window.addEventListener('hashchange', router);
window.addEventListener('load', router);
