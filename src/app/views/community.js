import { icon } from '../icons.js';
import { community } from '../store.js';
import { esc, $, $$, initials, timeAgo, toast, emptyState, uid, validateImage, fileToDataURL, setBusy, confirmDialog } from '../util.js';

const CATS = ['Question', 'Tip', 'Success story'];

const seedPosts = () => [
  { id: 'p1', author: 'Ramesh Patil', place: 'Nashik', cat: 'Tip', text: 'Spray in the early morning. The wind is low and the medicine stays on the leaves longer. 🌿', ts: Date.now() - 4 * 3600e3, likes: ['x1', 'x2', 'x3'], comments: [], sample: true },
  { id: 'p2', author: 'Gurpreet Kaur', place: 'Ludhiana', cat: 'Question', text: 'My wheat leaves show yellow stripes after the fog. What should I do?', ts: Date.now() - 30 * 3600e3, likes: ['x1'], comments: [{ id: 'c1', author: 'Sunil Yadav', text: 'It may be yellow rust. Check with your agriculture officer and spray the recommended fungicide.', ts: Date.now() - 20 * 3600e3 }], sample: true },
  { id: 'p3', author: 'Lakshmi Devi', place: 'Guntur', cat: 'Success story', text: 'Used drip irrigation on my chilli this year. Saved a lot of water and the harvest was better! 🌶️', ts: Date.now() - 3 * 864e5, likes: ['x1', 'x2'], comments: [], sample: true },
];

const load = () => {
  let p = community.get(null);
  if (!p) {
    p = seedPosts();
    community.set(p);
  }
  return p;
};

export const communityView = {
  html: () => `
    <div class="page-head"><h1>Farmer community</h1><p class="muted">Ask questions and share tips with other farmers.</p></div>
    <section class="card">
      <form id="post-form" novalidate>
        <label class="sr-only" for="post-text">Write a post</label>
        <textarea id="post-text" rows="3" maxlength="500" placeholder="Ask a question or share a farming tip…"></textarea>
        <p class="field-error" id="post-err" role="alert"></p>
        <div class="chips" id="cat-chips">${CATS.map((c, i) => `<button type="button" class="chip ${i === 0 ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('')}</div>
        <div class="img-preview" id="post-img" hidden><img alt="Photo to share" /><button type="button" class="icon-btn remove" aria-label="Remove photo">${icon('x', { size: 20 })}</button></div>
        <div class="row-between">
          <label class="btn btn-soft" for="post-photo">${icon('camera', { size: 20 })} Add photo</label>
          <input type="file" id="post-photo" accept="image/*" capture="environment" class="sr-only" />
          <button class="btn btn-primary" type="submit">${icon('send', { size: 18 })} Post</button>
        </div>
      </form>
    </section>
    <div id="feed"></div>`,

  mount(el, ctx) {
    let cat = CATS[0];
    let photo = '';
    const me = ctx.user;
    const myId = me.id;
    const myName = me.guest ? 'Guest farmer' : me.name;

    $('#cat-chips', el).addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      cat = b.dataset.cat;
      $$('#cat-chips .chip', el).forEach((c) => c.classList.toggle('on', c === b));
    });

    const pbox = $('#post-img', el);
    $('#post-photo', el).addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      e.target.value = '';
      if (!f) return;
      const bad = validateImage(f);
      if (bad) return toast(bad, 'error');
      try {
        photo = await fileToDataURL(f, 640, 0.7);
        $('img', pbox).src = photo;
        pbox.hidden = false;
      } catch (ex) {
        toast(ex.message, 'error');
      }
    });
    $('.remove', pbox).addEventListener('click', () => {
      photo = '';
      pbox.hidden = true;
    });

    $('#post-form', el).addEventListener('submit', (e) => {
      e.preventDefault();
      const text = $('#post-text', el).value.trim();
      const err = $('#post-err', el);
      if (text.length < 3) {
        err.textContent = 'Please write something first (at least 3 letters).';
        return;
      }
      err.textContent = '';
      const posts = load();
      posts.unshift({ id: uid(), author: myName, place: me.district || '', cat, text, photo, ts: Date.now(), likes: [], comments: [], authorId: myId });
      if (!community.set(posts.slice(0, 40))) {
        posts[0].photo = '';
        if (!community.set(posts.slice(0, 40))) return toast('Phone storage is full. Please delete some data.', 'error');
        toast('Posted without the photo (storage is full).', 'info');
      } else toast('Your post is live! 🌱');
      $('#post-text', el).value = '';
      photo = '';
      pbox.hidden = true;
      draw();
    });

    const feed = $('#feed', el);
    function draw() {
      const posts = load();
      if (!posts.length) {
        feed.innerHTML = `<section class="card">${emptyState({ iconName: 'users', title: 'No posts yet', text: 'Be the first to ask a question or share a tip.' })}</section>`;
        return;
      }
      feed.innerHTML = posts
        .map((p) => {
          const liked = p.likes.includes(myId);
          return `
        <article class="card post" data-id="${p.id}">
          <header><span class="avatar sm">${esc(initials(p.author))}</span>
            <div><b>${esc(p.author)}</b><small>${esc(p.place ? p.place + ' · ' : '')}${timeAgo(p.ts)}</small></div>
            <span class="badge badge-cat">${esc(p.cat)}</span></header>
          <p>${esc(p.text)}</p>
          ${p.photo ? `<img class="post-img" src="${p.photo}" alt="Photo shared by ${esc(p.author)}" loading="lazy" />` : ''}
          <footer>
            <button class="act ${liked ? 'on' : ''}" data-like aria-pressed="${liked}">${icon('heart', { size: 20, fill: liked })} ${p.likes.length}</button>
            <button class="act" data-toggle-comments>${icon('chat', { size: 20 })} ${p.comments.length} ${p.comments.length === 1 ? 'reply' : 'replies'}</button>
            ${p.authorId === myId ? `<button class="act" data-delete aria-label="Delete my post">${icon('trash', { size: 20 })}</button>` : ''}
          </footer>
          <div class="comments" hidden>
            ${p.comments.map((c) => `<div class="comment"><b>${esc(c.author)}</b><span>${esc(c.text)}</span></div>`).join('')}
            <form class="comment-form"><input type="text" maxlength="200" placeholder="Write a reply…" aria-label="Write a reply" /><button class="icon-btn send" aria-label="Send reply">${icon('send', { size: 20 })}</button></form>
          </div>
        </article>`;
        })
        .join('');
    }

    const openComments = new Set();
    feed.addEventListener('click', async (e) => {
      const card = e.target.closest('.post');
      if (!card) return;
      const id = card.dataset.id;
      if (e.target.closest('[data-like]')) {
        const posts = load();
        const p = posts.find((x) => x.id === id);
        p.likes = p.likes.includes(myId) ? p.likes.filter((x) => x !== myId) : [...p.likes, myId];
        community.set(posts);
        draw();
        restoreOpen();
      } else if (e.target.closest('[data-toggle-comments]')) {
        const box = $('.comments', card);
        box.hidden = !box.hidden;
        box.hidden ? openComments.delete(id) : openComments.add(id);
        if (!box.hidden) $('input', box).focus();
      } else if (e.target.closest('[data-delete]')) {
        if (await confirmDialog('Delete your post?', 'This cannot be undone.', 'Delete', true)) {
          community.set(load().filter((x) => x.id !== id));
          draw();
          toast('Post deleted.');
        }
      }
    });
    feed.addEventListener('submit', (e) => {
      e.preventDefault();
      const card = e.target.closest('.post');
      const input = $('input', e.target);
      const text = input.value.trim();
      if (!text) return toast('Please write a reply first.', 'error');
      const posts = load();
      posts.find((x) => x.id === card.dataset.id).comments.push({ id: uid(), author: myName, text, ts: Date.now() });
      community.set(posts);
      openComments.add(card.dataset.id);
      draw();
      restoreOpen();
      toast('Reply added.');
    });
    function restoreOpen() {
      openComments.forEach((id) => {
        const box = $(`.post[data-id="${id}"] .comments`, feed);
        if (box) box.hidden = false;
      });
    }
    draw();
  },
};
