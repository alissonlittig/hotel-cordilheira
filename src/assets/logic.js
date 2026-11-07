// Pure helpers shared by the browser script and the tests.
export const brl = (n) => n === 0 ? 'Grátis' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function filterShows(shows, { uf = '', month = '' } = {}) {
  return shows.filter((s) => (!uf || s.uf === uf) && (!month || s.date.slice(0, 7) === month));
}

export function seconds(t) {
  const [m, s] = t.split(':').map(Number);
  return m * 60 + s;
}
export function total(tracks) {
  const t = tracks.reduce((a, x) => a + seconds(x[1]), 0);
  return `${Math.floor(t / 60)} min`;
}

const pad = (n) => String(n).padStart(2, '0');
export function ics(show) {
  const [y, m, d] = show.date.split('-');
  const [hh, mm] = show.time.split(':');
  const e = new Date(Date.UTC(+y, +m - 1, +d, +hh + 2, +mm));
  const end = `${e.getUTCFullYear()}${pad(e.getUTCMonth() + 1)}${pad(e.getUTCDate())}T${pad(e.getUTCHours())}${pad(e.getUTCMinutes())}00`;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hotel Cordilheira//Demo//PT',
    'BEGIN:VEVENT', `UID:${show.id}@hotel-cordilheira.demo`,
    `DTSTART:${y}${m}${d}T${hh}${mm}00`, `DTEND:${end}`,
    `SUMMARY:Hotel Cordilheira em ${show.city}`, `LOCATION:${show.venue}\, ${show.city}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

// cart: [{id, size, qty, price}]
export function addItem(cart, item) {
  const hit = cart.find((c) => c.id === item.id && c.size === item.size);
  if (hit) return cart.map((c) => (c === hit ? { ...c, qty: Math.min(c.qty + 1, 9) } : c));
  return [...cart, { ...item, qty: 1 }];
}
export function setQty(cart, i, qty) {
  return qty < 1 ? cart.filter((_, k) => k !== i) : cart.map((c, k) => (k === i ? { ...c, qty: Math.min(qty, 9) } : c));
}
export const subtotal = (cart) => cart.reduce((a, c) => a + c.price * c.qty, 0);
export const shipping = (sub) => (sub === 0 || sub >= 250 ? 0 : 18);

export function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}
