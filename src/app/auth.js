/**
 * AgriVision AI – DEMO AUTHENTICATION (frontend only)
 * ---------------------------------------------------------------------------
 * !!  THIS IS NOT SECURE AUTHENTICATION.  !!
 * Accounts and sessions live in the browser's localStorage, which anyone with
 * access to the device can read or edit. It exists only so the app can be
 * demonstrated end to end. Never use it to protect real data.
 *
 * What we DO to avoid obviously bad practice:
 *  - Passwords are never stored in plaintext. They are salted and hashed with
 *    PBKDF2-SHA256 (Web Crypto) before being saved.
 *  - A small lock-out slows down repeated wrong guesses.
 *
 * FIREBASE MIGRATION
 * ---------------------------------------------------------------------------
 * All UI code talks to the `Auth` object at the bottom of this file, never to
 * localStorage directly. To move to Firebase Authentication, write another
 * provider with the same methods and assign it to `Auth`:
 *
 *   register(data)            -> createUserWithEmailAndPassword + save profile in Firestore
 *   login({identifier,password,remember})
 *                             -> signInWithEmailAndPassword (+ setPersistence for "remember me")
 *                                (mobile login -> use Phone Auth / OTP)
 *   loginGuest()              -> signInAnonymously
 *   logout()                  -> signOut
 *   currentUser()             -> auth.currentUser / onAuthStateChanged
 *   updateProfile(patch)      -> updateDoc(users/{uid}, patch)
 *   resetPassword(identifier) -> sendPasswordResetEmail (the demo resets locally)
 */

const USERS_KEY = 'agrivision.demo.users.v1';
const SESSION_KEY = 'agrivision.demo.session.v1';
const LOCK_KEY = 'agrivision.demo.lock.v1';
const ITERATIONS = 120000;
const SESSION_DAYS = 30;
const MAX_TRIES = 5;
const LOCK_SECONDS = 30;

export class AuthError extends Error {
  constructor(code, message, field) {
    super(message);
    this.code = code;
    this.field = field;
  }
}

/* ------------------------------ helpers ---------------------------------- */
const readJSON = (storage, key, fallback) => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (storage, key, value) => {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    throw new AuthError('storage', 'Your phone or browser is not letting us save data. Please turn off private mode and try again.');
  }
};

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const randomHex = (n = 16) => {
  const a = new Uint8Array(n);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(a);
  else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
  return toHex(a);
};

async function hashPassword(password, salt = randomHex(), iter = ITERATIONS) {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const key = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle.deriveBits(
      { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: iter, hash: 'SHA-256' },
      key,
      256
    );
    return { algo: 'pbkdf2-sha256', iter, salt, hash: toHex(bits) };
  }
  // Web Crypto is only available on https / localhost. Weak, demo-only fallback.
  let h = 2166136261;
  const s = `${salt}:${password}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return { algo: 'demo-fallback', iter: 0, salt, hash: h.toString(16) };
}

async function verifyPassword(password, rec) {
  if (!rec) return false;
  if (rec.algo === 'pbkdf2-sha256' && !globalThis.crypto?.subtle) {
    throw new AuthError('crypto', 'Please open the app over https to log in on this device.');
  }
  const test = await hashPassword(password, rec.salt, rec.iter);
  return test.algo === rec.algo && test.hash === rec.hash;
}

/** Normalise a mobile number to 10 digits (India). Returns '' if invalid. */
export function normaliseMobile(v) {
  let d = String(v || '').replace(/[\s\-().]/g, '');
  d = d.replace(/^\+?91/, '').replace(/^0/, '');
  return /^[6-9]\d{9}$/.test(d) ? d : '';
}
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());

export function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const level = !pw ? 0 : Math.min(4, Math.max(1, score - (pw.length < 8 ? 1 : 0)));
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { level, label: labels[level] };
}

/* ------------------------------ lock-out ---------------------------------- */
function lockRemaining() {
  const l = readJSON(localStorage, LOCK_KEY, null);
  if (!l || !l.until) return 0;
  const left = Math.ceil((l.until - Date.now()) / 1000);
  return left > 0 ? left : 0;
}
function registerFailure() {
  const l = readJSON(localStorage, LOCK_KEY, { count: 0 });
  const count = (l.count || 0) + 1;
  if (count >= MAX_TRIES) writeJSON(localStorage, LOCK_KEY, { count: 0, until: Date.now() + LOCK_SECONDS * 1000 });
  else writeJSON(localStorage, LOCK_KEY, { count });
}
const clearFailures = () => localStorage.removeItem(LOCK_KEY);

/* ------------------------------ storage ----------------------------------- */
const getUsers = () => readJSON(localStorage, USERS_KEY, []);
const saveUsers = (u) => writeJSON(localStorage, USERS_KEY, u);

function findByIdentifier(identifier) {
  const id = String(identifier || '').trim();
  const users = getUsers();
  if (id.includes('@')) return users.find((u) => u.email === id.toLowerCase());
  const m = normaliseMobile(id);
  return m ? users.find((u) => u.mobile === m) : undefined;
}

const publicUser = (u) => {
  if (!u) return null;
  // eslint-disable-next-line no-unused-vars
  const { password, ...rest } = u;
  return rest;
};

function readSession() {
  const s = readJSON(localStorage, SESSION_KEY, null) || readJSON(sessionStorage, SESSION_KEY, null);
  if (!s) return null;
  if (s.expires && s.expires < Date.now()) {
    clearSession();
    return null;
  }
  return s;
}
function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
function startSession(session, remember) {
  clearSession();
  const data = { ...session, createdAt: Date.now(), expires: remember ? Date.now() + SESSION_DAYS * 864e5 : null };
  writeJSON(remember ? localStorage : sessionStorage, SESSION_KEY, data);
}

/* ---------------------------- demo provider ------------------------------- */
const demoProvider = {
  name: 'localStorage-demo',
  isDemo: true,

  async register({ name, mobile, email, password, state, district, language }) {
    const m = normaliseMobile(mobile);
    const e = String(email || '').trim().toLowerCase();
    const users = getUsers();
    if (users.some((u) => u.mobile === m)) {
      throw new AuthError('dup-mobile', 'This mobile number already has an account. Please log in instead.', 'mobile');
    }
    if (users.some((u) => u.email === e)) {
      throw new AuthError('dup-email', 'This email already has an account. Please log in instead.', 'email');
    }
    const user = {
      id: 'u_' + randomHex(8),
      name: String(name).trim(),
      mobile: m,
      email: e,
      state,
      district: String(district).trim(),
      language,
      password: await hashPassword(password),
      createdAt: Date.now(),
    };
    users.push(user);
    saveUsers(users);
    startSession({ uid: user.id }, true);
    return publicUser(user);
  },

  async login({ identifier, password, remember }) {
    const left = lockRemaining();
    if (left) throw new AuthError('locked', `Too many tries. Please wait ${left} seconds and try again.`);
    const user = findByIdentifier(identifier);
    if (!user) {
      registerFailure();
      throw new AuthError('no-account', "We couldn't find an account with that email or mobile number. Please check it or create a new account.", 'identifier');
    }
    if (!(await verifyPassword(password, user.password))) {
      registerFailure();
      throw new AuthError('bad-password', "That password doesn't look right. Please try again or tap “Forgot password”.", 'password');
    }
    clearFailures();
    startSession({ uid: user.id }, !!remember);
    return publicUser(user);
  },

  async loginGuest() {
    startSession({ uid: 'guest', guest: true }, false);
    return this.currentUser();
  },

  async logout() {
    clearSession();
  },

  currentUser() {
    const s = readSession();
    if (!s) return null;
    if (s.guest) {
      return { id: 'guest', guest: true, name: 'Guest', state: '', district: '', language: 'English', mobile: '', email: '' };
    }
    const u = getUsers().find((x) => x.id === s.uid);
    if (!u) {
      clearSession();
      return null;
    }
    return publicUser(u);
  },

  async updateProfile(patch) {
    const s = readSession();
    if (!s || s.guest) throw new AuthError('guest', 'Please create an account to save your profile.');
    const users = getUsers();
    const i = users.findIndex((u) => u.id === s.uid);
    if (i < 0) throw new AuthError('no-user', 'Account not found.');
    const allowed = ['name', 'state', 'district', 'language'];
    allowed.forEach((k) => {
      if (patch[k] !== undefined) users[i][k] = String(patch[k]).trim();
    });
    saveUsers(users);
    return publicUser(users[i]);
  },

  /** Demo-only: a real app sends an email link (Firebase sendPasswordResetEmail). */
  async resetPassword(identifier, newPassword) {
    const user = findByIdentifier(identifier);
    if (!user) throw new AuthError('no-account', "We couldn't find an account with that email or mobile number.", 'identifier');
    const users = getUsers();
    const i = users.findIndex((u) => u.id === user.id);
    users[i].password = await hashPassword(newPassword);
    saveUsers(users);
    clearFailures();
  },

  accountExists: (identifier) => !!findByIdentifier(identifier),

  async deleteAccount() {
    const s = readSession();
    if (!s || s.guest) return;
    saveUsers(getUsers().filter((u) => u.id !== s.uid));
    clearSession();
  },
};

// Swap this assignment for a Firebase provider later.
export const Auth = demoProvider;
export const isAuthenticated = () => !!Auth.currentUser();
