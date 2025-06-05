
  function setupHeader() {
    const user = JSON.parse(localStorage.getItem('user'));
    const usernameDisplay = document.getElementById('usernameDisplay');
    const logoutBtn = document.getElementById('logoutBtn');

    if (user && usernameDisplay) {
      usernameDisplay.textContent = user.username || 'No se encontró usuario';
    }
  
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        logoutUser();
      });
    }
  }
  