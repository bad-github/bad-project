import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createSupabaseClient, createSupabaseApi, result} from '../dist/esm/index.mjs';

function fixture(respond = () => ({body: []})) {
  const requests = [];
  const client = createSupabaseClient('https://example.supabase.co', 'offline-test-key', {
    auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
    global: {
      fetch: async (input, init) => {
        const request = {
          url: new URL(String(input)),
          method: init?.method ?? 'GET',
          headers: new Headers(init?.headers),
          body: init?.body,
        };
        requests.push(request);
        const response = respond(request);
        return new Response(response.body === undefined ? null : JSON.stringify(response.body), {
          status: response.status ?? 200,
          headers: {'Content-Type': 'application/json', ...response.headers},
        });
      },
    },
  });
  return {client, api: createSupabaseApi(client), requests};
}

test('creating API facades makes no requests and keeps instance-owned auth/functions', () => {
  const a = fixture();
  const b = fixture();
  assert.equal(a.requests.length, 0);
  assert.equal(a.api.client, a.client);
  assert.equal(a.api.auth, a.client.auth);
  assert.notEqual(a.api.auth, b.api.auth);
  assert.equal(typeof a.api.auth.mfa.challengeAndVerify, 'function');
  assert.equal(typeof a.api.functions.invoke, 'function');
});

test('database pagination uses inclusive range, stable ordering and exact counts', async () => {
  const {api, requests} = fixture(() => ({
    body: [{id: '11', email: 'a@example.com'}],
    headers: {'Content-Range': '10-10/25'},
  }));
  const page = await api.profiles.getPage({page: 2, pageSize: 10, email: 'a@example.com'});
  const request = requests[0];
  assert.equal(request.url.pathname, '/rest/v1/profiles');
  assert.equal(request.url.searchParams.get('offset'), '10');
  assert.equal(request.url.searchParams.get('limit'), '10');
  assert.equal(request.url.searchParams.get('order'), 'id.asc');
  assert.equal(request.url.searchParams.get('email'), 'eq.a@example.com');
  assert.ok(request.headers.get('Prefer').includes('count=exact'));
  assert.equal(page.count, 25);
  assert.equal(page.totalPages, 3);
  assert.equal(page.hasNextPage, true);
  assert.equal(page.page, 2);
  assert.equal(page.data[0].id, '11');
});

test('pagination distinguishes an unknown count from an empty result', async () => {
  const unknown = fixture();
  const page = await unknown.api.database.paginate(unknown.api.database.from('profiles').select('*'));
  assert.equal(page.count, null);
  assert.equal(page.totalPages, null);
  assert.equal(page.hasNextPage, null);
  const empty = fixture(() => ({body: [], headers: {'Content-Range': '*/0'}}));
  const emptyPage = await empty.api.profiles.getPage();
  assert.equal(emptyPage.totalPages, 0);
  assert.equal(emptyPage.hasNextPage, false);
});

test('invalid page ranges fail before making network requests', async () => {
  const {api, requests} = fixture();
  for (const options of [
    {page: 0},
    {page: -1},
    {page: 1.5},
    {pageSize: 0},
    {pageSize: NaN},
    {page: Infinity},
    {page: Number.MAX_SAFE_INTEGER, pageSize: 20},
  ]) {
    await assert.rejects(api.profiles.getPage(options), RangeError);
  }
  assert.deepEqual(api.database.getPageRange({page: 2, pageSize: 10}), {page: 2, pageSize: 10, from: 10, to: 19});
  assert.equal(requests.length, 0);
});

test('database and profile methods retain SDK errors without silently returning empty data', async () => {
  const {api} = fixture(() => ({status: 403, body: {message: 'Forbidden', code: '42501', details: null, hint: null}}));
  const response = await api.profiles.getPage();
  assert.equal(response.data, null);
  assert.equal(response.error.code, '42501');
  assert.equal(response.status, 403);
  assert.throws(
    () => result.unwrap(response),
    (error) => error === response.error
  );
});

test('iteratePages constructs fresh queries, honors limits and stops when consumers break', async () => {
  const rows = Array.from({length: 23}, (_, index) => ({id: String(index)}));
  const {api, requests} = fixture((request) => {
    const offset = Number(request.url.searchParams.get('offset'));
    const limit = Number(request.url.searchParams.get('limit'));
    return {body: rows.slice(offset, offset + limit)};
  });
  let queries = 0;
  const makeQuery = () => {
    queries++;
    return api.database.from('profiles').select('*').order('id');
  };
  const pages = [];
  for await (const page of api.database.iteratePages(makeQuery, {page: 2, pageSize: 10})) pages.push(page);
  assert.deepEqual(
    pages.map((page) => page.data.length),
    [10, 3]
  );
  assert.equal(queries, 2);
  assert.equal(requests.length, 2);
  for await (const page of api.database.iteratePages(makeQuery, {pageSize: 5, maxPages: 1}))
    assert.equal(page.data.length, 5);
  assert.equal(requests.length, 3);
  for await (const page of api.database.iteratePages(makeQuery, {pageSize: 5})) {
    assert.ok(page.data);
    break;
  }
  assert.equal(requests.length, 4);
  await assert.rejects(async () => {
    for await (const unused of api.database.iteratePages(makeQuery, {maxPages: 0})) void unused;
  }, RangeError);
});

test('iteratePages throws the original SDK error and does not continue requesting pages', async () => {
  const {api, requests} = fixture(() => ({status: 500, body: {message: 'Failed', code: 'offline'}}));
  await assert.rejects(
    async () => {
      for await (const unused of api.database.iteratePages(() => api.database.from('profiles').select('*')))
        void unused;
    },
    (error) => error.code === 'offline'
  );
  assert.equal(requests.length, 1);
});

test('iteratePages detects truncated pages with known remaining rows', async () => {
  const {api, requests} = fixture(() => ({body: [{id: '1'}], headers: {'Content-Range': '0-0/100'}}));
  await assert.rejects(async () => {
    for await (const unused of api.database.iteratePages(
      () => api.database.from('profiles').select('*', {count: 'exact'}),
      {pageSize: 20}
    ))
      void unused;
  }, /pageSize/);
  assert.equal(requests.length, 1);
});

test('profile writes always include the id filter and reject primary key changes', async () => {
  const {api, requests} = fixture(() => ({body: {id: 'alice', email: 'new@example.com'}}));
  await api.profiles.updateById('alice', {email: 'new@example.com'});
  assert.equal(requests[0].method, 'PATCH');
  assert.equal(requests[0].url.searchParams.get('id'), 'eq.alice');
  assert.deepEqual(JSON.parse(requests[0].body), {email: 'new@example.com'});
  await api.profiles.deleteById('alice');
  assert.equal(requests[1].method, 'DELETE');
  assert.equal(requests[1].url.searchParams.get('id'), 'eq.alice');
  assert.throws(() => api.profiles.updateById('', {email: 'x'}), TypeError);
  assert.throws(() => api.profiles.updateById('alice', {id: 'bob'}), TypeError);
  assert.throws(() => api.profiles.deleteById(' '), TypeError);
  assert.equal(requests.length, 2);
});

test('profile email queries return arrays and profile misses return null', async () => {
  const {api} = fixture(() => ({body: []}));
  assert.deepEqual((await api.profiles.getByEmail('a@example.com')).data, []);
  assert.equal((await api.profiles.getById('missing')).data, null);
});

test('bound database methods preserve schema and RPC routing', async () => {
  const {api, requests} = fixture(() => ({body: 3}));
  await api.database.schema('private').from('profiles').select('*');
  assert.equal(requests[0].headers.get('Accept-Profile'), 'private');
  await api.database.rpc('profile_count', {active: true});
  assert.equal(requests[1].url.pathname, '/rest/v1/rpc/profile_count');
  assert.deepEqual(JSON.parse(requests[1].body), {active: true});
});

test('storage signed URLs, public URLs and removals use the selected bucket', async () => {
  const {api, requests} = fixture(() => ({body: {signedURL: '/object/sign/private/report.pdf?token=offline'}}));
  const signed = await api.storage.createSignedUrl('private', 'report.pdf', 60);
  assert.equal(signed.error, null);
  assert.ok(signed.data.signedUrl.includes('report.pdf?token=offline'));
  assert.equal(requests[0].url.pathname, '/storage/v1/object/sign/private/report.pdf');
  assert.equal(JSON.parse(requests[0].body).expiresIn, 60);
  const publicUrl = api.storage.getPublicUrl('avatars', 'users/alice.png');
  assert.equal(
    publicUrl.data.publicUrl,
    'https://example.supabase.co/storage/v1/object/public/avatars/users/alice.png'
  );
  assert.equal(requests.length, 1); // getPublicUrl 不发请求。
  await api.storage.remove('avatars', ['a.png', 'b.png']);
  assert.equal(requests[1].method, 'DELETE');
  assert.equal(requests[1].url.pathname, '/storage/v1/object/avatars');
});

test('storage uploads retain file options and the SDK response', async () => {
  const {api, requests} = fixture(() => ({body: {Id: 'file-id', Key: 'avatars/alice.png'}}));
  const response = await api.storage.upload('avatars', 'alice.png', new Blob(['offline'], {type: 'image/png'}), {
    upsert: true,
    cacheControl: '60',
  });
  assert.equal(response.error, null);
  assert.equal(response.data.path, 'alice.png');
  assert.equal(requests[0].headers.get('x-upsert'), 'true');
  assert.equal(requests[0].body.get('cacheControl'), '60');
});

test('edge function invoke preserves typed JSON body and SDK error handling', async () => {
  const {api, requests} = fixture(() => ({body: {ok: true}}));
  const response = await api.functions.invoke('hello', {body: {name: 'Alice'}});
  assert.deepEqual(response.data, {ok: true});
  assert.equal(requests[0].url.pathname, '/functions/v1/hello');
  assert.deepEqual(JSON.parse(requests[0].body), {name: 'Alice'});
});

test('result helpers preserve falsy data and distinguish absent data from errors', () => {
  const error = new Error('Original');
  for (const data of [false, 0, '', []]) assert.equal(result.requireData({data, error: null}), data);
  assert.equal(result.unwrap({data: null, error: null}), null);
  assert.throws(() => result.requireData({data: null, error: null}, 'Missing'), /Missing/);
  assert.throws(
    () => result.requireData({data: undefined, error}),
    (value) => value === error
  );
});
