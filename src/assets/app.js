import { brl, filterShows, ics, addItem, setQty, subtotal, shipping, validEmail, seconds } from './logic.js';

const { shows, releases, merch } = window.__DATA__;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const say = (el, t, err) => { el.textContent = t; el.classList.toggle('err', !!err); };

// dialogs
$$('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
$$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

// show filters
const fuf = $('#f-uf'), fmes = $('#f-mes');
function applyFilters() {
  const ok = new Set(filterShows(shows, { uf: fuf.value, month: fmes.value }).map((s) => s.id));
  $$('.show').forEach((li, i) => { li.hidden = !ok.has(shows[i].id); });
  $('#shows-empty').hidden = ok.size > 0;
}
fuf.addEventListener('change', applyFilters);
fmes.addEventListener('change', applyFilters);

// .ics
$$('[data-ics]').forEach((b) => b.addEventListener('click', () => {
  const s = shows.find((x) => x.id === b.dataset.ics);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics(s)], { type: 'text/calendar' }));
  a.download = `hotel-cordilheira-${s.date}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}));

// tickets
let show = null;
const tkTotal = () => say($('#tk-total'), `Total: ${brl(show.price * +$('#tk-q').value)}`);
$$('[data-ticket]').forEach((b) => b.addEventListener('click', () => {
  show = shows.find((x) => x.id === b.dataset.ticket);
  $('#tk-meta').textContent = `${show.date.split('-').reverse().join('/')} · ${show.time}`;
  $('#tk-t').textContent = `${show.city}, ${show.venue}`;
  $('#tk-form').reset(); say($('#tk-msg'), '');
  tkTotal();
  $('#dlg-tk').showModal();
}));
$('#tk-q').addEventListener('change', tkTotal);
$('#tk-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if ($('#tk-n').value.trim().length < 3) return say($('#tk-msg'), 'Informe o nome completo.', true);
  if (!validEmail($('#tk-e').value)) return say($('#tk-msg'), 'Informe um e-mail válido.', true);
  const ref = 'HC-' + show.id.toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  say($('#tk-msg'), `Reserva simulada confirmada. Código ${ref}. Nenhum dado foi enviado.`);
});

// newsletter
$('#news').addEventListener('submit', (e) => {
  e.preventDefault();
  const m = $('#n-mail').value;
  validEmail(m) ? say($('#n-msg'), 'Inscrição simulada: nada foi enviado nem guardado.') : say($('#n-msg'), 'Digite um e-mail válido.', true);
});

// releases + simulated player
let rel = null, cur = 0, tick = null, pos = 0;
const play = $('#rel-play');
function stop() { clearInterval(tick); tick = null; play.textContent = '▶'; }
function renderTrack() {
  const [name, dur] = rel.tracks[cur];
  $$('#rel-tracks li').forEach((li, i) => li.classList.toggle('on', i === cur));
  $('#rel-now').textContent = `${name} · ${dur}`;
  $('#rel-bar').style.width = (pos / seconds(dur)) * 100 + '%';
}
function start() {
  play.textContent = '❚❚';
  tick = setInterval(() => {
    pos += 1;
    if (pos >= seconds(rel.tracks[cur][1])) { pos = 0; cur = (cur + 1) % rel.tracks.length; }
    renderTrack();
  }, 1000);
}
play.addEventListener('click', () => (tick ? stop() : start()));
$('#dlg-rel').addEventListener('close', stop);
$$('[data-open-release]').forEach((b) => b.addEventListener('click', () => {
  rel = releases.find((r) => r.slug === b.dataset.openRelease);
  stop(); cur = 0; pos = 0;
  $('#rel-cover').innerHTML = (b.querySelector('.cover') || b).innerHTML;
  $('#rel-meta').textContent = `${rel.type} · ${rel.year}`;
  $('#rel-t').textContent = rel.title;
  $('#rel-b').textContent = rel.blurb;
  $('#rel-tracks').innerHTML = rel.tracks.map((t) => `<li tabindex="0"><span>${t[0]}</span><span class="mono">${t[1]}</span></li>`).join('');
  $$('#rel-tracks li').forEach((li, i) => {
    const go = () => { cur = i; pos = 0; renderTrack(); if (!tick) start(); };
    li.addEventListener('click', go);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  renderTrack();
  $('#dlg-rel').showModal();
}));

// cart
const KEY = 'hc-cart';
let cart = [];
try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch { cart = []; }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function drawCart() {
  localStorage.setItem(KEY, JSON.stringify(cart));
  $('#cart-n').textContent = cart.reduce((a, c) => a + c.qty, 0);
  const list = $('#cart-list');
  if (!cart.length) { list.innerHTML = '<li>A sacola está vazia.</li>'; $('#cart-sum').innerHTML = ''; $('#cart-go').disabled = true; return; }
  $('#cart-go').disabled = false;
  list.innerHTML = cart.map((c, i) => `<li><span>${esc(c.name)}${c.size ? ' · ' + esc(c.size) : ''}</span><b>${brl(c.price * c.qty)}</b>
    <div class="q"><button type="button" data-q="${i}" data-d="-1" aria-label="Menos uma unidade">−</button><span>${c.qty}</span><button type="button" data-q="${i}" data-d="1" aria-label="Mais uma unidade">+</button></div></li>`).join('');
  const sub = subtotal(cart), fr = shipping(sub);
  $('#cart-sum').innerHTML = `<dt>Subtotal</dt><dd>${brl(sub)}</dd><dt>Frete</dt><dd>${fr ? brl(fr) : 'Grátis'}</dd><dt class="t">Total</dt><dd class="t">${brl(sub + fr)}</dd>`;
}
$('#cart-list').addEventListener('click', (e) => {
  const b = e.target.closest('[data-q]'); if (!b) return;
  const i = +b.dataset.q; cart = setQty(cart, i, cart[i].qty + +b.dataset.d); drawCart();
});
$$('.item').forEach((el) => $('.add', el).addEventListener('click', () => {
  const z = $('.size', el);
  cart = addItem(cart, { id: el.dataset.id, name: el.dataset.name, price: +el.dataset.price, size: z ? z.value : '' });
  drawCart(); say($('#cart-msg'), '');
  const b = $('#cart-open'); b.animate([{ transform: 'scale(1.12)' }, { transform: 'none' }], 220);
}));
$('#cart-open').addEventListener('click', () => { say($('#cart-msg'), ''); $('#dlg-cart').showModal(); });
$('#cart-go').addEventListener('click', () => {
  const ref = 'HC-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  cart = []; drawCart();
  say($('#cart-msg'), `Pedido simulado ${ref}. Nenhum pagamento foi processado.`);
});
drawCart();
