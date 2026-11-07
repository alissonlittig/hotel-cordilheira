// Seeded cover art: layered ridges + sun, so every release gets its own sleeve without image files.
function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export default function (cfg) {
  cfg.addPassthroughCopy({ 'src/assets': 'assets' });
  cfg.addPassthroughCopy({
    'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2': 'assets/bricolage.woff2',
    'node_modules/@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2': 'assets/mono-400.woff2',
    'node_modules/@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2': 'assets/mono-500.woff2',
  });
  cfg.addShortcode('cover', (seed, hue, size = 480) => {
    const r = rng(seed); let g = '';
    const sx = 90 + r() * 300, sy = 110 + r() * 80;
    g += `<circle cx="${sx.toFixed(0)}" cy="${sy.toFixed(0)}" r="${(34 + r() * 26).toFixed(0)}" fill="hsl(${(hue + 30) % 360} 95% 68%)"/>`;
    for (let i = 0; i < 6; i++) {
      const base = 190 + i * 48; let d = `M0 480 L0 ${base}`;
      for (let x = 0; x <= 480; x += 40) d += ` L${x} ${(base - 30 - r() * (50 + i * 8)).toFixed(0)}`;
      d += ' L480 480Z';
      g += `<path d="${d}" fill="hsl(${(hue + i * 6) % 360} ${55 - i * 4}% ${70 - i * 11}%)"/>`;
    }
    return `<svg viewBox="0 0 480 480" width="${size}" height="${size}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><rect width="480" height="480" fill="hsl(${hue} 60% 86%)"/>${g}</svg>`;
  });
  cfg.addFilter('brl', (n) => (n === 0 ? 'Grátis' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
  cfg.addFilter('dia', (d) => d.slice(8, 10));
  cfg.addFilter('mes', (d) => MES[+d.slice(5, 7) - 1]);
  cfg.addFilter('ym', (d) => d.slice(0, 7));
  cfg.addFilter('ufs', (a) => [...new Set(a.map((s) => s.uf))].sort());
  cfg.addFilter('months', (a) => [...new Set(a.map((s) => s.date.slice(0, 7)))].map((m) => ({ v: m, t: `${MES[+m.slice(5) - 1]}/${m.slice(2, 4)}` })));
  cfg.addFilter('json', (v) => JSON.stringify(v).replace(/</g, '\\u003c'));
  cfg.addFilter('mins', (tr) => { const t = tr.reduce((a, x) => { const [m, s] = x[1].split(':'); return a + m * 60 + +s; }, 0); return Math.floor(t / 60) + ' min'; });
  return { dir: { input: 'src', output: 'dist' }, pathPrefix: '/hotel-cordilheira/', markdownTemplateEngine: 'njk', htmlTemplateEngine: 'njk' };
}
