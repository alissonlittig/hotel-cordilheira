import test from 'node:test';
import assert from 'node:assert/strict';
import { filterShows, total, ics, addItem, setQty, subtotal, shipping, validEmail, brl } from '../src/assets/logic.js';

const shows = [
  { id: 'a', date: '2026-12-04', time: '21:00', city: 'BH', uf: 'MG', venue: 'X' },
  { id: 'b', date: '2027-01-16', time: '22:30', city: 'RJ', uf: 'RJ', venue: 'Y' },
];
test('filter by uf and month', () => {
  assert.equal(filterShows(shows, {}).length, 2);
  assert.deepEqual(filterShows(shows, { uf: 'RJ' }).map((s) => s.id), ['b']);
  assert.deepEqual(filterShows(shows, { month: '2026-12' }).map((s) => s.id), ['a']);
  assert.equal(filterShows(shows, { uf: 'MG', month: '2027-01' }).length, 0);
});
test('total duration', () => assert.equal(total([['a', '3:30'], ['b', '4:45']]), '8 min'));
test('ics', () => {
  const s = ics(shows[1]);
  assert.match(s, /DTSTART:20270116T223000/);
  assert.match(s, /DTEND:20270117T003000/);
  assert.match(s, /SUMMARY:Hotel Cordilheira em RJ/);
});
test('cart', () => {
  let c = addItem([], { id: 'm1', size: 'M', price: 89 });
  c = addItem(c, { id: 'm1', size: 'M', price: 89 });
  c = addItem(c, { id: 'm1', size: 'G', price: 89 });
  assert.equal(c.length, 2);
  assert.equal(subtotal(c), 89 * 3);
  c = setQty(c, 0, 0);
  assert.equal(c.length, 1);
  c = setQty(c, 0, 50);
  assert.equal(c[0].qty, 9);
});
test('shipping', () => {
  assert.equal(shipping(0), 0);
  assert.equal(shipping(100), 18);
  assert.equal(shipping(250), 0);
});
test('email + brl', () => {
  assert.ok(validEmail(' a@b.co '));
  assert.ok(!validEmail('a@b'));
  assert.equal(brl(0), 'Grátis');
});
