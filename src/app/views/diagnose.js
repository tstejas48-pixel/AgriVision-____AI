import { icon } from '../icons.js';
import { store } from '../store.js';
import { CROPS, DISEASES } from '../data.js';
import { $, $$, esc, toast, sleep, timeAgo, emptyState, validateImage, loadImage, drawToCanvas, modal, confirmDialog, uid } from '../util.js';

/**
 * DEMO analysis. This is NOT a trained AI model. It measures how much of the
 * leaf is green vs yellow vs brown and picks a matching entry from a small
 * knowledge base. Replace `analyse()` with a call to a real model/API later.
 */
function analyse(canvas) {
  const s = 96;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  // look at the middle of the photo (where the leaf usually is)
  const sw = canvas.width * 0.8, sh = canvas.height * 0.8;
  ctx.drawImage(canvas, canvas.width * 0.1, canvas.height * 0.1, sw, sh, 0, 0, s, s);
  const { data } = ctx.getImageData(0, 0, s, s);
  let green = 0, yellow = 0, brown = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    if (max < 0.15 || d === 0) continue;
    const sat = d / max;
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    if (h >= 70 && h <= 170 && sat > 0.2) green++;
    else if (h >= 42 && h < 70 && sat > 0.3 && max > 0.4) yellow++;
    else if (h >= 8 && h < 42 && sat > 0.25 && max < 0.7) brown++;
  }
  const plant = green + yellow + brown;
  const total = s * s;
  return {
    plantShare: plant / total,
    score: plant ? Math.round((green / plant) * 100) : 0,
    yellow: plant ? yellow / plant : 0,
    brown: plant ? brown / plant : 0,
  };
}

function decide(crop, m) {
  if (m.plantShare < 0.06) return { unclear: true };
  if (m.score >= 80 && m.yellow + m.brown < 0.12) return { idx: -1, score: m.score };
  return { idx: m.yellow >= m.brown ? 0 : 1, score: m.score };
}

const SEV = { danger: ['High risk', 'danger'], warning: ['Needs attention', 'warning'], info: ['Mild', 'info'] };

function resultHTML({ crop, idx, score }) {
  const c = CROPS[crop];
  if (idx < 0) {
    return `
    <div class="result result-ok">
      <div class="result-top"><span class="badge badge-ok">${icon('checkCircle', { size: 16 })} Looks healthy</span><span class="muted">${esc(c.name)}</span></div>
      <h3>Your ${esc(c.name.toLowerCase())} leaf looks healthy 🎉</h3>
      <div class="meter"><i style="width:${score}%"></i></div><p class="tiny muted">Leaf greenness: ${score}%</p>
      <h4>Keep it healthy</h4>
      <ul class="steps"><li>Water at the right time and avoid standing water.</li><li>Check the field once a week.</li><li>Take another photo if you see spots or yellow patches.</li></ul>
      <p class="disclaimer">${icon('info', { size: 16 })} Demo estimate from the photo colours. Not a lab test.</p>
    </div>`;
  }
  const d = DISEASES[crop][idx];
  const [label, cls] = SEV[d.severity];
  return `
    <div class="result result-${cls}">
      <div class="result-top"><span class="badge badge-${cls}">${icon('alert', { size: 16 })} ${label}</span><span class="muted">${esc(c.name)}</span></div>
      <h3>Possible: ${esc(d.name)}</h3>
      <p class="muted">${esc(d.kind)} · ${esc(d.why)}</p>
      <div class="meter"><i style="width:${score}%"></i></div><p class="tiny muted">Leaf greenness: ${score}%</p>
      <h4>What to do now</h4>
      <ol class="steps">${d.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <h4>How to prevent it</h4>
      <ul class="steps">${d.prevent.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <p class="disclaimer">${icon('info', { size: 16 })} Demo estimate from the photo colours – not a confirmed diagnosis. Please show the leaf to your local agriculture officer before using any chemical.</p>
    </div>`;
}

export const diagnoseView = {
  html() {
    const crop = store.get('lastCrop', 'wheat');
    return `
    <div class="page-head"><h1>Check my crop</h1><p class="muted">Three easy steps to find out what is wrong.</p></div>

    <section class="card">
      <h2 class="step"><i>1</i> Which crop?</h2>
      <div class="chips" id="crop-chips" role="radiogroup" aria-label="Crop">
        ${Object.entries(CROPS).map(([k, c]) => `<button type="button" role="radio" aria-checked="${k === crop}" class="chip ${k === crop ? 'on' : ''}" data-crop="${k}">${c.emoji} ${esc(c.name)}</button>`).join('')}
      </div>
    </section>

    <section class="card">
      <h2 class="step"><i>2</i> Add a clear photo</h2>
      <div id="drop" class="drop">
        <div class="drop-empty" id="drop-empty">
          <span class="empty-icon">${icon('leaf', { size: 34 })}</span>
          <p>Take a close photo of one leaf in daylight.<br/>A plain background (like your hand or a paper) works best.</p>
        </div>
        <div class="preview" id="preview" hidden>
          <img id="preview-img" alt="Your crop photo" />
          <button class="icon-btn remove" id="remove" aria-label="Remove photo">${icon('x', { size: 20 })}</button>
        </div>
      </div>
      <div class="grid-2">
        <label class="btn btn-primary btn-lg" for="cam">${icon('camera', { size: 22 })} Take photo</label>
        <label class="btn btn-soft btn-lg" for="gallery">${icon('image', { size: 22 })} From gallery</label>
      </div>
      <input type="file" id="cam" accept="image/*" capture="environment" class="sr-only" />
      <input type="file" id="gallery" accept="image/*" class="sr-only" />
      <p class="field-error" id="photo-err" role="alert"></p>
    </section>

    <section class="card">
      <h2 class="step"><i>3</i> Find the problem</h2>
      <button class="btn btn-primary btn-lg btn-block" id="analyse" disabled>${icon('search', { size: 22 })} Check now</button>
      <div id="progress" hidden class="progress"><div class="spinner lg"></div><p id="progress-text">Looking at the leaf…</p></div>
      <div id="result" aria-live="polite"></div>
    </section>

    <section class="card">
      <div class="sec-head"><h2>Past checks</h2><button class="link link-btn" id="clear-history" hidden>Clear all</button></div>
      <div id="history"></div>
    </section>`;
  },

  mount(el) {
    let crop = store.get('lastCrop', 'wheat');
    let canvas = null;
    let thumb = '';
    const err = $('#photo-err', el);
    const analyseBtn = $('#analyse', el);

    $('#crop-chips', el).addEventListener('click', (e) => {
      const b = e.target.closest('[data-crop]');
      if (!b) return;
      crop = b.dataset.crop;
      store.set('lastCrop', crop);
      $$('#crop-chips .chip', el).forEach((c) => {
        c.classList.toggle('on', c === b);
        c.setAttribute('aria-checked', String(c === b));
      });
      $('#result', el).innerHTML = '';
    });

    async function handleFile(file) {
      err.textContent = '';
      const problem = validateImage(file);
      if (problem) {
        err.textContent = problem;
        return;
      }
      try {
        const img = await loadImage(file);
        canvas = drawToCanvas(img, 900);
        thumb = drawToCanvas(img, 220).toDataURL('image/jpeg', 0.6);
        $('#preview-img', el).src = canvas.toDataURL('image/jpeg', 0.8);
        $('#preview', el).hidden = false;
        $('#drop-empty', el).hidden = true;
        analyseBtn.disabled = false;
        $('#result', el).innerHTML = '';
        toast('Photo added. Now tap “Check now”.', 'info');
      } catch (ex) {
        err.textContent = ex.message;
      }
    }
    ['cam', 'gallery'].forEach((id) =>
      $('#' + id, el).addEventListener('change', (e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (f) handleFile(f);
      })
    );

    $('#remove', el).addEventListener('click', () => {
      canvas = null;
      $('#preview', el).hidden = true;
      $('#drop-empty', el).hidden = false;
      analyseBtn.disabled = true;
      $('#result', el).innerHTML = '';
    });

    analyseBtn.addEventListener('click', async () => {
      if (!canvas) return;
      analyseBtn.hidden = true;
      $('#progress', el).hidden = false;
      $('#result', el).innerHTML = '';
      const steps = ['Looking at the leaf…', 'Checking colour and spots…', 'Preparing advice…'];
      for (const t of steps) {
        $('#progress-text', el).textContent = t;
        await sleep(650);
      }
      const m = analyse(canvas);
      const d = decide(crop, m);
      $('#progress', el).hidden = true;
      analyseBtn.hidden = false;
      if (d.unclear) {
        $('#result', el).innerHTML = `<div class="result result-info"><h3>We couldn't see a leaf clearly</h3><ul class="steps"><li>Move closer so the leaf fills the photo.</li><li>Use daylight and keep the camera steady.</li><li>Try a different leaf.</li></ul></div>`;
        return;
      }
      const rec = { id: uid(), ts: Date.now(), crop, idx: d.idx, score: d.score, thumb };
      $('#result', el).innerHTML = resultHTML(rec);
      $('#result', el).scrollIntoView({ behavior: 'smooth', block: 'start' });
      const list = store.get('scans', []);
      list.unshift(rec);
      let saved = store.set('scans', list.slice(0, 15));
      if (!saved) {
        rec.thumb = '';
        saved = store.set('scans', list.slice(0, 15));
      }
      toast(saved ? 'Result saved in Past checks.' : 'Result ready (phone storage is full, so it was not saved).', saved ? 'success' : 'info');
      drawHistory();
    });

    function drawHistory() {
      const list = store.get('scans', []);
      const box = $('#history', el);
      $('#clear-history', el).hidden = !list.length;
      if (!list.length) {
        box.innerHTML = emptyState({ iconName: 'history', title: 'No checks yet', text: 'Your crop checks will appear here so you can look at them later.' });
        return;
      }
      box.innerHTML = `<div class="stack">${list
        .map((s) => {
          const ok = s.idx < 0;
          const d = ok ? null : DISEASES[s.crop][s.idx];
          return `<div class="hist-row">
            <button class="hist-open" data-open="${s.id}">
              ${s.thumb ? `<img src="${s.thumb}" alt="" />` : `<span class="hist-ph">${icon('leaf', { size: 24 })}</span>`}
              <span class="hist-body"><b>${ok ? 'Looks healthy' : esc(d.name)}</b><small>${esc(CROPS[s.crop].name)} · ${timeAgo(s.ts)}</small></span>
              <span class="badge ${ok ? 'badge-ok' : 'badge-' + SEV[d.severity][1]}">${ok ? 'Healthy' : SEV[d.severity][0]}</span>
            </button>
            <button class="icon-btn" data-del="${s.id}" aria-label="Delete this check">${icon('trash', { size: 20 })}</button>
          </div>`;
        })
        .join('')}</div>`;
    }
    $('#history', el).addEventListener('click', async (e) => {
      const open = e.target.closest('[data-open]');
      const del = e.target.closest('[data-del]');
      if (open) {
        const s = store.get('scans', []).find((x) => x.id === open.dataset.open);
        if (s) modal({ title: 'Past check', body: (s.thumb ? `<img class="modal-img" src="${s.thumb}" alt="Saved crop photo" />` : '') + resultHTML(s), actions: [{ label: 'Close', value: true, cls: 'btn-primary' }] });
      }
      if (del) {
        if (await confirmDialog('Delete this check?', 'It will be removed from your phone.', 'Delete', true)) {
          store.update('scans', (l) => l.filter((x) => x.id !== del.dataset.del), []);
          drawHistory();
          toast('Check deleted.');
        }
      }
    });
    $('#clear-history', el).addEventListener('click', async () => {
      if (await confirmDialog('Clear all past checks?', 'This cannot be undone.', 'Clear all', true)) {
        store.set('scans', []);
        drawHistory();
        toast('All past checks cleared.');
      }
    });
    drawHistory();
  },
};
