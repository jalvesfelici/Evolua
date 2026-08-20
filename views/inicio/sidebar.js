const sidebar = document.querySelector('.sidebar');
const toggleButton = document.querySelector('.sidebar-toggle');
const logoutButton = document.querySelector('.logout-button');
const storageKey = 'evolua-sidebar-collapsed';

function atualizarSidebar(recolhida) {
  sidebar.classList.toggle('sidebar-collapsed', recolhida);
  toggleButton.setAttribute('aria-expanded', String(!recolhida));
  toggleButton.setAttribute('aria-label', recolhida ? 'Expandir menu' : 'Recolher menu');
}

if (sidebar && toggleButton) {
  atualizarSidebar(localStorage.getItem(storageKey) === 'true');

  toggleButton.addEventListener('click', () => {
    const recolhida = !sidebar.classList.contains('sidebar-collapsed');
    atualizarSidebar(recolhida);
    localStorage.setItem(storageKey, String(recolhida));
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    if (!window.confirm('Deseja sair do sistema?')) return;

    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario_logado');
    window.location.href = '/login/';
  });
}
