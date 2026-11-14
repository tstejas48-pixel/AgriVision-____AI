// Pure calculator functions (no DOM) so they are easy to test.
import { CROPS } from './data.js';

export const ACRE_IN_M2 = 4046.856;
export const ACRE_IN_HA = 0.404686;

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Fertilizer plan from crop N-P2O5-K2O recommendation (kg/ha) using Urea (46% N), DAP (18-46-0), MOP (60% K2O). */
export function fertilizer({ crop, area, unit = 'acre' }) {
  const c = CROPS[crop];
  const ha = unit === 'hectare' ? num(area) : num(area) * ACRE_IN_HA;
  const [n, p, k] = c.npk.map((x) => x * ha);
  const dap = p / 0.46;
  const nFromDap = dap * 0.18;
  const urea = Math.max(0, n - nFromDap) / 0.46;
  const mop = k / 0.6;
  return {
    nutrients: { n, p, k },
    dap, urea, mop,
    ureaBags: urea / 45, dapBags: dap / 50, mopBags: mop / 50,
    ureaBasal: urea / 3, ureaTop: (urea * 2) / 3,
  };
}

/** Seed requirement from spacing. */
export function seed({ area, row, plant, perHill = 1, tgw, germination = 85 }) {
  const a = num(area), r = num(row), p = num(plant), g = Math.min(100, Math.max(1, num(germination)));
  const hillsPerAcre = ACRE_IN_M2 / ((r / 100) * (p / 100));
  const hills = hillsPerAcre * a;
  const seeds = (hills * num(perHill)) / (g / 100);
  const kg = (seeds * num(tgw)) / 1e6;
  return { hillsPerAcre, hills, seeds, kg, kgPerAcre: a ? kg / a : 0 };
}

/** Irrigation volume and pumping time. */
export function irrigation({ crop, area, interval, efficiency, flow, mm }) {
  const need = mm ? num(mm) : CROPS[crop].mm;
  const m2 = num(area) * ACRE_IN_M2;
  const depth = need * num(interval); // mm needed between irrigations
  const litres = (m2 * depth) / (num(efficiency) / 100); // 1 mm on 1 m² = 1 litre
  const minutes = num(flow) > 0 ? litres / num(flow) : 0;
  return { depth, litres, kl: litres / 1000, minutes, hours: minutes / 60, need };
}

/** Profit / loss for one crop season. */
export function profit({ area, yieldPerAcre, price, costs }) {
  const a = num(area);
  const quintals = a * num(yieldPerAcre);
  const revenue = quintals * num(price);
  const cost = Object.values(costs).reduce((s, v) => s + num(v), 0);
  const net = revenue - cost;
  return {
    quintals, revenue, cost, net,
    perAcre: a ? net / a : 0,
    margin: revenue ? (net / revenue) * 100 : 0,
    breakEven: quintals ? cost / quintals : 0,
  };
}
