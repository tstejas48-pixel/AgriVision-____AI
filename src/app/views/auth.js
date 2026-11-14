import { Auth, AuthError, isEmail, normaliseMobile, passwordStrength } from '../auth.js';
import { icon, logo } from '../icons.js';
import { STATES, DISTRICTS, LANGUAGES } from '../data.js';
import { $, $$, field, selectField, setError, clearErrors, wirePasswordToggles, setBusy, toast, modal, esc } from '../util.js';

const demoNotice = `
  <div class="notice notice-info">
    ${icon('info', { size: 20 })}
    <p><b>Demo mode.</b> Accounts are saved only on this device for testing. Please don't use a password you use anywhere else.</p>
  </div>`;

function authLayout(inner) {
  return `
  <div class="auth">
    <aside class="auth-hero" aria-hidden="true">
      <div class="auth-hero-inner">
        ${logo({ size: 52, light: true })}
        <h2>Healthy crops.<br/>Better harvest.</h2>
        <p>Check your crop, plan fertilizer and water, and track your profit – all in one simple app.</p>
        <ul>
          <li>${icon('camera', { size: 20 })} Photo crop check</li>
          <li>${icon('sun', { size: 20 })} Weather for your village</li>
          <li>${icon('calc', { size: 20 })} Easy farming calculators</li>
        </ul>
      </div>
      <span class="blob b1"></span><span class="blob b2"></span>
    </aside>
    <main class="auth-main">
      <div class="auth-card">
        <div class="auth-brand">${logo({ size: 48 })}</div>
        ${inner}
      </div>
    </main>
  </div>`;
}

/* -------------------------------- LOGIN ----------------------------------- */
export const loginView = {
  html: () =>
    authLayout(`
    <h1>Welcome back 👋</h1>
    <p class="muted">Log in to see your farm dashboard.</p>
    <form id="login-form" novalidate>
      ${field({ id: 'identifier', label: 'Email or mobile number', icon: 'user', placeholder: 'you@example.com or 98765 43210', autocomplete: 'username', inputmode: 'email' })}
      ${field({ id: 'password', label: 'Password', type: 'password', icon: 'lock', placeholder: 'Your password', autocomplete: 'current-password', toggle: true })}
      <div class="row-between">
        <label class="check"><input type="checkbox" id="remember" checked /><span class="box">${icon('check', { size: 14 })}</span><span>Remember me</span></label>
        <a href="#/forgot" class="link">Forgot password?</a>
      </div>
      <p class="form-error" id="form-error" role="alert"></p>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Log in</button>
    </form>
    <div class="divider"><span>or</span></div>
    <button class="btn btn-soft btn-lg btn-block" id="guest-btn" type="button">${icon('leaf', { size: 20 })} Continue as guest</button>
    <p class="center muted mt">New to AgriVision? <a href="#/signup" class="link">Create an account</a></p>
    ${demoNotice}`),

  mount(el, ctx) {
    const form = $('#login-form', el);
    wirePasswordToggles(el);
    const err = $('#form-error', el);

    const validate = () => {
      clearErrors(el);
      err.textContent = '';
      let ok = true;
      const id = $('#identifier', el).value.trim();
      const pw = $('#password', el).value;
      if (!id) ok = setError(el, 'identifier', 'Please enter your email or mobile number.') && ok;
      else if (!id.includes('@') && !normaliseMobile(id)) ok = setError(el, 'identifier', 'Enter a 10-digit mobile number (like 98765 43210) or a valid email.') && ok;
      else if (id.includes('@') && !isEmail(id)) ok = setError(el, 'identifier', 'This email looks incomplete. Example: name@example.com') && ok;
      if (!pw) ok = setError(el, 'password', 'Please enter your password.') && ok;
      return ok;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate()) {
        $('[aria-invalid="true"]', el)?.focus();
        return;
      }
      const btn = $('button[type=submit]', form);
      setBusy(btn, true, 'Logging in…');
      try {
        const user = await Auth.login({
          identifier: $('#identifier', el).value,
          password: $('#password', el).value,
          remember: $('#remember', el).checked,
        });
        toast(`Welcome back, ${user.name.split(' ')[0]}!`);
        ctx.navigate(ctx.next || '/home');
      } catch (ex) {
        setBusy(btn, false);
        if (ex instanceof AuthError && ex.field) setError(el, ex.field, ex.message);
        else err.textContent = ex.message || 'Something went wrong. Please try again.';
        $('[aria-invalid="true"]', el)?.focus();
      }
    });

    $('#guest-btn', el).addEventListener('click', async () => {
      await Auth.loginGuest();
      toast('You are using the app as a guest. Create an account to keep your data safe.', 'info');
      ctx.navigate('/home');
    });
  },
};

/* -------------------------------- SIGNUP ---------------------------------- */
const TERMS = `
  <p><b>Demo terms.</b> AgriVision AI is a demonstration app. The crop check result is a simple estimate and is not a replacement for advice from an agriculture expert.</p>
  <p>Your account details are stored only in this browser on this device. This is not secure storage – don't use important passwords.</p>
  <p>Please follow pesticide labels and local agriculture officer advice.</p>`;

export const signupView = {
  html: () =>
    authLayout(`
    <a href="#/login" class="back-link">${icon('arrowLeft', { size: 20 })} Back to login</a>
    <h1>Create your account 🌱</h1>
    <p class="muted">It takes less than a minute.</p>
    <form id="signup-form" novalidate>
      ${field({ id: 'name', label: 'Full name', icon: 'user', placeholder: 'Your name', autocomplete: 'name' })}
      ${field({ id: 'mobile', label: 'Mobile number', icon: 'phone', placeholder: '98765 43210', type: 'tel', autocomplete: 'tel', inputmode: 'tel' })}
      ${field({ id: 'email', label: 'Email address', icon: 'mail', placeholder: 'you@example.com', type: 'email', autocomplete: 'email', inputmode: 'email' })}
      ${field({ id: 'password', label: 'Password', type: 'password', icon: 'lock', placeholder: 'At least 8 letters and numbers', autocomplete: 'new-password', toggle: true })}
      <div class="strength" id="strength" aria-live="polite"><div class="bars"><i></i><i></i><i></i><i></i></div><span id="strength-label"></span></div>
      ${field({ id: 'confirm', label: 'Confirm password', type: 'password', icon: 'lock', placeholder: 'Type the password again', autocomplete: 'new-password', toggle: true })}
      <div class="grid-2">
        ${selectField({ id: 'state', label: 'State', options: STATES, placeholder: 'Choose state', icon: 'pin' })}
        ${field({ id: 'district', label: 'District', icon: 'pin', placeholder: 'Your district', list: 'district-list', autocomplete: 'off' })}
      </div>
      <datalist id="district-list"></datalist>
      ${selectField({ id: 'language', label: 'Preferred language', options: LANGUAGES, value: 'English', placeholder: '' })}
      <div class="field" data-field="terms">
        <label class="check"><input type="checkbox" id="terms" /><span class="box">${icon('check', { size: 14 })}</span>
          <span>I accept the <button type="button" class="link link-btn" id="terms-link">terms and conditions</button></span></label>
        <p class="field-error" id="terms-err" role="alert"></p>
      </div>
      <p class="form-error" id="form-error" role="alert"></p>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Create account</button>
    </form>
    <p class="center muted mt">Already have an account? <a href="#/login" class="link">Log in</a></p>
    ${demoNotice}`),

  mount(el, ctx) {
    wirePasswordToggles(el);
    const form = $('#signup-form', el);
    const err = $('#form-error', el);

    // password strength meter
    const bars = $$('#strength .bars i', el);
    const label = $('#strength-label', el);
    $('#password', el).addEventListener('input', (e) => {
      const { level, label: l } = passwordStrength(e.target.value);
      bars.forEach((b, i) => {
        b.className = i < level ? `on l${level}` : '';
      });
      label.textContent = l ? `Password strength: ${l}` : '';
    });

    // district suggestions
    $('#state', el).addEventListener('change', (e) => {
      $('#district-list', el).innerHTML = (DISTRICTS[e.target.value] || []).map((d) => `<option value="${esc(d)}"></option>`).join('');
      setError(el, 'state', '');
    });

    $('#terms-link', el).addEventListener('click', () =>
      modal({ title: 'Terms & conditions', body: TERMS, actions: [{ label: 'Close', value: true, cls: 'btn-primary' }] })
    );

    const rules = {
      name: (v) => (!v.trim() ? 'Please enter your name.' : v.trim().length < 2 ? 'Name is too short.' : ''),
      mobile: (v) => (!v.trim() ? 'Please enter your mobile number.' : !normaliseMobile(v) ? 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.' : ''),
      email: (v) => (!v.trim() ? 'Please enter your email address.' : !isEmail(v) ? 'This email looks incomplete. Example: name@example.com' : ''),
      password: (v) => (!v ? 'Please create a password.' : v.length < 8 ? 'Use at least 8 characters.' : !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Mix letters and numbers to make it stronger.' : ''),
      confirm: (v) => (!v ? 'Please type the password again.' : v !== $('#password', el).value ? "Passwords don't match yet." : ''),
      state: (v) => (!v ? 'Please choose your state.' : ''),
      district: (v) => (!v.trim() ? 'Please enter your district.' : ''),
    };
    Object.keys(rules).forEach((id) => {
      const input = $('#' + id, el);
      input.addEventListener('blur', () => input.value && setError(el, id, rules[id](input.value)));
      input.addEventListener('input', () => input.getAttribute('aria-invalid') && setError(el, id, rules[id](input.value)));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.textContent = '';
      let ok = true;
      Object.keys(rules).forEach((id) => {
        ok = setError(el, id, rules[id]($('#' + id, el).value)) && ok;
      });
      if (!$('#terms', el).checked) {
        $('#terms-err', el).textContent = 'Please accept the terms to continue.';
        ok = false;
      } else $('#terms-err', el).textContent = '';
      if (!ok) {
        $('[aria-invalid="true"]', el)?.focus();
        return;
      }
      const btn = $('button[type=submit]', form);
      setBusy(btn, true, 'Creating account…');
      try {
        const user = await Auth.register({
          name: $('#name', el).value,
          mobile: $('#mobile', el).value,
          email: $('#email', el).value,
          password: $('#password', el).value,
          state: $('#state', el).value,
          district: $('#district', el).value,
          language: $('#language', el).value,
        });
        toast(`Account created! Welcome, ${user.name.split(' ')[0]} 🌱`);
        ctx.navigate('/home');
      } catch (ex) {
        setBusy(btn, false);
        if (ex instanceof AuthError && ex.field) setError(el, ex.field, ex.message);
        else err.textContent = ex.message || 'Something went wrong. Please try again.';
        $('[aria-invalid="true"]', el)?.focus();
      }
    });
  },
};

/* ------------------------------ FORGOT PASSWORD --------------------------- */
export const forgotView = {
  html: () =>
    authLayout(`
    <a href="#/login" class="back-link">${icon('arrowLeft', { size: 20 })} Back to login</a>
    <h1>Forgot password?</h1>
    <p class="muted" id="forgot-sub">No problem. Enter your email or mobile number.</p>
    <form id="forgot-form" novalidate>
      <div id="step1">
        ${field({ id: 'identifier', label: 'Email or mobile number', icon: 'user', placeholder: 'you@example.com or 98765 43210', autocomplete: 'username' })}
      </div>
      <div id="step2" hidden>
        ${field({ id: 'password', label: 'New password', type: 'password', icon: 'lock', placeholder: 'At least 8 letters and numbers', autocomplete: 'new-password', toggle: true })}
        ${field({ id: 'confirm', label: 'Confirm new password', type: 'password', icon: 'lock', placeholder: 'Type it again', autocomplete: 'new-password', toggle: true })}
      </div>
      <p class="form-error" id="form-error" role="alert"></p>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Continue</button>
    </form>
    <div class="notice notice-info mt">${icon('info', { size: 20 })}
      <p><b>Demo only.</b> A real app would email you a secure reset link. Here we let you set a new password directly on this device.</p></div>`),

  mount(el, ctx) {
    wirePasswordToggles(el);
    let step = 1;
    const err = $('#form-error', el);
    $('#forgot-form', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      err.textContent = '';
      clearErrors(el);
      const idv = $('#identifier', el).value.trim();
      const btn = $('button[type=submit]', el);
      if (step === 1) {
        if (!idv) return setError(el, 'identifier', 'Please enter your email or mobile number.');
        if (!Auth.accountExists(idv)) return setError(el, 'identifier', "We couldn't find an account with that email or mobile number.");
        step = 2;
        $('#step1', el).hidden = true;
        $('#step2', el).hidden = false;
        $('#forgot-sub', el).textContent = 'Account found. Choose a new password.';
        btn.textContent = 'Save new password';
        $('#password', el).focus();
        return;
      }
      const pw = $('#password', el).value;
      let ok = true;
      if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) ok = setError(el, 'password', 'Use at least 8 characters with letters and numbers.') && ok;
      if (pw !== $('#confirm', el).value) ok = setError(el, 'confirm', "Passwords don't match yet.") && ok;
      if (!ok) return;
      setBusy(btn, true, 'Saving…');
      try {
        await Auth.resetPassword(idv, pw);
        toast('Password changed. Please log in.');
        ctx.navigate('/login');
      } catch (ex) {
        setBusy(btn, false);
        err.textContent = ex.message;
      }
    });
  },
};
