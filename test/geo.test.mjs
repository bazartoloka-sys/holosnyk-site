import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

// GEO-гайдлайн (~/geo/GEO.md): §4 — одна сутність на один @id,
// §7 — підвал із зв'язками екосистеми на ВСІХ сторінках.

const root = new URL('../', import.meta.url);
const pages = readdirSync(root).filter((n) => n.endsWith('.html')).sort();
const read = (n) => readFileSync(new URL(n, root), 'utf8');

test('сторінки знайдено', () => {
  assert.ok(pages.length >= 20, `сторінок: ${pages.length}`);
});

for (const name of pages) {
  test(`${name}: підвал із зв'язками екосистеми`, () => {
    const html = read(name);
    assert.match(html, /<footer class="site-footer"/);
    assert.match(html, /Екосистема Толока/);
    assert.ok(html.includes('https://bazar.in.ua/'), 'немає посилання на Базар');
    assert.ok(html.includes('https://magistral-it.com/'), 'немає посилання на студію');
    assert.equal(html.split('<footer').length - 1, 1, 'підвал не один');
  });

  test(`${name}: JSON-LD розбирається, @id студії канонічний`, () => {
    const html = read(name);
    assert.ok(!html.includes('golosnik.com.ua/#dev'), 'лишився @id студії на чужому домені');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length >= 1, 'немає JSON-LD');
    for (const b of blocks) JSON.parse(b[1]);
  });
}

test('головна: @id застосунку і Базар у графі', () => {
  const html = read('index.html');
  const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const graph = JSON.parse(block[1])['@graph'];
  const app = graph.find((n) => n['@type'] === 'SoftwareApplication');
  assert.equal(app['@id'], 'https://golosnik.com.ua/#app');
  const bazar = graph.find((n) => n['@id'] === 'https://bazar.in.ua/#org');
  assert.ok(bazar, 'Базар не оголошений у графі');
  const dev = graph.find((n) => n['@id'] === 'https://magistral-it.com/#org');
  assert.ok(dev, 'студія не оголошена');
  const kids = (dev.subOrganization ?? []).map((x) => x['@id']);
  assert.ok(kids.includes('https://golosnik.com.ua/#org'), 'Голосник не дочірній');
  assert.ok(kids.includes('https://bazar.in.ua/#org'), 'Базар не дочірній');
});

test('стилі підвалу є у спільному style.css', () => {
  const css = readFileSync(new URL('css/style.css', root), 'utf8');
  assert.match(css, /\.site-footer\s*\{[^}]*display:\s*flex/);
  assert.match(css, /\.site-footer__eco\s*\{[^}]*flex-basis/);
});
