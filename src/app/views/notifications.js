import { icon } from '../icons.js';
import { store } from '../store.js';
import { SAMPLE_ALERTS } from '../data.js';
import { esc, $, timeAgo, toast, emptyState } from '../util.js';

export const notificationsView = {
  html: () => `
    <div class="page-head"><a href="#/home" class="back-link">${icon('arrowLeft', { size: 20 })} Home</a>
      <div class="row-between"><h1>Alerts</h1><button class="btn btn-soft btn-sm" id="mark-all">${icon('check', { size: 18 })} Mark all read</button></div>
      <p class="muted">Disease and crop alerts for you. These are sample alerts for demonstration.</p></div>
    <div id="alert-list"></div>`,

  mount(el, ctx) {
    const draw = () => {
      const read = store.get('readAlerts', []);
      const box = $('#alert-list', el);
      if (!SAMPLE_ALERTS.length) {
        box.innerHTML = emptyState({ iconName: 'bell', title: 'No alerts', text: 'We will tell you here when there is a risk for your crops.' });
        return;
      }
      box.innerHTML = `<div class="stack">${SAMPLE_ALERTS.map(
        (a) => `
        <button class="alert-card alert-${a.level} ${read.includes(a.id) ? 'is-read' : ''}" data-id="${a.id}">
          <span class="alert-ico">${icon(a.level === 'info' ? 'info' : 'alert', { size: 22 })}</span>
          <span class="alert-body"><b>${esc(a.title)}${read.includes(a.id) ? '' : ' <i class="new">New</i>'}</b><small>${esc(a.text)}</small><em>${timeAgo(Date.now() - a.time)}</em></span>
        </button>`
      ).join('')}</div>`;
    };
    $('#alert-list', el).addEventListener('click', (e) => {
      const b = e.target.closest('[data-id]');
      if (!b) return;
      store.update('readAlerts', (r) => (r.includes(b.dataset.id) ? r : [...r, b.dataset.id]), []);
      draw();
      ctx.refreshChrome?.();
    });
    $('#mark-all', el).addEventListener('click', () => {
      store.set('readAlerts', SAMPLE_ALERTS.map((a) => a.id));
      draw();
      ctx.refreshChrome?.();
      toast('All alerts marked as read.');
    });
    draw();
  },
};
