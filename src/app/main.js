import './styles.css';
import { Auth } from './auth.js';
import { icon, logo } from './icons.js';
import { esc, initials } from './util.js';
import { loginView, signupView, forgotView } from './views/auth.js';
import { homeView } from './views/home.js';
import { diagnoseView } from './views/diagnose.js';
import { communityView } from './views/community.js';
import { shopsView } from './views/shops.js';
import { profileView } from './views/profile.js';
import { toolsView, toolView } from './views/tools.js';
import { assistantView } from './views/assistant.js';
import { notificationsView } from './views/notifications.js';

/**
 * Tiny hash router. Everything outside `public: true` routes is PROTECTED:
 * if there is no session the user is redirected to #/login.
 * (Front-end protection only – a real deployment must also protect data on the server.)
 */
const ROUTES = [
  { path: '/login', view: loginView, public: true, title: 'Log in' },
  { path: '/signup', view: signupView, public: true, title: 'Create account' },
  { path: '/forgot', view: forgotView, public: true, title: 'Forgot password' },
  { path: '/home', view: homeView, tab: 'home', title: 'Home' },
  { path: '/diagnose', view: diagnoseView, tab: 'diagnose', title: 'Check my crop' },
  { path: '/community', view: communityView, tab: 'community', title: 'Community' },
  { path: '/shops', view: shopsView, tab: 'shops', title: 'Shops' },
  { path: '/profile', view: profileView, tab: 'profile', title: 'Profile' },
  { path: '/tools', view: toolsView, tab: 'home', title: 'Farming tools' },
  { path: '/tools/:id', view: toolView, tab: 'home', title: 'Calculator' },
  { path: '/assistant', view: assistantView, tab: 'home', title: 'AI assistant' },
  { path: '/notifications', view: notificationsView, tab: 'home', title: 'Alerts' },
  { path: '/alerts', view: notificationsView, tab: 'home', title: 'Alerts' },
];

const NAV = [
  { path: '/home', tab: 'home', label: 'Home', icon: 'home' },
  { path: '/diagnose', tab: 'diagnose', label: 'Diagnose', icon: 'camera' },
  { path: '/community', tab: 'community', label: 'Community', icon: 'users' },
  { path: '/shops', tab: 'shops', label: 'Shops', icon: 'store' },
  { path: '/profile', tab: 'profile', label: 'Profile', icon: 'user' },
];

function match(path) {
  const parts = path.split('/').filter(Boolean);
  for (const r of ROUTES) {
    const rp = r.path.split('/').filter(Boolean);
    if (rp.length !== parts.length) continue;
    const params = {};
    if (rp.every((seg, i) => (seg.startsWith(':') ? ((params[seg.slice(1)] = decodeURIComponent(parts[i])), true) : seg === parts[i]))) {
      return { route: r, params };
    }
  }
  return null;
}

const navHTML = (active) =>
  NAV.map(
    (n) => `<a href="#${n.path}" class="nav-item ${n.tab === 'diagnose' ? 'nav-main' : ''} ${n.tab === active ? 'active' : ''}" ${n.tab === active ? 'aria-current="page"' : ''}>
      <span class="nav-ico">${icon(n.icon, { size: 24 })}</span><span class="nav-label">${n.label}</span></a>`
  ).join('');

function shell(user, active, body) {
  return `
  <a class="skip" href="#main">Skip to content</a>
  <div class="app-shell">
    <aside class="sidebar" aria-label="Main">
      <div class="sidebar-logo">${logo({ size: 40 })}</div>
      <nav class="side-nav">${navHTML(active)}</nav>
      <a href="#/profile" class="side-user"><span class="avatar sm">${esc(initials(user.name))}</span><span><b>${esc(user.guest ? 'Guest' : user.name)}</b><small>${user.guest ? 'Not logged in' : 'Demo account'}</small></span></a>
    </aside>
    <main id="main" class="main" tabindex="-1"><div class="page" id="page">${body}</div></main>
    <nav class="bottom-nav" aria-label="Main">${navHTML(active)}</nav>
  </div>`;
}

export function mountApp(root) {
  const ac = new AbortController();
  const { signal } = ac;
  let token = 0;

  const navigate = (path) => {
    const target = '#' + path;
    if (location.hash === target) render();
    else location.hash = target;
  };
  const redirect = (path) => location.replace(location.pathname + location.search + '#' + path);

  async function render() {
    const my = ++token;
    const raw = location.hash.slice(1) || '/';
    const [path, query = ''] = raw.split('?');
    const next = new URLSearchParams(query).get('next') || '';
    const user = Auth.currentUser();
    const m = match(path);

    if (!m) return redirect(user ? '/home' : '/login');

    // ---- route protection ----
    if (!m.route.public && !user) return redirect('/login' + (path !== '/' ? '?next=' + encodeURIComponent(path) : ''));
    if (m.route.public && user && !user.guest) return redirect('/home');

    const ctx = {
      user,
      params: m.params,
      next: next && match(next) && !match(next).route.public ? next : '',
      navigate,
      refresh: () => render(),
    };

    document.title = `${m.route.title} – AgriVision AI`;
    const view = m.route.view;
    try {
      root.innerHTML = m.route.public ? view.html(ctx) : shell(user, m.route.tab, view.html(ctx));
      root.className = m.route.public ? 'is-public' : 'is-app';
      window.scrollTo(0, 0);
      const page = root.querySelector('#page') || root;
      await view.mount(root.querySelector('#page') || root, ctx);
      if (my === token) (root.querySelector('#main') || root.querySelector('h1'))?.focus?.({ preventScroll: true });
      void page;
    } catch (e) {
      console.error(e);
      root.innerHTML = `<div class="crash"><h1>Oops, something went wrong</h1><p>Please try again.</p><button class="btn btn-primary btn-lg" onclick="location.hash='#/home';location.reload()">Reload app</button></div>`;
    }
  }

  window.addEventListener('hashchange', render, { signal });
  // log out / log in in another tab -> update this tab
  window.addEventListener('storage', (e) => e.key && e.key.startsWith('agrivision.demo.session') && render(), { signal });
  render();

  return () => {
    ac.abort();
    token++;
    root.innerHTML = '';
  };
}
