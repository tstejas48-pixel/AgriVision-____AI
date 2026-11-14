// Per-user app data (scans, calculator records, chat, notification state).
// Saved in localStorage so user data is preserved between visits.
// (Future: replace with Firestore collections keyed by the user id.)
import { Auth } from './auth.js';

const keyFor = (uid) => `agrivision.data.${uid}.v1`;

function readAll(uid) {
  try {
    return JSON.parse(localStorage.getItem(keyFor(uid)) || '{}');
  } catch {
    return {};
  }
}

function uid() {
  return Auth.currentUser()?.id || 'guest';
}

export const store = {
  get(name, fallback) {
    const v = readAll(uid())[name];
    if (v === undefined || v === null) return fallback;
    if (Array.isArray(fallback) && !Array.isArray(v)) return fallback;
    if (fallback && typeof fallback === 'object' && !Array.isArray(fallback) && (typeof v !== 'object' || v === null || Array.isArray(v))) return fallback;
    return v;
  },
  set(name, value) {
    const all = readAll(uid());
    all[name] = value;
    try {
      localStorage.setItem(keyFor(uid()), JSON.stringify(all));
      return true;
    } catch {
      return false; // storage full
    }
  },
  update(name, fn, fallback) {
    const next = fn(this.get(name, fallback));
    return this.set(name, next) ? next : null;
  },
  clearMine() {
    localStorage.removeItem(keyFor(uid()));
  },
  clearFor(id) {
    localStorage.removeItem(keyFor(id));
  },
};

// Community posts are shared by everybody who uses this device (demo).
const COMMUNITY_KEY = 'agrivision.community.v1';
export const community = {
  get(fallback = null) {
    try {
      const v = JSON.parse(localStorage.getItem(COMMUNITY_KEY));
      if (v === null || v === undefined) return fallback;
      if (Array.isArray(fallback) && !Array.isArray(v)) return fallback;
      if (fallback === null && !Array.isArray(v)) return fallback;
      return v;
    } catch {
      return fallback;
    }
  },
  set(posts) {
    try {
      localStorage.setItem(COMMUNITY_KEY, JSON.stringify(posts));
      return true;
    } catch {
      return false;
    }
  },
};
