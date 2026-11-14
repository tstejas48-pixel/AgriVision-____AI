import { icon } from './icons.js';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const fmtMoney = (n) => (n < 0 ? '-' : '') + '₹' + Math.round(Math.abs(n)).toLocaleString('en-IN');
export const fmtNum = (n, d = 1) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: d });

export function timeAgo(ts) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return 'Just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const initials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?';

/* ------------------------------- toasts ----------------------------------- */
export function toast(message, type = 'success') {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `${icon(type === 'error' ? 'alert' : type === 'info' ? 'info' : 'checkCircle', { size: 20 })}<span>${esc(message)}</span>`;
  host.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

/* ------------------------------- modal ------------------------------------ */
export function modal({ title, body, actions = [] }) {
  return new Promise((resolve) => {
    const prevFocus = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Close">${icon('x', { size: 22 })}</button></div>
        <div class="modal-body">${body}</div>
        <div class="modal-actions">${actions
          .map((a, i) => `<button class="btn ${a.cls || 'btn-ghost'}" data-act="${i}">${esc(a.label)}</button>`)
          .join('')}</div>
      </div>`;
    const close = (val) => {
      wrap.classList.add('out');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => wrap.remove(), 200);
      prevFocus?.focus?.();
      resolve(val);
    };
    const onKey = (e) => e.key === 'Escape' && close(undefined);
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap || e.target.closest('[data-close]')) close(undefined);
      const b = e.target.closest('[data-act]');
      if (b) close(actions[Number(b.dataset.act)].value);
    });
    document.body.appendChild(wrap);
    (wrap.querySelector('[data-act]') || wrap.querySelector('[data-close]')).focus();
  });
}

export const confirmDialog = (title, message, okLabel = 'Yes', danger = false) =>
  modal({
    title,
    body: `<p>${esc(message)}</p>`,
    actions: [
      { label: 'Cancel', value: false },
      { label: okLabel, value: true, cls: danger ? 'btn-danger' : 'btn-primary' },
    ],
  });

/* ------------------------------- forms ------------------------------------ */
export function field({
  id, label, type = 'text', placeholder = '', icon: ic, autocomplete = 'off', inputmode = '',
  value = '', hint = '', extra = '', toggle = false, list = '',
}) {
  return `
  <div class="field" data-field="${id}">
    <label for="${id}">${esc(label)}</label>
    <div class="input-wrap">
      ${ic ? `<span class="input-icon">${icon(ic, { size: 20 })}</span>` : ''}
      <input id="${id}" name="${id}" type="${type}" placeholder="${esc(placeholder)}" autocomplete="${autocomplete}"
        ${inputmode ? `inputmode="${inputmode}"` : ''} ${list ? `list="${list}"` : ''} value="${esc(value)}"
        autocapitalize="${type === 'email' ? 'none' : 'off'}" spellcheck="false" aria-describedby="${id}-err" ${extra} />
      ${toggle ? `<button type="button" class="pw-toggle" data-toggle="${id}" aria-label="Show password" aria-pressed="false">${icon('eye', { size: 20 })}</button>` : ''}
    </div>
    ${hint ? `<p class="field-hint">${esc(hint)}</p>` : ''}
    <p class="field-error" id="${id}-err" role="alert"></p>
  </div>`;
}

export function selectField({ id, label, options, value = '', placeholder = 'Select…', icon: ic, extra = '' }) {
  const opts = options
    .map((o) => {
      const v = typeof o === 'string' ? o : o.value;
      const l = typeof o === 'string' ? o : o.label;
      return `<option value="${esc(v)}" ${v === value ? 'selected' : ''}>${esc(l)}</option>`;
    })
    .join('');
  return `
  <div class="field" data-field="${id}">
    <label for="${id}">${esc(label)}</label>
    <div class="input-wrap">
      ${ic ? `<span class="input-icon">${icon(ic, { size: 20 })}</span>` : ''}
      <select id="${id}" name="${id}" aria-describedby="${id}-err" ${extra}>
        ${placeholder ? `<option value="">${esc(placeholder)}</option>` : ''}${opts}
      </select>
      <span class="select-caret">${icon('chevronRight', { size: 18 })}</span>
    </div>
    <p class="field-error" id="${id}-err" role="alert"></p>
  </div>`;
}

export function setError(root, id, msg) {
  const input = root.querySelector('#' + CSS.escape(id));
  const err = root.querySelector('#' + CSS.escape(id) + '-err');
  if (err) err.textContent = msg || '';
  if (input) {
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
  root.querySelector(`[data-field="${CSS.escape(id)}"]`)?.classList.toggle('has-error', !!msg);
  return !msg;
}
export const clearErrors = (root) => $$('[data-field]', root).forEach((f) => setError(root, f.dataset.field, ''));

/** Wire password show/hide buttons inside root. */
export function wirePasswordToggles(root) {
  $$('[data-toggle]', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = root.querySelector('#' + CSS.escape(btn.dataset.toggle));
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = icon(show ? 'eyeOff' : 'eye', { size: 20 });
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      btn.setAttribute('aria-pressed', String(show));
    });
  });
}

export function setBusy(btn, busy, label) {
  if (!btn) return;
  if (busy) {
    btn.dataset.label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span><span>${esc(label || 'Please wait…')}</span>`;
  } else {
    btn.disabled = false;
    if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
  }
}

export const emptyState = ({ iconName = 'leaf', title, text, action = '' }) => `
  <div class="empty">
    <span class="empty-icon">${icon(iconName, { size: 30 })}</span>
    <h3>${esc(title)}</h3>
    <p>${esc(text)}</p>
    ${action}
  </div>`;

/* ------------------------------- images ----------------------------------- */
export const MAX_IMAGE_MB = 15;

export function validateImage(file) {
  if (!file) return 'No photo selected.';
  if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) return 'Please choose a photo (JPG or PNG).';
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `This photo is too big. Please choose one under ${MAX_IMAGE_MB} MB.`;
  return '';
}

/** Load a File into an HTMLImageElement (honours EXIF orientation in modern browsers). */
export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this photo. Please try another one.'));
    };
    img.src = url;
  });
}

export function drawToCanvas(img, max) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}

export async function fileToDataURL(file, max = 600, quality = 0.75) {
  const img = await loadImage(file);
  return drawToCanvas(img, max).toDataURL('image/jpeg', quality);
}
