import { icon } from '../icons.js';
import { store } from '../store.js';
import { CROPS, SEED_CROPS } from '../data.js';
import * as calc from '../calc.js';
import { $, $$, esc, field, selectField, setError, clearErrors, toast, fmtNum, fmtMoney, emptyState, confirmDialog, uid, timeAgo } from '../util.js';

const cropOptions = (keys = Object.keys(CROPS)) => keys.map((k) => ({ value: k, label: `${CROPS[k].emoji} ${CROPS[k].name}` }));

const numField = (id, label, value, hint = '', extra = '') =>
  field({ id, label, type: 'number', inputmode: 'decimal', value, hint, extra: `min="0" step="any" ${extra}` });

const result = (rows, note = '') => `
  <div class="calc-result" aria-live="polite">
    <h3>Your result</h3>
    ${rows.map((r) => `<div class="res-row ${r.big ? 'big' : ''} ${r.cls || ''}"><span>${esc(r.label)}</span><b>${esc(r.value)}</b></div>`).join('')}
    ${note ? `<p class="tiny muted mt-s">${esc(note)}</p>` : ''}
  </div>`;

/** Validate a list of [id, message, opts] numeric fields. Returns values or null. */
function readNumbers(el, specs) {
  clearErrors(el);
  const out = {};
  let ok = true;
  for (const [id, msg, { min = 0, allowZero = false, max = Infinity } = {}] of specs) {
    const raw = $('#' + id, el).value.trim();
    const v = Number(raw);
    if (raw === '' || !Number.isFinite(v)) ok = setError(el, id, msg) && ok;
    else if (v < min || (!allowZero && v === 0)) ok = setError(el, id, 'Please enter a number bigger than 0.') && ok;
    else if (v > max) ok = setError(el, id, `This number looks too big. Please check it (maximum ${max}).`) && ok;
    else out[id] = v;
  }
  if (!ok) $('[aria-invalid="true"]', el)?.focus();
  return ok ? out : null;
}

/* --------------------------- tool definitions ------------------------------ */
const TOOLS = {
  fertilizer: {
    title: 'Fertilizer Calculator',
    desc: 'How much urea, DAP and potash for your land',
    icon: 'flask',
    form: (v) => `
      ${selectField({ id: 'crop', label: 'Crop', options: cropOptions(), value: v.crop || 'wheat', placeholder: '' })}
      <div class="grid-2">
        ${numField('area', 'Land size', v.area || '', 'e.g. 2')}
        ${selectField({ id: 'unit', label: 'Unit', options: [{ value: 'acre', label: 'Acre' }, { value: 'hectare', label: 'Hectare' }], value: v.unit || 'acre', placeholder: '' })}
      </div>`,
    run(el) {
      const n = readNumbers(el, [['area', 'Please enter your land size.', { max: 100000 }]]);
      if (!n) return null;
      const crop = $('#crop', el).value, unit = $('#unit', el).value;
      const r = calc.fertilizer({ crop, area: n.area, unit });
      return {
        saved: { crop, unit, area: n.area },
        html: result(
          [
            { label: 'Urea (46% N)', value: `${fmtNum(r.urea)} kg  (≈ ${fmtNum(r.ureaBags)} bags)`, big: true },
            { label: 'DAP (18-46-0)', value: `${fmtNum(r.dap)} kg  (≈ ${fmtNum(r.dapBags)} bags)`, big: true },
            { label: 'Potash – MOP (60% K₂O)', value: `${fmtNum(r.mop)} kg  (≈ ${fmtNum(r.mopBags)} bags)`, big: true },
            { label: 'Urea at sowing', value: `${fmtNum(r.ureaBasal)} kg` },
            { label: 'Urea as top-dressing later', value: `${fmtNum(r.ureaTop)} kg` },
            { label: 'Pure nutrients N–P–K', value: `${fmtNum(r.nutrients.n, 0)} – ${fmtNum(r.nutrients.p, 0)} – ${fmtNum(r.nutrients.k, 0)} kg` },
          ],
          'Put DAP and potash at sowing. Split urea: one-third at sowing, rest in 1–2 doses. This is a general guide – a soil test gives the best answer.'
        ),
      };
    },
  },

  seed: {
    title: 'Seed Calculator',
    desc: 'How many kilograms of seed you need',
    icon: 'sprout',
    form: (v) => {
      const c = CROPS[v.crop || 'wheat'];
      return `
      ${selectField({ id: 'crop', label: 'Crop', options: cropOptions(SEED_CROPS), value: v.crop || 'wheat', placeholder: '' })}
      ${numField('area', 'Land size (acres)', v.area || '', 'e.g. 2')}
      <div class="grid-2">
        ${numField('row', 'Row gap (cm)', v.row ?? c.row)}
        ${numField('plant', 'Plant gap (cm)', v.plant ?? c.plant)}
      </div>
      <div class="grid-2">
        ${numField('perHill', 'Seeds per spot', v.perHill ?? c.perHill)}
        ${numField('germination', 'Seed germination %', v.germination ?? 85, 'On the seed bag')}
      </div>
      ${numField('tgw', 'Weight of 1000 seeds (grams)', v.tgw ?? c.tgw, 'Filled in for you – change if your seed is different')}`;
    },
    wire(el) {
      $('#crop', el).addEventListener('change', (e) => {
        const c = CROPS[e.target.value];
        $('#row', el).value = c.row;
        $('#plant', el).value = c.plant;
        $('#perHill', el).value = c.perHill;
        $('#tgw', el).value = c.tgw;
      });
    },
    run(el) {
      const n = readNumbers(el, [
        ['area', 'Please enter your land size.', { max: 100000 }],
        ['row', 'Please enter the row gap.', { max: 500 }],
        ['plant', 'Please enter the plant gap.', { max: 500 }],
        ['perHill', 'Please enter seeds per spot.', { max: 50 }],
        ['germination', 'Please enter germination % (for example 85).', { max: 100 }],
        ['tgw', 'Please enter the seed weight.', { max: 100000 }],
      ]);
      if (!n) return null;
      const r = calc.seed(n);
      return {
        saved: { crop: $('#crop', el).value, ...n },
        html: result(
          [
            { label: 'Seed needed (total)', value: `${fmtNum(r.kg, 2)} kg`, big: true },
            { label: 'Seed per acre', value: `${fmtNum(r.kgPerAcre, 2)} kg` },
            { label: 'Spots to sow per acre', value: fmtNum(r.hillsPerAcre, 0) },
            { label: 'Total seeds', value: fmtNum(r.seeds, 0) },
          ],
          'This includes extra seed for seeds that do not sprout. Buy 5–10% more for safety.'
        ),
      };
    },
  },

  water: {
    title: 'Water Calculator',
    desc: 'How much water and pumping time you need',
    icon: 'droplet',
    form: (v) => `
      ${selectField({ id: 'crop', label: 'Crop', options: cropOptions(), value: v.crop || 'wheat', placeholder: '' })}
      ${numField('area', 'Land size (acres)', v.area || '', 'e.g. 2')}
      <div class="grid-2">
        ${numField('interval', 'Days between watering', v.interval ?? 7)}
        ${selectField({ id: 'efficiency', label: 'Watering method', options: [{ value: '55', label: 'Flood / canal' }, { value: '75', label: 'Sprinkler' }, { value: '90', label: 'Drip' }], value: v.efficiency || '55', placeholder: '' })}
      </div>
      ${numField('flow', 'Pump flow (litres per minute)', v.flow ?? 300, 'Optional – leave 300 if not sure')}`,
    run(el) {
      const n = readNumbers(el, [
        ['area', 'Please enter your land size.', { max: 100000 }],
        ['interval', 'Please enter the days between watering.', { max: 60 }],
        ['flow', 'Please enter pump flow.', { max: 1000000 }],
      ]);
      if (!n) return null;
      const crop = $('#crop', el).value, efficiency = Number($('#efficiency', el).value);
      const r = calc.irrigation({ crop, ...n, efficiency });
      const t = r.minutes >= 60 ? `${fmtNum(r.hours, 1)} hours` : `${fmtNum(r.minutes, 0)} minutes`;
      return {
        saved: { crop, ...n, efficiency: String(efficiency) },
        html: result(
          [
            { label: 'Water per watering', value: `${fmtNum(r.kl, 1)} kilolitres (${fmtNum(r.litres, 0)} L)`, big: true },
            { label: 'Pumping time', value: t, big: true },
            { label: 'Crop need', value: `${r.need} mm per day` },
            { label: 'Water depth between waterings', value: `${fmtNum(r.depth, 0)} mm` },
          ],
          'Based on average crop water need. Rain, soil type and crop stage change the real need – check soil moisture by hand before watering.'
        ),
      };
    },
  },

  profit: {
    title: 'Profit Calculator',
    desc: 'See your income, costs and profit',
    icon: 'rupee',
    form: (v) => `
      ${selectField({ id: 'crop', label: 'Crop', options: cropOptions(), value: v.crop || 'wheat', placeholder: '' })}
      ${numField('area', 'Land size (acres)', v.area || '', 'e.g. 2')}
      <div class="grid-2">
        ${numField('yieldPerAcre', 'Harvest (quintal per acre)', v.yieldPerAcre || '', '1 quintal = 100 kg')}
        ${numField('price', 'Selling price (₹ per quintal)', v.price || '')}
      </div>
      <h3 class="sub">Total costs (₹)</h3>
      <div class="grid-2">
        ${numField('seeds', 'Seeds', v.seeds ?? 0, '', 'data-cost')}
        ${numField('fert', 'Fertilizer', v.fert ?? 0, '', 'data-cost')}
        ${numField('pest', 'Pesticide', v.pest ?? 0, '', 'data-cost')}
        ${numField('labour', 'Labour', v.labour ?? 0, '', 'data-cost')}
        ${numField('water', 'Water / electricity', v.water ?? 0, '', 'data-cost')}
        ${numField('other', 'Other', v.other ?? 0, '', 'data-cost')}
      </div>`,
    run(el) {
      const n = readNumbers(el, [
        ['area', 'Please enter your land size.', { max: 100000 }],
        ['yieldPerAcre', 'Please enter your harvest per acre.', { max: 100000 }],
        ['price', 'Please enter the selling price.', { max: 10000000 }],
        ...['seeds', 'fert', 'pest', 'labour', 'water', 'other'].map((id) => [id, 'Enter 0 if there is no cost.', { allowZero: true, max: 1e9 }]),
      ]);
      if (!n) return null;
      const crop = $('#crop', el).value;
      const r = calc.profit({ area: n.area, yieldPerAcre: n.yieldPerAcre, price: n.price, costs: { a: n.seeds, b: n.fert, c: n.pest, d: n.labour, e: n.water, f: n.other } });
      const win = r.net >= 0;
      return {
        saved: { crop, ...n },
        record: { crop: CROPS[crop].name, area: n.area, revenue: r.revenue, cost: r.cost, net: r.net },
        html: result(
          [
            { label: win ? 'Your profit' : 'Your loss', value: fmtMoney(r.net), big: true, cls: win ? 'pos' : 'neg' },
            { label: 'Total harvest', value: `${fmtNum(r.quintals)} quintal` },
            { label: 'Income from sale', value: fmtMoney(r.revenue) },
            { label: 'Total costs', value: fmtMoney(r.cost) },
            { label: 'Profit per acre', value: fmtMoney(r.perAcre) },
            { label: 'Profit margin', value: `${fmtNum(r.margin, 0)}%` },
            { label: 'Break-even price', value: `${fmtMoney(r.breakEven)} per quintal` },
          ],
          win ? 'Selling above the break-even price gives you profit.' : 'Your costs are higher than your income. Try comparing mandi prices or lowering costs next season.'
        ),
      };
    },
  },
};

/* ------------------------------- tools index ------------------------------- */
export const toolsView = {
  html: () => `
    <div class="page-head"><a href="#/home" class="back-link" data-back>${icon('arrowLeft', { size: 20 })} Home</a><h1>Farming tools</h1><p class="muted">Simple calculators to plan your farm.</p></div>
    <div class="tool-list">
      ${Object.entries(TOOLS).map(([id, t]) => `<a href="#/tools/${id}" class="tool-card"><span class="tool-ico">${icon(t.icon, { size: 28 })}</span><span><b>${t.title}</b><small>${t.desc}</small></span><span class="chev">${icon('chevronRight', { size: 22 })}</span></a>`).join('')}
    </div>`,
  mount() {},
};

/* ------------------------------- single tool ------------------------------- */
export const toolView = {
  html(ctx) {
    const t = TOOLS[ctx.params.id];
    if (!t) return `<div class="page-head"><a href="#/tools" class="back-link">${icon('arrowLeft', { size: 20 })} Tools</a></div>${emptyState({ iconName: 'alert', title: 'Tool not found', text: 'Please choose a tool from the list.', action: '<a class="btn btn-primary" href="#/tools">See tools</a>' })}`;
    const saved = store.get('calc.' + ctx.params.id, {});
    return `
    <div class="page-head"><a href="#/tools" class="back-link">${icon('arrowLeft', { size: 20 })} All tools</a>
      <div class="title-row"><span class="tool-ico">${icon(t.icon, { size: 26 })}</span><h1>${t.title}</h1></div></div>
    <section class="card">
      <form id="calc-form" novalidate>
        ${t.form(saved)}
        <button class="btn btn-primary btn-lg btn-block" type="submit">${icon('calc', { size: 22 })} Calculate</button>
      </form>
    </section>
    <div id="out"></div>
    ${ctx.params.id === 'profit' ? '<section class="card" id="records-card"></section>' : ''}`;
  },

  mount(el, ctx) {
    const id = ctx.params.id;
    const t = TOOLS[id];
    if (!t) return;
    t.wire?.(el);
    let last = null;

    $('#calc-form', el).addEventListener('submit', (e) => {
      e.preventDefault();
      const r = t.run(el);
      if (!r) {
        $('#out', el).innerHTML = '';
        return;
      }
      last = r;
      store.set('calc.' + id, r.saved);
      $('#out', el).innerHTML = `<section class="card result-card">${r.html}${r.record ? `<button class="btn btn-soft btn-block" id="save-rec">${icon('check', { size: 20 })} Save this result</button>` : ''}</section>`;
      $('#out .result-card', el).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      $('#save-rec', el)?.addEventListener('click', (ev) => {
        const b = ev.currentTarget;
        store.update('records', (l) => [{ id: uid(), ts: Date.now(), ...last.record }, ...l].slice(0, 50), []);
        b.disabled = true;
        b.innerHTML = `${icon('checkCircle', { size: 20 })} Saved`;
        toast('Saved! You can see it on your Home screen.');
        drawRecords();
      });
    });

    function drawRecords() {
      const box = $('#records-card', el);
      if (!box) return;
      const list = store.get('records', []);
      box.innerHTML = `<div class="sec-head"><h2>Saved results</h2></div>` +
        (list.length
          ? `<div class="stack">${list.map((r) => `
            <div class="rec-row"><span class="rec-body"><b>${esc(r.crop)} · ${fmtNum(r.area)} acre</b><small>${timeAgo(r.ts)} · Income ${fmtMoney(r.revenue)} · Cost ${fmtMoney(r.cost)}</small></span>
            <b class="${r.net >= 0 ? 'pos' : 'neg'}">${fmtMoney(r.net)}</b>
            <button class="icon-btn" data-del="${r.id}" aria-label="Delete saved result">${icon('trash', { size: 20 })}</button></div>`).join('')}</div>`
          : emptyState({ iconName: 'rupee', title: 'Nothing saved yet', text: 'Calculate and tap “Save this result” to keep track of every crop.' }));
      $$('[data-del]', box).forEach((b) =>
        b.addEventListener('click', async () => {
          if (await confirmDialog('Delete this result?', 'It will be removed from your profit overview.', 'Delete', true)) {
            store.update('records', (l) => l.filter((x) => x.id !== b.dataset.del), []);
            drawRecords();
            toast('Deleted.');
          }
        })
      );
    }
    drawRecords();
  },
};
