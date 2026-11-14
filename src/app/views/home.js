import { icon } from '../icons.js';
import { store } from '../store.js';
import { SAMPLE_ALERTS, SAMPLE_SHOPS } from '../data.js';
import { loadWeather, WMO, advice } from '../weather.js';
import { esc, $, initials, fmtMoney, timeAgo, emptyState } from '../util.js';

function greeting(user) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return part;
}

export const unreadCount = () => {
  const read = store.get('readAlerts', []);
  return SAMPLE_ALERTS.filter((a) => !read.includes(a.id)).length;
};

export const alertCard = (a) => `
  <a href="#/notifications" class="alert-card alert-${a.level}">
    <span class="alert-ico">${icon(a.level === 'info' ? 'info' : 'alert', { size: 22 })}</span>
    <span class="alert-body"><b>${esc(a.title)}</b><small>${esc(a.text)}</small><em>${timeAgo(Date.now() - a.time)}</em></span>
  </a>`;

export const shopCard = (s) => `
  <a class="shop-row" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name)}" target="_blank" rel="noopener">
    <span class="shop-ico">${icon('store', { size: 22 })}</span>
    <span class="shop-body"><b>${esc(s.name)}</b><small>${esc(s.type)} · ${s.km} km · ${icon('star', { size: 12, fill: true, cls: 'star' })} ${s.rating}</small></span>
    <span class="chev">${icon('chevronRight', { size: 20 })}</span>
  </a>`;

function profitOverview() {
  const records = store.get('records', []);
  if (!records.length) {
    return emptyState({
      iconName: 'rupee',
      title: 'No profit records yet',
      text: 'Add your crop costs and sale to see how much you earn.',
      action: '<a href="#/tools/profit" class="btn btn-soft">Calculate profit</a>',
    });
  }
  const rev = records.reduce((s, r) => s + r.revenue, 0);
  const cost = records.reduce((s, r) => s + r.cost, 0);
  const net = rev - cost;
  const last = records.slice(0, 5).reverse();
  const max = Math.max(...last.map((r) => Math.abs(r.net)), 1);
  return `
    <div class="stat-row">
      <div><small>Income</small><b>${fmtMoney(rev)}</b></div>
      <div><small>Expenses</small><b>${fmtMoney(cost)}</b></div>
      <div class="${net >= 0 ? 'pos' : 'neg'}"><small>${net >= 0 ? 'Profit' : 'Loss'}</small><b>${fmtMoney(net)}</b></div>
    </div>
    <div class="bars-chart" aria-label="Recent profit by crop">
      ${last.map((r) => `<div class="bc"><span class="bc-bar ${r.net >= 0 ? 'pos' : 'neg'}" style="height:${Math.max(8, (Math.abs(r.net) / max) * 70)}px"></span><small>${esc(r.crop.slice(0, 8))}</small></div>`).join('')}
    </div>`;
}

export const homeView = {
  html(ctx) {
    const u = ctx.user;
    const unread = unreadCount();
    const alerts = SAMPLE_ALERTS.slice(0, 2);
    return `
    <header class="home-head">
      <a href="#/profile" class="avatar" aria-label="My profile">${esc(initials(u.name))}</a>
      <div class="home-greet">
        <small>${greeting(u)} 👋</small>
        <h1>${esc(u.guest ? 'Hello, Farmer' : (String(u.name || '').trim().split(/\s+/)[0] || 'Farmer'))}</h1>
      </div>
      <a href="#/notifications" class="icon-btn bell" aria-label="Alerts${unread ? ', ' + unread + ' new' : ''}">${icon('bell', { size: 24 })}${unread ? `<span class="dot">${unread}</span>` : ''}</a>
    </header>

    <div class="dash-grid">
      <section class="weather card-hero" id="weather" aria-label="Weather">
        <div class="skeleton" style="height:150px"></div>
      </section>

      <a href="#/diagnose" class="cta-diagnose">
        <span class="cta-ico">${icon('camera', { size: 32 })}</span>
        <span class="cta-text"><b>Check my crop</b><small>Take a photo of a sick leaf</small></span>
        <span class="chev">${icon('chevronRight', { size: 24 })}</span>
      </a>

      <section class="card">
        <div class="sec-head"><h2>Disease alerts</h2><a href="#/notifications" class="link">See all</a></div>
        <div class="stack">${alerts.map(alertCard).join('')}</div>
        <p class="tiny muted mt-s">Sample alerts for demonstration.</p>
      </section>

      <section class="card">
        <div class="sec-head"><h2>Farming tools</h2></div>
        <div class="tools-grid">
          <a href="#/tools/fertilizer" class="tool"><span>${icon('flask', { size: 28 })}</span>Fertilizer</a>
          <a href="#/tools/seed" class="tool"><span>${icon('sprout', { size: 28 })}</span>Seeds</a>
          <a href="#/tools/water" class="tool"><span>${icon('droplet', { size: 28 })}</span>Water</a>
          <a href="#/tools/profit" class="tool"><span>${icon('rupee', { size: 28 })}</span>Profit</a>
        </div>
      </section>

      <section class="card">
        <div class="sec-head"><h2>Nearby shops</h2><a href="#/shops" class="link">See all</a></div>
        <div class="stack">${SAMPLE_SHOPS.slice(0, 3).map(shopCard).join('')}</div>
      </section>

      <section class="card">
        <div class="sec-head"><h2>Profit overview</h2><a href="#/tools/profit" class="link">Open</a></div>
        ${profitOverview()}
      </section>

      <a href="#/assistant" class="cta-ai">
        <span class="cta-ico">${icon('sparkles', { size: 28 })}</span>
        <span class="cta-text"><b>Ask AI assistant</b><small>Get quick farming tips in simple words</small></span>
        <span class="chev">${icon('chevronRight', { size: 24 })}</span>
      </a>
    </div>`;
  },

  async mount(el, ctx) {
    const box = $('#weather', el);
    const draw = (w) => {
      const cur = WMO(w.code);
      const adv = advice(w);
      box.innerHTML = `
        <div class="w-top">
          <div>
            <p class="w-place">${icon('pin', { size: 16 })} ${esc(w.place)}</p>
            <div class="w-temp">${w.temp}°<small>C</small></div>
            <p class="w-cond">${cur.text}</p>
          </div>
          <span class="w-icon">${icon(cur.icon, { size: 56 })}</span>
        </div>
        <div class="w-stats">
          <span>${icon('droplet', { size: 16 })} ${w.humidity}% humidity</span>
          <span>${icon('wind', { size: 16 })} ${w.wind} km/h</span>
          <span>${icon('rain', { size: 16 })} ${w.rainChance}% rain</span>
        </div>
        <div class="w-days">${w.days.map((d) => `<div><small>${d.label}</small>${icon(WMO(d.code).icon, { size: 22 })}<b>${d.max}°</b><small>${d.min}°</small></div>`).join('')}</div>
        <p class="w-advice">${icon(adv.icon, { size: 20 })}<span>${adv.text}</span></p>
        ${w.sample ? '<p class="w-note">Sample weather shown – connect to the internet for live weather.</p>' : ''}
        <button class="w-refresh" id="w-refresh" aria-label="Refresh weather">${icon('refresh', { size: 18 })}</button>`;
      $('#w-refresh', box).addEventListener('click', async () => {
        box.querySelector('#w-refresh').classList.add('spin');
        draw(await loadWeather(ctx.user, { force: true }));
      });
    };
    draw(await loadWeather(ctx.user));
  },
};
