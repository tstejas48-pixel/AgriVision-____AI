import { icon } from '../icons.js';
import { Auth } from '../auth.js';
import { store } from '../store.js';
import { STATES, DISTRICTS, LANGUAGES } from '../data.js';
import { esc, $, initials, field, selectField, setError, clearErrors, setBusy, toast, confirmDialog } from '../util.js';

export const profileView = {
  html(ctx) {
    const u = ctx.user;
    const scans = store.get('scans', []).length;
    const recs = store.get('records', []).length;
    if (u.guest) {
      return `
      <div class="page-head"><h1>My profile</h1></div>
      <section class="card profile-top">
        <span class="avatar xl">${icon('user', { size: 40 })}</span>
        <h2>Guest farmer</h2><p class="muted">Create a free account to keep your crop checks and profit records safe on your phone.</p>
        <a href="#/signup" class="btn btn-primary btn-lg btn-block">Create account</a>
        <a href="#/login" class="btn btn-soft btn-lg btn-block">I already have an account</a>
      </section>
      <button class="btn btn-ghost btn-lg btn-block" id="logout">${icon('logout', { size: 20 })} Leave guest mode</button>`;
    }
    return `
    <div class="page-head"><h1>My profile</h1></div>
    <section class="card profile-top">
      <span class="avatar xl">${esc(initials(u.name))}</span>
      <h2>${esc(u.name)}</h2>
      <p class="muted">${esc(u.district)}${u.district && u.state ? ', ' : ''}${esc(u.state)}</p>
      <div class="stat-row">
        <div><small>Crop checks</small><b>${scans}</b></div>
        <div><small>Saved results</small><b>${recs}</b></div>
        <div><small>Language</small><b class="sm">${esc(String(u.language || 'English').split(' ')[0])}</b></div>
      </div>
    </section>

    <section class="card">
      <div class="sec-head"><h2>My details</h2></div>
      <form id="profile-form" novalidate>
        ${field({ id: 'name', label: 'Full name', icon: 'user', value: u.name, autocomplete: 'name' })}
        <div class="grid-2">
          ${field({ id: 'mobile', label: 'Mobile number', icon: 'phone', value: u.mobile, extra: 'disabled' })}
          ${field({ id: 'email', label: 'Email', icon: 'mail', value: u.email, extra: 'disabled' })}
        </div>
        <div class="grid-2">
          ${selectField({ id: 'state', label: 'State', options: STATES, value: u.state, placeholder: 'Choose state', icon: 'pin' })}
          ${field({ id: 'district', label: 'District', icon: 'pin', value: u.district, list: 'district-list' })}
        </div>
        <datalist id="district-list">${(DISTRICTS[u.state] || []).map((d) => `<option value="${esc(d)}"></option>`).join('')}</datalist>
        ${selectField({ id: 'language', label: 'Preferred language', options: LANGUAGES, value: u.language, placeholder: '' })}
        <button class="btn btn-primary btn-lg btn-block" type="submit">Save changes</button>
      </form>
    </section>

    <section class="card">
      <div class="sec-head"><h2>Account</h2></div>
      <div class="notice notice-info">${icon('info', { size: 20 })}<p>Demo account – saved only on this device, not on a server.</p></div>
      <button class="btn btn-ghost btn-lg btn-block" id="logout">${icon('logout', { size: 20 })} Log out</button>
      <button class="btn btn-danger-soft btn-lg btn-block" id="delete-account">${icon('trash', { size: 20 })} Delete my account</button>
    </section>`;
  },

  mount(el, ctx) {
    $('#logout', el).addEventListener('click', async () => {
      if (await confirmDialog('Log out?', 'You can log in again any time.', 'Log out')) {
        await Auth.logout();
        toast('You are logged out. See you soon! 👋', 'info');
        ctx.navigate('/login');
      }
    });
    if (ctx.user.guest) return;

    $('#state', el).addEventListener('change', (e) => {
      $('#district-list', el).innerHTML = (DISTRICTS[e.target.value] || []).map((d) => `<option value="${esc(d)}"></option>`).join('');
    });

    $('#profile-form', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors(el);
      let ok = true;
      if ($('#name', el).value.trim().length < 2) ok = setError(el, 'name', 'Please enter your name.') && ok;
      if (!$('#state', el).value) ok = setError(el, 'state', 'Please choose your state.') && ok;
      if (!$('#district', el).value.trim()) ok = setError(el, 'district', 'Please enter your district.') && ok;
      if (!ok) return;
      const btn = $('button[type=submit]', el);
      setBusy(btn, true, 'Saving…');
      try {
        await Auth.updateProfile({ name: $('#name', el).value, state: $('#state', el).value, district: $('#district', el).value, language: $('#language', el).value });
        sessionStorage.removeItem('agrivision.weather.v1');
        toast('Your details are saved.');
        ctx.refresh();
      } catch (ex) {
        setBusy(btn, false);
        toast(ex.message, 'error');
      }
    });

    $('#delete-account', el).addEventListener('click', async () => {
      if (await confirmDialog('Delete your account?', 'Your account and all your saved crop checks, results and chat will be removed from this device.', 'Delete everything', true)) {
        const id = ctx.user.id;
        await Auth.deleteAccount();
        store.clearFor(id);
        toast('Your account was deleted.', 'info');
        ctx.navigate('/signup');
      }
    });
  },
};
