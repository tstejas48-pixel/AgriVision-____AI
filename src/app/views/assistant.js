import { icon } from '../icons.js';
import { store } from '../store.js';
import { ASSISTANT_KB, ASSISTANT_QUICK } from '../data.js';
import { esc, $, sleep, toast, confirmDialog } from '../util.js';

const WELCOME = { role: 'bot', text: 'Namaste! 🌱 I am your farming helper. Ask me about water, fertilizer, yellow leaves or profit.' };

export function reply(q) {
  const t = ' ' + q.toLowerCase() + ' ';
  const hit = ASSISTANT_KB.find((k) => k.keys.some((w) => t.includes(w)));
  if (hit) return { text: hit.a, link: hit.link };
  return {
    text: "I'm not sure about that yet. Try asking about water, fertilizer, spraying, seeds or profit. For a sick plant, take a photo in the Diagnose tab.",
    link: ['#/diagnose', 'Check a leaf'],
  };
}

export const assistantView = {
  html: () => `
    <div class="page-head"><a href="#/home" class="back-link">${icon('arrowLeft', { size: 20 })} Home</a>
      <div class="row-between"><h1>AI assistant</h1><button class="btn btn-ghost btn-sm" id="clear-chat">${icon('trash', { size: 18 })} Clear</button></div>
      <p class="muted">Quick tips from a built-in demo helper (works without internet).</p></div>
    <section class="chat card">
      <div class="chat-log" id="log" aria-live="polite"></div>
      <div class="chips quick" id="quick">${ASSISTANT_QUICK.map((q) => `<button class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      <form class="chat-form" id="chat-form">
        <input type="text" id="chat-input" maxlength="300" placeholder="Type your question…" aria-label="Your question" autocomplete="off" />
        <button class="btn btn-primary send-btn" aria-label="Send">${icon('send', { size: 22 })}</button>
      </form>
    </section>`,

  mount(el) {
    const log = $('#log', el);
    const msgs = () => store.get('chat', [WELCOME]);
    const bubble = (m) => `<div class="msg ${m.role}"><div class="bubble">${esc(m.text)}${m.link ? `<a class="link-chip" href="${m.link[0]}">${esc(m.link[1])} ${icon('chevronRight', { size: 16 })}</a>` : ''}</div></div>`;
    const draw = () => {
      log.innerHTML = msgs().map(bubble).join('');
      log.scrollTop = log.scrollHeight;
    };
    async function ask(text) {
      text = text.trim();
      if (!text) return;
      store.update('chat', (l) => [...l, { role: 'user', text }].slice(-40), [WELCOME]);
      draw();
      log.insertAdjacentHTML('beforeend', '<div class="msg bot" id="typing"><div class="bubble typing"><i></i><i></i><i></i></div></div>');
      log.scrollTop = log.scrollHeight;
      await sleep(700);
      const r = reply(text);
      store.update('chat', (l) => [...l, { role: 'bot', text: r.text, link: r.link }].slice(-40), [WELCOME]);
      draw();
    }
    $('#chat-form', el).addEventListener('submit', (e) => {
      e.preventDefault();
      const i = $('#chat-input', el);
      const v = i.value;
      i.value = '';
      if (!v.trim()) return toast('Please type your question first.', 'error');
      ask(v);
    });
    $('#quick', el).addEventListener('click', (e) => {
      const b = e.target.closest('[data-q]');
      if (b) ask(b.dataset.q);
    });
    $('#clear-chat', el).addEventListener('click', async () => {
      if (await confirmDialog('Clear chat?', 'All messages will be removed.', 'Clear', true)) {
        store.set('chat', [WELCOME]);
        draw();
        toast('Chat cleared.');
      }
    });
    draw();
  },
};
