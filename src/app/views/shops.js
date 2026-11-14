import { icon } from '../icons.js';
import { SAMPLE_SHOPS, SHOP_TYPES } from '../data.js';
import { esc, $, $$, emptyState } from '../util.js';

export const shopsView = {
  html: (ctx) => `
    <div class="page-head"><h1>Shops near me</h1><p class="muted">Seeds, fertilizer, medicine and market.</p></div>
    <a class="btn btn-primary btn-lg btn-block" id="find-maps" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('agriculture input shop near ' + (ctx.user.district || 'me'))}">${icon('navigation', { size: 22 })} Find real shops on Maps</a>
    <div class="search mt">
      <span>${icon('search', { size: 20 })}</span>
      <input type="search" id="shop-q" placeholder="Search shops…" aria-label="Search shops" />
    </div>
    <div class="chips" id="shop-chips">${SHOP_TYPES.map((t, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-type="${t}">${t}</button>`).join('')}</div>
    <div id="shop-list"></div>
    <p class="tiny muted center mt">These are sample shops for demonstration. Use “Find real shops on Maps” for shops in your area.</p>`,

  mount(el) {
    let type = 'All', q = '';
    const draw = () => {
      const list = SAMPLE_SHOPS.filter((s) => (type === 'All' || s.type === type) && (s.name + s.info + s.type).toLowerCase().includes(q.toLowerCase()));
      $('#shop-list', el).innerHTML = list.length
        ? `<div class="shop-grid">${list
            .map(
              (s) => `<article class="card shop">
            <div class="shop-top"><span class="shop-ico">${icon('store', { size: 24 })}</span>
              <div><b>${esc(s.name)}</b><small>${esc(s.info)}</small></div></div>
            <div class="shop-meta"><span>${icon('pin', { size: 16 })} ${s.km} km</span><span>${icon('star', { size: 16, fill: true, cls: 'star' })} ${s.rating}</span><span>${icon('clock', { size: 16 })} ${esc(s.hours)}</span></div>
            <a class="btn btn-soft btn-block" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name)}">${icon('navigation', { size: 18 })} Directions</a>
          </article>`
            )
            .join('')}</div>`
        : emptyState({ iconName: 'store', title: 'No shops found', text: 'Try a different word or choose “All”.' });
    };
    $('#shop-q', el).addEventListener('input', (e) => {
      q = e.target.value.trim();
      draw();
    });
    $('#shop-chips', el).addEventListener('click', (e) => {
      const b = e.target.closest('[data-type]');
      if (!b) return;
      type = b.dataset.type;
      $$('#shop-chips .chip', el).forEach((c) => c.classList.toggle('on', c === b));
      draw();
    });
    draw();
  },
};
