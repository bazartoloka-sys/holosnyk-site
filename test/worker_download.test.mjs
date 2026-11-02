import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';

const URL_APK = 'https://golosnik.test/download/holosnyk-android.apk';
const assets = { fetch: async () => new Response('asset') };

function makeEnv(obj, calls = { get: 0, head: 0 }) {
  return {
    ASSETS: assets,
    DOWNLOADS: obj === undefined ? undefined : {
      get: async () => { calls.get += 1; return obj && { ...obj, body: new Blob(['12345']).stream() }; },
      head: async () => { calls.head += 1; return obj; },
    },
  };
}
const OBJ = { size: 5, httpEtag: '"abc"' };

test('GET: віддає apk з правильними заголовками', async () => {
  const r = await worker.fetch(new Request(URL_APK), makeEnv(OBJ));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'application/vnd.android.package-archive');
  assert.match(r.headers.get('content-disposition'), /attachment; filename="holosnyk-android\.apk"/);
  assert.equal(r.headers.get('content-length'), '5');
  assert.equal(r.headers.get('etag'), '"abc"');
  assert.equal(await r.text(), '12345');
});

test('HEAD: без тіла, лише head() у сховище', async () => {
  const calls = { get: 0, head: 0 };
  const r = await worker.fetch(new Request(URL_APK, { method: 'HEAD' }), makeEnv(OBJ, calls));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-length'), '5');
  assert.equal(await r.text(), '');
  assert.deepEqual(calls, { get: 0, head: 1 });
});

test('файлу в сховищі нема: 404', async () => {
  const r = await worker.fetch(new Request(URL_APK), makeEnv(null));
  assert.equal(r.status, 404);
});

test('сховище не підключене: 503', async () => {
  const r = await worker.fetch(new Request(URL_APK), makeEnv(undefined));
  assert.equal(r.status, 503);
});

test('POST на цей шлях і інші адреси йдуть у статику', async () => {
  const a = await worker.fetch(new Request(URL_APK, { method: 'POST' }), makeEnv(OBJ));
  assert.equal(await a.text(), 'asset');
  const b = await worker.fetch(new Request('https://golosnik.test/index.html'), makeEnv(OBJ));
  assert.equal(await b.text(), 'asset');
});
